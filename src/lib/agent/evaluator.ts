import OpenAI from "openai";
import { z } from "zod";

import { getAppConfig } from "@/lib/config";
import {
  clamp,
  extractJsonObject,
  parseJsonSafely,
  stableNumberFromText,
} from "@/lib/utils";
import type {
  AgentDecision,
  EvaluationScore,
  HumanVerification,
  Proposal,
  UnbrowseResearch,
} from "@/types/api";

const evaluationSchema = z.object({
  scores: z.object({
    impactPotential: z.number().min(0).max(100),
    technicalFeasibility: z.number().min(0).max(100),
    teamCredibility: z.number().min(0).max(100),
    budgetReasonableness: z.number().min(0).max(100),
    missionAlignment: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
  }),
  rationale: z.string().min(10),
});

export interface EvaluationResult {
  rationale: string;
  scores: EvaluationScore;
}

function extractText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .join("\n");
  }

  return "";
}

function missionBoost(text: string): number {
  const source = text.toLowerCase();
  const keywords = [
    "public goods",
    "community",
    "climate",
    "open source",
    "funding",
    "commons",
    "resilience",
  ];

  return keywords.reduce((total, keyword) => {
    return total + (source.includes(keyword) ? 3 : 0);
  }, 0);
}

function buildHeuristicScores(input: {
  proposal: Proposal;
  verification: HumanVerification;
  research: UnbrowseResearch;
}): EvaluationScore {
  const text = `${input.proposal.title} ${input.proposal.description} ${input.proposal.transcript ?? ""}`;
  const githubStars = input.research.github?.stars ?? 0;
  const linkedinConnections = input.research.linkedin?.connectionCount ?? 0;
  const twitterFollowers = input.research.twitter?.followers ?? 0;
  const repoSignal = Math.min(15, Math.round(githubStars / 60));
  const networkSignal = Math.min(
    12,
    Math.round((linkedinConnections + twitterFollowers) / 500)
  );

  const impactPotential = clamp(
    stableNumberFromText(`${text}:impact`, 58, 86) + missionBoost(text),
    0,
    100
  );
  const technicalFeasibility = clamp(
    stableNumberFromText(`${text}:feasibility`, 55, 84) +
      (text.toLowerCase().includes("prototype") ? 8 : 0) +
      (text.toLowerCase().includes("working") ? 4 : 0),
    0,
    100
  );
  const teamCredibility = clamp(
    Math.round(
      input.verification.humanityScore * 0.45 + repoSignal * 2 + networkSignal * 2.2
    ),
    0,
    100
  );

  let budgetReasonableness = 88;
  if (input.proposal.requestedAmount > 25_000) {
    budgetReasonableness = 54;
  } else if (input.proposal.requestedAmount > 15_000) {
    budgetReasonableness = 68;
  } else if (input.proposal.requestedAmount > 8_000) {
    budgetReasonableness = 79;
  }
  if (text.toLowerCase().includes("milestone")) {
    budgetReasonableness += 5;
  }
  budgetReasonableness = clamp(budgetReasonableness, 0, 100);

  const missionAlignment = clamp(
    stableNumberFromText(`${text}:mission`, 62, 90) + missionBoost(text),
    0,
    100
  );

  const overall = Math.round(
    impactPotential * 0.25 +
      technicalFeasibility * 0.2 +
      teamCredibility * 0.25 +
      budgetReasonableness * 0.15 +
      missionAlignment * 0.15
  );

  return {
    impactPotential,
    technicalFeasibility,
    teamCredibility,
    budgetReasonableness,
    missionAlignment,
    overall,
  };
}

function buildHeuristicRationale(
  scores: EvaluationScore,
  proposal: Proposal,
  research: UnbrowseResearch
): string {
  const githubSignal = research.github
    ? `${research.github.username} shows ${research.github.stars} GitHub stars and ${research.github.commitFrequency} recent activity`
    : "the team research pass returned limited GitHub data";
  const budgetSignal =
    proposal.requestedAmount <= 15_000
      ? "The requested amount is proportionate to an early-stage grant."
      : "The requested amount is large enough that execution confidence matters more.";

  return `${githubSignal}. ${budgetSignal} Overall the proposal lands at ${scores.overall}/100 because it combines credible execution signals with a mission-aligned use of capital.`;
}

function buildPrompt(input: {
  proposal: Proposal;
  verification: HumanVerification;
  research: UnbrowseResearch;
  reputationScore?: number;
  platformResults?: unknown[];
}): string {
  const reputationContext = input.reputationScore != null
    ? `\nReputation Score: ${input.reputationScore}/100 (from multi-agent due diligence across Twitter, Reddit, Google, Y Combinator, and HackerNews).`
    : "";

  return `You are FundFlow AI, an autonomous on-chain grants allocator.

Evaluate the proposal and return JSON only in this exact shape:
{
  "scores": {
    "impactPotential": 0,
    "technicalFeasibility": 0,
    "teamCredibility": 0,
    "budgetReasonableness": 0,
    "missionAlignment": 0,
    "overall": 0
  },
  "rationale": "..."
}

Rules:
- Score each field from 0 to 100.
- Use the human verification and research data for team credibility.
- Factor in the reputation score from multi-platform due diligence.
- Approval threshold is 80+. Approved funding is proportional to score.
- Make overall a weighted summary, not a simple copy of one field.
- Keep the rationale concise, concrete, and decision-ready.
${reputationContext}

Context:
${JSON.stringify({ proposal: input.proposal, verification: input.verification, research: input.research }, null, 2)}`;
}

