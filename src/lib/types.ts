import { z } from "zod";

export const ALLOWLISTED_FIELDS = [
  "fullName",
  "employer",
  "payPeriodStart",
  "payPeriodEnd",
  "payDate",
  "payFrequency",
  "grossPayPeriod",
  "grossPayYtd",
  "householdSize",
  "city",
  "state",
] as const;

export type AllowlistedField = (typeof ALLOWLISTED_FIELDS)[number];

export const FIELD_LABELS: Record<AllowlistedField, string> = {
  fullName: "Full name",
  employer: "Employer / payer",
  payPeriodStart: "Pay period start",
  payPeriodEnd: "Pay period end",
  payDate: "Pay date",
  payFrequency: "Pay frequency",
  grossPayPeriod: "Gross pay (period)",
  grossPayYtd: "Gross pay (YTD)",
  householdSize: "Household size",
  city: "City",
  state: "State",
};

export const PayFrequencySchema = z.enum([
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "unknown",
]);

export type PayFrequency = z.infer<typeof PayFrequencySchema>;

export const ExtractedFieldSchema = z.object({
  key: z.enum(ALLOWLISTED_FIELDS),
  value: z.union([z.string(), z.number(), z.null()]),
  confidence: z.number().min(0).max(1),
  evidence: z.string().nullable(),
  confirmed: z.boolean().default(false),
  corrected: z.boolean().default(false),
});

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;

export type SessionDocument = {
  id: string;
  title: string;
  type: string;
  filename: string;
  text: string;
  uploadedAt: string;
  isAdversarial?: boolean;
};

export type AuditEvent = {
  at: string;
  action: string;
  detail: string;
};

export type SessionState = {
  id: string;
  createdAt: string;
  consentAt: string | null;
  document: SessionDocument | null;
  fields: ExtractedField[];
  amiPercent: 50 | 60;
  checklistOverrides: Record<string, boolean>;
  audit: AuditEvent[];
  deleted: boolean;
};

export type Citation = {
  id: string;
  title: string;
  text: string;
  effectiveDate: string;
};

export type RulesAnswer = {
  answer: string;
  citations: Citation[];
  abstained: boolean;
  abstainReason?: string;
};

export type IncomeCalculation = {
  inputs: {
    grossPayPeriod: number;
    payFrequency: PayFrequency;
    householdSize: number;
    amiPercent: 50 | 60;
  };
  periodsPerYear: number;
  annualIncome: number;
  threshold: number;
  difference: number;
  formula: string;
  effectiveDate: string;
  source: string;
  comparisonNote: string;
  abstained: boolean;
  abstainReason?: string;
};
