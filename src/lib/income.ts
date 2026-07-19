import {
  DOC_MAX_AGE_DAYS,
  EVENT_DATE,
  checklistForHousehold,
  getMtsp60,
  type GoldField,
} from "./organizer";
import { annualize, compareToThreshold, normalizeFrequency } from "./calculate";

export type IncomeSource = {
  documentId: string;
  amount: number;
  frequency: string;
  label: string;
};

export type OfficialCalcResult = {
  abstained: boolean;
  abstainReason?: string;
  householdSize: number;
  incomeSources: IncomeSource[];
  annualIncome: number;
  threshold: number | null;
  comparison: "below_or_equal" | "above" | null;
  formula: string;
  effectiveDate: string;
  sourceUrl?: string;
  sourceLocator?: string;
  comparisonNote: string;
  readinessStatus: "READY_TO_REVIEW" | "NEEDS_REVIEW" | "ABSTAINED";
  reviewReasons: string[];
};

const CHALLENGE_AS_OF = new Date(`${EVENT_DATE}T00:00:00Z`);

function daysBeforeEvent(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((CHALLENGE_AS_OF.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function isCurrentDocument(isoDate: string | null): boolean {
  const age = daysBeforeEvent(isoDate);
  if (age == null) return false;
  return age >= 0 && age <= DOC_MAX_AGE_DAYS;
}

/** Build calc from confirmed gold-style fields across household docs. */
export function calculateOfficial(input: {
  householdId: string;
  householdSize: number;
  sources: IncomeSource[];
  documentDates: Array<{ documentId: string; documentType: string; date: string | null }>;
  presentTypes: string[];
}): OfficialCalcResult {
  const checklist = checklistForHousehold(input.householdId);
  const reviewReasons: string[] = [];

  const mtsp = getMtsp60(input.householdSize);
  if (!mtsp) {
    return {
      abstained: true,
      abstainReason: "Household size outside frozen 1–8 MTSP table.",
      householdSize: input.householdSize,
      incomeSources: input.sources,
      annualIncome: 0,
      threshold: null,
      comparison: null,
      formula: "n/a",
      effectiveDate: EVENT_DATE,
      comparisonNote: "No frozen threshold for this household size. A person needs to review.",
      readinessStatus: "NEEDS_REVIEW",
      reviewReasons: ["NO_FROZEN_THRESHOLD"],
    };
  }

  if (input.sources.length === 0) {
    return {
      abstained: true,
      abstainReason:
        "Go back to Your documents, open a pay stub (or benefit letter), tap Confirm all, then Save. We need your confirmed pay amount and how often you are paid.",
      householdSize: input.householdSize,
      incomeSources: [],
      annualIncome: 0,
      threshold: mtsp.income_limit_60_percent,
      comparison: null,
      formula: "n/a",
      effectiveDate: mtsp.effective_date,
      sourceUrl: mtsp.source_url,
      sourceLocator: `PDF page ${mtsp.source_pdf_page}`,
      comparisonNote: "This is only information to help a person review. It is not an approval or a denial.",
      readinessStatus: "NEEDS_REVIEW",
      reviewReasons: ["MISSING_INCOME_EVIDENCE"],
    };
  }

  let annualIncome = 0;
  const parts: string[] = [];
  try {
    for (const s of input.sources) {
      const a = annualize(s.amount, s.frequency);
      annualIncome = Math.round((annualIncome + a) * 100) / 100;
      parts.push(`${s.amount}×${s.frequency}(${s.documentId})=${a}`);
    }
  } catch (e) {
    return {
      abstained: true,
      abstainReason: e instanceof Error ? e.message : "Annualize failed",
      householdSize: input.householdSize,
      incomeSources: input.sources,
      annualIncome: 0,
      threshold: mtsp.income_limit_60_percent,
      comparison: null,
      formula: "n/a",
      effectiveDate: mtsp.effective_date,
      comparisonNote: "This is only information to help a person review. It is not an approval or a denial.",
      readinessStatus: "NEEDS_REVIEW",
      reviewReasons: ["UNSUPPORTED_FREQUENCY"],
    };
  }

  const comparison = compareToThreshold(annualIncome, mtsp.income_limit_60_percent);

  // Required docs missing
  const required = checklist?.required_document_types ?? [];
  for (const t of required) {
    if (!input.presentTypes.includes(t) && !(t === "gig_income_corroboration" && input.presentTypes.includes("gig_statement"))) {
      // gig_income_corroboration is special; gig_statement alone is not enough
      if (t === "gig_income_corroboration") {
        if (!input.presentTypes.includes("gig_income_corroboration")) {
          reviewReasons.push("GIG_INCOME_UNCORROBORATED");
        }
      } else if (!input.presentTypes.includes(t)) {
        reviewReasons.push(`MISSING_${t.toUpperCase()}`);
      }
    }
  }

  // Expired employment letters (>60 days before event)
  for (const d of input.documentDates) {
    if (d.documentType === "employment_letter" && !isCurrentDocument(d.date)) {
      reviewReasons.push("EMPLOYMENT_LETTER_EXPIRED");
    }
  }

  // Pay stub conflict heuristic: multiple stubs with same frequency but very different gross
  const stubs = input.sources.filter((s) => s.label.includes("pay_stub") || s.documentId.includes("D02") || s.documentId.includes("D03"));
  if (stubs.length >= 2) {
    const amounts = stubs.map((s) => s.amount);
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    if (max > 0 && (max - min) / max > 0.2) {
      reviewReasons.push("PAY_STUB_TOTAL_CONFLICT");
    }
  }

  const uniqueReasons = [...new Set(reviewReasons)];
  const readinessStatus: OfficialCalcResult["readinessStatus"] =
    uniqueReasons.length === 0 ? "READY_TO_REVIEW" : "NEEDS_REVIEW";

  return {
    abstained: false,
    householdSize: input.householdSize,
    incomeSources: input.sources,
    annualIncome,
    threshold: mtsp.income_limit_60_percent,
    comparison,
    formula: parts.join(" + "),
    effectiveDate: mtsp.effective_date,
    sourceUrl: mtsp.source_url,
    sourceLocator: `PDF page ${mtsp.source_pdf_page}`,
    comparisonNote:
      "This is only information to help a person review. It is not an approval or a denial.",
    readinessStatus,
    reviewReasons: uniqueReasons,
  };
}

export function goldFieldsToMap(fields: GoldField[]) {
  const map: Record<string, GoldField> = {};
  for (const f of fields) map[f.field] = f;
  return map;
}

export function incomeSourcesFromGoldDocs(
  docs: Array<{
    document_id: string;
    document_type: string;
    fields: GoldField[];
    confirmedFields: Set<string>;
  }>,
): IncomeSource[] {
  const sources: IncomeSource[] = [];

  for (const doc of docs) {
    const byField = goldFieldsToMap(doc.fields);

    if (doc.document_type === "pay_stub") {
      const gross = byField.gross_pay;
      const freq = byField.pay_frequency;
      if (
        gross &&
        freq &&
        doc.confirmedFields.has("gross_pay") &&
        doc.confirmedFields.has("pay_frequency")
      ) {
        const frequency = normalizeFrequency(String(freq.value));
        if (frequency) {
          sources.push({
            documentId: doc.document_id,
            amount: Number(gross.value),
            frequency,
            label: `pay_stub:${doc.document_id}`,
          });
        }
      }
    }

    if (doc.document_type === "benefit_letter") {
      const amt = byField.monthly_benefit;
      const freq = byField.benefit_frequency;
      if (
        amt &&
        freq &&
        doc.confirmedFields.has("monthly_benefit") &&
        doc.confirmedFields.has("benefit_frequency")
      ) {
        const frequency = normalizeFrequency(String(freq.value)) ?? "monthly";
        sources.push({
          documentId: doc.document_id,
          amount: Number(amt.value),
          frequency,
          label: `benefit:${doc.document_id}`,
        });
      }
    }
  }

  // Prefer one representative pay stub per household if multiples agree;
  // if conflict, keep both so calc flags PAY_STUB_TOTAL_CONFLICT.
  return sources;
}
