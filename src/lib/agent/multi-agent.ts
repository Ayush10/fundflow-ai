import { getAppConfig } from "@/lib/config";
import {
  AGENT_SCOUT,
  AGENT_DIGGER,
  AGENT_VERIFIER,
  AGENT_ANALYST,
  AGENT_JUDGE,
  getAgent,
} from "@/lib/agent/personas";
import {
  researchTwitter,
  researchReddit,
  researchGoogle,
  researchYCombinator,
  researchHackerNews,
  researchGitHub,
} from "@/lib/integrations/platforms";
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

  // Extract identifiers from proposal text
  const ghUser = extractHandle(source, /github\.com\/([\w-]+)/i) ?? extractHandle(source, /github:\s*@?([\w-]+)/i);
  const twHandle = extractHandle(source, /(?:x|twitter)\.com\/([\w-]+)/i) ?? extractHandle(source, /(?:@|twitter:\s*@?)([\w-]+)/i);
  const searchQuery = proposal.title.replace(/[^\w\s]/g, " ").trim();
  const founderName = extractFounderName(source) ?? searchQuery;

  const conversation: AgentConversation = {
    proposalId: proposal.id,
    messages: [],
    startedAt: now(),
  };

  function emit(msg: Omit<AgentMessage, "timestamp">) {
    const full: AgentMessage = { ...msg, timestamp: now() };
    conversation.messages.push(full);
    onMessage?.(full);
  }

  // ── Phase 1: Agents introduce themselves and start researching ──

  emit({
    agentId: AGENT_ANALYST.id,
    agentName: AGENT_ANALYST.name,
    emoji: AGENT_ANALYST.emoji,
    text: `New proposal incoming: "${proposal.title}" requesting $${proposal.requestedAmount.toLocaleString()}. All agents, begin due diligence.`,
    type: "discovery",
  });

  emit({
    agentId: AGENT_SCOUT.id,
    agentName: AGENT_SCOUT.name,
    emoji: AGENT_SCOUT.emoji,
    text: `On it. Checking X/Twitter${twHandle ? ` for @${twHandle}` : ""} and GitHub${ghUser ? ` for @${ghUser}` : ""}...`,
    type: "discovery",
  });

  emit({
    agentId: AGENT_DIGGER.id,
    agentName: AGENT_DIGGER.name,
    emoji: AGENT_DIGGER.emoji,
    text: `Diving into Reddit and HackerNews for "${founderName}"...`,
    type: "discovery",
  });

  emit({
    agentId: AGENT_VERIFIER.id,
    agentName: AGENT_VERIFIER.name,
    emoji: AGENT_VERIFIER.emoji,
    text: `Running Google search and Y Combinator lookup for "${founderName}"...`,
    type: "discovery",
  });

  // ── Phase 2: Parallel platform research ──

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

  // ── Phase 3: Agents report discoveries ──

  // Scout reports
  if (twitterResult.found) {
    emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `Found them on X! ${twitterResult.summary}`,
      type: "discovery",
    });
  } else {
    emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `Hmm, I couldn't find a strong X/Twitter presence. ${twitterResult.summary}`,
      type: "discovery",
    });
  }

  if (githubResult.found) {
    emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `GitHub looks legit! ${githubResult.summary}`,
      type: "discovery",
    });
  }

  // Digger reports
  if (redditResult.found || hnResult.found) {
    const parts: string[] = [];
    if (redditResult.found) parts.push(`Reddit: ${redditResult.summary}`);
    if (hnResult.found) parts.push(`HackerNews: ${hnResult.summary}`);
    emit({
      agentId: AGENT_DIGGER.id,
      agentName: AGENT_DIGGER.name,
      emoji: AGENT_DIGGER.emoji,
      text: `Community presence detected! ${parts.join(" | ")}`,
      type: "discovery",
    });
  } else {
    emit({
      agentId: AGENT_DIGGER.id,
      agentName: AGENT_DIGGER.name,
      emoji: AGENT_DIGGER.emoji,
      text: `Low community footprint. No significant Reddit or HackerNews presence found.`,
      type: "discovery",
    });
  }

  // Verifier reports
  if (ycResult.found) {
    emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `Major credibility signal! ${ycResult.summary} This is a YC-backed founder.`,
      type: "verification",
    });
  }

  if (googleResult.found) {
    emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `Google results: ${googleResult.summary}`,
      type: "verification",
    });
  } else {
    emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `Weak Google presence. No significant press or articles found. This is a red flag.`,
      type: "challenge",
    });
  }

  // ── Phase 4: Cross-verification & debate ──

  const foundCount = platformResults.filter((r) => r.found).length;
  const totalConfidence = platformResults.reduce((s, r) => s + r.confidence, 0);
  const avgConfidence = Math.round(totalConfidence / platformResults.length);

  if (foundCount >= 4) {
    emit({
      agentId: AGENT_ANALYST.id,
      agentName: AGENT_ANALYST.name,
      emoji: AGENT_ANALYST.emoji,
      text: `Strong multi-platform presence: ${foundCount}/6 platforms verified. Average confidence: ${avgConfidence}%. This founder checks out across multiple sources.`,
      type: "verification",
    });
  } else if (foundCount >= 2) {
    emit({
      agentId: AGENT_ANALYST.id,
      agentName: AGENT_ANALYST.name,
      emoji: AGENT_ANALYST.emoji,
      text: `Moderate presence: only ${foundCount}/6 platforms verified (confidence: ${avgConfidence}%). Some gaps in the trail.`,
      type: "challenge",
    });

    emit({
      agentId: AGENT_DIGGER.id,
      agentName: AGENT_DIGGER.name,
      emoji: AGENT_DIGGER.emoji,
      text: `I agree that's concerning. Without community validation, we're relying heavily on the proposal itself.`,
      type: "agreement",
    });
  } else {
    emit({
      agentId: AGENT_ANALYST.id,
      agentName: AGENT_ANALYST.name,
      emoji: AGENT_ANALYST.emoji,
      text: `Warning: only ${foundCount}/6 platforms showed any presence. Confidence is just ${avgConfidence}%. This could be a new or unverifiable applicant.`,
      type: "challenge",
    });

    emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `Could be a brand new builder — or a Sybil. No track record makes it impossible to assess credibility from web data alone.`,
      type: "challenge",
    });
  }

  // Budget check
  if (proposal.requestedAmount > 25000) {
    emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `$${proposal.requestedAmount.toLocaleString()} is a large ask. For this amount I'd want to see at least 4/6 platforms verified and strong community backing.`,
      type: "challenge",
    });
  }

  // ── Phase 5: Calculate reputation score ──

  const reputation = calculateReputation(platformResults, proposal, founderName);

  emit({
    agentId: AGENT_ANALYST.id,
    agentName: AGENT_ANALYST.name,
    emoji: AGENT_ANALYST.emoji,
    text: `Reputation score calculated: ${reputation.overall}/100. Platform presence: ${reputation.platformPresence}, Sentiment: ${reputation.sentimentScore}, Community: ${reputation.communityEngagement}, Track record: ${reputation.trackRecord}.`,
    type: "verification",
  });

  // ── Phase 6: Agents argue and reach verdict ──

  if (reputation.overall >= 80) {
    emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `I'm convinced. Strong digital footprint across platforms. This is a real builder.`,
      type: "agreement",
    });
    emit({
      agentId: AGENT_DIGGER.id,
      agentName: AGENT_DIGGER.name,
      emoji: AGENT_DIGGER.emoji,
      text: `The community signals support it. I vote approve.`,
      type: "agreement",
    });
    emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `Credentials check out. I'm in favor.`,
      type: "agreement",
    });
  } else if (reputation.overall >= 50) {
    emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `Mixed signals. I see some presence but not enough for full confidence.`,
      type: "challenge",
    });
    emit({
      agentId: AGENT_DIGGER.id,
      agentName: AGENT_DIGGER.name,
      emoji: AGENT_DIGGER.emoji,
      text: `The community evidence is thin. I'd want more before committing significant funds.`,
      type: "challenge",
    });
    emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `I can partially verify their identity. Perhaps reduced funding with milestone gates?`,
      type: "agreement",
    });
  } else {
    emit({
      agentId: AGENT_SCOUT.id,
      agentName: AGENT_SCOUT.name,
      emoji: AGENT_SCOUT.emoji,
      text: `I couldn't verify this person anywhere. Too risky.`,
      type: "challenge",
    });
    emit({
      agentId: AGENT_DIGGER.id,
      agentName: AGENT_DIGGER.name,
      emoji: AGENT_DIGGER.emoji,
      text: `Zero community footprint. I vote reject.`,
      type: "challenge",
    });
    emit({
      agentId: AGENT_VERIFIER.id,
      agentName: AGENT_VERIFIER.name,
      emoji: AGENT_VERIFIER.emoji,
      text: `No verifiable credentials. This doesn't meet our due diligence standards.`,
      type: "challenge",
    });
  }

  // Judge renders verdict
  const approveVotes = reputation.overall >= 50 ? (reputation.overall >= 80 ? 4 : 2) : 0;
  const rejectVotes = 4 - approveVotes;
  const verdictPct = Math.round((approveVotes / 4) * 100);

  emit({
    agentId: AGENT_JUDGE.id,
    agentName: AGENT_JUDGE.name,
    emoji: AGENT_JUDGE.emoji,
    text: `The council has voted: ${approveVotes} in favor, ${rejectVotes} against (${verdictPct}% approval). Reputation score: ${reputation.overall}/100. ${
      reputation.overall >= 80
        ? "Proceeding to AI evaluation with strong backing."
        : reputation.overall >= 50
        ? "Proceeding to AI evaluation with reservations. Recommend reduced funding."
        : "Insufficient evidence for approval. Forwarding to AI for final assessment."
    }`,
    type: "verdict",
  });

  // Narrate the verdict via ElevenLabs
  const config = getAppConfig();
  if (config.liveElevenLabs && config.elevenLabsApiKey) {
    try {
      const verdictText = conversation.messages[conversation.messages.length - 1].text;
      const audio = await narrateShort(verdictText, AGENT_JUDGE.voiceId);
      if (audio) {
        conversation.messages[conversation.messages.length - 1].audioUrl = audio;
      }
    } catch {
      // narration optional
    }
  }

  conversation.completedAt = now();

  // Build partial founder profile
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

