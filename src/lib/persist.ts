/**
 * Write-through persistence layer.
 * Mirrors in-memory store writes to PostgreSQL asynchronously.
 * Failures are logged but never block the main flow.
 */

import { execute, query, hasDatabase } from "@/lib/db";
import type { Proposal, AuditRecord, AgentEvent, HumanVerification, UnbrowseResearch, TreasuryState } from "@/types/api";
import type { FounderProfile } from "@/types/agents";
import type { TreasuryTransaction, FundPool } from "@/types/treasury";

function fire(fn: () => Promise<unknown>) {
  if (!hasDatabase()) return;
  fn().catch((err) => console.error("[Persist]", (err as Error).message));
}

// ─── Proposals ──────────────────────────────────────────────────────

export function persistProposal(p: Proposal) {
  fire(() =>
    execute(
      `INSERT INTO proposals (id, applicant_wallet, title, description, requested_amount, voice_pitch_url, transcript, status, decision, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET status=$8, decision=$9`,
      [p.id, p.applicantWallet, p.title, p.description, p.requestedAmount, p.voicePitchUrl ?? null, p.transcript ?? null, p.status, p.decision ? JSON.stringify(p.decision) : null, p.createdAt]
    )
  );
}

export function persistProposalStatus(id: string, status: string) {
  fire(() => execute(`UPDATE proposals SET status=$1 WHERE id=$2`, [status, id]));
}

export function persistVerification(v: HumanVerification & { proposalId: string }) {
  fire(() =>
    execute(
      `INSERT INTO human_verifications (proposal_id, wallet, humanity_score, verified, passport_id, checked_at)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (proposal_id) DO UPDATE SET humanity_score=$3, verified=$4`,
      [v.proposalId, v.wallet, v.humanityScore, v.verified, v.passportId ?? null, v.checkedAt]
    )
  );
}

export function persistResearch(proposalId: string, data: UnbrowseResearch) {
  fire(() =>
    execute(
      `INSERT INTO research_results (proposal_id, data, completed_at) VALUES ($1,$2,$3)
       ON CONFLICT (proposal_id) DO UPDATE SET data=$2`,
      [proposalId, JSON.stringify(data), data.completedAt]
    )
  );
}

export function persistAgentEvent(proposalId: string, event: AgentEvent) {
  fire(() =>
    execute(`INSERT INTO agent_events (proposal_id, event) VALUES ($1,$2)`, [proposalId, JSON.stringify(event)])
  );
}

// ─── Audit Records ──────────────────────────────────────────────────

