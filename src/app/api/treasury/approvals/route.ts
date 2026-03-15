export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listApprovalQueue, approveRequest } from "@/lib/store";

export function GET() {
  return NextResponse.json(listApprovalQueue());
}

export async function POST(request: Request) {
  const body = await request.json() as { requestId?: string; approver?: string };
  if (!body.requestId || !body.approver) {
    return NextResponse.json({ error: "requestId and approver required" }, { status: 400 });
  }
  const result = approveRequest(body.requestId, body.approver);
  if (!result) {
    return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
  }
  return NextResponse.json(result);
}
