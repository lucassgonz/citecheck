import { readFileSync } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

function loadJson<T>(filename: string): T {
  const raw = readFileSync(path.join(dataDir, filename), "utf8");
  return JSON.parse(raw) as T;
}

export type ProgramMeta = {
  programId: string;
  programName: string;
  ruleYear: number;
  effectiveDate: string;
  metro: string;
  hudArea: string;
  disclaimer: string;
};

export type MtspData = {
  source: string;
  effectiveDate: string;
  area: string;
  medianFamilyIncome: number;
  limits: Record<string, Record<string, number>>;
  formulaNotes: string[];
};

export type RuleSection = {
  id: string;
  title: string;
  text: string;
  effectiveDate: string;
  tags: string[];
};

export type RulesCorpus = {
  corpusId: string;
  programId: string;
  ruleYear: number;
  effectiveDate: string;
  sections: RuleSection[];
};

export type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  category: string;
  maxAgeDays?: number;
};

export type GoldChecklist = {
  checklistId: string;
  items: ChecklistItem[];
};

export type SyntheticDoc = {
  id: string;
  title: string;
  type: string;
  filename: string;
  text: string;
  goldFields: Record<string, string | number | null>;
  evidenceHints: Record<string, string>;
  isAdversarial?: boolean;
};

export type SyntheticPack = {
  documents: SyntheticDoc[];
};

export const program = loadJson<ProgramMeta>("program.json");
export const mtsp = loadJson<MtspData>("mtsp-2026.json");
export const rules = loadJson<RulesCorpus>("rules-corpus.json");
export const checklist = loadJson<GoldChecklist>("gold-checklist.json");
export const syntheticPack = loadJson<SyntheticPack>("synthetic-documents.json");
