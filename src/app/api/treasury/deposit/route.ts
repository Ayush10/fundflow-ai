import { NextRequest, NextResponse } from "next/server";

import { depositIdleUsdc } from "@/lib/solana/meteora";
import { treasuryMutationSchema, zodErrorResponse } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = treasuryMutationSchema.safeParse(await req.json());

  if (!payload.success) {
    return zodErrorResponse(payload.error);
  }

  try {
    const result = await depositIdleUsdc(payload.data.amount);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Deposit failed.",
      },
      { status: 400 }
    );
  }
}
