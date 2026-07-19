# CiteCheck — Architecture & Risk Note

## What it is

CiteCheck is an assistive RealDoor prototype for **one metro** (Cambridge, MA demo) and **one program/rule year** (LIHTC / MTSP 2026 freeze). It implements Profile → Understand → Prepare.

## Architecture

```
Browser (CiteCheck UI)
  → /api/extract     OpenAI structured extraction (allowlist only)
  → /api/fields      Confirm/correct fields; checklist overrides
  → /api/ask         Corpus retrieval + OpenAI phrasing (cited)
  → /api/calculate   Deterministic MTSP math (no LLM)
  → /api/packet      Renter-controlled readiness packet JSON
  → /api/safety/run  Refusal + injection + deletion suite
  → /api/session     Ephemeral in-memory sessions
```

Data plane: `/data/*.json` (program metadata, MTSP tables, versioned rule corpus, gold checklist, synthetic documents).

## Trust boundaries

1. **No decisioning** — prompts + product copy + refusal tests block eligible/approve/deny language.  
2. **Allowlisted fields only** — unknown keys dropped.  
3. **Human confirmation** — downstream math uses confirmed fields only.  
4. **Untrusted documents** — extraction system prompt ignores embedded instructions; adversarial fixture included.  
5. **Deterministic math** — income annualization and threshold lookup are code, not model output.  
6. **Ephemeral sessions** — delete clears document text and fields; nothing auto-sent to properties.  
7. **No training on uploads** — API calls are inference-only for the hackathon demo.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Model invents eligibility | Refusal layer + UI disclaimer + safety suite |
| Wrong income math | Code calculator with abstain when inputs missing |
| Prompt injection via PDF/text | Untrusted-input prompt + adversarial test fixture |
| Over-retention of PII | In-memory sessions + explicit delete |
| Accessibility gaps | Skip link, labels, focus rings, `aria-live` status |

## Out of scope (intentionally)

Multi-metro coverage, eligibility scoring, landlord portals, Discover ranking, model fine-tuning.
