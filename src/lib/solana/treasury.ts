import { getAppConfig } from "@/lib/config";
import { getTreasurySnapshot, withdrawVaultUsdc } from "@/lib/solana/meteora";
import { setTreasuryState } from "@/lib/store";
import { createSimulatedSignature, roundCurrency } from "@/lib/utils";
import type { Proposal } from "@/types/api";

export async function disburseApprovedProposal(proposal: Proposal) {
  if (proposal.requestedAmount <= 0) {
    throw new Error("Requested amount must be greater than zero.");
  }

  let treasury = getTreasurySnapshot();
  if (proposal.requestedAmount > treasury.usdcBalance) {
    const shortfall = roundCurrency(proposal.requestedAmount - treasury.usdcBalance);
    await withdrawVaultUsdc(shortfall);
    treasury = getTreasurySnapshot();
  }

  if (proposal.requestedAmount > treasury.usdcBalance) {
    throw new Error("Treasury cannot cover the requested amount.");
  }

  const nextState = {
    ...treasury,
    usdcBalance: roundCurrency(treasury.usdcBalance - proposal.requestedAmount),
    totalDisbursed: roundCurrency(
      treasury.totalDisbursed + proposal.requestedAmount
    ),
    lastUpdated: new Date().toISOString(),
  };

  setTreasuryState(nextState);

  return {
    mode: getAppConfig().liveSolana ? "configured" : "simulated",
    treasury: nextState,
    txHash: createSimulatedSignature("spl-transfer"),
  };
}
