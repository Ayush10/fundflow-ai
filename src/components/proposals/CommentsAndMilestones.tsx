"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckCircle,
  Clock,
  DollarSign,
  Send,
  Milestone as MilestoneIcon,
} from "lucide-react";
import type { Milestone } from "@/types/treasury";
import type { ProposalComment } from "@/lib/store";

function MilestoneCard({
  milestone,
  onVerify,
}: {
  milestone: Milestone;
  onVerify: (id: string) => void;
}) {
  const statusColors = {
    pending: "border-gray-500/20 bg-gray-500/5",
    verified: "border-amber-500/20 bg-amber-500/5",
    disbursed: "border-emerald-500/20 bg-emerald-500/5",
  };
  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-gray-400" />,
    verified: <CheckCircle className="h-4 w-4 text-amber-400" />,
    disbursed: <DollarSign className="h-4 w-4 text-emerald-400" />,
  };

  return (
    <div className={`rounded-lg border p-3 ${statusColors[milestone.status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcons[milestone.status]}
          <span className="text-sm font-medium text-white">{milestone.title}</span>
        </div>
        <span className="text-xs text-gray-400">
          ${milestone.trancheAmount.toLocaleString()} ({milestone.tranchePct}%)
        </span>
      </div>
      {milestone.status === "pending" && (
        <button
          onClick={() => onVerify(milestone.id)}
          className="mt-2 w-full rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-500"
        >
          Verify Milestone
        </button>
      )}
      {milestone.verifiedAt && (
        <p className="mt-1 text-xs text-gray-500">
          Verified: {new Date(milestone.verifiedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function CommentsAndMilestones({
  proposalId,
}: {
  proposalId: string;
}) {
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  const loadData = () => {
    fetch(`/api/proposals/${proposalId}/comments`)
      .then((r) => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setComments(d); })
      .catch(() => {});
    fetch(`/api/proposals/${proposalId}/milestones`)
      .then((r) => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setMilestones(d); })
      .catch(() => {});
  };

  useEffect(() => { loadData(); }, [proposalId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    await fetch(`/api/proposals/${proposalId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment, author: "Judge" }),
    });
    setNewComment("");
    setSending(false);
    loadData();
  };

  const handleVerifyMilestone = async (milestoneId: string) => {
    await fetch(`/api/proposals/${proposalId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId }),
    });
    loadData();
  };

  return (
    <div className="space-y-4">
      {/* Milestones */}
      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
        >
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <MilestoneIcon className="h-4 w-4" />
            Funding Milestones
          </h3>
          <div className="space-y-2">
            {milestones.map((ms) => (
              <MilestoneCard
                key={ms.id}
                milestone={ms}
                onVerify={handleVerifyMilestone}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Comments */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
      >
        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Judge Notes
          {comments.length > 0 && (
            <span className="text-xs text-gray-600">({comments.length})</span>
          )}
        </h3>

        {/* Comment input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            placeholder="Add a note or observation..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
          />
          <button
            onClick={handleSubmitComment}
            disabled={sending || !newComment.trim()}
            className="rounded-lg bg-violet-600 px-3 py-2 text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Comment list */}
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-violet-400">
                  {c.author}
                </span>
                <span className="text-[10px] text-gray-600">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{c.text}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-4">
              No notes yet. Add observations during evaluation.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
