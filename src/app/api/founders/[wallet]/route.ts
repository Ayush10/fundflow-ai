export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getFounder } from "@/lib/store";

export function GET(
  _request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  return params.then(({ wallet }) => {
    const founder = getFounder(wallet);
    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }
    return NextResponse.json(founder);
  });
}
