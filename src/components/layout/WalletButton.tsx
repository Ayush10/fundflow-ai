"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, LogOut } from "lucide-react";
import { shortenAddress } from "@/lib/utils";

export default function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-lg bg-white/5 px-3 py-1.5 font-mono text-xs text-gray-300 sm:inline">
          {shortenAddress(publicKey.toBase58(), 4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          title="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">Connect</span>
    </button>
  );
}
