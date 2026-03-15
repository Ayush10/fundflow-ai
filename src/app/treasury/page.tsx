"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  PieChart,
  RefreshCw,
} from "lucide-react";
import type { TreasuryState } from "@/types/api";
import { getTreasury, depositToVault, withdrawFromVault, ApiError } from "@/lib/api";
import StatCard from "@/components/ui/StatCard";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { formatUSDC } from "@/lib/utils";

export default function TreasuryPage() {
  const [treasury, setTreasury] = useState<TreasuryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(() => {
    getTreasury().then(setTreasury);
  }, []);

  useEffect(() => {
    getTreasury().then((t) => {
      setTreasury(t);
      setLoading(false);
    });
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast("Enter a valid deposit amount", "error");
      return;
    }
    setDepositLoading(true);
    try {
      const updated = await depositToVault(amount);
      setTreasury(updated);
      setDepositAmount("");
      toast(`Deposited ${formatUSDC(amount)} to Meteora vault`, "success");
    } catch (err) {
      toast(
        err instanceof ApiError ? err.displayMessage : "Deposit failed",
        "error"
      );
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast("Enter a valid withdraw amount", "error");
      return;
    }
    setWithdrawLoading(true);
    try {
      const updated = await withdrawFromVault(amount);
      setTreasury(updated);
      setWithdrawAmount("");
      toast(`Withdrew ${formatUSDC(amount)} from Meteora vault`, "success");
    } catch (err) {
      toast(
        err instanceof ApiError ? err.displayMessage : "Withdraw failed",
        "error"
      );
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading || !treasury) return <PageLoader />;

  const totalFunds = treasury.usdcBalance + treasury.meteoraVaultBalance;
  const treasuryPercent =
    totalFunds > 0
      ? Math.round((treasury.usdcBalance / totalFunds) * 100)
      : 50;
  const vaultPercent = 100 - treasuryPercent;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Treasury</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage treasury funds and Meteora yield vault
        </p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Treasury Balance"
          value={formatUSDC(treasury.usdcBalance)}
          icon={DollarSign}
        />
        <StatCard
          label="Meteora Vault"
          value={formatUSDC(treasury.meteoraVaultBalance)}
          icon={TrendingUp}
        />
        <StatCard
          label="Yield Earned"
          value={formatUSDC(treasury.meteoraYieldEarned)}
          icon={TrendingUp}
          trend="+2.4% APY"
          trendUp
        />
        <StatCard
          label="Total Disbursed"
          value={formatUSDC(treasury.totalDisbursed)}
          icon={ArrowUpFromLine}
        />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Fund Allocation</CardTitle>
              <PieChart className="h-4 w-4 text-gray-500" />
            </CardHeader>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-full">
                <div className="flex h-6">
                  <div
                    className="flex items-center justify-center bg-violet-600 text-xs font-medium text-white"
                    style={{ width: `${treasuryPercent}%` }}
                  >
                    {treasuryPercent}%
                  </div>
                  <div
                    className="flex items-center justify-center bg-cyan-600 text-xs font-medium text-white"
                    style={{ width: `${vaultPercent}%` }}
                  >
                    {vaultPercent}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-violet-600" />
                    <span className="text-sm text-gray-400">
                      Active Treasury
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatUSDC(treasury.usdcBalance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Available for disbursement
                  </p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-cyan-600" />
                    <span className="text-sm text-gray-400">Meteora Vault</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatUSDC(treasury.meteoraVaultBalance)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Earning yield automatically
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Total Managed Funds
                  </span>
                  <span className="text-xl font-bold text-white">
                    {formatUSDC(totalFunds)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Actions + Wallet Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Vault Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Vault Actions</CardTitle>
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <div className="space-y-4">
              {/* Deposit */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Amount"
                      min="0"
                      step="100"
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-7 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <button
                    onClick={handleDeposit}
                    disabled={depositLoading}
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {depositLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <ArrowDownToLine className="h-4 w-4" />
                    )}
                    Deposit
                  </button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount"
                      min="0"
                      step="100"
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-7 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawLoading}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {withdrawLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4" />
                    )}
                    Withdraw
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-gray-500">
                The agent automatically rebalances the vault after each
                disbursement
              </p>
            </div>
          </Card>

          {/* Wallet Info */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Info</CardTitle>
              <Wallet className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-xs text-gray-500">Treasury Address</p>
                <p className="mt-1 break-all font-mono text-sm text-gray-300">
                  {treasury.walletAddress}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-xs text-gray-500">Network</p>
                <p className="mt-1 text-sm text-gray-300">Solana Devnet</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="mt-1 text-sm text-gray-300">
                  {new Date(treasury.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
