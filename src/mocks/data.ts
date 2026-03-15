import type {
  Proposal,
  TreasuryState,
  AuditRecord,
  AgentDecision,
  UnbrowseResearch,
  HumanVerification,
  EvaluationScore,
} from "@/types/api";

export const mockTreasury: TreasuryState = {
  walletAddress: "FundF1ow7reasury1111111111111111111111111111",
  usdcBalance: 45_230.5,
  meteoraVaultBalance: 120_000,
  meteoraYieldEarned: 1_847.32,
  totalDisbursed: 34_769.5,
  lastUpdated: new Date().toISOString(),
};

export const mockDecisions: Record<string, AgentDecision> = {
  "prop-001": {
    proposalId: "prop-001",
    scores: {
      impactPotential: 88,
      technicalFeasibility: 75,
      teamCredibility: 92,
      budgetReasonableness: 70,
      missionAlignment: 85,
      overall: 82,
    },
    decision: "approved",
    rationale:
      "Strong team with proven track record in decentralized infrastructure. The proposed developer tooling for Solana smart contract auditing addresses a genuine gap. Budget is slightly high but justified by the 6-month timeline and team size. Recommend full funding.",
    onChainTxHash:
      "5KtPn1LGuxhFiwjxErkxTb3XoW4yDiAt5U8Y8NKQr7mRvLbGgJDXEaQdT3HrZF2w",
    disbursementTxHash:
      "3vZ9BfXkKERmFU5xBNFNJ6NrHS7gPa5CkF95L2u3XY8VqFhAEoEPmRt1f4dJ6gPe",
    createdAt: "2026-03-14T10:30:00Z",
  },
  "prop-002": {
    proposalId: "prop-002",
    scores: {
      impactPotential: 45,
      technicalFeasibility: 30,
      teamCredibility: 25,
      budgetReasonableness: 40,
      missionAlignment: 50,
      overall: 38,
    },
    decision: "rejected",
    rationale:
      "The proposal lacks technical specificity. No GitHub activity found for the applicant, and the LinkedIn profile shows no relevant experience. The requested budget of $50,000 is disproportionate to the vague deliverables described. Recommend rejection.",
    onChainTxHash:
      "2XmPq9LGuxhFiwjxErkxTb3XoW4yDiAt5U8Y8NKQr7mRvLbGgJDXEaQdT3HrZF2w",
    createdAt: "2026-03-14T11:15:00Z",
  },
  "prop-003": {
    proposalId: "prop-003",
    scores: {
      impactPotential: 65,
      technicalFeasibility: 60,
      teamCredibility: 55,
      budgetReasonableness: 68,
      missionAlignment: 62,
      overall: 62,
    },
    decision: "flagged",
    rationale:
      "Promising concept for cross-chain governance tooling, but the team's limited blockchain experience raises concerns. GitHub shows active development but in unrelated domains. Recommend human review before funding decision.",
    onChainTxHash:
      "4YnRs2LGuxhFiwjxErkxTb3XoW4yDiAt5U8Y8NKQr7mRvLbGgJDXEaQdT3HrZF2w",
    createdAt: "2026-03-14T12:00:00Z",
  },
};

