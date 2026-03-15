import {
  mockAuditRecords,
  mockDecisions,
  mockHumanVerification,
  mockProposals,
  mockResearch,
  mockTreasury,
} from "@/mocks/data";
import { createId } from "@/lib/utils";
import type {
  AgentDecision,
  AgentEvent,
  AuditRecord,
  CreateProposalRequest,
  HumanVerification,
  Proposal,
  TreasuryState,
  UnbrowseResearch,
} from "@/types/api";
import type { FounderProfile, AgentConversation, ReputationScore } from "@/types/agents";
import type { TreasuryTransaction, FundPool, Milestone } from "@/types/treasury";

// ─── Inline types for comments, activity, approvals ──────────────

export interface ProposalComment {
  id: string;
  proposalId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  type: "proposal_created" | "evaluation_started" | "evaluation_complete" | "disbursement" | "milestone_verified" | "comment_added";
  title: string;
  description: string;
  proposalId?: string;
  timestamp: string;
}

export interface ApprovalRequest {
  id: string;
  proposalId: string;
  proposalTitle: string;
  amount: number;
  requiredApprovals: number;
  approvals: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
import * as persist from "@/lib/persist";

interface ProposalRecord {
  proposal: Proposal;
  humanVerification?: HumanVerification;
  research?: UnbrowseResearch;
  decision?: AgentDecision;
  auditRecord?: AuditRecord;
  events: AgentEvent[];
}

interface FundFlowStore {
  version: string;
  proposals: Map<string, ProposalRecord>;
  auditRecords: AuditRecord[];
  treasury: TreasuryState;
  listeners: Map<string, Set<(event: AgentEvent) => void>>;
  founders: Map<string, FounderProfile>;
  transactions: TreasuryTransaction[];
  fundPools: FundPool[];
  milestones: Milestone[];
  comments: ProposalComment[];
  activityFeed: ActivityEntry[];
  approvalQueue: ApprovalRequest[];
}

const STORE_VERSION = "2026-03-14-cx14";

declare global {
  var __fundflowStore: FundFlowStore | undefined;
}

function cloneRecord(record: ProposalRecord): ProposalRecord {
  return structuredClone(record);
}

function createSeedStore(): FundFlowStore {
  const proposals = new Map<string, ProposalRecord>();
  const auditRecordByProposalId = new Map(
    mockAuditRecords.map((record) => [record.proposalId, record])
  );

  for (const proposal of mockProposals) {
    proposals.set(proposal.id, {
      proposal,
      humanVerification:
        proposal.id === "prop-001" ? structuredClone(mockHumanVerification) : undefined,
      research: proposal.id === "prop-001" ? structuredClone(mockResearch) : undefined,
      decision: proposal.decision ?? mockDecisions[proposal.id],
      auditRecord: auditRecordByProposalId.get(proposal.id),
      events: [],
    });
  }

  return {
    version: STORE_VERSION,
    proposals,
    auditRecords: structuredClone(mockAuditRecords),
    treasury: structuredClone(mockTreasury),
    listeners: new Map<string, Set<(event: AgentEvent) => void>>(),
    founders: new Map<string, FounderProfile>(),
    transactions: seedTransactions(),
    fundPools: seedFundPools(),
    milestones: [],
    comments: [],
    activityFeed: seedActivity(),
    approvalQueue: [],
  };
}

function getStore(): FundFlowStore {
  if (!global.__fundflowStore || global.__fundflowStore.version !== STORE_VERSION) {
    global.__fundflowStore = createSeedStore();
    // Hydrate founders from PostgreSQL asynchronously
    hydrateFromDB();
  }

  return global.__fundflowStore;
}

/** Load persistent data from PostgreSQL into the in-memory store. */
async function hydrateFromDB() {
  try {
    const founders = await persist.loadFoundersFromDB();
    if (founders.length > 0 && global.__fundflowStore) {
      for (const f of founders) {
        global.__fundflowStore.founders.set(f.wallet, f);
      }
      console.log(`[Store] Hydrated ${founders.length} founders from PostgreSQL`);
    }
    const txs = await persist.loadTransactionsFromDB();
    if (txs.length > 0 && global.__fundflowStore) {
      // Merge DB transactions with seed, deduplicate by id
      const existing = new Set(global.__fundflowStore.transactions.map((t) => t.id));
      for (const tx of txs) {
        if (!existing.has(tx.id)) {
          global.__fundflowStore.transactions.push(tx);
        }
      }
      global.__fundflowStore.transactions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      console.log(`[Store] Hydrated ${txs.length} transactions from PostgreSQL`);
    }
  } catch (err) {
    console.warn("[Store] DB hydration failed (running in memory-only mode):", (err as Error).message);
  }
}

export function listProposals(): Proposal[] {
  return Array.from(getStore().proposals.values())
    .map((record) => structuredClone(record.proposal))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getProposal(proposalId: string): Proposal | null {
  const record = getStore().proposals.get(proposalId);
  return record ? structuredClone(record.proposal) : null;
}

export function getProposalRecord(proposalId: string): ProposalRecord | null {
  const record = getStore().proposals.get(proposalId);
  return record ? cloneRecord(record) : null;
}

export function requireProposalRecord(proposalId: string): ProposalRecord {
  const record = getStore().proposals.get(proposalId);

  if (!record) {
    throw new Error(`Unknown proposal: ${proposalId}`);
  }

  return record;
}

export function createProposal(input: CreateProposalRequest): Proposal {
  const proposal: Proposal = {
    id: createId("prop"),
    applicantWallet: input.applicantWallet,
    title: input.title,
    description: input.description,
    requestedAmount: input.requestedAmount,
    transcript: input.transcript,
    voicePitchUrl: input.voicePitchUrl,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  getStore().proposals.set(proposal.id, {
    proposal,
    events: [],
  });

  persist.persistProposal(proposal);
  return structuredClone(proposal);
}

function updateProposalRecord(
  proposalId: string,
  updater: (record: ProposalRecord) => void
): ProposalRecord {
  const record = requireProposalRecord(proposalId);
  updater(record);
  getStore().proposals.set(proposalId, record);
  return cloneRecord(record);
}

export function setProposalStatus(
  proposalId: string,
  status: Proposal["status"]
): ProposalRecord {
  persist.persistProposalStatus(proposalId, status);
  return updateProposalRecord(proposalId, (record) => {
    record.proposal.status = status;
  });
}

export function setProposalVerification(
  proposalId: string,
  verification: HumanVerification
): ProposalRecord {
  return updateProposalRecord(proposalId, (record) => {
    record.humanVerification = verification;
  });
}

export function setProposalResearch(
  proposalId: string,
  research: UnbrowseResearch
): ProposalRecord {
  return updateProposalRecord(proposalId, (record) => {
    record.research = research;
  });
}

export function setProposalDecision(
  proposalId: string,
  decision: AgentDecision,
  auditRecord?: AuditRecord
): ProposalRecord {
  const result = updateProposalRecord(proposalId, (record) => {
    record.decision = decision;
    record.proposal.decision = decision;
    record.proposal.status = decision.decision;
    if (auditRecord) {
      record.auditRecord = auditRecord;
    }
  });
  persist.persistProposal(result.proposal);
  return result;
}

export function appendAgentEvent(
  proposalId: string,
  event: AgentEvent
): ProposalRecord {
  const store = getStore();
  const record = requireProposalRecord(proposalId);
  record.events.push(event);
  store.proposals.set(proposalId, record);

  const listeners = store.listeners.get(proposalId);
  listeners?.forEach((listener) => listener(structuredClone(event)));

  return cloneRecord(record);
}

export function listAgentEvents(proposalId: string): AgentEvent[] {
  return structuredClone(requireProposalRecord(proposalId).events);
}

export function subscribeToProposalEvents(
  proposalId: string,
  listener: (event: AgentEvent) => void
): () => void {
  const store = getStore();
  const listeners = store.listeners.get(proposalId) ?? new Set();
  listeners.add(listener);
  store.listeners.set(proposalId, listeners);

  return () => {
    const currentListeners = store.listeners.get(proposalId);
    currentListeners?.delete(listener);
    if (currentListeners && currentListeners.size === 0) {
      store.listeners.delete(proposalId);
    }
  };
}

export function listAuditRecords(): AuditRecord[] {
  return structuredClone(getStore().auditRecords).sort((left, right) =>
    right.timestamp.localeCompare(left.timestamp)
  );
}

export function getAuditRecordByAssetAddress(
  assetAddress: string
): AuditRecord | null {
  const record = getStore().auditRecords.find(
    (entry) => entry.coreAssetAddress === assetAddress
  );
  return record ? structuredClone(record) : null;
}

export function addAuditRecord(auditRecord: AuditRecord): AuditRecord {
  getStore().auditRecords.unshift(auditRecord);
  persist.persistAuditRecord(auditRecord);
  return structuredClone(auditRecord);
}

export function getTreasuryState(): TreasuryState {
  return structuredClone(getStore().treasury);
}

export function setTreasuryState(treasury: TreasuryState): TreasuryState {
  getStore().treasury = structuredClone(treasury);
  persist.persistTreasuryState(treasury);
  return getTreasuryState();
}

export const getTreasurySnapshot = getTreasuryState;

// ─── Founder Profiles ─────────────────────────────────────────────

export function getFounder(wallet: string): FounderProfile | null {
  const profile = getStore().founders.get(wallet);
  return profile ? structuredClone(profile) : null;
}

export function listFounders(): FounderProfile[] {
  return Array.from(getStore().founders.values())
    .map((f) => structuredClone(f))
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export function upsertFounder(partial: Partial<FounderProfile> & { wallet: string }): FounderProfile {
  const store = getStore();
  const existing = store.founders.get(partial.wallet);
  const now = new Date().toISOString();

  const profile: FounderProfile = {
    wallet: partial.wallet,
    name: partial.name ?? existing?.name,
    bio: partial.bio ?? existing?.bio,
    platforms: { ...existing?.platforms, ...partial.platforms },
    reputationScore: partial.reputationScore ?? existing?.reputationScore ?? 0,
    proposals: existing?.proposals ?? [],
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
    totalFunded: existing?.totalFunded ?? 0,
    totalRequested: existing?.totalRequested ?? 0,
  };

  store.founders.set(partial.wallet, profile);
  persist.persistFounder(profile);
  return structuredClone(profile);
}

// ─── Transaction Ledger & Fund Pools ──────────────────────────────

function seedFundPools(): FundPool[] {
  return [
    { id: "defi", name: "DeFi & Infrastructure", description: "Core DeFi tooling, indexers, analytics", allocated: 80000, disbursed: 18500, color: "bg-blue-500", icon: "🔗", maxAllocation: 150000 },
    { id: "public-goods", name: "Public Goods", description: "Open source, commons, public benefit", allocated: 60000, disbursed: 9200, color: "bg-emerald-500", icon: "🌱", maxAllocation: 100000 },
    { id: "research", name: "Research & Education", description: "Academic research, workshops, documentation", allocated: 30000, disbursed: 4500, color: "bg-purple-500", icon: "🔬", maxAllocation: 50000 },
    { id: "community", name: "Community & DAOs", description: "Governance tools, community platforms", allocated: 25000, disbursed: 2569.5, color: "bg-amber-500", icon: "👥", maxAllocation: 40000 },
  ];
}

function seedTransactions(): TreasuryTransaction[] {
  const base = new Date("2026-03-10T00:00:00Z");
  return [
    { id: "tx-001", type: "incoming", amount: 200000, description: "Initial treasury funding from Solana Foundation grant", timestamp: new Date(base.getTime()).toISOString() },
    { id: "tx-002", type: "deposit", amount: 120000, description: "Deposit to Meteora yield vault (62/38 split)", pool: "defi", timestamp: new Date(base.getTime() + 3600000).toISOString() },
    { id: "tx-003", type: "yield", amount: 847.32, description: "Meteora vault yield accrual (0.045% APY)", timestamp: new Date(base.getTime() + 86400000).toISOString() },
    { id: "tx-004", type: "disbursement", amount: 15000, description: "Approved: Solana Smart Contract Auditing Toolkit", counterparty: "8nJQk...", proposalId: "prop-001", pool: "defi", timestamp: new Date(base.getTime() + 172800000).toISOString() },
    { id: "tx-005", type: "rebalance", amount: 5000, description: "Auto-rebalance: vault → liquid (maintain 62/38)", timestamp: new Date(base.getTime() + 180000000).toISOString() },
    { id: "tx-006", type: "yield", amount: 500, description: "Meteora vault yield accrual", timestamp: new Date(base.getTime() + 259200000).toISOString() },
    { id: "tx-007", type: "yield", amount: 500, description: "Meteora vault yield accrual", timestamp: new Date(base.getTime() + 345600000).toISOString() },
    { id: "tx-008", type: "disbursement", amount: 3000, description: "Approved: Open Source Climate Data Dashboard", counterparty: "Dn1SD...", proposalId: "prop-eval-1", pool: "public-goods", timestamp: new Date(base.getTime() + 400000000).toISOString() },
  ];
}

export function listTransactions(): TreasuryTransaction[] {
  return structuredClone(getStore().transactions).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
}

export function addTransaction(tx: Omit<TreasuryTransaction, "id" | "timestamp">): TreasuryTransaction {
  const full: TreasuryTransaction = {
    ...tx,
    id: createId("tx"),
    timestamp: new Date().toISOString(),
  };
  getStore().transactions.unshift(full);
  persist.persistTransaction(full);
  return structuredClone(full);
}

export function listFundPools(): FundPool[] {
  return structuredClone(getStore().fundPools);
}

export function updateFundPool(poolId: string, update: Partial<FundPool>): FundPool | null {
  const store = getStore();
  const pool = store.fundPools.find((p) => p.id === poolId);
  if (!pool) return null;
  Object.assign(pool, update);
  return structuredClone(pool);
}

export function addProposalToFounder(
  wallet: string,
  entry: { id: string; title: string; amount: number; decision: string; score: number }
): FounderProfile | null {
  const store = getStore();
  const profile = store.founders.get(wallet);
  if (!profile) return null;

  const date = new Date().toISOString();
  profile.proposals.push({ ...entry, date });
  profile.totalRequested += entry.amount;
  if (entry.decision === "approved") {
    profile.totalFunded += entry.amount;
  }
  profile.lastSeen = date;

  store.founders.set(wallet, profile);
  persist.persistFounder(profile);
  persist.persistFounderProposal(wallet, { ...entry, date });
  return structuredClone(profile);
}

// ─── Milestones ───────────────────────────────────────────────────

export function createMilestones(proposalId: string, totalAmount: number): Milestone[] {
  const tranches = [
    { pct: 30, title: "Phase 1: Setup & Foundation" },
    { pct: 30, title: "Phase 2: Core Development" },
    { pct: 40, title: "Phase 3: Launch & Delivery" },
  ];

  const milestones: Milestone[] = tranches.map((t, i) => ({
    id: createId("ms"),
    proposalId,
    title: t.title,
    tranchePct: t.pct,
    trancheAmount: Math.round(totalAmount * (t.pct / 100) * 100) / 100,
    status: i === 0 ? "disbursed" : "pending", // first tranche auto-disbursed
  }));

  const store = getStore();
  store.milestones.push(...milestones);
  return structuredClone(milestones);
}

export function listMilestones(proposalId?: string): Milestone[] {
  const store = getStore();
  const all = proposalId
    ? store.milestones.filter((m) => m.proposalId === proposalId)
    : store.milestones;
  return structuredClone(all);
}

// ─── Auto-Categorize ─────────────────────────────────────────────

export function categorizeProposal(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  const defiKw = ["defi", "swap", "amm", "liquidity", "yield", "vault", "protocol", "indexer", "oracle", "bridge", "analytics"];
  const publicKw = ["public good", "open source", "commons", "climate", "education", "accessibility", "free"];
  const researchKw = ["research", "paper", "academic", "study", "experiment", "documentation", "workshop"];
  const communityKw = ["community", "dao", "governance", "social", "forum", "voting", "coordination"];

  const scores: Record<string, number> = {
    defi: defiKw.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0),
    "public-goods": publicKw.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0),
    research: researchKw.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0),
    community: communityKw.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0),
  };

