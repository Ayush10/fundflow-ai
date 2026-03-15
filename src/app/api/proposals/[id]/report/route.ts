export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getProposalRecord } from "@/lib/store";

/**
 * GET /api/proposals/[id]/report
 * Returns a JSON due diligence report that the frontend renders as PDF.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = getProposalRecord(id);

  if (!record) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    proposal: {
      id: record.proposal.id,
      title: record.proposal.title,
      description: record.proposal.description,
      requestedAmount: record.proposal.requestedAmount,
      applicantWallet: record.proposal.applicantWallet,
      status: record.proposal.status,
      createdAt: record.proposal.createdAt,
    },
    humanVerification: record.humanVerification ?? null,
    research: record.research ?? null,
    decision: record.decision ?? null,
    auditRecord: record.auditRecord ?? null,
    agentEvents: record.events.filter((e) =>
      ["agent-message", "reputation-score"].includes(e.step)
    ),
  };

  return NextResponse.json(report);
}
