import { NextResponse } from "next/server";

import {
  registerFundFlowAgent,
  getRegisteredAgent,
} from "@/lib/solana/agent-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cached = getRegisteredAgent();
  if (cached.agentAssetAddress) {
    return NextResponse.json({
      registered: true,
      ...cached,
    });
  }
  return NextResponse.json({ registered: false });
}

export async function POST() {
  const result = await registerFundFlowAgent();
  return NextResponse.json(result);
}
