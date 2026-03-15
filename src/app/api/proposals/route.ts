import { NextRequest, NextResponse } from "next/server";

import { createProposal, listProposals } from "@/lib/store";
import { createProposalSchema, zodErrorResponse } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listProposals());
}

export async function POST(req: NextRequest) {
  const payload = createProposalSchema.safeParse(await req.json());

  if (!payload.success) {
    return zodErrorResponse(payload.error);
  }

  const proposal = createProposal(payload.data);
  return NextResponse.json(proposal, { status: 201 });
}