export function persistAuditRecord(r: AuditRecord) {
  fire(() =>
    execute(
      `INSERT INTO audit_records (id, proposal_id, proposal_title, core_asset_address, decision, score, rationale, applicant_wallet, tx_hash, scores, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.proposalId, r.proposalTitle, r.coreAssetAddress, r.decision, r.score, r.rationale, r.applicantWallet, r.txHash, r.scores ? JSON.stringify(r.scores) : null, r.timestamp]
    )
  );
}

// ─── Treasury ───────────────────────────────────────────────────────

export function persistTreasuryState(t: TreasuryState) {
  fire(() =>
    execute(
      `UPDATE treasury_state SET usdc_balance=$1, meteora_vault_balance=$2, meteora_yield_earned=$3, total_disbursed=$4, last_updated=$5 WHERE id=1`,
      [t.usdcBalance, t.meteoraVaultBalance, t.meteoraYieldEarned, t.totalDisbursed, t.lastUpdated]
    )
  );
}

export function persistTransaction(tx: TreasuryTransaction) {
  fire(() =>
    execute(
      `INSERT INTO treasury_transactions (id, type, amount, description, counterparty, proposal_id, tx_hash, pool, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [tx.id, tx.type, tx.amount, tx.description, tx.counterparty ?? null, tx.proposalId ?? null, tx.txHash ?? null, tx.pool ?? null, tx.timestamp]
    )
  );
}

export function persistFundPool(p: FundPool) {
  fire(() =>
    execute(
      `UPDATE fund_pools SET allocated=$1, disbursed=$2 WHERE id=$3`,
      [p.allocated, p.disbursed, p.id]
    )
  );
}

// ─── Founders ───────────────────────────────────────────────────────

export function persistFounder(f: FounderProfile) {
  fire(() =>
    execute(
      `INSERT INTO founders (wallet, name, bio, platforms, reputation_score, first_seen, last_seen, total_funded, total_requested)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (wallet) DO UPDATE SET name=$2, bio=$3, platforms=$4, reputation_score=$5, last_seen=$7, total_funded=$8, total_requested=$9`,
      [f.wallet, f.name ?? null, f.bio ?? null, JSON.stringify(f.platforms), f.reputationScore, f.firstSeen, f.lastSeen, f.totalFunded, f.totalRequested]
    )
  );
}

export function persistFounderProposal(wallet: string, entry: { id: string; title: string; amount: number; decision: string; score: number; date: string }) {
  fire(() =>
    execute(
      `INSERT INTO founder_proposals (wallet, proposal_id, title, amount, decision, score, date) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [wallet, entry.id, entry.title, entry.amount, entry.decision, entry.score, entry.date]
    )
  );
}

// ─── Load from Database on Startup ──────────────────────────────────

export async function loadFoundersFromDB(): Promise<FounderProfile[]> {
  if (!hasDatabase()) return [];
  try {
    const founders = await query<{
      wallet: string; name: string | null; bio: string | null;
      platforms: Record<string, unknown>; reputation_score: number;
      first_seen: unknown; last_seen: unknown; total_funded: number; total_requested: number;
    }>(`SELECT * FROM founders ORDER BY last_seen DESC`);

    const proposals = await query<{
      wallet: string; proposal_id: string; title: string;
      amount: number; decision: string; score: number; date: unknown;
    }>(`SELECT * FROM founder_proposals ORDER BY date DESC`);

    const proposalsByWallet = new Map<string, FounderProfile["proposals"]>();
    for (const p of proposals) {
      const list = proposalsByWallet.get(p.wallet) ?? [];
      list.push({ id: p.proposal_id, title: p.title, amount: Number(p.amount), decision: p.decision, score: p.score, date: p.date instanceof Date ? p.date.toISOString() : String(p.date) });
      proposalsByWallet.set(p.wallet, list);
    }

    return founders.map((f) => ({
      wallet: f.wallet,
      name: f.name ?? undefined,
      bio: f.bio ?? undefined,
      platforms: (typeof f.platforms === "string" ? JSON.parse(f.platforms) : f.platforms) as FounderProfile["platforms"],
      reputationScore: f.reputation_score,
      proposals: proposalsByWallet.get(f.wallet) ?? [],
      firstSeen: f.first_seen instanceof Date ? f.first_seen.toISOString() : String(f.first_seen),
      lastSeen: f.last_seen instanceof Date ? f.last_seen.toISOString() : String(f.last_seen),
      totalFunded: Number(f.total_funded),
      totalRequested: Number(f.total_requested),
    }));
  } catch {
    return [];
  }
}

export async function loadTransactionsFromDB(): Promise<TreasuryTransaction[]> {
  if (!hasDatabase()) return [];
  try {
    const rows = await query<Record<string, unknown>>(`SELECT * FROM treasury_transactions ORDER BY timestamp DESC`);
    return rows.map((r) => ({
      id: String(r.id),
      type: String(r.type) as TreasuryTransaction["type"],
      amount: Number(r.amount),
      description: String(r.description),
      counterparty: r.counterparty ? String(r.counterparty) : undefined,
      proposalId: r.proposal_id ? String(r.proposal_id) : undefined,
      txHash: r.tx_hash ? String(r.tx_hash) : undefined,
      pool: r.pool ? String(r.pool) : undefined,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
    }));
  } catch {
    return [];
  }
}
