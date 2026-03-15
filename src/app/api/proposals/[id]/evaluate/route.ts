import { NextRequest, NextResponse } from "next/server";

import {
  isProposalEvaluationRunning,
  runProposalEvaluation,
} from "@/lib/agent/orchestrator";
import { getProposal } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposal = getProposal(id);

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  if (!isProposalEvaluationRunning(id)) {
    void runProposalEvaluation(id);
  }

  return NextResponse.json(
    { proposalId: id, status: "evaluation_started" },
    { status: 202 }
  );
}
