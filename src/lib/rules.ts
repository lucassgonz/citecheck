import OpenAI from "openai";
import { ruleCorpus } from "./organizer";

export type OfficialCitation = {
  rule_id: string;
  text: string;
  effective_date: string | null;
  source_url: string;
  source_locator: string;
  authority: string;
};

export type OfficialRulesAnswer = {
  answer: string;
  citations: OfficialCitation[];
  abstained: boolean;
  abstainReason?: string;
};

const DECISION_RE =
  /\b(am i|are we|eligible|ineligible|approve|deny|approved|denied|qualify|decide for me|acceptance)\b/i;

export function isDecisionRequest(q: string) {
  return DECISION_RE.test(q);
}

function retrieve(question: string, limit = 3): OfficialCitation[] {
  const q = question.toLowerCase();
  const scored = ruleCorpus.map((r) => {
    let score = 0;
    for (const token of `${r.rule_id} ${r.text} ${r.source_locator}`.toLowerCase().split(/\W+/)) {
      if (token.length > 3 && q.includes(token)) score += 1;
    }
    if (q.includes("income") && r.rule_id.includes("MTSP")) score += 5;
    if (q.includes("60") && r.rule_id.includes("002")) score += 4;
    if (q.includes("50") && r.rule_id.includes("003")) score += 4;
    if (q.includes("eligib") && r.rule_id.includes("DECISION")) score += 6;
    if (q.includes("document") && r.rule_id.includes("READINESS")) score += 4;
    if (q.includes("untrusted") || q.includes("injection")) {
      if (r.rule_id.includes("SAFETY")) score += 6;
    }
    return { r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = (scored.some((s) => s.score > 0) ? scored.filter((s) => s.score > 0) : scored).slice(
    0,
    limit,
  );
  return top.map(({ r }) => ({
    rule_id: r.rule_id,
    text: r.text,
    effective_date: r.effective_date,
    source_url: r.source_url,
    source_locator: r.source_locator,
    authority: r.authority,
  }));
}

export async function answerOfficialRules(question: string): Promise<OfficialRulesAnswer> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer: "Ask about the frozen RealDoor rules corpus.",
      citations: [],
      abstained: true,
      abstainReason: "Empty question",
    };
  }

  if (isDecisionRequest(trimmed)) {
    const citations = retrieve("eligibility decision human handoff", 2);
    return {
      answer:
        "I cannot say if you are eligible, approved, or denied. I can show the published income limits, your confirmed yearly income estimate, and whether your packet looks ready for a person to review.",
      citations,
      abstained: true,
      abstainReason: "Decisioning request refused (CH-DECISION-001)",
    };
  }

  const citations = retrieve(trimmed);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      answer: citations[0]
        ? `According to [${citations[0].rule_id}] (${citations[0].source_locator}): ${citations[0].text}`
        : "No matching frozen rule found.",
      citations,
      abstained: citations.length === 0,
      abstainReason: citations.length === 0 ? "No corpus match" : undefined,
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const block = citations
      .map(
        (c) =>
          `[${c.rule_id}] ${c.source_locator} (effective ${c.effective_date ?? "n/a"})\n${c.text}\n${c.source_url}`,
      )
      .join("\n\n");

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: `You explain the frozen RealDoor / LIHTC hackathon rules for Boston-Cambridge-Quincy FY2026.
Use ONLY the provided corpus. Cite rule_ids like [HUD-MTSP-002].
Never say eligible/ineligible/approved/denied. Prefer READY_TO_REVIEW / NEEDS_REVIEW language for readiness.`,
        },
        { role: "user", content: `Corpus:\n${block}\n\nQuestion: ${trimmed}` },
      ],
    });

    return { answer: response.output_text.trim(), citations, abstained: false };
  } catch {
    return {
      answer: citations[0]
        ? `According to [${citations[0].rule_id}]: ${citations[0].text}`
        : "Rules lookup failed.",
      citations,
      abstained: citations.length === 0,
    };
  }
}
