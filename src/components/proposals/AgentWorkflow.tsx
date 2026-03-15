"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Search,
  Brain,
  Gavel,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Github,
  Linkedin,
  Twitter,
  ExternalLink,
} from "lucide-react";
import type {
  AgentEvent,
  HumanVerification,
  UnbrowseResearch,
  EvaluationScore,
  AgentDecision,
} from "@/types/api";
import { subscribeToAgentEvents } from "@/lib/api";
import ScoreBar from "@/components/ui/ScoreBar";
import { cn, solanaExplorerUrl } from "@/lib/utils";

interface AgentWorkflowProps {
  proposalId: string;
  onComplete?: () => void;
}

interface WorkflowState {
  humanCheck: {
    status: "idle" | "running" | "passed" | "failed";
    data?: HumanVerification;
  };
  research: {
    status: "idle" | "running" | "complete";
    data?: UnbrowseResearch;
  };
  evaluation: {
    status: "idle" | "running" | "complete";
    data?: EvaluationScore;
  };
  decision: {
    status: "idle" | "running" | "complete";
    data?: AgentDecision;
  };
  onChain: {
    status: "idle" | "minting" | "transferring" | "rebalancing" | "complete";
    txHash?: string;
  };
}

const initialState: WorkflowState = {
  humanCheck: { status: "idle" },
  research: { status: "idle" },
  evaluation: { status: "idle" },
  decision: { status: "idle" },
  onChain: { status: "idle" },
};

export default function AgentWorkflow({
  proposalId,
  onComplete,
}: AgentWorkflowProps) {
  const [state, setState] = useState<WorkflowState>(initialState);
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, []);

  const startEvaluation = useCallback(() => {
    setState(initialState);
    setIsRunning(true);
    cancelRef.current?.();

    const cancel = subscribeToAgentEvents(
      proposalId,
      (event: AgentEvent) => {
        setState((prev) => {
          const next = { ...prev };
          switch (event.step) {
            case "human-check":
              next.humanCheck = {
                status: event.status as "running" | "passed" | "failed",
                data: event.data,
              };
              break;
            case "unbrowse-research":
              next.research = {
                status: event.status as "running" | "complete",
                data: event.data,
              };
              break;
            case "ai-evaluation":
              next.evaluation = {
                status: event.status as "running" | "complete",
                data: event.data,
              };
              break;
            case "decision":
              next.decision = {
                status: event.status as "running" | "complete",
                data: event.data,
              };
              break;
            case "on-chain":
              next.onChain = {
                status: event.status as
                  | "minting"
                  | "transferring"
                  | "rebalancing"
                  | "complete",
                txHash: event.txHash,
              };
              break;
          }
          return next;
        });
      },
      () => {
        setIsRunning(false);
        cancelRef.current = null;
        onComplete?.();
      }
    );
    cancelRef.current = cancel;
  }, [proposalId, onComplete]);

  return (
    <div className="space-y-4">
      {!isRunning && state.humanCheck.status === "idle" && (
        <button
          onClick={startEvaluation}
          className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          Trigger AI Evaluation
        </button>
      )}

      {(isRunning || state.humanCheck.status !== "idle") && (
        <div className="space-y-3">
          <Step1HumanCheck state={state.humanCheck} />
          <Step2Research state={state.research} />
          <Step3Evaluation state={state.evaluation} />
          <Step4Decision state={state.decision} />
          <Step5OnChain state={state.onChain} />
        </div>
      )}
    </div>
  );
}

// ============ STEP COMPONENTS ============