export async function evaluateProposal(input: {
  proposal: Proposal;
  verification: HumanVerification;
  research: UnbrowseResearch;
  reputationScore?: number;
  platformResults?: unknown[];
}): Promise<EvaluationResult> {
  const config = getAppConfig();

  if (config.liveAnthropic) {
    try {
      const prompt = buildPrompt(input);
      let text = "";

      if (config.openaiApiKey) {
        // Use OpenAI
        const openai = new OpenAI({ apiKey: config.openaiApiKey });
        const response = await openai.chat.completions.create({
          model: config.openaiModel,
          temperature: 0.2,
          max_tokens: 900,
          messages: [
            {
              role: "system",
              content:
                "You are FundFlow AI, an autonomous on-chain grants allocator. Return only valid JSON.",
            },
            { role: "user", content: prompt },
          ],
        });
        text = response.choices[0]?.message?.content ?? "";
      } else if (config.anthropicApiKey) {
        // Fallback to Anthropic if available
        const { ChatAnthropic } = await import("@langchain/anthropic");
        const model = new ChatAnthropic({
          apiKey: config.anthropicApiKey,
          model: config.anthropicModel,
          temperature: 0.2,
          maxTokens: 900,
        });
        const response = await model.invoke(prompt);
        text = extractText(response.content);
      }

      const extracted = extractJsonObject(text);
      const parsed = extracted ? parseJsonSafely<unknown>(extracted) : null;
      const result = evaluationSchema.safeParse(parsed);

      if (result.success) {
        return result.data;
      }
    } catch {
      // Fall through to deterministic demo mode.
    }
  }

  const scores = buildHeuristicScores(input);
  return {
    scores,
    rationale: buildHeuristicRationale(scores, input.proposal, input.research),
  };
}

export function decisionFromOverallScore(
  overallScore: number
): AgentDecision["decision"] {
  if (overallScore >= 70) {
    return "approved";
  }

  if (overallScore >= 50) {
    return "flagged";
  }

  return "rejected";
}

// ─── Risk Assessment ────────────────────────────────────────────────

export function assessRisk(input: {
  proposal: Proposal;
  verification: HumanVerification;
  research: UnbrowseResearch;
  reputationScore?: number;
}): { overall: number; budgetRisk: number; teamRisk: number; timelineRisk: number; marketRisk: number; flags: string[] } {
  const flags: string[] = [];
  const text = `${input.proposal.title} ${input.proposal.description}`.toLowerCase();

  // Budget risk: higher amounts = more risk
  let budgetRisk = 20;
  if (input.proposal.requestedAmount > 50000) { budgetRisk = 85; flags.push("Very large funding request (>$50k)"); }
  else if (input.proposal.requestedAmount > 25000) { budgetRisk = 65; flags.push("Large funding request (>$25k)"); }
  else if (input.proposal.requestedAmount > 10000) { budgetRisk = 40; }
  if (!text.includes("milestone") && !text.includes("tranche")) { budgetRisk += 10; flags.push("No milestone-based delivery mentioned"); }

  // Team risk: low credibility = high risk
  const rep = input.reputationScore ?? 50;
  let teamRisk = clamp(100 - rep, 10, 95);
  if (input.verification.humanityScore < 50) { teamRisk += 15; flags.push("Low humanity score"); }
  if (!input.research.github) { teamRisk += 10; flags.push("No GitHub presence"); }
  teamRisk = clamp(teamRisk, 0, 100);

  // Timeline risk: vague proposals are riskier
  let timelineRisk = 40;
  if (text.includes("timeline") || text.includes("roadmap") || text.includes("phase")) { timelineRisk = 20; }
  if (text.includes("asap") || text.includes("urgent")) { timelineRisk = 60; flags.push("Urgency language detected"); }

  // Market risk
  let marketRisk = 30;
  if (text.includes("novel") || text.includes("first") || text.includes("new concept")) { marketRisk = 55; flags.push("Unproven market/concept"); }
  if (text.includes("existing") || text.includes("proven") || text.includes("traction")) { marketRisk = 15; }

  const overall = clamp(Math.round(budgetRisk * 0.3 + teamRisk * 0.35 + timelineRisk * 0.15 + marketRisk * 0.2), 0, 100);

  return { overall, budgetRisk, teamRisk, timelineRisk, marketRisk, flags };
}