// ─── Reputation Scoring ─────────────────────────────────────────────

function calculateReputation(
  results: PlatformResult[],
  proposal: Proposal,
  founderName: string
): ReputationScore {
  const found = results.filter((r) => r.found);
  const totalPlatforms = results.length;

  // Platform presence: how many platforms found (0-100)
  const platformPresence = Math.round((found.length / totalPlatforms) * 100);

  // Sentiment: average sentiment across found platforms
  const sentimentMap = { positive: 90, neutral: 50, negative: 20, not_found: 10 };
  const sentimentScore = Math.round(
    results.reduce((s, r) => s + sentimentMap[r.sentiment], 0) / totalPlatforms
  );

  // Verification: weighted confidence
  const verificationScore = Math.round(
    results.reduce((s, r) => s + r.confidence * (r.found ? 1.5 : 0.5), 0) /
      (totalPlatforms * 1.5)
  );

  // Community engagement: Reddit + HN combined
  const reddit = results.find((r) => r.platform === "reddit");
  const hn = results.find((r) => r.platform === "hackernews");
  const communityEngagement = clamp(
    Math.round(
      ((reddit?.found ? reddit.confidence : 10) + (hn?.found ? hn.confidence : 10)) / 2
    ),
    0,
    100
  );

  // Track record: GitHub + YC + Google
  const gh = results.find((r) => r.platform === "github");
  const yc = results.find((r) => r.platform === "ycombinator");
  const google = results.find((r) => r.platform === "google");
  const trackRecord = clamp(
    Math.round(
      ((gh?.found ? gh.confidence * 1.2 : 10) +
        (yc?.found ? 95 : 5) +
        (google?.found ? google.confidence : 10)) /
        3
    ),
    0,
    100
  );

  // Overall: weighted average
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
  // Try to find a name pattern like "by John Smith" or "founder: Jane Doe"
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