function StepWrapper({
  icon: Icon,
  label,
  status,
  children,
}: {
  icon: React.ElementType;
  label: string;
  status: string;
  children?: React.ReactNode;
}) {
  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isDone =
    status === "passed" || status === "complete" || status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isIdle ? 0.3 : 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4 transition-colors",
        isIdle && "border-white/5 bg-white/[0.02]",
        isRunning && "border-violet-500/30 bg-violet-500/5",
        isDone && status !== "failed" && "border-emerald-500/20 bg-emerald-500/5",
        status === "failed" && "border-red-500/20 bg-red-500/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isIdle && "bg-white/5",
            isRunning && "bg-violet-500/20",
            isDone && status !== "failed" && "bg-emerald-500/20",
            status === "failed" && "bg-red-500/20"
          )}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          ) : status === "failed" ? (
            <XCircle className="h-4 w-4 text-red-400" />
          ) : isDone ? (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          ) : (
            <Icon className="h-4 w-4 text-gray-500" />
          )}
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            isIdle ? "text-gray-500" : "text-white"
          )}
        >
          {label}
        </span>
        {isRunning && (
          <span className="ml-auto text-xs text-violet-400">Processing...</span>
        )}
      </div>
      <AnimatePresence>
        {children && isDone && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-t border-white/5 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Step1HumanCheck({
  state,
}: {
  state: WorkflowState["humanCheck"];
}) {
  return (
    <StepWrapper
      icon={UserCheck}
      label="Human Passport Verification"
      status={state.status}
    >
      {state.data && (
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">Humanity Score: </span>
            <span
              className={
                state.data.humanityScore >= 50
                  ? "font-bold text-emerald-400"
                  : "font-bold text-red-400"
              }
            >
              {state.data.humanityScore}/100
            </span>
          </div>
          {state.data.passportId && (
            <div>
              <span className="text-gray-400">Passport: </span>
              <span className="font-mono text-xs text-gray-300">
                {state.data.passportId}
              </span>
            </div>
          )}
        </div>
      )}
    </StepWrapper>
  );
}

function Step2Research({
  state,
}: {
  state: WorkflowState["research"];
}) {
  return (
    <StepWrapper
      icon={Search}
      label="Unbrowse Web Research"
      status={state.status}
    >
      {state.data && (
        <div className="grid gap-3 sm:grid-cols-3">
          {state.data.github && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Github className="h-4 w-4" />
                GitHub
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                <p>@{state.data.github.username}</p>
                <p>
                  {state.data.github.repos} repos / {state.data.github.stars}{" "}
                  stars
                </p>
                <p>Activity: {state.data.github.commitFrequency}</p>
                <p>{state.data.github.topLanguages.join(", ")}</p>
              </div>
            </div>
          )}
          {state.data.linkedin && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                <p>{state.data.linkedin.headline}</p>
                <p>{state.data.linkedin.employment}</p>
                <p>{state.data.linkedin.connectionCount} connections</p>
              </div>
            </div>
          )}
          {state.data.twitter && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Twitter className="h-4 w-4" />
                Twitter/X
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                <p>{state.data.twitter.handle}</p>
                <p>
                  {state.data.twitter.followers.toLocaleString()} followers
                </p>
                <p>Engagement: {state.data.twitter.engagement}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </StepWrapper>
  );
}

function Step3Evaluation({
  state,
}: {
  state: WorkflowState["evaluation"];
}) {
  return (
    <StepWrapper
      icon={Brain}
      label="AI Evaluation (Claude)"
      status={state.status}
    >
      {state.data && (
        <div className="space-y-2">
          <ScoreBar
            label="Impact Potential"
            score={state.data.impactPotential}
            delay={0}
          />
          <ScoreBar
            label="Technical Feasibility"
            score={state.data.technicalFeasibility}
            delay={0.1}
          />
          <ScoreBar
            label="Team Credibility"
            score={state.data.teamCredibility}
            delay={0.2}
          />
          <ScoreBar
            label="Budget Reasonableness"
            score={state.data.budgetReasonableness}
            delay={0.3}
          />
          <ScoreBar
            label="Mission Alignment"
            score={state.data.missionAlignment}
            delay={0.4}
          />
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-sm font-medium text-white">
              Overall Score
            </span>
            <span
              className={cn(
                "text-2xl font-bold",
                state.data.overall >= 70
                  ? "text-emerald-400"
                  : state.data.overall >= 50
                  ? "text-amber-400"
                  : "text-red-400"
              )}
            >
              {state.data.overall}/100
            </span>
          </div>
        </div>
      )}
    </StepWrapper>
  );
}

function Step4Decision({
  state,
}: {
  state: WorkflowState["decision"];
}) {
  return (
    <StepWrapper icon={Gavel} label="Decision" status={state.status}>
      {state.data && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {state.data.decision === "approved" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Approved
              </span>
            )}
            {state.data.decision === "rejected" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-400">
                <XCircle className="h-4 w-4" />
                Rejected
              </span>
            )}
            {state.data.decision === "flagged" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Flagged for Review
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-gray-300">
            {state.data.rationale}
          </p>
        </div>
      )}
    </StepWrapper>
  );
}

function Step5OnChain({
  state,
}: {
  state: WorkflowState["onChain"];
}) {
  const statusText =
    state.status === "minting"
      ? "Minting decision record..."
      : state.status === "transferring"
      ? "Transferring USDC..."
      : state.status === "rebalancing"
      ? "Rebalancing Meteora vault..."
      : state.status === "complete"
      ? "All on-chain actions complete"
      : "";

  return (
    <StepWrapper
      icon={LinkIcon}
      label="On-Chain Actions"
      status={
        state.status === "idle"
          ? "idle"
          : state.status === "complete"
          ? "complete"
          : "running"
      }
    >
      {state.status !== "idle" && (
        <div className="space-y-2">
          {state.status !== "complete" && (
            <p className="text-sm text-violet-400">{statusText}</p>
          )}
          {state.txHash && (
            <a
              href={solanaExplorerUrl(state.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on Solana Explorer
            </a>
          )}
        </div>
      )}
    </StepWrapper>
  );
}
