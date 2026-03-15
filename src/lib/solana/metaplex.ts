import { createHash } from "crypto";

import { Keypair } from "@solana/web3.js";

import { getAppConfig } from "@/lib/config";
import { addAuditRecord } from "@/lib/store";
import { createSimulatedSignature } from "@/lib/utils";
import type { AgentDecision, AuditRecord, Proposal } from "@/types/api";

function deriveAssetAddress(seed: string): string {
  const digest = createHash("sha256").update(seed).digest().subarray(0, 32);
  return Keypair.fromSeed(digest).publicKey.toBase58();
}

export async function mintDecisionRecord(input: {
  proposal: Proposal;
  decision: AgentDecision;
}) {
  const assetSeed = JSON.stringify({
    proposalId: input.proposal.id,
    decision: input.decision.decision,
    timestamp: input.decision.createdAt,
  });

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
    mode: getAppConfig().liveSolana ? "configured" : "simulated",
  };
}
