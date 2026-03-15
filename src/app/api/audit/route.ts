import { NextResponse } from "next/server";

import { listAuditRecords } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listAuditRecords());
}
