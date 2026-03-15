// ============ TRANSACTION LEDGER ============

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "disbursement"
  | "yield"
  | "rebalance"
  | "fee"
  | "incoming";

export interface TreasuryTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  counterparty?: string; // wallet address or label
  proposalId?: string;
  txHash?: string;
  pool?: string;
  timestamp: string;
}

// ============ FUND POOLS ============

export interface FundPool {
  id: string;
  name: string;
  description: string;
  allocated: number;
  disbursed: number;
  color: string; // tailwind color
  icon: string; // emoji
  maxAllocation?: number;
}

// ============ BALANCE SHEET ============

export interface BalanceSheet {
  totalAssets: number;
  liquidUsdc: number;
  vaultBalance: number;
  pendingDisbursements: number;
  yieldEarned: number;
  totalDisbursed: number;
  totalDeposited: number;
  pools: FundPool[];
  transactions: TreasuryTransaction[];
  apy: number;
  lastRebalance: string;
}
