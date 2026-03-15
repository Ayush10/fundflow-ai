import { NextRequest, NextResponse } from "next/server";

import { getAuditRecordByAssetAddress } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assetAddress: string }> }
) {
  const { assetAddress } = await params;
  const record = getAuditRecordByAssetAddress(assetAddress);

  if (!record) {
    return NextResponse.json(
      { error: "Audit record not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(record);
}
