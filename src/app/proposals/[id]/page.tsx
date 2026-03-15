"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  Wallet,
  Clock,
  ExternalLink,
  Volume2,
} from "lucide-react";
import type { Proposal } from "@/types/api";
import { getProposal } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import ScoreBar from "@/components/ui/ScoreBar";
import AgentWorkflow from "@/components/proposals/AgentWorkflow";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import NarrationPlayer from "@/components/voice/NarrationPlayer";
import {
  formatUSDC,
  formatDate,
  shortenAddress,
  solanaExplorerUrl,
  cn,
  getScoreColor,
} from "@/lib/utils";

export default function ProposalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProposal(id).then((p) => {
      setProposal(p);
      setLoading(false);
    });
  }, [id]);

  // Poll every 3 seconds while evaluating
  useEffect(() => {
    if (
      !proposal ||
      (proposal.status !== "evaluating" && proposal.status !== "pending")
    )
      return;
    const interval = setInterval(() => {
      getProposal(id).then((p) => {
        setProposal(p);
        if (
          p.status !== "evaluating" &&
          p.status !== "pending"
        ) {
          clearInterval(interval);
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [id, proposal?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !proposal) return <PageLoader />;

  const hasDecision = !!proposal.decision;
  const canEvaluate =
    proposal.status === "pending" || proposal.status === "evaluating";

  return (
    <div className="space-y-6">
      <Link
        href="/proposals"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to proposals
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">{proposal.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              {formatUSDC(proposal.requestedAmount)}
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              {shortenAddress(proposal.applicantWallet, 6)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDate(proposal.createdAt)}
            </span>
          </div>
        </div>
        <StatusBadge status={proposal.status} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Proposal details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 lg:col-span-2"
        >
          <Card>
            <CardTitle>Description</CardTitle>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {proposal.description}
            </p>
          </Card>

          {proposal.transcript && (
            <Card>
              <CardHeader>
                <CardTitle>Voice Pitch Transcript</CardTitle>
                <Volume2 className="h-4 w-4 text-violet-400" />
              </CardHeader>
              <p className="text-sm leading-relaxed text-gray-300">
                {proposal.transcript}
              </p>
            </Card>
          )}

          {/* Existing decision display */}
          {hasDecision && proposal.decision && (
            <Card>
              <CardTitle>Evaluation Results</CardTitle>
              <div className="mt-4 space-y-3">
                <ScoreBar
                  label="Impact Potential"
                  score={proposal.decision.scores.impactPotential}
                  animate={false}
                />
                <ScoreBar
                  label="Technical Feasibility"
                  score={proposal.decision.scores.technicalFeasibility}
                  animate={false}
                />
                <ScoreBar
                  label="Team Credibility"
                  score={proposal.decision.scores.teamCredibility}
                  animate={false}
                />
                <ScoreBar
                  label="Budget Reasonableness"
                  score={proposal.decision.scores.budgetReasonableness}
                  animate={false}
                />
                <ScoreBar
                  label="Mission Alignment"
                  score={proposal.decision.scores.missionAlignment}
                  animate={false}
                />
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-sm font-medium text-white">
                    Overall Score
                  </span>
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      getScoreColor(proposal.decision.scores.overall)
                    )}
                  >
                    {proposal.decision.scores.overall}/100
                  </span>
                </div>
              </div>
            </Card>
          )}

          {hasDecision && proposal.decision && (
            <Card>
              <CardTitle>Decision Rationale</CardTitle>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">
                {proposal.decision.rationale}
              </p>
              {proposal.decision.narrationAudioUrl && (
                <NarrationPlayer
                  audioUrl={proposal.decision.narrationAudioUrl}
                />
              )}
              {proposal.decision.onChainTxHash && (
                <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                  <a
                    href={solanaExplorerUrl(proposal.decision.onChainTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Decision Record (Metaplex Core)
                  </a>
                  {proposal.decision.disbursementTxHash && (
                    <a
                      href={solanaExplorerUrl(
                        proposal.decision.disbursementTxHash
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      USDC Disbursement
                    </a>
                  )}
                </div>
              )}
            </Card>
          )}
        </motion.div>

        {/* Right: Agent Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <Card>
            <CardHeader>
              <CardTitle>Agent Workflow</CardTitle>
              {canEvaluate && (
                <span className="text-xs text-gray-500">
                  Click below to start evaluation
                </span>
              )}
            </CardHeader>
            {canEvaluate ? (
              <AgentWorkflow
                proposalId={id}
                onComplete={() => {
                  // Refresh proposal data after evaluation
                  getProposal(id).then(setProposal);
                }}
              />
            ) : hasDecision ? (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center text-sm text-gray-400">
                Evaluation complete. See results on the left.
              </div>
            ) : (
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center text-sm text-gray-400">
                Waiting for evaluation to begin.
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
