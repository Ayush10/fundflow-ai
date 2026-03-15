import { createHash } from "crypto";

import { Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createV1,
  mplCore,
  pluginAuthorityPair,
} from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

import { getAppConfig } from "@/lib/config";
import { getSolanaConnection, getTreasuryAuthority } from "@/lib/solana";
import { addAuditRecord } from "@/lib/store";
import { createSimulatedSignature, hashText } from "@/lib/utils";
import type { AgentDecision, AuditRecord, Proposal } from "@/types/api";

function deriveAssetAddress(seed: string): string {
  const digest = createHash("sha256").update(seed).digest().subarray(0, 32);
  return Keypair.fromSeed(digest).publicKey.toBase58();
}

export async function mintDecisionRecord(input: {
  proposal: Proposal;
  decision: AgentDecision;
}) {
  const config = getAppConfig();
  const assetSeed = JSON.stringify({
    proposalId: input.proposal.id,
    decision: input.decision.decision,
    timestamp: input.decision.createdAt,
  });

  // Try real on-chain minting
  if (config.liveSolana) {
    try {
      const authority = getTreasuryAuthority();
      const connection = getSolanaConnection();

      const umi = createUmi(connection.rpcEndpoint).use(mplCore());
      const umiKeypair = fromWeb3JsKeypair(authority);
      umi.use(keypairIdentity(umiKeypair));

      const asset = generateSigner(umi);

      const tx = await createV1(umi, {
        asset,
        name: `FundFlow Decision: ${input.proposal.title.slice(0, 32)}`,
        uri: "",
        plugins: [
          pluginAuthorityPair({
            type: "Attributes",
            data: {
              attributeList: [
                { key: "score", value: String(input.decision.scores.overall) },
                { key: "decision", value: input.decision.decision },
                { key: "proposalId", value: input.proposal.id },
                {
                  key: "proposalHash",
                  value: hashText(
                    input.proposal.title + input.proposal.description
                  ).slice(0, 16),
                },
                {
                  key: "applicantWallet",
                  value: input.proposal.applicantWallet,
                },
                { key: "timestamp", value: input.decision.createdAt },
                {
                  key: "rationale",
                  value: input.decision.rationale.slice(0, 200),
                },
              ],
            },
          }),
        ],
      }).sendAndConfirm(umi);

      // Encode signature as base58 for Solana Explorer
      const bs58 = await import("bs58");
      const txHash = bs58.default.encode(Buffer.from(tx.signature));

      const auditRecord: AuditRecord = {
        id: `audit-${input.proposal.id}`,
        proposalId: input.proposal.id,
        proposalTitle: input.proposal.title,
        coreAssetAddress: asset.publicKey.toString(),
        decision: input.decision.decision,
        score: input.decision.scores.overall,
        rationale: input.decision.rationale,
        applicantWallet: input.proposal.applicantWallet,
        txHash,
        timestamp: new Date().toISOString(),
        scores: input.decision.scores,
      };

      addAuditRecord(auditRecord);

      return {
        auditRecord,
        mode: "live" as const,
      };
    } catch (err) {
      console.error(
        "[Metaplex] Real minting failed, falling back to simulated:",
        err instanceof Error ? err.message : err
      );
      // Fall through to simulated
    }
  }

  // Simulated fallback
  const auditRecord: AuditRecord = {
    id: `audit-${input.proposal.id}`,
    proposalId: input.proposal.id,
    proposalTitle: input.proposal.title,
    coreAssetAddress: deriveAssetAddress(assetSeed),
    decision: input.decision.decision,
    score: input.decision.scores.overall,
    rationale: input.decision.rationale,
    applicantWallet: input.proposal.applicantWallet,
    txHash: createSimulatedSignature("metaplex-core"),
    timestamp: new Date().toISOString(),
    scores: input.decision.scores,
  };

  addAuditRecord(auditRecord);

  return {
    auditRecord,
    mode: "simulated" as const,
  };
}
