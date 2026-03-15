// ============ CORE TYPES ============

export interface Proposal {
  id: string;
  applicantWallet: string;
  title: string;
  description: string;
  requestedAmount: number;
  voicePitchUrl?: string;
  transcript?: string;
  status: ProposalStatus;
  decision?: AgentDecision;
  createdAt: string;
}

export type ProposalStatus =
  | "pending"
  | "evaluating"
  | "approved"
  | "rejected"
  | "flagged";

export type DecisionType = "approved" | "rejected" | "flagged";

export interface HumanVerification {
  wallet: string;
  humanityScore: number;
  verified: boolean;
  passportId?: string;
  checkedAt: string;
}

export interface UnbrowseResearch {
  proposalId: string;
  github: {
    username: string;
    repos: number;
    stars: number;
    commitFrequency: "high" | "medium" | "low";
    topLanguages: string[];
    profileUrl?: string;
    bio?: string;
    contributions?: number;
  } | null;
  linkedin: {
    headline: string;
    employment: string;
    connectionCount: number;
    profileUrl?: string;
    skills?: string[];
  } | null;
  twitter: {
    handle: string;
    followers: number;
    engagement: "high" | "medium" | "low";
    profileUrl?: string;
    recentTopics?: string[];
  } | null;
  dataSources?: {
    github: "unbrowse" | "fallback";
    linkedin: "unbrowse" | "fallback";
    twitter: "unbrowse" | "fallback";
  };
  completedAt: string;
}

export interface EvaluationScore {
  impactPotential: number;
  technicalFeasibility: number;
  teamCredibility: number;
  budgetReasonableness: number;
  missionAlignment: number;
  overall: number;
}

export interface AgentDecision {
  proposalId: string;
  scores: EvaluationScore;
  decision: DecisionType;
  rationale: string;
  narrationAudioUrl?: string;
  onChainTxHash?: string;
  disbursementTxHash?: string;
  createdAt: string;
}

export interface TreasuryState {
  walletAddress: string;
  usdcBalance: number;
  meteoraVaultBalance: number;
  meteoraYieldEarned: number;
  totalDisbursed: number;
  lastUpdated: string;
}

export interface AuditRecord {
  id: string;
  proposalId: string;
  proposalTitle: string;
  coreAssetAddress: string;
  decision: DecisionType;
  score: number;
  rationale: string;
  applicantWallet: string;
  txHash: string;
  timestamp: string;
  scores?: EvaluationScore;
}

// ============ AGENT WORKFLOW EVENTS (SSE) ============

export type AgentEvent =
  | {
      step: "human-check";
      status: "running" | "passed" | "failed";
      data?: HumanVerification;
    }
  | {
      step: "multi-agent-research";
      status: "running" | "complete";
      data?: unknown;
    }
  | {
      step: "agent-message";
      status: "message";
      data?: {
        agentId: string;
        agentName: string;
        emoji: string;
        text: string;
        type: string;
        audioUrl?: string;
      };
    }
  | {
      step: "reputation-score";
      status: "complete";
      data?: unknown;
    }
  | {
      step: "unbrowse-research";
      status: "running" | "complete";
      data?: UnbrowseResearch;
    }
  | {
      step: "ai-evaluation";
      status: "running" | "complete";
      data?: EvaluationScore;
    }
  | {
      step: "decision";
      status: "running" | "complete";
      data?: AgentDecision;
    }
  | {
      step: "on-chain";
      status: "minting" | "transferring" | "rebalancing" | "complete";
      txHash?: string;
    };

// ============ API REQUEST TYPES ============

export interface CreateProposalRequest {
  title: string;
  description: string;
  requestedAmount: number;
  applicantWallet: string;
  transcript?: string;
  voicePitchUrl?: string;
}

export interface TreasuryMutationInput {
  amount: number;
}

export interface VoiceTranscriptionResponse {
  transcript: string;
  provider: "mock" | "elevenlabs";
  confidence?: number;
}

export interface VoiceNarrationResponse {
  audioUrl?: string | null;
  provider: "mock" | "elevenlabs";
  text: string;
}
