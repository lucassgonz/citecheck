import { NextResponse } from "next/server";
import { listHouseholds, programOfficial, ruleCorpus, mtspRows } from "@/lib/organizer";
import { SAFETY_COPY } from "@/lib/safety";

export async function GET() {
  return NextResponse.json({
    program: programOfficial,
    households: listHouseholds(),
    mtsp: {
      effectiveDate: mtspRows[0]?.effective_date,
      area: mtspRows[0]?.hud_area,
      medianFamilyIncome: mtspRows[0]?.median_family_income,
      rows: mtspRows.map((r) => ({
        household_size: r.household_size,
        limit_50: r.income_limit_50_percent,
        limit_60: r.income_limit_60_percent,
      })),
      sourceUrl: mtspRows[0]?.source_url,
    },
    rulesCount: ruleCorpus.length,
    safety: SAFETY_COPY,
  });
}
