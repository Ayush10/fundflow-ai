import { createHash, randomUUID } from "crypto";

import bs58 from "bs58";

import type { ProposalStatus } from "@/types/api";

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatUSDC(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: ProposalStatus): string {
  switch (status) {
    case "approved":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "rejected":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "flagged":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "evaluating":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "pending":
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function getScoreBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function solanaExplorerUrl(txHash: string): string {
  return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
}

export function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function stableNumberFromText(
  value: string,
  min: number,
  max: number
): number {
  const hash = createHash("sha256").update(value).digest();
  const spread = max - min;
  const seed = hash.readUInt32BE(0);
  return min + (seed % (spread + 1));
}

export function stablePick<T>(value: string, options: T[]): T {
  const index = stableNumberFromText(value, 0, options.length - 1);
  return options[index];
}

export function createSimulatedSignature(label: string): string {
  const entropy = `${label}:${Date.now()}:${randomUUID()}`;
  const bytes = createHash("sha256").update(entropy).digest();
  const fullBytes = Buffer.concat([bytes, bytes]);
  return bs58.encode(fullBytes.subarray(0, 64));
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function inferLanguagesFromText(value: string): string[] {
  const source = value.toLowerCase();
  const languages = new Set<string>();

  if (source.includes("rust")) {
    languages.add("Rust");
  }
  if (source.includes("python")) {
    languages.add("Python");
  }
  if (source.includes("solana") || source.includes("typescript")) {
    languages.add("TypeScript");
  }
  if (source.includes("smart contract") || source.includes("evm")) {
    languages.add("Solidity");
  }
  if (source.includes("ai") || source.includes("ml")) {
    languages.add("Python");
  }

  if (languages.size === 0) {
    languages.add("TypeScript");
    languages.add("Python");
  }

  return Array.from(languages).slice(0, 3);
}

export function parseJsonSafely<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function extractJsonObject(value: string): string | null {
  const match = value.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}
