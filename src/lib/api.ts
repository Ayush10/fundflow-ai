import type {
  Proposal,
  TreasuryState,
  AuditRecord,
  CreateProposalRequest,
  AgentEvent,
} from "@/types/api";
import {
  mockProposals,
  mockTreasury,
  mockAuditRecords,
  mockHumanVerification,
  mockResearch,
  mockEvaluationScores,
  mockDecisions,
} from "@/mocks/data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;
  issues?: string[];

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string[]>,
    issues?: string[]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.issues = issues;
  }

  /** Return first field error message, or the top-level message */
  get displayMessage(): string {
    if (this.issues && this.issues.length > 0) {
      return this.issues[0];
    }
    if (this.fieldErrors) {
      const first = Object.entries(this.fieldErrors).find(
        ([, msgs]) => msgs.length > 0
      );
      if (first) return `${first[0]}: ${first[1][0]}`;
    }
    return this.message;
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    return getMockData<T>(path, options);
  }
  const res = await fetch(path, options);
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    let fieldErrors: Record<string, string[]> | undefined;
    let issues: string[] | undefined;
    try {
      const body = await res.json();
      if (typeof body.message === "string") {
        message = body.message;
      } else if (typeof body.error === "string") {
        message = body.error;
      }
      if (Array.isArray(body.issues)) {
        issues = body.issues.filter(
          (issue: unknown): issue is string => typeof issue === "string"
        );
      }
      if (body.issues?.fieldErrors) fieldErrors = body.issues.fieldErrors;
      if (body.fieldErrors) fieldErrors = body.fieldErrors;
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(message, res.status, fieldErrors, issues);
  }
  return res.json();
}

// Mock data router
function getMockData<T>(path: string, options?: RequestInit): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (path === "/api/proposals" && options?.method === "POST") {
        const body = JSON.parse(options.body as string) as CreateProposalRequest;
        const newProposal: Proposal = {
          id: `prop-${Date.now()}`,
          ...body,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        resolve(newProposal as T);
      } else if (path === "/api/proposals") {
        resolve([...mockProposals] as T);
      } else if (path.match(/\/api\/proposals\/[\w-]+$/)) {
        const id = path.split("/").pop()!;
        const proposal = mockProposals.find((p) => p.id === id) ?? mockProposals[0];
        resolve(proposal as T);
      } else if (path === "/api/treasury") {
        resolve({ ...mockTreasury } as T);
      } else if (path === "/api/audit") {
        resolve([...mockAuditRecords] as T);
      } else {
        resolve({} as T);
      }
    }, 300);
  });
}

// ============ API FUNCTIONS ============

export async function getProposals(): Promise<Proposal[]> {
  return fetchApi<Proposal[]>("/api/proposals");
}

export async function getProposal(id: string): Promise<Proposal> {
  return fetchApi<Proposal>(`/api/proposals/${id}`);
}

export async function createProposal(
  data: CreateProposalRequest
): Promise<Proposal> {
  return fetchApi<Proposal>("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getTreasury(): Promise<TreasuryState> {
  return fetchApi<TreasuryState>("/api/treasury");
}

export async function getAuditRecords(): Promise<AuditRecord[]> {
  return fetchApi<AuditRecord[]>("/api/audit");
}

export async function depositToVault(amount: number): Promise<TreasuryState> {
  const res = await fetchApi<{ treasury: TreasuryState }>(
    "/api/treasury/deposit",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }
  );
  return res.treasury;
}

export async function withdrawFromVault(
  amount: number
): Promise<TreasuryState> {
  const res = await fetchApi<{ treasury: TreasuryState }>(
    "/api/treasury/withdraw",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }
  );
  return res.treasury;
}

export async function triggerEvaluation(proposalId: string): Promise<void> {
  if (USE_MOCK) return;
  await fetch(`/api/proposals/${proposalId}/evaluate`, { method: "POST" });
}

// SSE stream for agent events (mock version simulates the full pipeline)
export function subscribeToAgentEvents(
  proposalId: string,
  onEvent: (event: AgentEvent) => void,
  onComplete: () => void
): () => void {
  if (USE_MOCK) {
    return simulateAgentEvents(onEvent, onComplete);
  }

  const eventSource = new EventSource(
    `/api/proposals/${proposalId}/stream`
  );
  void fetch(`/api/proposals/${proposalId}/evaluate`, { method: "POST" });
  eventSource.onmessage = (e) => {
    const event = JSON.parse(e.data) as AgentEvent;
    onEvent(event);
    if (event.step === "on-chain" && event.status === "complete") {
      eventSource.close();
      onComplete();
    }
  };
  eventSource.onerror = () => {
    eventSource.close();
    onComplete();
  };
  return () => eventSource.close();
}

function simulateAgentEvents(
  onEvent: (event: AgentEvent) => void,
  onComplete: () => void
): () => void {
  const events: { event: AgentEvent; delay: number }[] = [
    { event: { step: "human-check", status: "running" }, delay: 500 },
    {
      event: {
        step: "human-check",
        status: "passed",
        data: mockHumanVerification,
      },
      delay: 2000,
    },
    { event: { step: "unbrowse-research", status: "running" }, delay: 500 },
    {
      event: {
        step: "unbrowse-research",
        status: "complete",
        data: mockResearch,
      },
      delay: 3000,
    },
    { event: { step: "ai-evaluation", status: "running" }, delay: 500 },
    {
      event: {
        step: "ai-evaluation",
        status: "complete",
        data: mockEvaluationScores,
      },
      delay: 2500,
    },
    { event: { step: "decision", status: "running" }, delay: 500 },
    {
      event: {
        step: "decision",
        status: "complete",
        data: mockDecisions["prop-001"],
      },
      delay: 1500,
    },
    { event: { step: "on-chain", status: "minting" }, delay: 500 },
    { event: { step: "on-chain", status: "transferring" }, delay: 1500 },
    { event: { step: "on-chain", status: "rebalancing" }, delay: 1500 },
    {
      event: {
        step: "on-chain",
        status: "complete",
        txHash:
          "5KtPn1LGuxhFiwjxErkxTb3XoW4yDiAt5U8Y8NKQr7mRvLbGgJDXEaQdT3HrZF2w",
      },
      delay: 1000,
    },
  ];

  let cancelled = false;
  let currentTimeout: ReturnType<typeof setTimeout>;

  function scheduleNext(index: number) {
    if (cancelled || index >= events.length) {
      if (!cancelled) onComplete();
      return;
    }
    currentTimeout = setTimeout(() => {
      if (!cancelled) {
        onEvent(events[index].event);
        scheduleNext(index + 1);
      }
    }, events[index].delay);
  }

  scheduleNext(0);
  return () => {
    cancelled = true;
    clearTimeout(currentTimeout);
  };
}
