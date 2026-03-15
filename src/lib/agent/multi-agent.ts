import OpenAI from "openai";

import { getAppConfig } from "@/lib/config";
import {
  AGENT_SCOUT,
  AGENT_DIGGER,
  AGENT_VERIFIER,
  AGENT_ANALYST,
  AGENT_JUDGE,
} from "@/lib/agent/personas";
import { checkPartnerDatabase } from "@/lib/agent/partners";
import {
  researchTwitter,
  researchReddit,
  researchGoogle,
  researchYCombinator,
  researchHackerNews,
  researchGitHub,
} from "@/lib/integrations/platforms";
import { getFounder, listFounders } from "@/lib/store";
import { narrateShort } from "@/lib/voice/elevenlabs";
import type { Proposal } from "@/types/api";
import type {
  AgentMessage,
  AgentConversation,
  PlatformResult,
  ReputationScore,
  FounderProfile,
} from "@/types/agents";

// ─── Helpers ────────────────────────────────────────────────────────

function extractHandle(text: string, pattern: RegExp): string | undefined {
  return text.match(pattern)?.[1];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function now(): string {
  return new Date().toISOString();
}

type MessageCallback = (msg: AgentMessage) => void;

// ─── GPT-4o Dialogue Generation ─────────────────────────────────────

async function generateAgentDebate(
  proposal: Proposal,
  platformResults: PlatformResult[],
  reputation: ReputationScore,
  priorHistory: string,
  partnerInfo: string
): Promise<string[]> {
  const config = getAppConfig();
  if (!config.openaiApiKey) return [];

  try {
    const openai = new OpenAI({ apiKey: config.openaiApiKey });

    const foundPlatforms = platformResults
      .filter((r) => r.found)
      .map((r) => `${r.platform}: ${r.summary}`)
      .join("\n");
    const missingPlatforms = platformResults
      .filter((r) => !r.found)
      .map((r) => r.platform)
      .join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.8,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a script writer for an AI agent council debating whether to fund a grant proposal. Write a natural 4-6 line debate between these agents. Each line must be formatted as "AGENT_ID: message".

Agents:
- scout: Social intelligence agent (checks X/Twitter, GitHub). Enthusiastic, uses data.
- digger: Community researcher (Reddit, HackerNews). Skeptical, wants community proof.
- verifier: Credential checker (Google, YC). Formal, demands evidence.
- analyst: Data synthesizer. Objective, summarizes findings.

Rules:
- Be conversational and natural — agents should react to each other
- Include specific data points from the research
- If reputation is low (<40), agents should be critical
- If reputation is high (>70), agents should be supportive but not blindly
- Include at least one disagreement or challenge
- Keep each line under 150 characters
- Return ONLY the debate lines, nothing else`,
        },
        {
          role: "user",
          content: `Proposal: "${proposal.title}" — $${proposal.requestedAmount.toLocaleString()}
Reputation: ${reputation.overall}/100

Found on: ${foundPlatforms || "none"}
Missing from: ${missingPlatforms || "none"}
${priorHistory}
${partnerInfo}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.includes(":") && l.length > 5);
  } catch {
    return [];
  }
}

// ─── Multi-Agent Research ───────────────────────────────────────────

