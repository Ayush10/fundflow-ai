import { getAppConfig } from "@/lib/config";
import { stableNumberFromText } from "@/lib/utils";
import type { HumanVerification } from "@/types/api";

const PASSPORT_API_BASE = "https://api.passport.xyz";

export async function verifyHumanity(
  wallet: string
): Promise<HumanVerification> {
  const config = getAppConfig();

  if (config.liveHumanTech && config.humanTechApiKey && config.humanTechScorerId) {
    try {
      const response = await fetch(
        `${PASSPORT_API_BASE}/v2/stamps/${config.humanTechScorerId}/score/${wallet}`,
        {
          headers: {
            "X-API-KEY": config.humanTechApiKey,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as Record<string, unknown>;

        // Passport API returns score as a string or number
        const evidence = data.evidence as Record<string, unknown> | undefined;
        const rawScore =
          data.score ?? evidence?.rawScore ?? data.unique_humanity_score ?? 0;
        const humanityScore = Math.round(Number(rawScore));
        const passingScore = Boolean(data.passing_score);

        return {
          wallet,
          humanityScore,
          verified: passingScore || humanityScore >= config.minHumanityScore,
          passportId: typeof data.stamp_id === "string"
            ? data.stamp_id
            : `passport_${wallet.slice(0, 8)}`,
          checkedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Fall through to deterministic demo mode.
    }
  }

  // Deterministic fallback
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