export const mockProposals: Proposal[] = [
  {
    id: "prop-001",
    applicantWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    title: "Solana Smart Contract Auditing Toolkit",
    description:
      "Building an open-source automated auditing toolkit for Solana programs. Uses static analysis and symbolic execution to detect common vulnerabilities like reentrancy, integer overflow, and unauthorized signer checks. Phase 1 delivers a CLI tool; Phase 2 adds a VS Code extension with inline warnings.",
    requestedAmount: 15_000,
    status: "approved",
    decision: mockDecisions["prop-001"],
    createdAt: "2026-03-14T10:00:00Z",
  },
  {
    id: "prop-002",
    applicantWallet: "9pKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBsV",
    title: "Decentralized Social Media Platform",
    description:
      "Creating a new social media platform on blockchain. Will have posts, likes, and followers. Looking for funding to hire developers and market the product.",
    requestedAmount: 50_000,
    status: "rejected",
    decision: mockDecisions["prop-002"],
    createdAt: "2026-03-14T10:45:00Z",
  },
  {
    id: "prop-003",
    applicantWallet: "3mKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgCsW",
    title: "Cross-Chain Governance Bridge",
    description:
      "A governance aggregation layer that enables DAOs on Solana, Ethereum, and Cosmos to coordinate on shared proposals. Uses message passing protocols to sync voting state. Prototype already works on testnet between Solana and Ethereum Sepolia.",
    requestedAmount: 25_000,
    status: "flagged",
    decision: mockDecisions["prop-003"],
    createdAt: "2026-03-14T11:30:00Z",
  },
  {
    id: "prop-004",
    applicantWallet: "5nKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgDsX",
    title: "DeFi Yield Optimizer for DAOs",
    description:
      "An autonomous agent that manages DAO treasury yield strategies across Solana DeFi protocols. Supports Meteora, Raydium, and Marinade. The agent continuously rebalances based on risk parameters set by DAO governance votes.",
    requestedAmount: 20_000,
    status: "pending",
    createdAt: "2026-03-14T13:00:00Z",
  },
  {
    id: "prop-005",
    applicantWallet: "8qKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgEsY",
    title: "On-Chain Identity Verification SDK",
    description:
      "Building a TypeScript SDK that wraps human.tech, Civic, and World ID into a unified identity verification layer for Solana dApps. Developers can add sybil-resistant verification with 3 lines of code.",
    requestedAmount: 12_000,
    status: "pending",
    createdAt: "2026-03-14T13:30:00Z",
  },
];

export const mockAuditRecords: AuditRecord[] = [
  {
    id: "audit-001",
    proposalId: "prop-001",
    proposalTitle: "Solana Smart Contract Auditing Toolkit",
    coreAssetAddress: "CoRe1111111111111111111111111111111111111111",
    decision: "approved",
    score: 82,
    rationale: mockDecisions["prop-001"].rationale,
    applicantWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    txHash:
      "5KtPn1LGuxhFiwjxErkxTb3XoW4yDiAt5U8Y8NKQr7mRvLbGgJDXEaQdT3HrZF2w",
    timestamp: "2026-03-14T10:30:00Z",
  },
  {
    id: "audit-002",
    proposalId: "prop-002",
    proposalTitle: "Decentralized Social Media Platform",
    coreAssetAddress: "CoRe2222222222222222222222222222222222222222",
    decision: "rejected",
    score: 38,
    rationale: mockDecisions["prop-002"].rationale,
    applicantWallet: "9pKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBsV",
    txHash:
      "2XmPq9LGuxhFiwjxErkxTb3XoW4yDiAt5U8Y8NKQr7mRvLbGgJDXEaQdT3HrZF2w",
    timestamp: "2026-03-14T11:15:00Z",
  },
  {
    id: "audit-003",
    proposalId: "prop-003",
    proposalTitle: "Cross-Chain Governance Bridge",
    coreAssetAddress: "CoRe3333333333333333333333333333333333333333",
    decision: "flagged",
    score: 62,
    rationale: mockDecisions["prop-003"].rationale,
    applicantWallet: "3mKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgCsW",
    txHash:
      "4YnRs2LGuxhFiwjxErkxTb3XoW4yDiAt5U8Y8NKQr7mRvLbGgJDXEaQdT3HrZF2w",
    timestamp: "2026-03-14T12:00:00Z",
  },
];

export const mockResearch: UnbrowseResearch = {
  proposalId: "prop-001",
  github: {
    username: "solana-auditor",
    repos: 34,
    stars: 1_247,
    commitFrequency: "high",
    topLanguages: ["Rust", "TypeScript", "Python"],
  },
  linkedin: {
    headline: "Senior Blockchain Security Engineer",
    employment: "Trail of Bits (2022-present)",
    connectionCount: 890,
  },
  twitter: {
    handle: "@solana_auditor",
    followers: 4_200,
    engagement: "medium",
  },
  completedAt: "2026-03-14T10:20:00Z",
};

export const mockHumanVerification: HumanVerification = {
  wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  humanityScore: 87,
  verified: true,
  passportId: "hp_8x7f2k9m3n",
  checkedAt: "2026-03-14T10:15:00Z",
};

export const mockEvaluationScores: EvaluationScore = {
  impactPotential: 88,
  technicalFeasibility: 75,
  teamCredibility: 92,
  budgetReasonableness: 70,
  missionAlignment: 85,
  overall: 82,
};