export async function runMultiAgentResearch(
  proposal: Proposal,
  onMessage?: MessageCallback
): Promise<{
  platformResults: PlatformResult[];
  conversation: AgentConversation;
  reputation: ReputationScore;
  founderProfile: Partial<FounderProfile>;
}> {
  const source = `${proposal.title} ${proposal.description} ${proposal.transcript ?? ""}`;
  const seed = proposal.id + proposal.title;
  const config = getAppConfig();

  const ghUser =
    extractHandle(source, /github\.com\/([\w-]+)/i) ??
    extractHandle(source, /github:\s*@?([\w-]+)/i);
  const twHandle =
    extractHandle(source, /(?:x|twitter)\.com\/([\w-]+)/i) ??
    extractHandle(source, /(?:@|twitter:\s*@?)([\w-]+)/i);
  const searchQuery = proposal.title.replace(/[^\w\s]/g, " ").trim();
  const founderName = extractFounderName(source) ?? searchQuery;

  const conversation: AgentConversation = {
    proposalId: proposal.id,
    messages: [],
    startedAt: now(),
  };

  // Helper to emit + optionally narrate
  async function emit(
    msg: Omit<AgentMessage, "timestamp">,
    narrate = false
  ) {
    const full: AgentMessage = { ...msg, timestamp: now() };

    if (narrate && config.liveElevenLabs && config.elevenLabsApiKey) {
      const persona = [AGENT_SCOUT, AGENT_DIGGER, AGENT_VERIFIER, AGENT_ANALYST, AGENT_JUDGE]
        .find((a) => a.id === msg.agentId);
      try {
        const audio = await narrateShort(msg.text, persona?.voiceId);
        if (audio) full.audioUrl = audio;
      } catch { /* optional */ }
    }

    conversation.messages.push(full);
    onMessage?.(full);
  }

  // ── Phase 1: Cross-reference previous founder database ──

  const existingFounder = getFounder(proposal.applicantWallet);
  const allFounders = listFounders();
  let priorHistory = "";

  if (existingFounder && existingFounder.proposals.length > 0) {
    const pastApproved = existingFounder.proposals.filter((p) => p.decision === "approved");
    const pastRejected = existingFounder.proposals.filter((p) => p.decision === "rejected");
    priorHistory = `Prior history: ${existingFounder.proposals.length} past proposals (${pastApproved.length} approved, ${pastRejected.length} rejected). Previous reputation: ${existingFounder.reputationScore}/100.`;

    await emit(
      {
        agentId: AGENT_ANALYST.id,
        agentName: AGENT_ANALYST.name,
        emoji: AGENT_ANALYST.emoji,
        text: `Database check: I've seen this wallet before. ${priorHistory} ${
          pastRejected.length > 0
            ? "Previous rejections are a concern."
            : pastApproved.length > 0
            ? "Good track record with us."
            : ""
        }`,
        type: "verification",
      },
      true // narrate this key finding
    );
  } else if (allFounders.length > 0) {
    await emit({
      agentId: AGENT_ANALYST.id,
      agentName: AGENT_ANALYST.name,
      emoji: AGENT_ANALYST.emoji,
      text: `Database check: First-time applicant. No prior history in our system (${allFounders.length} founders on record).`,
      type: "discovery",
    });
  }

  // ── Phase 2: Partner database check ──

  const { matches: partnerMatches, totalBoost: partnerBoost } = checkPartnerDatabase(
    source,
    proposal.applicantWallet
  );
  let partnerInfo = "";

  if (partnerMatches.length > 0) {
    const names = partnerMatches.map((p) => p.name).join(", ");
    partnerInfo = `Partner affiliations detected: ${names} (+${partnerBoost} credibility boost).`;

    await emit(
      {
        agentId: AGENT_VERIFIER.id,
        agentName: AGENT_VERIFIER.name,
        emoji: AGENT_VERIFIER.emoji,
        text: `Partner database match! Affiliated with ${names}. This adds +${partnerBoost} to credibility. ${
          partnerMatches.some((p) => p.type === "accelerator")
            ? "Accelerator backing is a strong signal."
            : ""
        }`,
        type: "verification",
      },
      true // narrate partner discovery
    );
  }

  // ── Phase 3: Agents introduce and start researching ──

  await emit({
    agentId: AGENT_ANALYST.id,
    agentName: AGENT_ANALYST.name,
    emoji: AGENT_ANALYST.emoji,
    text: `New proposal: "${proposal.title}" requesting $${proposal.requestedAmount.toLocaleString()}. All agents, begin due diligence.`,
    type: "discovery",
  });

  await emit({
    agentId: AGENT_SCOUT.id,
    agentName: AGENT_SCOUT.name,
    emoji: AGENT_SCOUT.emoji,
    text: `On it. Checking X/Twitter${twHandle ? ` for @${twHandle}` : ""} and GitHub${ghUser ? ` for @${ghUser}` : ""}...`,
    type: "discovery",
  });

  await emit({
    agentId: AGENT_DIGGER.id,
    agentName: AGENT_DIGGER.name,
    emoji: AGENT_DIGGER.emoji,
    text: `Diving into Reddit and HackerNews for "${founderName}"...`,
    type: "discovery",
  });

  await emit({
    agentId: AGENT_VERIFIER.id,
    agentName: AGENT_VERIFIER.name,
    emoji: AGENT_VERIFIER.emoji,
    text: `Running Google search and Y Combinator lookup for "${founderName}"...`,
    type: "discovery",
  });

  // ── Phase 4: Parallel platform research ──

  const [twitterResult, githubResult, redditResult, hnResult, googleResult, ycResult] =
    await Promise.all([
      researchTwitter(twHandle ?? founderName, seed),
      ghUser ? researchGitHub(ghUser, seed) : researchGitHub(founderName, seed),
      researchReddit(founderName, seed),
      researchHackerNews(founderName, seed),
      researchGoogle(`${founderName} startup founder`, seed),
      researchYCombinator(founderName, seed),
    ]);

  const platformResults = [twitterResult, githubResult, redditResult, hnResult, googleResult, ycResult];

  // ── Phase 5: Agents report key discoveries (with narration) ──

  // Scout: Twitter & GitHub
  if (twitterResult.found) {
    await emit(
      {
        agentId: AGENT_SCOUT.id,
        agentName: AGENT_SCOUT.name,
        emoji: AGENT_SCOUT.emoji,
        text: `Found them on X! ${twitterResult.summary}`,
        type: "discovery",
      },
      true // narrate Scout's discovery
    );
  } else {
    await emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `No strong X/Twitter presence. ${twitterResult.summary}`,
      type: "discovery",
    });
  }

  if (githubResult.found) {
    await emit(
      {
        agentId: AGENT_SCOUT.id,
        agentName: AGENT_SCOUT.name,
        emoji: AGENT_SCOUT.emoji,
        text: `GitHub looks legit! ${githubResult.summary}`,
        type: "discovery",
      },
      true // narrate GitHub finding
    );
  }

  // Digger: Reddit & HN
  if (redditResult.found || hnResult.found) {
    const parts: string[] = [];
    if (redditResult.found) parts.push(`Reddit: ${redditResult.summary}`);
    if (hnResult.found) parts.push(`HackerNews: ${hnResult.summary}`);
    await emit(
      {
        agentId: AGENT_DIGGER.id,
        agentName: AGENT_DIGGER.name,
        emoji: AGENT_DIGGER.emoji,
        text: `Community presence detected! ${parts.join(" | ")}`,
        type: "discovery",
      },
      true // narrate community discovery
    );
  } else {
    await emit({
      agentId: AGENT_DIGGER.id,
      agentName: AGENT_DIGGER.name,
      emoji: AGENT_DIGGER.emoji,
      text: `Low community footprint. No significant Reddit or HackerNews presence found.`,
      type: "discovery",
    });
  }

  // Verifier: Google & YC
  if (ycResult.found) {
    await emit(
      {
        agentId: AGENT_VERIFIER.id,
        agentName: AGENT_VERIFIER.name,
        emoji: AGENT_VERIFIER.emoji,
        text: `Major credibility signal! ${ycResult.summary} This is a YC-backed founder.`,
        type: "verification",
      },
      true // narrate YC discovery
    );
  }

  if (googleResult.found) {
    await emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `Google: ${googleResult.summary}`,
      type: "verification",
    });
  } else {
    await emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `Weak Google presence. No significant press or articles found.`,
      type: "challenge",
    });
  }

  // ── Phase 6: Calculate reputation ──

  const reputation = calculateReputation(
    platformResults,
    proposal,
    founderName,
    partnerBoost,
    existingFounder
  );

  await emit({
    agentId: AGENT_ANALYST.id,
    agentName: AGENT_ANALYST.name,
    emoji: AGENT_ANALYST.emoji,
    text: `Reputation score: ${reputation.overall}/100 (platforms: ${reputation.platformPresence}, sentiment: ${reputation.sentimentScore}, community: ${reputation.communityEngagement}, track record: ${reputation.trackRecord}).`,
    type: "verification",
  });

  // ── Phase 7: GPT-4o generated debate ──

  const debateLines = await generateAgentDebate(
    proposal,
    platformResults,
    reputation,
    priorHistory,
    partnerInfo
  );

  const agentMap: Record<string, typeof AGENT_SCOUT> = {
    scout: AGENT_SCOUT,
    digger: AGENT_DIGGER,
    verifier: AGENT_VERIFIER,
    analyst: AGENT_ANALYST,
    judge: AGENT_JUDGE,
  };

  for (const line of debateLines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const agentId = line.slice(0, colonIdx).trim().toLowerCase();
    const text = line.slice(colonIdx + 1).trim();
    const agent = agentMap[agentId];
    if (!agent || !text) continue;

    const isChallenge = text.toLowerCase().includes("concern") ||
      text.toLowerCase().includes("risk") ||
      text.toLowerCase().includes("disagree") ||
      text.toLowerCase().includes("but ");
    const isAgreement = text.toLowerCase().includes("agree") ||
      text.toLowerCase().includes("support") ||
      text.toLowerCase().includes("convinced");

    await emit({
      agentId: agent.id,
      agentName: agent.name,
      emoji: agent.emoji,
      text,
      type: isChallenge ? "challenge" : isAgreement ? "agreement" : "discovery",
    });
  }

  // ── Phase 8: Judge verdict ──

  const foundCount = platformResults.filter((r) => r.found).length;
  const approveVotes = reputation.overall >= 50 ? (reputation.overall >= 80 ? 4 : 2) : 0;
  const rejectVotes = 4 - approveVotes;
  const verdictPct = Math.round((approveVotes / 4) * 100);

  await emit(
    {
      agentId: AGENT_JUDGE.id,
      agentName: AGENT_JUDGE.name,
      emoji: AGENT_JUDGE.emoji,
      text: `The council votes: ${approveVotes} approve, ${rejectVotes} reject (${verdictPct}%). Reputation: ${reputation.overall}/100. Platforms verified: ${foundCount}/6.${
        partnerMatches.length > 0 ? ` Partner affiliations: ${partnerMatches.map((p) => p.name).join(", ")}.` : ""
      }${
        existingFounder ? ` Prior history: ${existingFounder.proposals.length} proposals.` : ""
      } ${
        reputation.overall >= 80
          ? "Strong backing — proceeding to AI evaluation."
          : reputation.overall >= 50
          ? "Moderate confidence — recommend reduced funding."
          : "Insufficient evidence — forwarding for final AI assessment."
      }`,
      type: "verdict",
    },
    true // narrate the verdict
  );

  conversation.completedAt = now();

  const founderProfile = buildFounderProfile(
    proposal,
    platformResults,
    reputation,
    founderName,
    ghUser,
    twHandle
  );

  return { platformResults, conversation, reputation, founderProfile };
}

