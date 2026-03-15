import { getAppConfig } from "@/lib/config";
import { getTreasuryWalletPublicKey } from "@/lib/solana";
import { getTreasuryState, setTreasuryState } from "@/lib/store";
import { createSimulatedSignature, roundCurrency } from "@/lib/utils";
import type { TreasuryState } from "@/types/api";

const LIQUID_BUFFER_USDC = 9_000;

function syncTreasuryWallet(): TreasuryState {
  const treasury = getTreasuryState();
  treasury.walletAddress = getTreasuryWalletPublicKey().toBase58();
  return treasury;
}

export function getTreasurySnapshot(): TreasuryState {
  return syncTreasuryWallet();
}

export async function depositIdleUsdc(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  const treasury = syncTreasuryWallet();
  if (amount > treasury.usdcBalance) {
    throw new Error("Insufficient liquid treasury balance.");
  }

  const nextState = {
    ...treasury,
    usdcBalance: roundCurrency(treasury.usdcBalance - amount),
    meteoraVaultBalance: roundCurrency(treasury.meteoraVaultBalance + amount),
    meteoraYieldEarned: roundCurrency(
      treasury.meteoraYieldEarned + amount * 0.00045
    ),
    lastUpdated: new Date().toISOString(),
  };

  setTreasuryState(nextState);

  return {
    mode: getAppConfig().liveMeteora ? "configured" : "simulated",
    treasury: nextState,
    txHash: createSimulatedSignature("meteora-deposit"),
  };
}

export async function withdrawVaultUsdc(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Withdraw amount must be greater than zero.");
  }

  const treasury = syncTreasuryWallet();
  if (amount > treasury.meteoraVaultBalance) {
    throw new Error("Insufficient Meteora vault balance.");
  }

  const nextState = {
    ...treasury,
    usdcBalance: roundCurrency(treasury.usdcBalance + amount),
    meteoraVaultBalance: roundCurrency(treasury.meteoraVaultBalance - amount),
    lastUpdated: new Date().toISOString(),
  };

  setTreasuryState(nextState);

  return {
    mode: getAppConfig().liveMeteora ? "configured" : "simulated",
    treasury: nextState,
    txHash: createSimulatedSignature("meteora-withdraw"),
  };
}

export async function rebalanceVault() {
  const treasury = syncTreasuryWallet();
  const totalUsdc = treasury.usdcBalance + treasury.meteoraVaultBalance;
  const targetLiquid = Math.max(LIQUID_BUFFER_USDC, totalUsdc * 0.62);

  if (treasury.usdcBalance > targetLiquid + 1_500) {
    const amount = roundCurrency(treasury.usdcBalance - targetLiquid);
    const result = await depositIdleUsdc(amount);
    return {
      ...result,
      action: "deposit" as const,
      amount,
    };
  }

  if (
    treasury.usdcBalance < LIQUID_BUFFER_USDC &&
    treasury.meteoraVaultBalance > 0
  ) {
    const amount = roundCurrency(
      Math.min(
        LIQUID_BUFFER_USDC - treasury.usdcBalance,
        treasury.meteoraVaultBalance
      )
    );
    const result = await withdrawVaultUsdc(amount);
    return {
      ...result,
      action: "withdraw" as const,
      amount,
    };
  }

  return {
    action: "hold" as const,
    amount: 0,
    mode: getAppConfig().liveMeteora ? "configured" : "simulated",
    treasury,
  };
}
