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
  };
}

function getStore(): FundFlowStore {
  if (!global.__fundflowStore || global.__fundflowStore.version !== STORE_VERSION) {
    global.__fundflowStore = createSeedStore();
  }

  return global.__fundflowStore;
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
  return updateProposalRecord(proposalId, (record) => {
    record.decision = decision;
    record.proposal.decision = decision;
    record.proposal.status = decision.decision;
    if (auditRecord) {
      record.auditRecord = auditRecord;
    }
  });
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
  return structuredClone(auditRecord);
}

export function getTreasuryState(): TreasuryState {
  return structuredClone(getStore().treasury);
}

export function setTreasuryState(treasury: TreasuryState): TreasuryState {
  getStore().treasury = structuredClone(treasury);
  return getTreasuryState();
}
