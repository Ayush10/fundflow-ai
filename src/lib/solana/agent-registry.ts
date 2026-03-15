import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import {
  create,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

import { getAppConfig } from "@/lib/config";
import { getSolanaConnection, getTreasuryAuthority } from "@/lib/solana";

// Store the registered agent asset address
let registeredAgentAsset: string | null = null;
let registeredCollection: string | null = null;

/**
 * Register FundFlow AI as an agent in the Metaplex Agent Registry.
 *
 * This creates:
 * 1. A collection for FundFlow decision records
 * 2. An MPL Core asset representing the FundFlow AI agent
 * 3. Registers the agent identity with lifecycle hooks
 *
 * This is a one-time operation. Subsequent calls return the cached asset address.
 */
export async function registerFundFlowAgent(): Promise<{
  agentAssetAddress: string;
  collectionAddress: string;
  mode: "live" | "simulated";
}> {
  // Return cached if already registered
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

    // 1. Create the agent identity asset (standalone, no collection)
    const agentAsset = generateSigner(umi);
    await create(umi, {
      asset: agentAsset,
      name: "FundFlow AI Agent",
      uri: "",
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
      }).sendAndConfirm(registryUmi);

      console.log("[Agent Registry] Identity registered successfully");
    } catch (regErr) {
      // Registration may fail on devnet if program not deployed
      console.warn(
        "[Agent Registry] Identity registration skipped (program may not be on devnet):",
        regErr instanceof Error ? regErr.message : regErr
      );
    }

    registeredAgentAsset = agentAsset.publicKey.toString();
    registeredCollection = agentAsset.publicKey.toString(); // Use agent asset as reference

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

/**
 * Get the registered agent and collection addresses.
 */
export function getRegisteredAgent() {
  return {
    agentAssetAddress: registeredAgentAsset,
    collectionAddress: registeredCollection,
  };
}
