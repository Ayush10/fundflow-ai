"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Coins,
  PiggyBank,
  BarChart3,
  Clock,
  ExternalLink,
  RefreshCw,
  ArrowRightLeft,
  Wallet,
  Shield,
} from "lucide-react";
import type { TreasuryState } from "@/types/api";
import type { TreasuryTransaction, FundPool } from "@/types/treasury";
import { solanaExplorerUrl, shortenAddress, cn } from "@/lib/utils";

const TX_ICONS: Record<string, React.ElementType> = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  disbursement: ArrowUpRight,
  yield: TrendingUp,
  rebalance: ArrowRightLeft,
  fee: Coins,
  incoming: ArrowDownLeft,
};

const TX_COLORS: Record<string, string> = {
  deposit: "text-blue-400",
  withdrawal: "text-red-400",
  disbursement: "text-orange-400",
  yield: "text-emerald-400",
  rebalance: "text-purple-400",
  fee: "text-gray-400",
  incoming: "text-cyan-400",
};

function formatAmount(amount: number, type: string): string {
  const sign = ["withdrawal", "disbursement", "fee"].includes(type) ? "-" : "+";
  return `${sign}$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TreasuryPage() {
  const [treasury, setTreasury] = useState<TreasuryState | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [pools, setPools] = useState<FundPool[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = () => {
    fetch("/api/treasury").then((r) => r.json()).then(setTreasury).catch(() => {});
    fetch("/api/treasury/transactions").then((r) => r.json()).then((d: unknown) => { if (Array.isArray(d)) setTransactions(d); }).catch(() => {});
    fetch("/api/treasury/pools").then((r) => r.json()).then((d: unknown) => { if (Array.isArray(d)) setPools(d); }).catch(() => {});
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 15000);
    return () => clearInterval(iv);
  }, []);

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    setActionLoading(true);
    await fetch("/api/treasury/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt }),
    });
    setDepositAmount("");
    refresh();
    setActionLoading(false);
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    setActionLoading(true);
    await fetch("/api/treasury/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt }),
    });
    setWithdrawAmount("");
    refresh();
    setActionLoading(false);
  };

  const totalAssets = treasury
    ? treasury.usdcBalance + treasury.meteoraVaultBalance + treasury.meteoraYieldEarned
    : 0;
  const totalPoolAllocated = pools.reduce((s, p) => s + p.allocated, 0);
  const totalPoolDisbursed = pools.reduce((s, p) => s + p.disbursed, 0);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Treasury</h1>
                <p className="text-xs text-gray-400">Autonomous fund management on Solana Devnet</p>
              </div>
            </div>
            <button onClick={refresh} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Balance Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Assets", value: totalAssets, icon: Wallet, color: "from-violet-500 to-purple-600", sub: "USDC + Vault + Yield" },
            { label: "Liquid USDC", value: treasury?.usdcBalance ?? 0, icon: Coins, color: "from-cyan-500 to-blue-600", sub: "Available for disbursement" },
            { label: "Meteora Vault", value: treasury?.meteoraVaultBalance ?? 0, icon: PiggyBank, color: "from-emerald-500 to-green-600", sub: "Earning ~4.5% APY" },
            { label: "Yield Earned", value: treasury?.meteoraYieldEarned ?? 0, icon: TrendingUp, color: "from-amber-500 to-orange-600", sub: "From vault deposits" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-5 relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <card.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Fund Pools + Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Fund Pools */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Fund Allocation Pools
              </h2>
              <div className="space-y-3">
                {pools.map((pool) => {
                  const pct = pool.maxAllocation ? Math.round((pool.disbursed / pool.maxAllocation) * 100) : 0;
                  return (
                    <div key={pool.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white flex items-center gap-1.5">
                          <span>{pool.icon}</span>
                          {pool.name}
                        </span>
                        <span className="text-xs text-gray-500">{pct}% used</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 mb-2">
                        <div className={`h-full rounded-full ${pool.color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>${pool.disbursed.toLocaleString()} disbursed</span>
                        <span>${pool.allocated.toLocaleString()} allocated</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs">
                <span className="text-gray-500">Total allocated</span>
                <span className="text-white font-semibold">${totalPoolAllocated.toLocaleString()}</span>
              </div>
            </motion.div>

            {/* Vault Actions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vault Operations
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Deposit to Meteora Vault</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="USDC amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
                    <button onClick={handleDeposit} disabled={actionLoading}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                      Deposit
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Withdraw from Vault</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="USDC amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none" />
                    <button onClick={handleWithdraw} disabled={actionLoading}
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
              {treasury?.walletAddress && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <a
                    href={`https://explorer.solana.com/address/${treasury.walletAddress}?cluster=devnet`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    <Wallet className="h-3 w-3" />
                    {shortenAddress(treasury.walletAddress, 6)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Transaction Ledger */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Transaction Ledger
              <span className="ml-auto text-xs text-gray-600">{transactions.length} transactions</span>
            </h2>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {transactions.map((tx, i) => {
                const Icon = TX_ICONS[tx.type] ?? Coins;
                const color = TX_COLORS[tx.type] ?? "text-gray-400";
                const isOutgoing = ["withdrawal", "disbursement", "fee"].includes(tx.type);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isOutgoing ? "bg-red-500/10" : "bg-emerald-500/10")}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                        {tx.pool && <span className="rounded bg-white/5 px-1.5 py-0.5">{tx.pool}</span>}
                        {tx.counterparty && <span>→ {tx.counterparty}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-semibold", isOutgoing ? "text-red-400" : "text-emerald-400")}>
                        {formatAmount(tx.amount, tx.type)}
                      </p>
                      {tx.txHash && (
                        <a href={solanaExplorerUrl(tx.txHash)} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-0.5 justify-end">
                          <ExternalLink className="h-3 w-3" /> Explorer
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {transactions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No transactions yet</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Balance Sheet Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-6 rounded-xl border border-white/5 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Balance Sheet</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Assets</span><span className="text-white font-semibold">${totalAssets.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Liquid USDC</span><span className="text-cyan-400">${(treasury?.usdcBalance ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Vault Balance</span><span className="text-emerald-400">${(treasury?.meteoraVaultBalance ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Yield Earned</span><span className="text-amber-400">${(treasury?.meteoraYieldEarned ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Disbursed</span><span className="text-red-400">${(treasury?.totalDisbursed ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pool Allocated</span><span className="text-purple-400">${totalPoolAllocated.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pool Disbursed</span><span className="text-orange-400">${totalPoolDisbursed.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Vault APY</span><span className="text-emerald-400">~4.5%</span></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
