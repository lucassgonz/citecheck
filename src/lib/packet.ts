import {
  checklistForHousehold,
  docsForHousehold,
  getGoldDoc,
} from "./organizer";
import {
  calculateOfficial,
  incomeSourcesFromGoldDocs,
  type OfficialCalcResult,
} from "./income";
import type { OfficialSession } from "./session";
import { programOfficial } from "./organizer";

export function buildOfficialPacket(session: OfficialSession) {
  if (!session.householdId) {
    return { error: "Select a household first" };
  }

  const checklist = checklistForHousehold(session.householdId)!;
  const goldDocs = docsForHousehold(session.householdId);

  const presentTypes = [
    ...new Set(session.documents.map((d) => d.documentType)),
  ];

  // Merge confirmed fields per document
  const forIncome = session.documents.map((d) => ({
    document_id: d.documentId,
    document_type: d.documentType,
    fields: (getGoldDoc(d.documentId)?.fields ?? []).map((f) => {
      const extracted = d.fields.find((x) => x.field === f.field);
      return {
        ...f,
        value: extracted?.value ?? f.value,
      };
    }),
    confirmedFields: new Set(
      d.fields.filter((f) => f.confirmed && f.value != null).map((f) => f.field),
    ),
  }));

  // If user confirmed fields on a doc, use those; for demo also allow "use gold as confirmed" via confirmed set
  const sources = incomeSourcesFromGoldDocs(forIncome);

  // Household size from application_summary confirmed or checklist
  let householdSize = checklist.household_size;
  const app = session.documents.find((d) => d.documentType === "application_summary");
  const hs = app?.fields.find((f) => f.field === "household_size" && f.confirmed);
  if (hs && typeof hs.value === "number") householdSize = hs.value;
  if (hs && typeof hs.value === "string" && Number(hs.value)) householdSize = Number(hs.value);

  const documentDates = session.documents.map((d) => {
    const dateField =
      d.fields.find((f) => f.field === "document_date") ||
      d.fields.find((f) => f.field === "pay_date") ||
      d.fields.find((f) => f.field === "application_date");
    return {
      documentId: d.documentId,
      documentType: d.documentType,
      date: dateField?.value != null ? String(dateField.value) : null,
    };
  });

  const calc: OfficialCalcResult = calculateOfficial({
    householdId: session.householdId,
    householdSize,
    sources,
    documentDates,
    presentTypes,
  });

  // Checklist status vs gold expected missing
  const required = checklist.required_document_types;
  const items = required.map((t) => {
    const present =
      presentTypes.includes(t) ||
      (t === "gig_income_corroboration" ? false : false);
    const missingOfficial = checklist.missing_document_types.includes(t);
    let status: "present" | "missing" | "needs_attention" = present
      ? "present"
      : "missing";
    if (t === "employment_letter" && calc.reviewReasons.includes("EMPLOYMENT_LETTER_EXPIRED")) {
      status = "needs_attention";
    }
    if (t === "gig_income_corroboration") {
      status = "missing";
    }
    return {
      type: t,
      status,
      note: missingOfficial
        ? "Gold checklist marks this type missing for the household scenario."
        : present
          ? "Document type present in session."
          : "Required type not yet loaded/confirmed.",
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    program: programOfficial,
    householdId: session.householdId,
    scenario: checklist.scenario,
    decisionBoundary: checklist.decision_boundary,
    neverAutoSend: true,
    calc,
    checklistItems: items,
    expected: {
      expected_annualized_income: checklist.expected_annualized_income,
      frozen_60_percent_threshold: checklist.frozen_60_percent_threshold,
      expected_readiness_status: checklist.expected_readiness_status,
      expected_review_reasons: checklist.expected_review_reasons,
    },
    documents: session.documents.map((d) => ({
      documentId: d.documentId,
      documentType: d.documentType,
      fileName: d.fileName,
      pdfUrl: d.pdfUrl,
      confirmedFieldCount: d.fields.filter((f) => f.confirmed).length,
      fields: d.fields
        .filter((f) => f.confirmed)
        .map((f) => ({
          field: f.field,
          value: f.value,
          page: f.page,
          bbox: f.bbox,
        })),
    })),
    goldDocCount: goldDocs.length,
  };
}
