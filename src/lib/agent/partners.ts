/**
 * Partner Database — known-good organizations and wallets.
 *
 * Founders associated with these get a credibility boost.
 * In production, this would be backed by a real database.
 */

export interface PartnerOrg {
  name: string;
  type: "accelerator" | "dao" | "foundation" | "venture" | "protocol";
  trustScore: number; // 0-100 — how much credibility this partner confers
  keywords: string[]; // matched against proposal text
  wallets?: string[]; // known wallet addresses
}

export const PARTNER_DATABASE: PartnerOrg[] = [
  {
    name: "Y Combinator",
    type: "accelerator",
    trustScore: 95,
    keywords: ["y combinator", "yc", "ycombinator", "yc batch", "yc w", "yc s"],
  },
  {
    name: "Solana Foundation",
    type: "foundation",
    trustScore: 90,
    keywords: ["solana foundation", "solana labs", "solana grant"],
  },
  {
    name: "Ethereum Foundation",
    type: "foundation",
    trustScore: 88,
    keywords: ["ethereum foundation", "ef grant", "devcon"],
  },
  {
    name: "Gitcoin",
    type: "dao",
    trustScore: 75,
    keywords: ["gitcoin", "gitcoin grants", "gg18", "gg19", "gg20"],
  },
  {
    name: "a16z Crypto",
    type: "venture",
    trustScore: 92,
    keywords: ["a16z", "andreessen horowitz", "a16z crypto"],
  },
  {
    name: "Superteam",
    type: "dao",
    trustScore: 70,
    keywords: ["superteam", "superteam dao", "superteam earn"],
  },
  {
    name: "Protocol Labs",
    type: "protocol",
    trustScore: 80,
    keywords: ["protocol labs", "filecoin", "ipfs"],
  },
  {
    name: "Uniswap Foundation",
    type: "foundation",
    trustScore: 82,
    keywords: ["uniswap foundation", "uniswap grants"],
  },
  {
    name: "Aave Grants DAO",
    type: "dao",
    trustScore: 78,
    keywords: ["aave grants", "aave dao"],
  },
  {
    name: "Optimism RetroPGF",
    type: "foundation",
    trustScore: 85,
    keywords: ["optimism", "retropgf", "op grants", "retroactive public goods"],
  },
];

/**
 * Check proposal text and wallet against partner database.
 * Returns matched partners and total trust boost.
 */
export function checkPartnerDatabase(
  text: string,
  wallet: string
): { matches: PartnerOrg[]; totalBoost: number } {
  const lower = text.toLowerCase();
  const matches: PartnerOrg[] = [];

  for (const partner of PARTNER_DATABASE) {
    const keywordMatch = partner.keywords.some((kw) => lower.includes(kw));
    const walletMatch = partner.wallets?.includes(wallet) ?? false;

    if (keywordMatch || walletMatch) {
      matches.push(partner);
    }
  }

  // Total boost: weighted average of matched partner trust scores, capped at 30
  const totalBoost =
    matches.length > 0
      ? Math.min(
          30,
          Math.round(
            matches.reduce((sum, p) => sum + p.trustScore * 0.3, 0) / matches.length +
              matches.length * 5
          )
        )
      : 0;

  return { matches, totalBoost };
}
