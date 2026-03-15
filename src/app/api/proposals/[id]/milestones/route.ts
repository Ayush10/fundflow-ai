export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listMilestones, verifyMilestone } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(listMilestones(id));
}

export async function POST(
  request: Request,
) {
  const body = await request.json() as { milestoneId?: string };
  if (!body.milestoneId) {
    return NextResponse.json({ error: "milestoneId required" }, { status: 400 });
  }
  const result = verifyMilestone(body.milestoneId);
  if (!result) {
    return NextResponse.json({ error: "Milestone not found or already verified" }, { status: 404 });
  }
  return NextResponse.json(result);
}
