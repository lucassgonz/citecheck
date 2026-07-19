/** Deterministic challenge calculations — mirrors organizer starter/src/calculate.py */

export const FREQUENCY: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  annual: 1,
};

export function annualize(amount: number, frequency: string): number {
  if (!(frequency in FREQUENCY)) {
    throw new Error(`Unsupported frequency: ${frequency}`);
  }
  if (amount < 0) throw new Error("Amount must be non-negative");
  return Math.round(amount * FREQUENCY[frequency] * 100) / 100;
}

export function compareToThreshold(
  annualIncome: number,
  threshold: number,
): "below_or_equal" | "above" {
  if (annualIncome < 0 || threshold < 0) {
    throw new Error("Values must be non-negative");
  }
  return annualIncome <= threshold ? "below_or_equal" : "above";
}

export function normalizeFrequency(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = String(raw).toLowerCase().replace(/[-\s]/g, "");
  if (v.includes("biweek")) return "biweekly";
  if (v.includes("semi")) return "semimonthly";
  if (v.includes("week")) return "weekly";
  if (v.includes("month")) return "monthly";
  if (v.includes("annual") || v.includes("year")) return "annual";
  return null;
}
