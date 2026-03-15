import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

const MAX_PROPOSAL_AMOUNT_USDC = 100_000;
const MAX_TREASURY_MUTATION_USDC = 1_000_000;
const MAX_AUDIO_FILE_BYTES = 25 * 1024 * 1024;

const fieldNames: Record<string, string> = {
  applicantWallet: "Applicant wallet",
  amount: "Amount",
  description: "Description",
  requestedAmount: "Requested amount",
  text: "Narration text",
  title: "Title",
  transcript: "Transcript",
  voicePitchUrl: "Voice pitch URL",
};

function formatField(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "Request";
  }

  return path
    .map((segment) => fieldNames[String(segment)] ?? String(segment))
    .join(" -> ");
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isValidSolanaWallet(address: string): boolean {
  try {
    const trimmed = address.trim();
    const decoded = bs58.decode(trimmed);
    if (decoded.length !== 32) {
      return false;
    }

    new PublicKey(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function zodErrorResponse(error: ZodError) {
  const issues = error.issues.map((issue) => {
    return `${formatField(issue.path)}: ${issue.message}`;
  });

  return NextResponse.json(
    {
      error: "Invalid request.",
      message: issues[0] ?? "Please correct the highlighted fields and try again.",
      issues,
    },
    { status: 400 }
  );
}

export function badRequest(message: string, issues?: string[]) {
  return NextResponse.json(
    {
      error: "Invalid request.",
      message,
      issues: issues ?? [message],
    },
    { status: 400 }
  );
}

const walletSchema = z
  .string()
  .trim()
  .min(32, "Enter a Solana wallet address.")
  .max(64, "Wallet addresses should be 64 characters or fewer.")
  .refine(isValidSolanaWallet, "Enter a valid base58 Solana wallet address.");

export const createProposalSchema = z.object({
  applicantWallet: walletSchema,
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters.")
    .max(4000, "Description must be 4000 characters or fewer."),
  requestedAmount: z.coerce
    .number()
    .finite("Requested amount must be a number.")
    .positive("Requested amount must be greater than zero.")
    .max(
      MAX_PROPOSAL_AMOUNT_USDC,
      `Requested amount cannot exceed ${formatAmount(MAX_PROPOSAL_AMOUNT_USDC)} USDC.`
    ),
  voicePitchUrl: z
    .string()
    .trim()
    .max(2048, "Voice pitch URL must be 2048 characters or fewer.")
    .url("Voice pitch URL must be a valid URL.")
    .optional(),
  transcript: z
    .string()
    .trim()
    .max(6000, "Transcript must be 6000 characters or fewer.")
    .optional(),
});

export const treasuryMutationSchema = z.object({
  amount: z.coerce
    .number()
    .finite("Amount must be a number.")
    .positive("Amount must be greater than zero.")
    .max(
      MAX_TREASURY_MUTATION_USDC,
      `Amount cannot exceed ${formatAmount(MAX_TREASURY_MUTATION_USDC)} USDC.`
    ),
});

export const narrationSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Narration text is required.")
    .max(5000, "Narration text must be 5000 characters or fewer."),
});

export function validateAudioFile(file: unknown) {
  if (!(file instanceof File)) {
    return "Attach an audio file to transcribe.";
  }

  if (file.size === 0) {
    return "The uploaded audio file is empty.";
  }

  if (file.size > MAX_AUDIO_FILE_BYTES) {
    return "Audio files must be 25 MB or smaller.";
  }

  return null;
}
