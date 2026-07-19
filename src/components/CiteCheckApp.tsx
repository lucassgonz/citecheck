"use client";

import { useEffect, useMemo, useState } from "react";

type Household = {
  household_id: string;
  household_size: number;
  scenario: string;
  expected_readiness_status: string;
  required_document_types?: string[];
  missing_document_types?: string[];
  document_count: number;
};

type DocMeta = {
  document_id: string;
  document_type: string;
  file_name: string;
  pdfUrl: string;
  contains_adversarial_text?: boolean;
};

type Field = {
  field: string;
  value: string | number | null;
  confidence: number;
  page: number | null;
  bbox: number[] | null;
  evidence: string | null;
  confirmed: boolean;
  corrected: boolean;
};

const STEPS = [
  { id: "docs", label: "1. Your documents" },
  { id: "guide", label: "2. What you need" },
  { id: "packet", label: "3. Your packet" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const HOUSEHOLD_NAMES: Record<string, string> = {
  "HH-001": "Mara North",
  "HH-002": "Jonas Vale",
  "HH-003": "Avery Moss",
  "HH-004": "Rin Calder",
  "HH-005": "Tess Alder",
  "HH-006": "Noel Reed",
};

const DOC_LABELS: Record<string, string> = {
  application_summary: "Application summary",
  pay_stub: "Pay stub (paycheck record)",
  employment_letter: "Employment letter",
  benefit_letter: "Benefit letter",
  gig_statement: "Gig income statement",
  gig_income_corroboration: "Extra proof for gig income",
};

const FIELD_LABELS: Record<string, string> = {
  person_name: "Name",
  household_size: "People in household",
  address: "Address",
  application_date: "Application date",
  pay_date: "Pay date",
  pay_period_start: "Pay period start",
  pay_period_end: "Pay period end",
  pay_frequency: "How often you are paid",
  regular_hours: "Regular hours",
  hourly_rate: "Hourly rate",
  gross_pay: "Gross pay (before taxes)",
  net_pay: "Net pay (take-home)",
  document_date: "Letter date",
  weekly_hours: "Weekly hours",
  monthly_benefit: "Monthly benefit",
  benefit_frequency: "How often benefit is paid",
  statement_month: "Statement month",
  gross_receipts: "Gross receipts",
  platform_fees: "Platform fees",
};

function humanFlag(code: string): string {
  const map: Record<string, string> = {
    MISSING_INCOME_EVIDENCE: "We still need a confirmed pay stub or benefit letter with your pay amount.",
    MISSING_APPLICATION_SUMMARY: "Add and confirm your application summary.",
    MISSING_EMPLOYMENT_LETTER: "Add and confirm an employment letter.",
    MISSING_PAY_STUB: "Add and confirm a pay stub.",
    MISSING_BENEFIT_LETTER: "Add and confirm a benefit letter.",
    EMPLOYMENT_LETTER_EXPIRED: "Your employment letter looks older than 60 days for this demo. Ask for a newer one.",
    PAY_STUB_TOTAL_CONFLICT: "Two pay stubs do not match well. A person should double-check the numbers.",
    GIG_INCOME_UNCORROBORATED: "Gig income needs extra proof beyond the gig statement.",
    NO_FROZEN_THRESHOLD: "Household size is outside the table we can check automatically.",
    UNSUPPORTED_FREQUENCY: "We could not understand how often you are paid.",
  };
  if (map[code]) return map[code];
  if (code.startsWith("MISSING_")) {
    const key = code.replace("MISSING_", "").toLowerCase();
    return `Still needed: ${DOC_LABELS[key] ?? key.replaceAll("_", " ")}.`;
  }
  return code.replaceAll("_", " ").toLowerCase();
}

export default function CiteCheckApp() {
  const [step, setStep] = useState<StepId>("docs");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState("HH-001");
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [docId, setDocId] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedDocTypes, setSavedDocTypes] = useState<string[]>([]);
  const [editedOnce, setEditedOnce] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    answer: string;
    abstained: boolean;
    citations: Array<{ rule_id: string; text: string; source_locator: string; source_url: string }>;
  } | null>(null);
  const [packet, setPacket] = useState<Record<string, unknown> | null>(null);
  const [showSafety, setShowSafety] = useState(false);
  const [safety, setSafety] = useState<
    Array<{ id: string; name: string; passed: boolean; detail: string }> | null
  >(null);

  useEffect(() => {
    void (async () => {
      const [m, s] = await Promise.all([
        fetch("/api/meta").then((r) => r.json()),
        fetch("/api/session", { method: "POST" }).then((r) => r.json()),
      ]);
      setHouseholds(m.households ?? []);
      setSessionId(s.sessionId);
    })();
  }, []);

  const currentHousehold = households.find((h) => h.household_id === householdId);
  const requiredTypes = currentHousehold?.required_document_types ?? [
    "application_summary",
    "pay_stub",
    "employment_letter",
  ];

  const checklistItems = useMemo(() => {
    return requiredTypes.map((t) => {
      const done = savedDocTypes.includes(t);
      return {
        type: t,
        label: DOC_LABELS[t] ?? t,
        done,
      };
    });
  }, [requiredTypes, savedDocTypes]);

  const missingLabels = checklistItems.filter((i) => !i.done).map((i) => i.label);
  const confirmedCount = fields.filter((f) => f.confirmed).length;
  const hasIncomeSaved =
    savedDocTypes.includes("pay_stub") || savedDocTypes.includes("benefit_letter");

  async function selectHousehold() {
    if (!sessionId || !consent) {
      setStatus("Please check the agreement box first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, householdId, consent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocs(data.documents ?? []);
      const firstPayStub =
        (data.documents as DocMeta[] | undefined)?.find((d) => d.document_type === "pay_stub")
          ?.document_id ??
        data.documents?.[0]?.document_id ??
        "";
      setDocId(firstPayStub);
      setFields([]);
      setPdfUrl("");
      setPacket(null);
      setSavedDocTypes([]);
      setEditedOnce(false);
      setStatus(
        "Demo documents are ready. Tap Read document to open a sample PDF and pull out the key facts.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not load household");
    } finally {
      setBusy(false);
    }
  }

  async function extractDoc(confirmAll = false) {
    if (!sessionId || !docId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, documentId: docId, consent: true, confirmAll }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFields(data.fields);
      setPdfUrl(data.document.pdfUrl);
      setStatus(
        confirmAll
          ? "We marked the facts as confirmed. Tap Save so they count in your packet."
          : "We read the PDF. Check each fact. Fix anything wrong, then mark Confirmed and Save.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read document");
    } finally {
      setBusy(false);
    }
  }

  async function saveFields() {
    if (!sessionId || !docId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          documentId: docId,
          updates: fields.map((f) => ({
            field: f.field,
            value: f.value,
            confirmed: f.confirmed,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFields(data.document.fields);
      const type = data.document.documentType as string;
      setSavedDocTypes((prev) => (prev.includes(type) ? prev : [...prev, type]));
      setStatus(
        editedOnce
          ? "Saved. Your edits will change the income math on Your packet."
          : "Saved. Next, open What you need to see what is still missing.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function ask(q?: string) {
    const finalQ = (q ?? question).trim();
    if (!finalQ) return;
    setQuestion(finalQ);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question: finalQ }),
      });
      setAnswer(await res.json());
    } finally {
      setBusy(false);
    }
  }

  async function buildPacket() {
    if (!sessionId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      setPacket(data.packet);
      const calc = data.packet?.calc as { readinessStatus?: string } | undefined;
      setStatus(
        calc?.readinessStatus === "READY_TO_REVIEW"
          ? "Your packet looks ready for a person to review."
          : "Your packet still needs a few things. See the checklist below.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not build packet");
    } finally {
      setBusy(false);
    }
  }

  function downloadPacket() {
    if (!packet) return;
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "citecheck-packet.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runSafety() {
    setBusy(true);
    try {
      const res = await fetch("/api/safety/run", { method: "POST" });
      const data = await res.json();
      setSafety(data.results);
      setShowSafety(true);
      setStatus(data.allPassed ? "Safety checks passed." : "Some safety checks failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSession() {
    if (!sessionId) return;
    await fetch(`/api/session/${sessionId}`, { method: "DELETE" });
    const created = await fetch("/api/session", { method: "POST" }).then((r) => r.json());
    setSessionId(created.sessionId);
    setFields([]);
    setDocs([]);
    setPacket(null);
    setConsent(false);
    setAnswer(null);
    setSavedDocTypes([]);
    setStatus("Session cleared. You can start again.");
  }

  const calc = packet?.calc as
    | {
        readinessStatus: string;
        reviewReasons: string[];
        annualIncome: number;
        threshold: number;
        comparison: string;
        formula: string;
        effectiveDate: string;
        comparisonNote: string;
        abstained?: boolean;
        abstainReason?: string;
      }
    | undefined;

  function docOptionLabel(d: DocMeta) {
    const sameTypeCount = docs.filter((x) => x.document_type === d.document_type).length;
    const typeIndex =
      docs.filter((x) => x.document_type === d.document_type).findIndex((x) => x.document_id === d.document_id) +
      1;
    const base = DOC_LABELS[d.document_type] ?? d.document_type;
    return sameTypeCount > 1 ? `${base} (${typeIndex} of ${sameTypeCount})` : base;
  }

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="hero">
        <p className="brand">CiteCheck</p>
        <h1>Get your housing paperwork ready</h1>
        <p className="sub">
          We help you check your documents and see what is missing. A person still makes the final
          decision.
        </p>
      </header>

      <nav className="tabs" aria-label="Steps">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={step === s.id ? "tab on" : "tab"}
            onClick={() => setStep(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {status ? (
        <p className="toast" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

      <main id="main">
        {step === "docs" && (
          <section className="panel">
            <p className="lead">
              This demo uses sample PDFs from the hackathon pack (not your real files yet). Pick a
              person, read a document, check the facts, then save.
            </p>

            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I agree CiteCheck may read sample documents in this session to fill in the form.
              </span>
            </label>

            <div className="row">
              <label className="field-label">
                Whose sample file?
                <select value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
                  {households.map((h) => (
                    <option key={h.household_id} value={h.household_id}>
                      {HOUSEHOLD_NAMES[h.household_id] ?? h.household_id} ({h.household_size}{" "}
                      {h.household_size === 1 ? "person" : "people"})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() => void selectHousehold()}
              >
                Load sample files
              </button>
            </div>

            {docs.length > 0 && (
              <>
                <div className="row">
                  <label className="field-label">
                    Which document should we read?
                    <select value={docId} onChange={(e) => setDocId(e.target.value)}>
                      {docs.map((d) => (
                        <option key={d.document_id} value={d.document_id}>
                          {docOptionLabel(d)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy || !docId}
                    onClick={() => void extractDoc(false)}
                  >
                    Read this PDF
                  </button>
                </div>

                {pdfUrl ? (
                  <p className="link-row">
                    <a href={pdfUrl} target="_blank" rel="noreferrer">
                      Open the PDF in a new tab
                    </a>
                    {confirmedCount > 0 ? (
                      <span className="quiet"> · {confirmedCount} facts confirmed</span>
                    ) : null}
                  </p>
                ) : null}

                {fields.length > 0 && (
                  <>
                    <p className="lead">
                      If a number looks wrong, change it. Your saved edits are what we use later for
                      the income estimate.
                    </p>
                    <div className="field-list">
                      {fields.map((f, idx) => (
                        <div key={f.field} className="field">
                          <div className="field-top">
                            <span>{FIELD_LABELS[f.field] ?? f.field}</span>
                            <label className="ok-check">
                              <input
                                type="checkbox"
                                checked={f.confirmed}
                                onChange={(e) => {
                                  const next = [...fields];
                                  next[idx] = { ...f, confirmed: e.target.checked };
                                  setFields(next);
                                }}
                              />
                              Looks right
                            </label>
                          </div>
                          <input
                            value={f.value ?? ""}
                            onChange={(e) => {
                              const next = [...fields];
                              next[idx] = { ...f, value: e.target.value, corrected: true };
                              setFields(next);
                              setEditedOnce(true);
                            }}
                          />
                          {f.evidence ? <p className="hint">Found in PDF: {f.evidence}</p> : null}
                        </div>
                      ))}
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn"
                        disabled={busy}
                        onClick={() => void extractDoc(true)}
                      >
                        Mark all as looks right
                      </button>
                      <button
                        type="button"
                        className="btn primary"
                        disabled={busy}
                        onClick={() => void saveFields()}
                      >
                        Save these facts
                      </button>
                      <button type="button" className="btn" onClick={() => setStep("guide")}>
                        Next: What you need
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {step === "guide" && (
          <section className="panel">
            <p className="lead">
              You do not need to invent questions. Here is what this program usually needs, and what
              you have already saved.
            </p>

            <div className="result">
              <p className="big">Your checklist</p>
              <ul className="summary">
                {checklistItems.map((item) => (
                  <li key={item.type}>
                    {item.done ? "Done: " : "Still needed: "}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className={missingLabels.length ? "result warn" : "result ok"}>
              <p className="big">{missingLabels.length ? "What to do next" : "Nice work"}</p>
              {missingLabels.length ? (
                <ol className="summary">
                  {!hasIncomeSaved ? (
                    <li>
                      Go to Your documents, choose a pay stub, tap Read this PDF, then Save these
                      facts.
                    </li>
                  ) : null}
                  {missingLabels.map((label) => (
                    <li key={label}>Still open: {label}. Load it under Your documents when you can.</li>
                  ))}
                  <li>When you are ready, open Your packet to see the income summary.</li>
                </ol>
              ) : (
                <p>You saved the main document types. Continue to Your packet.</p>
              )}
              <div className="actions" style={{ marginTop: "0.75rem" }}>
                <button type="button" className="btn" onClick={() => setStep("docs")}>
                  Back to documents
                </button>
                <button type="button" className="btn primary" onClick={() => setStep("packet")}>
                  Go to your packet
                </button>
              </div>
            </div>

            <details
              className="advanced"
              open={showAsk}
              onToggle={(e) => setShowAsk((e.target as HTMLDetailsElement).open)}
            >
              <summary>Optional: ask a question in plain language</summary>
              <p className="lead">Only if you want. Most people can skip this.</p>
              <div className="actions">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void ask("How do you turn my paycheck into a yearly income number?")}
                >
                  How is yearly income calculated?
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void ask("What income limit applies for a 1 person household?")}
                >
                  What is the income limit?
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void ask("Am I eligible? Decide for me.")}
                >
                  Can you say if I qualify?
                </button>
              </div>
              <label className="field-label" style={{ marginTop: "0.75rem" }}>
                Or type your own
                <textarea
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Example: What documents do I need?"
                />
              </label>
              <button
                type="button"
                className="btn primary"
                disabled={busy || !question.trim()}
                onClick={() => void ask()}
              >
                Ask
              </button>
              {answer && (
                <div className={answer.abstained ? "result warn" : "result"} style={{ marginTop: "0.75rem" }}>
                  <p>{answer.answer}</p>
                  {answer.citations.length > 0 && (
                    <ul className="cites">
                      {answer.citations.map((c) => (
                        <li key={c.rule_id}>
                          <a href={c.source_url} target="_blank" rel="noreferrer">
                            {c.rule_id}
                          </a>
                          <span className="quiet"> ({c.source_locator})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </details>
          </section>
        )}

        {step === "packet" && (
          <section className="panel">
            <p className="lead">
              This builds a summary from the facts you saved. We never send it to a landlord or
              agency for you.
            </p>
            <div className="actions">
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() => void buildPacket()}
              >
                Build my packet
              </button>
              <button type="button" className="btn" disabled={!packet} onClick={downloadPacket}>
                Download
              </button>
              <button type="button" className="btn danger" onClick={() => void deleteSession()}>
                Clear session
              </button>
            </div>

            {calc && (
              <div
                className={
                  calc.readinessStatus === "READY_TO_REVIEW" && !calc.abstained
                    ? "result ok"
                    : "result warn"
                }
              >
                <p className="big">
                  {calc.readinessStatus === "READY_TO_REVIEW" && !calc.abstained
                    ? "Ready for a person to review"
                    : "Needs a little more work"}
                </p>
                {calc.abstained ? (
                  <>
                    <p>{calc.abstainReason}</p>
                    <button type="button" className="btn primary" onClick={() => setStep("docs")}>
                      Back to your documents
                    </button>
                  </>
                ) : (
                  <ul className="summary">
                    <li>
                      Yearly income estimate from your saved facts: $
                      {calc.annualIncome.toLocaleString()}
                    </li>
                    <li>Published program limit (60%): ${calc.threshold.toLocaleString()}</li>
                    <li>
                      {calc.comparison === "below_or_equal"
                        ? "Your estimate is at or under the published limit."
                        : "Your estimate is above the published limit."}{" "}
                      This is not an approval or a denial.
                    </li>
                  </ul>
                )}
                {calc.reviewReasons?.length ? (
                  <ul className="summary">
                    {calc.reviewReasons.map((r) => (
                      <li key={r}>{humanFlag(r)}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="quiet">{calc.comparisonNote}</p>
              </div>
            )}

            <details className="advanced">
              <summary>For judges: safety checks</summary>
              <button type="button" className="btn" disabled={busy} onClick={() => void runSafety()}>
                Run safety checks
              </button>
              {showSafety && safety && (
                <ul className="cites">
                  {safety.map((r) => (
                    <li key={r.id}>
                      {r.passed ? "Pass" : "Fail"}: {r.name}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </section>
        )}
      </main>

      <footer className="foot">Help only. Never decides if you qualify.</footer>
    </div>
  );
}