  let best = "public-goods";
  let max = 0;
  for (const [pool, score] of Object.entries(scores)) {
    if (score > max) { max = score; best = pool; }
  }
  return best;
}

// ─── Comments ─────────────────────────────────────────────────────

export function addComment(proposalId: string, author: string, text: string): ProposalComment {
  const comment: ProposalComment = {
    id: createId("cmt"),
    proposalId,
    author,
    text,
    createdAt: new Date().toISOString(),
  };
  getStore().comments.push(comment);
  addActivity("comment_added", `Comment on proposal`, text.slice(0, 100), proposalId);
  return structuredClone(comment);
}

export function listComments(proposalId: string): ProposalComment[] {
  return structuredClone(
    getStore().comments
      .filter((c) => c.proposalId === proposalId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

// ─── Activity Feed ────────────────────────────────────────────────

function seedActivity(): ActivityEntry[] {
  return [
    { id: "act-001", type: "proposal_created", title: "New proposal submitted", description: "Solana Smart Contract Auditing Toolkit — $15,000", proposalId: "prop-001", timestamp: "2026-03-12T00:00:00Z" },
    { id: "act-002", type: "evaluation_complete", title: "Evaluation complete", description: "Approved with score 82/100", proposalId: "prop-001", timestamp: "2026-03-12T00:05:00Z" },
    { id: "act-003", type: "disbursement", title: "USDC disbursed", description: "$15,000 transferred to 8nJQk...", proposalId: "prop-001", timestamp: "2026-03-12T00:06:00Z" },
    { id: "act-004", type: "evaluation_complete", title: "Evaluation complete", description: "Rejected with score 38/100", proposalId: "prop-002", timestamp: "2026-03-13T00:00:00Z" },
  ];
}

export function addActivity(
  type: ActivityEntry["type"],
  title: string,
  description: string,
  proposalId?: string
): ActivityEntry {
  const entry: ActivityEntry = {
    id: createId("act"),
    type,
    title,
    description,
    proposalId,
    timestamp: new Date().toISOString(),
  };
  getStore().activityFeed.unshift(entry);
  // Keep only last 50
  if (getStore().activityFeed.length > 50) {
    getStore().activityFeed = getStore().activityFeed.slice(0, 50);
  }
  return structuredClone(entry);
}

export function listActivity(limit = 20): ActivityEntry[] {
  return structuredClone(getStore().activityFeed.slice(0, limit));
}

// ─── Multi-Sig Approval Queue ─────────────────────────────────────

const MULTISIG_THRESHOLD = 15000; // require approvals for amounts above this
const REQUIRED_APPROVALS = 2;

export function requiresMultiSig(amount: number): boolean {
  return amount >= MULTISIG_THRESHOLD;
}

export function createApprovalRequest(
  proposalId: string,
  proposalTitle: string,
  amount: number
): ApprovalRequest {
  const req: ApprovalRequest = {
    id: createId("appr"),
    proposalId,
    proposalTitle,
    amount,
    requiredApprovals: REQUIRED_APPROVALS,
    approvals: [],
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  getStore().approvalQueue.push(req);
  addActivity("proposal_created", "Multi-sig approval required", `$${amount.toLocaleString()} requires ${REQUIRED_APPROVALS} approvals`, proposalId);
  return structuredClone(req);
}

export function approveRequest(requestId: string, approver: string): ApprovalRequest | null {
  const store = getStore();
  const req = store.approvalQueue.find((r) => r.id === requestId);
  if (!req || req.status !== "pending") return null;
  if (req.approvals.includes(approver)) return structuredClone(req); // already approved

  req.approvals.push(approver);
  if (req.approvals.length >= req.requiredApprovals) {
    req.status = "approved";
  }
  return structuredClone(req);
}

export function listApprovalQueue(): ApprovalRequest[] {
  return structuredClone(
    getStore().approvalQueue.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

// ─── Milestone Verification ───────────────────────────────────────

export function verifyMilestone(milestoneId: string): Milestone | null {
  const store = getStore();
  const ms = store.milestones.find((m) => m.id === milestoneId);
  if (!ms || ms.status !== "pending") return null;
  ms.status = "verified";
  ms.verifiedAt = new Date().toISOString();
  addActivity("milestone_verified", "Milestone verified", `${ms.title} — $${ms.trancheAmount.toLocaleString()} ready for release`, ms.proposalId);
  return structuredClone(ms);
}
