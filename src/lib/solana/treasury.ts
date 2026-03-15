import { PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
} from "@solana/spl-token";

import { getAppConfig } from "@/lib/config";
import {
  getSolanaConnection,
  getTreasuryAuthority,
  getUsdcMintPublicKey,
} from "@/lib/solana";
import { getTreasurySnapshot, withdrawVaultUsdc } from "@/lib/solana/meteora";
import { setTreasuryState } from "@/lib/store";
import { createSimulatedSignature, roundCurrency } from "@/lib/utils";
import type { Proposal } from "@/types/api";

export async function disburseApprovedProposal(proposal: Proposal) {
  if (proposal.requestedAmount <= 0) {
    throw new Error("Requested amount must be greater than zero.");
  }

  const config = getAppConfig();

  // Try real on-chain USDC transfer
  if (config.liveSolana) {
    try {
      const connection = getSolanaConnection();
      const authority = getTreasuryAuthority();
      const usdcMint = getUsdcMintPublicKey();
      const amountLamports = Math.round(proposal.requestedAmount * 1_000_000); // 6 decimals

      // Get or create treasury's token account
      const treasuryAta = await getOrCreateAssociatedTokenAccount(
        connection,
        authority,
        usdcMint,
        authority.publicKey
      );

      // Check balance
      const accountInfo = await getAccount(connection, treasuryAta.address);
      const currentBalance = Number(accountInfo.amount) / 1_000_000;

      if (currentBalance < proposal.requestedAmount) {
        throw new Error(
          `Insufficient USDC. Have ${currentBalance}, need ${proposal.requestedAmount}`
        );
      }

      // Get or create recipient's token account
      const recipientPubkey = new PublicKey(proposal.applicantWallet);
      const recipientAta = await getOrCreateAssociatedTokenAccount(
        connection,
        authority, // payer
        usdcMint,
        recipientPubkey
      );

      // Transfer USDC
      const txHash = await transfer(
        connection,
        authority, // payer
        treasuryAta.address, // from
        recipientAta.address, // to
        authority, // authority
        amountLamports
      );

      // Update in-memory state
      const treasury = getTreasurySnapshot();
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
        mode: "live" as const,
        treasury: nextState,
        txHash,
      };
    } catch (err) {
      console.error(
        "[Treasury] Real transfer failed, falling back to simulated:",
        err instanceof Error ? err.message : err
      );
      // Fall through to simulated
    }
  }

  // Simulated fallback
  let treasury = getTreasurySnapshot();
  if (proposal.requestedAmount > treasury.usdcBalance) {
    const shortfall = roundCurrency(
      proposal.requestedAmount - treasury.usdcBalance
    );
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
    mode: "simulated" as const,
    treasury: nextState,
    txHash: createSimulatedSignature("spl-transfer"),
  };
}
