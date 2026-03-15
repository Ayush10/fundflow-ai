"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { createProposal, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function NewProposalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requestedAmount: "",
    applicantWallet: "",
    transcript: "",
  });
  const applicantWalletValue =
    form.applicantWallet || publicKey?.toBase58() || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.requestedAmount || !applicantWalletValue) {
      toast("Please fill in all required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const proposal = await createProposal({
        title: form.title,
        description: form.description,
        requestedAmount: parseFloat(form.requestedAmount),
        applicantWallet: applicantWalletValue,
        transcript: form.transcript || undefined,
      });
      toast("Proposal submitted successfully!", "success");
      router.push(`/proposals/${proposal.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast(err.displayMessage, "error");
      } else {
        toast("Failed to submit proposal", "error");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/proposals"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to proposals
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Submit Proposal</h1>
        <p className="mt-1 text-sm text-gray-400">
          Submit a funding proposal for AI-powered evaluation
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6"
      >
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Project Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Solana Smart Contract Auditing Toolkit"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your project, its goals, methodology, and expected outcomes..."
            rows={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Amount + Wallet */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Requested Amount (USDC) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                $
              </span>
              <input
                type="number"
                value={form.requestedAmount}
                onChange={(e) =>
                  setForm({ ...form, requestedAmount: e.target.value })
                }
                placeholder="15,000"
                min="0"
                step="100"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-8 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Applicant Wallet <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={applicantWalletValue}
              onChange={(e) =>
                setForm({ ...form, applicantWallet: e.target.value })
              }
              placeholder="Solana wallet address"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
            />
          </div>
        </div>

        {/* Voice Recorder */}
        <VoiceRecorder
          onTranscript={(t) => setForm({ ...form, transcript: t })}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <LoadingSpinner size="sm" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Proposal
            </>
          )}
        </button>
      </motion.form>

      {/* Info */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-gray-400">
        <p className="font-medium text-gray-300">What happens next?</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Your humanity is verified via Human Passport</li>
          <li>Our AI agent researches your web presence via Unbrowse</li>
          <li>Claude evaluates your proposal across 5 criteria</li>
          <li>Score &ge;70: auto-approved &middot; 50-69: flagged for review &middot; &lt;50: rejected</li>
          <li>Decision recorded on-chain as a Metaplex Core asset</li>
        </ol>
      </div>
    </div>
  );
}
