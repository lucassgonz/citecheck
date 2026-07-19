import { readFileSync } from "fs";
import path from "path";

const PACK = path.join(
  process.cwd(),
  "data/organizer/realdoor-hackathon-starter-pack",
);

function read(rel: string) {
  return readFileSync(path.join(PACK, rel), "utf8");
}

export const EVENT_DATE = "2026-07-18";
export const DOC_MAX_AGE_DAYS = 60;

export type MtspRow = {
  household_size: number;
  income_limit_50_percent: number;
  income_limit_60_percent: number;
  effective_date: string;
  hud_area: string;
  median_family_income: number;
  source_url: string;
  source_pdf_page: string;
};

export type GoldField = {
  field: string;
  value: string | number;
  page: number;
  bbox: [number, number, number, number];
  bbox_units: string;
};

export type GoldDocument = {
  document_id: string;
  household_id: string;
  document_type: string;
  file_name: string;
  synthetic: boolean;
  rasterized?: boolean;
  contains_adversarial_text?: boolean;
  page_count: number;
  page_size_points: [number, number];
  fields: GoldField[];
};

export type RuleRow = {
  rule_id: string;
  authority: string;
  effective_date: string | null;
  text: string;
  source_url: string;
  source_locator: string;
};

export type HouseholdChecklist = {
  household_id: string;
  household_size: number;
  scenario: string;
  required_document_types: string[];
  present_document_types: string[];
  missing_document_types: string[];
  expected_annualized_income: number;
  frozen_60_percent_threshold: number;
  comparison: string;
  expected_readiness_status: "READY_TO_REVIEW" | "NEEDS_REVIEW";
  expected_review_reasons: string[];
  decision_boundary: string;
};

function parseMtsp(): MtspRow[] {
  const lines = read("data/mtsp_2026_boston_cambridge_quincy.csv")
    .replace(/\r/g, "")
    .trim()
    .split("\n");
  return lines.slice(1).map((line) => {
    // fiscal_year,effective_date,"hud_area",mfi,size,50,60,core,page,url
    const match = line.match(
      /^(\d+),([^,]+),"([^"]+)",(\d+),(\d+),(\d+),(\d+),(\d+),(\d+),(.+)$/,
    );
    if (!match) throw new Error(`Bad MTSP row: ${JSON.stringify(line)}`);
    return {
      household_size: Number(match[5]),
      income_limit_50_percent: Number(match[6]),
      income_limit_60_percent: Number(match[7]),
      effective_date: match[2],
      hud_area: match[3],
      median_family_income: Number(match[4]),
      source_pdf_page: match[9],
      source_url: match[10],
    };
  });
}

function parseJsonl<T>(rel: string): T[] {
  return read(rel)
    .replace(/\r/g, "")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

export const mtspRows = parseMtsp();
export const goldDocuments = parseJsonl<GoldDocument>(
  "synthetic_documents/gold/document_gold.jsonl",
);
export const ruleCorpus = parseJsonl<RuleRow>("rules/rule_corpus.jsonl");
export const householdChecklists = JSON.parse(
  read("evaluation/application_checklists.json"),
) as HouseholdChecklist[];

export const programOfficial = {
  programId: "lihtc-boston-cambridge-quincy-2026",
  programName: "LIHTC readiness (Boston-Cambridge-Quincy, MA-NH HMFA)",
  ruleYear: 2026,
  effectiveDate: mtspRows[0]?.effective_date ?? "2026-05-01",
  metro: "Boston-Cambridge-Quincy, MA-NH HMFA",
  eventDate: EVENT_DATE,
  docMaxAgeDays: DOC_MAX_AGE_DAYS,
  scoredThreshold: "60% AMI (MTSP), comparison only, not eligibility",
  disclaimer:
    "CiteCheck uses the official RealDoor starter pack. It never approves, denies, scores, ranks, or determines eligibility. Ready for review and Needs review are labels for a person, not a final decision.",
  packPath: "data/organizer/realdoor-hackathon-starter-pack",
};

export function getMtsp60(householdSize: number): MtspRow | null {
  return mtspRows.find((r) => r.household_size === householdSize) ?? null;
}

export function listHouseholds() {
  return householdChecklists.map((h) => ({
    household_id: h.household_id,
    household_size: h.household_size,
    scenario: h.scenario,
    expected_readiness_status: h.expected_readiness_status,
    required_document_types: h.required_document_types,
    missing_document_types: h.missing_document_types,
    document_count: goldDocuments.filter((d) => d.household_id === h.household_id)
      .length,
  }));
}

export function docsForHousehold(householdId: string) {
  return goldDocuments.filter((d) => d.household_id === householdId);
}

export function getGoldDoc(documentId: string) {
  return goldDocuments.find((d) => d.document_id === documentId) ?? null;
}

export function checklistForHousehold(householdId: string) {
  return householdChecklists.find((h) => h.household_id === householdId) ?? null;
}
