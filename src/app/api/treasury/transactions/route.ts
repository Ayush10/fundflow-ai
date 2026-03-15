export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listTransactions } from "@/lib/store";

export function GET() {
  return NextResponse.json(listTransactions());
}
