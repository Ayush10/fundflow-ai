import { NextResponse } from "next/server";

import { getTreasurySnapshot } from "@/lib/solana/meteora";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getTreasurySnapshot());
}
