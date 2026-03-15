"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Cpu,
  Landmark,
  Coins,
  Shield,
} from "lucide-react";
import { solanaExplorerUrl, shortenAddress } from "@/lib/utils";

interface AgentInfo {
  agentAssetAddress: string;
  collectionAddress: string;
  mode: string;
}

function explorerAddress(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export default function OnChainStatus() {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [registering, setRegistering] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);

  useEffect(() => {
    // Check if agent is already registered
    fetch("/api/agent")
      .then((r) => r.json())
      .then((data) => {
        if (data.registered) setAgent(data);
      })
      .catch(() => {});

    // Get treasury info for SOL balance display
    fetch("/api/treasury")
      .then((r) => r.json())
      .then((data) => {
        if (data.walletAddress) {
          // Fetch real SOL balance
          fetch(
            `https://api.devnet.solana.com`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getBalance",
                params: [data.walletAddress],
              }),
            }
          )
            .then((r) => r.json())
            .then((rpc) => {
              if (rpc.result?.value != null) {
                setSolBalance(rpc.result.value / 1_000_000_000);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const res = await fetch("/api/agent", { method: "POST" });
      const data = await res.json();
      if (data.agentAssetAddress) setAgent(data);
    } catch {
      // ignore
    }
    setRegistering(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
          <Shield className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Solana Devnet — Live On-Chain
          </h3>
          <p className="text-xs text-gray-400">
            Real transactions verifiable on Solana Explorer
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Agent Registration */}
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-gray-400">Agent Identity</span>
          </div>
          {agent ? (
            <a
              href={explorerAddress(agent.agentAssetAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {shortenAddress(agent.agentAssetAddress, 4)}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="flex items-center gap-1.5 rounded bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {registering ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Cpu className="h-3 w-3" />
              )}
              Register Agent
            </button>
          )}
        </div>

        {/* Treasury Wallet */}
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-gray-400">Treasury Wallet</span>
          </div>
          <a
            href={explorerAddress("Dn1SDTkoA5tmSLAsf5inTsGhY7twbcEcSdKZTDmbGxjZ")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            {shortenAddress("Dn1SDTkoA5tmSLAsf5inTsGhY7twbcEcSdKZTDmbGxjZ", 4)}
            {solBalance != null && (
              <span className="text-gray-500">
                ({solBalance.toFixed(2)} SOL)
              </span>
            )}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* USDC Mint */}
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-400">USDC Mint (Devnet)</span>
          </div>
          <a
            href={explorerAddress("DD6pnbD7tCLnRkk9uKHSZH3HuhRV9UEx9ThonXH1ZGY")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300"
          >
            {shortenAddress("DD6pnbD7tCLnRkk9uKHSZH3HuhRV9UEx9ThonXH1ZGY", 4)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Metaplex Core */}
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-400">Decision Records</span>
          </div>
          <span className="text-xs text-amber-400">
            Metaplex Core NFTs
          </span>
        </div>
      </div>
    </motion.div>
  );
}
