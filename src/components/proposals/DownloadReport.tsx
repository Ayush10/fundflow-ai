"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function DownloadReport({ proposalId }: { proposalId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/report`);
      const report = await res.json();

      // Dynamic import jspdf (client-side only)
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const margin = 15;
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FundFlow AI — Due Diligence Report", margin, y);
      y += 12;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128);
      doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, margin, y);
      y += 10;

      // Proposal Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("Proposal", margin, y);
      y += 7;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const proposalLines = [
        `Title: ${report.proposal.title}`,
        `Amount: $${Number(report.proposal.requestedAmount).toLocaleString()}`,
        `Wallet: ${report.proposal.applicantWallet}`,
        `Status: ${report.proposal.status.toUpperCase()}`,
        `Submitted: ${new Date(report.proposal.createdAt).toLocaleDateString()}`,
      ];
      for (const line of proposalLines) {
        doc.text(line, margin, y);
        y += 5;
      }
      y += 3;

      // Description
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(report.proposal.description, 180);
      doc.text(descLines, margin, y);
      y += descLines.length * 4 + 5;

      // Human Verification
      if (report.humanVerification) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Human Verification", margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Humanity Score: ${report.humanVerification.humanityScore}/100`, margin, y);
        y += 5;
        doc.text(`Verified: ${report.humanVerification.verified ? "YES" : "NO"}`, margin, y);
        y += 5;
        doc.text(`Passport: ${report.humanVerification.passportId ?? "N/A"}`, margin, y);
        y += 8;
      }

      // Decision
      if (report.decision) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("AI Evaluation & Decision", margin, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        const scores = report.decision.scores;
        const scoreLines = [
          `Decision: ${report.decision.decision.toUpperCase()}`,
          `Overall Score: ${scores.overall}/100`,
          `Impact: ${scores.impactPotential} | Feasibility: ${scores.technicalFeasibility} | Credibility: ${scores.teamCredibility}`,
          `Budget: ${scores.budgetReasonableness} | Mission: ${scores.missionAlignment}`,
        ];
        for (const line of scoreLines) {
          doc.text(line, margin, y);
          y += 5;
        }
        y += 3;

        const rationaleLines = doc.splitTextToSize(`Rationale: ${report.decision.rationale}`, 180);
        doc.text(rationaleLines, margin, y);
        y += rationaleLines.length * 4 + 5;

        if (report.decision.onChainTxHash) {
          doc.text(`On-chain TX: ${report.decision.onChainTxHash}`, margin, y);
          y += 5;
        }
      }

      // Agent Conversation Summary
      const messages = report.agentEvents?.filter(
        (e: { step: string }) => e.step === "agent-message"
      );
      if (messages && messages.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Multi-Agent Due Diligence Discussion", margin, y);
        y += 7;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        for (const evt of messages.slice(0, 12)) {
          if (y > 270) { doc.addPage(); y = 20; }
          const msg = evt.data;
          const line = `${msg.emoji} ${msg.agentName}: ${msg.text}`;
          const wrapped = doc.splitTextToSize(line, 175);
          doc.text(wrapped, margin + 2, y);
          y += wrapped.length * 3.5 + 2;
        }
      }

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("FundFlow AI — Autonomous On-Chain Grant Allocator | fundflow.ayushojha.com", margin, 290);

      doc.save(`fundflow-report-${proposalId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      PDF Report
    </button>
  );
}
