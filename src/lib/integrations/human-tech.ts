import { getAppConfig } from "@/lib/config";
import { stableNumberFromText } from "@/lib/utils";
import type { HumanVerification } from "@/types/api";

function normalizeVerification(
  wallet: string,
  payload: unknown
): HumanVerification {
  const data = payload as Record<string, unknown>;
  const humanityScore = Number(data.humanityScore ?? data.score ?? 0);

  return {
    wallet,
    humanityScore,
    verified: Boolean(
      data.verified ?? humanityScore >= getAppConfig().minHumanityScore
    ),
    passportId:
      typeof data.passportId === "string"
        ? data.passportId
        : typeof data.id === "string"
          ? data.id
          : undefined,
    checkedAt:
      typeof data.checkedAt === "string"
        ? data.checkedAt
        : new Date().toISOString(),
  };
}

export async function verifyHumanity(wallet: string): Promise<HumanVerification> {
  const config = getAppConfig();

  if (config.liveHumanTech && config.humanTechApiUrl) {
    try {
      const response = await fetch(config.humanTechApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.humanTechApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet }),
      });

      if (response.ok) {
        return normalizeVerification(wallet, await response.json());
      }
    } catch {
      // Fall through to deterministic demo mode.
    }
  }

  const normalizedWallet = wallet.toLowerCase();
  const humanityScore =
    normalizedWallet.includes("bot") || normalizedWallet.includes("sybil")
      ? 34
      : stableNumberFromText(wallet, 58, 96);

  return {
    wallet,
    humanityScore,
    verified: humanityScore >= config.minHumanityScore,
    passportId: `passport_${wallet.slice(0, 6)}_${humanityScore}`,
    checkedAt: new Date().toISOString(),
  };
}