// ─── Reputation Scoring (enhanced with partner & history) ───────────

function calculateReputation(
  results: PlatformResult[],
  proposal: Proposal,
  founderName: string,
  partnerBoost: number,
  existingFounder: FounderProfile | null
): ReputationScore {
  const found = results.filter((r) => r.found);
  const totalPlatforms = results.length;

  const platformPresence = Math.round((found.length / totalPlatforms) * 100);

  const sentimentMap: Record<string, number> = { positive: 90, neutral: 50, negative: 20, not_found: 10 };
  const sentimentScore = Math.round(
    results.reduce((s, r) => s + (sentimentMap[r.sentiment] ?? 10), 0) / totalPlatforms
  );

  const verificationScore = Math.round(
    results.reduce((s, r) => s + r.confidence * (r.found ? 1.5 : 0.5), 0) /
      (totalPlatforms * 1.5)
  );

  const reddit = results.find((r) => r.platform === "reddit");
  const hn = results.find((r) => r.platform === "hackernews");
  const communityEngagement = clamp(
    Math.round(
      ((reddit?.found ? reddit.confidence : 10) + (hn?.found ? hn.confidence : 10)) / 2
    ),
    0,
    100
  );

  const gh = results.find((r) => r.platform === "github");
  const yc = results.find((r) => r.platform === "ycombinator");
  const google = results.find((r) => r.platform === "google");
  let trackRecord = clamp(
    Math.round(
      ((gh?.found ? gh.confidence * 1.2 : 10) +
        (yc?.found ? 95 : 5) +
        (google?.found ? google.confidence : 10)) /
        3
    ),
    0,
    100
  );

  // Boost from partner database
  trackRecord = clamp(trackRecord + partnerBoost, 0, 100);

  // Boost/penalty from prior history
  if (existingFounder) {
    const pastApproved = existingFounder.proposals.filter((p) => p.decision === "approved").length;
    const pastRejected = existingFounder.proposals.filter((p) => p.decision === "rejected").length;
    trackRecord = clamp(trackRecord + pastApproved * 8 - pastRejected * 12, 0, 100);
  }

  const overall = clamp(
    Math.round(
      platformPresence * 0.2 +
        sentimentScore * 0.15 +
        verificationScore * 0.25 +
        communityEngagement * 0.15 +
        trackRecord * 0.25
    ),
    0,
    100
  );

  return {
    overall,
    platformPresence,
    sentimentScore,
    verificationScore,
    communityEngagement,
    trackRecord,
    breakdown: results,
    founderName,
  };
}

