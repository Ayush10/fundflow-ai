export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listFounders } from "@/lib/store";

export function GET() {
  return NextResponse.json(listFounders());
}
