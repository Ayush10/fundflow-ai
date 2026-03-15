import { NextRequest, NextResponse } from "next/server";

import { withdrawVaultUsdc } from "@/lib/solana/meteora";
import { treasuryMutationSchema, zodErrorResponse } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = treasuryMutationSchema.safeParse(await req.json());

  if (!payload.success) {
    return zodErrorResponse(payload.error);
  }

  try {
    const result = await withdrawVaultUsdc(payload.data.amount);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Withdraw failed.",
      },
      { status: 400 }
    );
  }
}