// ─── Founder Profile Builder ────────────────────────────────────────

function buildFounderProfile(
  proposal: Proposal,
  results: PlatformResult[],
  reputation: ReputationScore,
  name: string,
  ghUser?: string,
  twHandle?: string
): Partial<FounderProfile> {
  const gh = results.find((r) => r.platform === "github");
  const tw = results.find((r) => r.platform === "twitter");
  const reddit = results.find((r) => r.platform === "reddit");
  const hn = results.find((r) => r.platform === "hackernews");
  const yc = results.find((r) => r.platform === "ycombinator");
  const google = results.find((r) => r.platform === "google");

  return {
    wallet: proposal.applicantWallet,
    name,
    platforms: {
      github: gh?.found
        ? {
            username: ghUser ?? String(gh.data.username ?? gh.data.login ?? ""),
            url: gh.url ?? "",
            repos: Number(gh.data.repos ?? gh.data.public_repos ?? 0),
            stars: Number(gh.data.stars ?? gh.data.total_stars ?? 0),
          }
        : undefined,
      twitter: tw?.found
        ? {
            handle: twHandle ?? String(tw.data.handle ?? tw.data.username ?? ""),
            url: tw.url ?? "",
            followers: Number(tw.data.followers ?? tw.data.follower_count ?? 0),
          }
        : undefined,
      reddit: reddit?.found
        ? {
            username: String(reddit.data.username ?? ""),
            karma: Number(reddit.data.karma ?? 0),
            url: reddit.url ?? "",
          }
        : undefined,
      hackernews: hn?.found
        ? {
            username: String(hn.data.username ?? ""),
            karma: Number(hn.data.karma ?? 0),
            url: hn.url ?? "",
          }
        : undefined,
      ycombinator: yc?.found
        ? {
            found: true,
            company: String(yc.data.company ?? yc.data.name ?? ""),
            batch: String(yc.data.batch ?? ""),
            url: yc.url,
          }
        : { found: false },
      google: google
        ? {
            articlesFound: Number(google.confidence > 30 ? google.data.resultCount ?? 5 : 0),
            sentiment: google.sentiment,
          }
        : undefined,
    },
    reputationScore: reputation.overall,
  };
}

function extractFounderName(text: string): string | undefined {
  const patterns = [
    /(?:founder|author|by|built by|created by)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /(?:I'm|I am|my name is)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return undefined;
}
