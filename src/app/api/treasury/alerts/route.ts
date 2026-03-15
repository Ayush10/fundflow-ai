export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getTreasuryState, listFundPools } from "@/lib/store";

interface Alert {
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
}

const MIN_LIQUID_BALANCE = 9000;
const LOW_LIQUID_THRESHOLD = 15000;
const POOL_DEPLETION_THRESHOLD = 85; // percent

export function GET() {
  const treasury = getTreasuryState();
  const pools = listFundPools();
  const alerts: Alert[] = [];

  // Critical: liquid balance below minimum
  if (treasury.usdcBalance < MIN_LIQUID_BALANCE) {
    alerts.push({
      level: "critical",
      title: "Liquid Balance Critical",
      message: `USDC balance ($${treasury.usdcBalance.toLocaleString()}) is below the $${MIN_LIQUID_BALANCE.toLocaleString()} minimum. Auto-rebalance from Meteora vault recommended.`,
    });
  } else if (treasury.usdcBalance < LOW_LIQUID_THRESHOLD) {
    alerts.push({
      level: "warning",
      title: "Low Liquid Balance",
      message: `USDC balance ($${treasury.usdcBalance.toLocaleString()}) is approaching the $${MIN_LIQUID_BALANCE.toLocaleString()} minimum buffer.`,
    });
  }

  // Pool depletion warnings
  for (const pool of pools) {
    if (!pool.maxAllocation) continue;
    const pct = Math.round((pool.disbursed / pool.maxAllocation) * 100);
    if (pct >= POOL_DEPLETION_THRESHOLD) {
      alerts.push({
        level: pct >= 95 ? "critical" : "warning",
        title: `${pool.name} Pool Nearly Depleted`,
        message: `${pct}% used ($${pool.disbursed.toLocaleString()} / $${pool.maxAllocation.toLocaleString()}). New proposals in this category may be unfundable.`,
      });
    }
  }

  // Info: yield earned
  if (treasury.meteoraYieldEarned > 1000) {
    alerts.push({
      level: "info",
      title: "Yield Accrual",
      message: `$${treasury.meteoraYieldEarned.toLocaleString()} earned from Meteora vault. Consider harvesting to liquid balance.`,
    });
  }

  return NextResponse.json(alerts);
}
