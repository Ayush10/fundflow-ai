import {
  appendAgentEvent,
  getProposal,
  requireProposalRecord,
  setProposalDecision,
  setProposalResearch,
  setProposalStatus,
  setProposalVerification,
} from "@/lib/store";
import {
  decisionFromOverallScore,
  evaluateProposal,
} from "@/lib/agent/evaluator";
import { verifyHumanity } from "@/lib/integrations/human-tech";
import { runUnbrowseResearch } from "@/lib/integrations/unbrowse";
import { mintDecisionRecord } from "@/lib/solana/metaplex";
import { rebalanceVault } from "@/lib/solana/meteora";
import { disburseApprovedProposal } from "@/lib/solana/treasury";
import { narrateDecision } from "@/lib/voice/elevenlabs";
import { sleep } from "@/lib/utils";
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

async function executeEvaluation(proposalId: string): Promise<Proposal> {
  const record = requireProposalRecord(proposalId);
  setProposalStatus(proposalId, "evaluating");

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
    appendAgentEvent(proposalId, {
      step: "decision",
      status: "running",
    });
    await sleep(180);

    let decision = createFailedHumanDecision(proposalId, verification.humanityScore);
    const narration = await narrateDecision(decision.rationale);
    decision = {
      ...decision,
      narrationAudioUrl: narration.audioUrl ?? undefined,
    };

    appendAgentEvent(proposalId, {
      step: "on-chain",
      status: "minting",
    });
    const minted = await mintDecisionRecord({
      proposal: record.proposal,
      decision,
    });
    decision = {
      ...decision,
      onChainTxHash: minted.auditRecord.txHash,
    };

    setProposalDecision(proposalId, decision, minted.auditRecord);
    appendAgentEvent(proposalId, {
      step: "decision",
      status: "complete",
      data: decision,
    });
    appendAgentEvent(proposalId, {
      step: "on-chain",
      status: "complete",
      txHash: minted.auditRecord.txHash,
    });

    return getProposal(proposalId)!;
  }

  appendAgentEvent(proposalId, {
    step: "unbrowse-research",
    status: "running",
  });
  await sleep(250);

  const research = await runUnbrowseResearch(record.proposal);
  setProposalResearch(proposalId, research);
  appendAgentEvent(proposalId, {
    step: "unbrowse-research",
    status: "complete",
    data: research,
  });

  appendAgentEvent(proposalId, {
    step: "ai-evaluation",
    status: "running",
  });
  await sleep(250);

  const evaluation = await evaluateProposal({
    proposal: record.proposal,
    verification,
    research,
  });
  appendAgentEvent(proposalId, {
    step: "ai-evaluation",
    status: "complete",
    data: evaluation.scores,
  });

  appendAgentEvent(proposalId, {
    step: "decision",
    status: "running",
  });
  await sleep(180);

  let decision: AgentDecision = {
    proposalId,
    scores: evaluation.scores,
    decision: decisionFromOverallScore(evaluation.scores.overall),
    rationale: evaluation.rationale,
    createdAt: new Date().toISOString(),
  };

  const narration = await narrateDecision(decision.rationale);
  decision = {
    ...decision,
    narrationAudioUrl: narration.audioUrl ?? undefined,
  };

  appendAgentEvent(proposalId, {
    step: "on-chain",
    status: "minting",
  });

  const minted = await mintDecisionRecord({
    proposal: record.proposal,
    decision,
  });

  decision = {
    ...decision,
    onChainTxHash: minted.auditRecord.txHash,
  };

  if (decision.decision === "approved") {
    appendAgentEvent(proposalId, {
      step: "on-chain",
      status: "transferring",
    });
    const disbursement = await disburseApprovedProposal(record.proposal);
    decision = {
      ...decision,
      disbursementTxHash: disbursement.txHash,
    };
  }

  appendAgentEvent(proposalId, {
    step: "on-chain",
    status: "rebalancing",
  });
  await rebalanceVault();

  setProposalDecision(proposalId, decision, minted.auditRecord);
  appendAgentEvent(proposalId, {
    step: "decision",
    status: "complete",
    data: decision,
  });
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

  if (existingJob) {
    return existingJob;
  }

  const job = executeEvaluation(proposalId).finally(() => {
    jobs.delete(proposalId);
  });

  jobs.set(proposalId, job);
  return job;
}

export function isProposalEvaluationRunning(proposalId: string): boolean {
  return getJobMap().has(proposalId);
}
