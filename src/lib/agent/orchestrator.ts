import {
  addProposalToFounder,
  addTransaction,
  appendAgentEvent,
  getProposal,
  requireProposalRecord,
  setProposalDecision,
  setProposalResearch,
  setProposalStatus,
  setProposalVerification,
  upsertFounder,
} from "@/lib/store";
import {
  decisionFromOverallScore,
  evaluateProposal,
} from "@/lib/agent/evaluator";
import { runMultiAgentResearch } from "@/lib/agent/multi-agent";
import { verifyHumanity } from "@/lib/integrations/human-tech";
import { mintDecisionRecord } from "@/lib/solana/metaplex";
import { rebalanceVault } from "@/lib/solana/meteora";
import { disburseApprovedProposal } from "@/lib/solana/treasury";
import { narrateDecision } from "@/lib/voice/elevenlabs";
import { sleep, roundCurrency } from "@/lib/utils";
import type { AgentDecision, Proposal } from "@/types/api";

declare global {
  var __fundflowJobs: Map<string, Promise<Proposal>> | undefined;
}

function getJobMap() {
  if (!global.__fundflowJobs) {
    global.__fundflowJobs = new Map();
  }
  return global.__fundflowJobs;
}

function createFailedHumanDecision(
  proposalId: string,
  humanityScore: number
): AgentDecision {
  return {
    proposalId,
    decision: "rejected",
    rationale:
      "The applicant failed the minimum humanity threshold, so the proposal was rejected before deeper due diligence or capital movement.",
    scores: {
      impactPotential: 25,
      technicalFeasibility: 25,
      teamCredibility: humanityScore,
      budgetReasonableness: 35,
      missionAlignment: 35,
      overall: 30,
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Enhanced evaluation with multi-agent due diligence.
 *
 * Flow:
 * 1. Human Passport verification
 * 2. Multi-agent research (5 agents, 6 platforms, real-time conversation)
 * 3. Reputation scoring
 * 4. AI evaluation (enhanced with reputation data)
 * 5. Decision: 80%+ → approved (proportional funding), 50-79 → flagged, <50 → rejected
 * 6. Founder profile creation/update
 * 7. On-chain actions (mint, disburse, rebalance)
 */
async function executeEvaluation(proposalId: string): Promise<Proposal> {
  const record = requireProposalRecord(proposalId);
  setProposalStatus(proposalId, "evaluating");

  // ── Step 1: Human Check ──

  appendAgentEvent(proposalId, {
    step: "human-check",
    status: "running",
  });
  await sleep(250);

  const verification = await verifyHumanity(record.proposal.applicantWallet);
  setProposalVerification(proposalId, verification);
  appendAgentEvent(proposalId, {
    step: "human-check",
    status: verification.verified ? "passed" : "failed",
    data: verification,
  });

  if (!verification.verified) {
    appendAgentEvent(proposalId, { step: "decision", status: "running" });
    await sleep(180);

    let decision = createFailedHumanDecision(proposalId, verification.humanityScore);
    const narration = await narrateDecision(decision.rationale);
    decision = { ...decision, narrationAudioUrl: narration.audioUrl ?? undefined };

    appendAgentEvent(proposalId, { step: "on-chain", status: "minting" });
    const minted = await mintDecisionRecord({ proposal: record.proposal, decision });
    decision = { ...decision, onChainTxHash: minted.auditRecord.txHash };

    // Create founder profile even for rejected
    upsertFounder({ wallet: record.proposal.applicantWallet, reputationScore: 0 });
    addProposalToFounder(record.proposal.applicantWallet, {
      id: proposalId,
      title: record.proposal.title,
      amount: record.proposal.requestedAmount,
      decision: "rejected",
      score: decision.scores.overall,
    });

    setProposalDecision(proposalId, decision, minted.auditRecord);
    appendAgentEvent(proposalId, { step: "decision", status: "complete", data: decision });
    appendAgentEvent(proposalId, { step: "on-chain", status: "complete", txHash: minted.auditRecord.txHash });

    return getProposal(proposalId)!;
  }

  // ── Step 2: Multi-Agent Research ──

  appendAgentEvent(proposalId, { step: "multi-agent-research", status: "running" });

  const multiAgentResult = await runMultiAgentResearch(
    record.proposal,
    (msg) => {
      // Stream each agent message as an SSE event
      appendAgentEvent(proposalId, {
        step: "agent-message",
        status: "message",
        data: {
          agentId: msg.agentId,
          agentName: msg.agentName,
          emoji: msg.emoji,
          text: msg.text,
          type: msg.type,
          audioUrl: msg.audioUrl,
        },
      });
    }
  );

  // Create/update founder profile with research data
  upsertFounder({
    ...multiAgentResult.founderProfile,
    wallet: record.proposal.applicantWallet,
  });

  appendAgentEvent(proposalId, {
    step: "reputation-score",
    status: "complete",
    data: {
      overall: multiAgentResult.reputation.overall,
      platformPresence: multiAgentResult.reputation.platformPresence,
      sentimentScore: multiAgentResult.reputation.sentimentScore,
      verificationScore: multiAgentResult.reputation.verificationScore,
      communityEngagement: multiAgentResult.reputation.communityEngagement,
      trackRecord: multiAgentResult.reputation.trackRecord,
      founderName: multiAgentResult.reputation.founderName,
    },
  });

  appendAgentEvent(proposalId, { step: "multi-agent-research", status: "complete" });

  // Also run the original unbrowse research for backward compatibility
  appendAgentEvent(proposalId, { step: "unbrowse-research", status: "running" });
  const { runUnbrowseResearch } = await import("@/lib/integrations/unbrowse");
  const research = await runUnbrowseResearch(record.proposal);
  setProposalResearch(proposalId, research);
  appendAgentEvent(proposalId, { step: "unbrowse-research", status: "complete", data: research });

  // ── Step 3: AI Evaluation (enhanced with reputation) ──

  appendAgentEvent(proposalId, { step: "ai-evaluation", status: "running" });
  await sleep(250);

  const evaluation = await evaluateProposal({
    proposal: record.proposal,
    verification,
    research,
    reputationScore: multiAgentResult.reputation.overall,
    platformResults: multiAgentResult.platformResults,
  });
  appendAgentEvent(proposalId, { step: "ai-evaluation", status: "complete", data: evaluation.scores });

  // ── Step 4: Decision with 80% threshold + proportional funding ──

  appendAgentEvent(proposalId, { step: "decision", status: "running" });
  await sleep(180);

  const overallScore = evaluation.scores.overall;
  const decisionType = overallScore >= 80 ? "approved" as const
    : overallScore >= 50 ? "flagged" as const
    : "rejected" as const;

  // Proportional funding: funding = requestedAmount * (score/100)
  const fundingRatio = decisionType === "approved" ? overallScore / 100 : 0;
  const approvedAmount = roundCurrency(record.proposal.requestedAmount * fundingRatio);

  let decision: AgentDecision = {
    proposalId,
    scores: evaluation.scores,
    decision: decisionType,
    rationale: evaluation.rationale + (
      decisionType === "approved" && fundingRatio < 1
        ? ` Based on the ${overallScore}% confidence score, approved funding is $${approvedAmount.toLocaleString()} (${Math.round(fundingRatio * 100)}% of requested $${record.proposal.requestedAmount.toLocaleString()}).`
        : ""
    ),
    createdAt: new Date().toISOString(),
  };

  const narration = await narrateDecision(decision.rationale);
  decision = { ...decision, narrationAudioUrl: narration.audioUrl ?? undefined };

  // ── Step 5: On-Chain ──

  appendAgentEvent(proposalId, { step: "on-chain", status: "minting" });

  const minted = await mintDecisionRecord({ proposal: record.proposal, decision });
  decision = { ...decision, onChainTxHash: minted.auditRecord.txHash };

  if (decision.decision === "approved") {
    appendAgentEvent(proposalId, { step: "on-chain", status: "transferring" });
    // Disburse proportional amount
    const disbursalProposal = { ...record.proposal, requestedAmount: approvedAmount };
    const disbursement = await disburseApprovedProposal(disbursalProposal);
    decision = { ...decision, disbursementTxHash: disbursement.txHash };

    // Log to transaction ledger
    addTransaction({
      type: "disbursement",
      amount: approvedAmount,
      description: `Approved: ${record.proposal.title} (${overallScore}% score, ${Math.round(fundingRatio * 100)}% of requested)`,
      counterparty: record.proposal.applicantWallet.slice(0, 8) + "...",
      proposalId,
      txHash: disbursement.txHash,
      pool: approvedAmount > 10000 ? "defi" : "public-goods",
    });
  }

  appendAgentEvent(proposalId, { step: "on-chain", status: "rebalancing" });
  await rebalanceVault();

  // ── Step 6: Update founder profile with decision ──

  addProposalToFounder(record.proposal.applicantWallet, {
    id: proposalId,
    title: record.proposal.title,
    amount: decisionType === "approved" ? approvedAmount : record.proposal.requestedAmount,
    decision: decisionType,
    score: overallScore,
  });

  setProposalDecision(proposalId, decision, minted.auditRecord);
  appendAgentEvent(proposalId, { step: "decision", status: "complete", data: decision });
  appendAgentEvent(proposalId, {
    step: "on-chain",
    status: "complete",
    txHash: decision.disbursementTxHash ?? decision.onChainTxHash,
  });

  return getProposal(proposalId)!;
}

export async function runProposalEvaluation(proposalId: string): Promise<Proposal> {
  const jobs = getJobMap();
  const existingJob = jobs.get(proposalId);
  if (existingJob) return existingJob;

  const job = executeEvaluation(proposalId).finally(() => {
    jobs.delete(proposalId);
  });

  jobs.set(proposalId, job);
  return job;
}

export function isProposalEvaluationRunning(proposalId: string): boolean {
  return getJobMap().has(proposalId);
}
