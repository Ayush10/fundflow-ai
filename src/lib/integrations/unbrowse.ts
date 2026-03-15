import { getAppConfig } from "@/lib/config";
import {
  inferLanguagesFromText,
  stableNumberFromText,
  stablePick,
} from "@/lib/utils";
import type { Proposal, UnbrowseResearch } from "@/types/api";

function extractProfile(value: string, pattern: RegExp): string | undefined {
  const match = value.match(pattern);
  return match?.[1];
}

function normalizeResearch(
  proposalId: string,
  payload: unknown
): UnbrowseResearch | null {
  const data = payload as Record<string, unknown>;

  if (!data) {
    return null;
  }

  return {
    proposalId,
    github:
      data.github && typeof data.github === "object"
        ? (data.github as UnbrowseResearch["github"])
        : null,
    linkedin:
      data.linkedin && typeof data.linkedin === "object"
        ? (data.linkedin as UnbrowseResearch["linkedin"])
        : null,
    twitter:
      data.twitter && typeof data.twitter === "object"
        ? (data.twitter as UnbrowseResearch["twitter"])
        : null,
    completedAt: new Date().toISOString(),
  };
}

export async function runUnbrowseResearch(
  proposal: Proposal
): Promise<UnbrowseResearch> {
  const config = getAppConfig();

  if (config.liveUnbrowse && config.unbrowseApiUrl) {
    try {
      const response = await fetch(config.unbrowseApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.unbrowseApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proposal),
      });

      if (response.ok) {
        const normalized = normalizeResearch(
          proposal.id,
          await response.json()
        );
        if (normalized) {
          return normalized;
        }
      }
    } catch {
      // Fall through to deterministic demo mode.
    }
  }

  const source = `${proposal.title} ${proposal.description} ${proposal.transcript ?? ""}`;
  const githubUsername =
    extractProfile(source, /github\.com\/([\w-]+)/i) ??
    `builder-${proposal.id.slice(-5)}`;
  const linkedinSlug = extractProfile(source, /linkedin\.com\/in\/([\w-]+)/i);
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
      engagement: stablePick(`${source}:engagement`, ["high", "medium", "low"]),
    },
    completedAt: new Date().toISOString(),
  };
}
