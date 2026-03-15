import { getAppConfig } from "@/lib/config";
import {
  inferLanguagesFromText,
  stableNumberFromText,
  stablePick,
} from "@/lib/utils";
import type { Proposal, UnbrowseResearch } from "@/types/api";

const UNBROWSE_LOCAL = "http://localhost:6969";

function extractProfile(value: string, pattern: RegExp): string | undefined {
  const match = value.match(pattern);
  return match?.[1];
}

async function unbrowseResolve(
  intent: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${UNBROWSE_LOCAL}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, url }),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) {
      return (await res.json()) as Record<string, unknown>;
    }
  } catch {
    // Unbrowse server not running or timed out
  }
  return null;
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).slice(0, 5);
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function classifyFrequency(val: unknown, highThresh = 20, medThresh = 5): "high" | "medium" | "low" {
  const n = Number(val ?? 0);
  if (n > highThresh) return "high";
  if (n > medThresh) return "medium";
  return "low";
}

/**
 * Autonomous Due Diligence via Unbrowse
 *
 * Uses Unbrowse to reverse-engineer GitHub, LinkedIn, and Twitter/X APIs
 * to build structured applicant profiles. Each platform is scraped
 * independently with targeted extraction intents, then the results are
 * normalized into a unified research profile that feeds directly into
 * the AI scoring pipeline.
 *
 * This is a novel use case: Unbrowse acts as an autonomous web research
 * agent performing structured data extraction for on-chain grant due
 * diligence — replacing manual background checks with real-time,
 * verifiable credential analysis.
 */
export async function runUnbrowseResearch(
  proposal: Proposal
): Promise<UnbrowseResearch> {
  const config = getAppConfig();
  const source = `${proposal.title} ${proposal.description} ${proposal.transcript ?? ""}`;

  // Try real Unbrowse CLI (local server on port 6969)
  if (config.liveUnbrowse) {
    try {
      // Extract profile handles from proposal text
      const ghUser =
        extractProfile(source, /github\.com\/([\w-]+)/i) ?? "solana-labs";
      const twitterUser =
        extractProfile(source, /(?:x|twitter)\.com\/([\w-]+)/i) ?? ghUser;
      const linkedinSlug =
        extractProfile(source, /linkedin\.com\/in\/([\w-]+)/i);

      // Run all three platform scrapes concurrently
      const [githubData, linkedinData, twitterData] = await Promise.all([
        unbrowseResolve(
          "Extract the user's bio, public repository count, total stars across all repos, " +
            "top 5 programming languages by usage, number of contributions in the last year, " +
            "and any pinned repository names. Return as structured JSON.",
          `https://github.com/${ghUser}`
        ),
        linkedinSlug
          ? unbrowseResolve(
              "Extract the person's headline, current employment or company, " +
                "number of connections (or '500+'), and list of top skills. " +
                "Return as structured JSON.",
              `https://linkedin.com/in/${linkedinSlug}`
            )
          : Promise.resolve(null),
        unbrowseResolve(
          "Extract the user's display name, follower count, following count, " +
            "engagement metrics, bio text, and topics of their 3 most recent posts. " +
            "Return as structured JSON.",
          `https://x.com/${twitterUser}`
        ),
      ]);

      const ghResult = (githubData?.data ?? githubData) as Record<string, unknown> | undefined;
      const liResult = (linkedinData?.data ?? linkedinData) as Record<string, unknown> | undefined;
      const twResult = (twitterData?.data ?? twitterData) as Record<string, unknown> | undefined;

      // Build research from whatever Unbrowse could extract
      if (ghResult || liResult || twResult) {
        return {
          proposalId: proposal.id,
          github: ghResult
            ? {
                username: String(ghResult.username ?? ghResult.login ?? ghUser),
                repos: Number(ghResult.repos ?? ghResult.public_repos ?? ghResult.repository_count ?? 0),
                stars: Number(ghResult.stars ?? ghResult.total_stars ?? 0),
                commitFrequency: classifyFrequency(
                  ghResult.contributions ?? ghResult.recent_commits ?? 10
                ),
                topLanguages: toStringArray(ghResult.languages ?? ghResult.top_languages).length > 0
                  ? toStringArray(ghResult.languages ?? ghResult.top_languages)
                  : inferLanguagesFromText(source),
                profileUrl: `https://github.com/${ghUser}`,
                bio: typeof ghResult.bio === "string" ? ghResult.bio.slice(0, 200) : undefined,
                contributions: Number(ghResult.contributions ?? ghResult.contribution_count ?? 0) || undefined,
              }
            : null,
          linkedin: liResult
            ? {
                headline: String(liResult.headline ?? "Independent builder"),
                employment: String(liResult.employment ?? liResult.company ?? liResult.current_position ?? "Open-source founder"),
                connectionCount: Number(String(liResult.connections ?? liResult.connectionCount ?? "500").replace("+", "")) || 500,
                profileUrl: linkedinSlug ? `https://linkedin.com/in/${linkedinSlug}` : undefined,
                skills: toStringArray(liResult.skills ?? liResult.top_skills),
              }
            : {
                headline: "Independent founder building mission-aligned infrastructure",
                employment: "Open-source founder",
                connectionCount: stableNumberFromText(source, 120, 1400),
              },
          twitter: twResult
            ? {
                handle: String(twResult.handle ?? twResult.username ?? `@${twitterUser}`),
                followers: Number(twResult.followers ?? twResult.follower_count ?? 0),
                engagement: classifyFrequency(
                  twResult.engagement_rate ?? twResult.engagement ?? 0, 3, 1
                ),
                profileUrl: `https://x.com/${twitterUser}`,
                recentTopics: toStringArray(twResult.recent_topics ?? twResult.topics),
              }
            : null,
          dataSources: {
            github: ghResult ? "unbrowse" : "fallback",
            linkedin: liResult ? "unbrowse" : "fallback",
            twitter: twResult ? "unbrowse" : "fallback",
          },
          completedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Fall through to deterministic demo mode
    }
  }

  // Deterministic fallback
  const githubUsername =
    extractProfile(source, /github\.com\/([\w-]+)/i) ??
    `builder-${proposal.id.slice(-5)}`;
  const linkedinSlug = extractProfile(
    source,
    /linkedin\.com\/in\/([\w-]+)/i
  );
  const twitterHandle =
    extractProfile(source, /(?:x|twitter)\.com\/([\w-]+)/i) ??
    `fundflow_${proposal.id.slice(-4)}`;

  return {
    proposalId: proposal.id,
    github: {
      username: githubUsername,
      repos: stableNumberFromText(source, 2, 14),
      stars: stableNumberFromText(source, 45, 950),
      commitFrequency: stablePick(source, ["high", "medium", "low"]),
      topLanguages: inferLanguagesFromText(source),
      profileUrl: `https://github.com/${githubUsername}`,
    },
    linkedin: {
      headline: linkedinSlug
        ? `Builder profile for ${linkedinSlug.replace(/-/g, " ")}`
        : "Independent founder building mission-aligned infrastructure",
      employment: proposal.title.toLowerCase().includes("community")
        ? "Community operator"
        : "Open-source founder",
      connectionCount: stableNumberFromText(source, 120, 1400),
    },
    twitter: {
      handle: twitterHandle,
      followers: stableNumberFromText(source, 80, 7200),
      engagement: stablePick(`${source}:engagement`, [
        "high",
        "medium",
        "low",
      ]),
      profileUrl: `https://x.com/${twitterHandle}`,
    },
    dataSources: {
      github: "fallback",
      linkedin: "fallback",
      twitter: "fallback",
    },
    completedAt: new Date().toISOString(),
  };
}
