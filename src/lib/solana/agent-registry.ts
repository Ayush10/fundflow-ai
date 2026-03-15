import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import {
  create,
  createCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

import { getAppConfig } from "@/lib/config";
import { getSolanaConnection, getTreasuryAuthority } from "@/lib/solana";

// Cached registration
let registeredAgentAsset: string | null = null;
let registeredCollection: string | null = null;

const AGENT_NAME = "FundFlow AI Agent";
const AGENT_URI = "https://fundflow.ayushojha.com/agent-metadata.json";

/**
 * Register FundFlow AI as an agent on Solana:
 * 1. Create a collection for decision records
 * 2. Create a Core asset representing the agent identity
 * 3. Register in the Metaplex Agent Registry with metadata URI
 */
export async function registerFundFlowAgent(): Promise<{
  agentAssetAddress: string;
  collectionAddress: string;
  mode: "live" | "simulated";
}> {
  if (registeredAgentAsset && registeredCollection) {
    return {
      agentAssetAddress: registeredAgentAsset,
      collectionAddress: registeredCollection,
      mode: "live",
    };
  }

  const config = getAppConfig();

  if (!config.liveSolana) {
    return {
      agentAssetAddress: "FundF1owAgentSimu1ated11111111111111111111",
      collectionAddress: "FundF1owCo11ectionSimu1ated1111111111111111",
      mode: "simulated",
    };
  }

  try {
    const authority = getTreasuryAuthority();
    const connection = getSolanaConnection();

    const umi = createUmi(connection.rpcEndpoint).use(mplCore());
    const umiKeypair = fromWeb3JsKeypair(authority);
    umi.use(keypairIdentity(umiKeypair));

    // 1. Create a collection for FundFlow decision records
    const collection = generateSigner(umi);
    await createCollection(umi, {
      collection,
      name: "FundFlow AI Decisions",
      uri: AGENT_URI,
    }).sendAndConfirm(umi);

    console.log(
      "[Agent Registry] Collection created:",
      collection.publicKey.toString()
    );

    // 2. Create the agent identity asset (standalone — collection link done via registry)
    const agentAsset = generateSigner(umi);
    await create(umi, {
      asset: agentAsset,
      name: AGENT_NAME,
      uri: AGENT_URI,
    }).sendAndConfirm(umi);

    console.log(
      "[Agent Registry] Agent asset created:",
      agentAsset.publicKey.toString()
    );

    // 3. Try to register identity via Metaplex Agent Registry
    try {
      const { mplAgentIdentity } = await import(
        "@metaplex-foundation/mpl-agent-registry"
      );
      const { registerIdentityV1 } = await import(
        "@metaplex-foundation/mpl-agent-registry/dist/src/generated/identity/instructions/index.js"
      );

      const registryUmi = createUmi(connection.rpcEndpoint)
        .use(mplCore())
        .use(mplAgentIdentity());
      registryUmi.use(keypairIdentity(umiKeypair));

      await registerIdentityV1(registryUmi, {
        asset: agentAsset.publicKey,
        collection: collection.publicKey,
        agentRegistrationUri: AGENT_URI,
      }).sendAndConfirm(registryUmi);

      console.log("[Agent Registry] Identity registered in Agent Registry");
    } catch (regErr) {
      console.warn(
        "[Agent Registry] Registry registration skipped:",
        regErr instanceof Error ? regErr.message : regErr
      );
    }

    registeredAgentAsset = agentAsset.publicKey.toString();
    registeredCollection = collection.publicKey.toString();

    return {
      agentAssetAddress: registeredAgentAsset,
      collectionAddress: registeredCollection,
      mode: "live",
    };
  } catch (err) {
    console.error(
      "[Agent Registry] Registration failed:",
      err instanceof Error ? err.message : err
    );
    return {
      agentAssetAddress: "FundF1owAgentSimu1ated11111111111111111111",
      collectionAddress: "FundF1owCo11ectionSimu1ated1111111111111111",
      mode: "simulated",
    };
  }
}

export function getRegisteredAgent() {
  return {
    agentAssetAddress: registeredAgentAsset,
    collectionAddress: registeredCollection,
  };
}
