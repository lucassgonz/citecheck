# CiteCheck recording scripts (Hack-Nation)

Two videos, **max 60 seconds each**. Speak clearly. Show the live app at http://localhost:3000.

Record in **English** (judges / global hackathon).

Before recording:
1. Hard refresh the app
2. Clear session if needed
3. Start on step **1. Your documents**
4. Use household **Mara North**
5. Do one dry run without recording

---

## 1) Demo Video (max 60 sec) — UI/UX + product flow

**Goal:** A renter gets paperwork ready. Simple. Guided. Human decides.

### Shot list (about 55–58 sec)

| Time | What to show | What to say (approx.) |
|------|----------------|------------------------|
| 0–5s | Hero: CiteCheck title | “CiteCheck helps renters get affordable-housing paperwork ready. We don’t decide eligibility. A person does.” |
| 5–18s | Documents: consent → Load sample files → Pay stub → Read this PDF | “First, we load sample documents from the official RealDoor pack, then read a pay stub PDF and pull out the key facts.” |
| 18–30s | Fields list + Looks right + Save these facts | “You check each fact. Fix anything wrong. Save. Your confirmed numbers are what the packet uses.” |
| 30–42s | What you need: checklist + What to do next | “Next, we don’t ask you to invent questions. We show a checklist of what’s done and what’s still missing.” |
| 42–55s | Your packet: Build my packet → Ready / Needs work + income vs limit | “Finally, we build a review packet: yearly income estimate versus the published limit, plus clear next steps. Assistive only.” |
| 55–60s | Footer / freeze on packet result | “CiteCheck: extract, guide, prepare. Human decides.” |

### Demo tips
- Click slowly. Pause 0.5s after each major action.
- Prefer **one** pay stub → Mark all as looks right → Save → What you need → Packet.
- If packet says “Needs a little more work,” that’s fine: say “It flags missing items in plain language.”
- Do **not** open Judge/safety tools in the demo video (save for tech or skip).

### Optional B-roll (only if you have spare seconds)
- Open PDF in new tab for 2 seconds
- Hover checklist “Still needed”

---

## 2) Tech Video (max 60 sec) — stack, architecture, implementation

**Goal:** Show it’s real engineering on the official pack, not a thin UI.

### Shot list (about 55–58 sec)

| Time | What to show | What to say (approx.) |
|------|----------------|------------------------|
| 0–8s | Repo tree or README + `data/organizer/...` | “CiteCheck is a Next.js TypeScript app wired to the official RealDoor starter pack: MTSP 2026 limits, frozen rule corpus, and 24 synthetic PDFs.” |
| 8–20s | Architecture sketch (see below) or API folder | “Architecture: browser UI talks to App Router APIs. OpenAI extracts allowlisted fields from PDFs. Income math is deterministic code, not the model.” |
| 20–32s | `src/lib/calculate.ts` + packet result numbers | “We annualize pay with the organizer formula, compare to the frozen 60% MTSP threshold, and return Ready for review or Needs review, never eligible or denied.” |
| 32–45s | Ask refusal OR Safety checks Pass | “Safety is productized: document text is untrusted, eligibility questions abstain, and we run refusal, prompt-injection, and session-deletion checks.” |
| 45–55s | Evidence line “Found in PDF: page / bbox” | “Every extracted field can cite page-level source boxes from the gold pack for traceability.” |
| 55–60s | Freeze on stack list | “Stack: Next.js, TypeScript, OpenAI, official RealDoor data. Human in the loop by design.” |

### Architecture one-liner (say this once)
“Profile docs → confirmed fields → guidance checklist → packet with deterministic MTSP compare and citations.”

### What to open on screen
1. `src/app/api/` (routes)
2. `src/lib/calculate.ts` + `src/lib/income.ts`
3. `data/organizer/realdoor-hackathon-starter-pack/`
4. Live app: eligibility refusal or Safety Pass

---

## Spoken scripts (full, if you prefer reading)

### Demo (≈58s)
“CiteCheck helps renters get affordable-housing paperwork ready. We don’t decide eligibility. A person does.  
First we load official sample documents, read a pay stub PDF, and extract the key facts.  
You confirm or correct each value, then save.  
Then we show a plain-language checklist: what’s done and what’s still missing, so you don’t have to invent questions.  
Finally we build a review packet with a yearly income estimate versus the published limit, and clear next steps.  
Extract, guide, prepare. Human decides.”

### Tech (≈58s)
“CiteCheck is built with Next.js and TypeScript on the official RealDoor starter pack.  
The UI calls App Router APIs. OpenAI extracts allowlisted fields from synthetic PDFs.  
Income annualization and the 60% MTSP comparison run in deterministic code, matching the organizer calculator.  
Outputs are Ready for review or Needs review, never an eligibility decision.  
We treat document text as untrusted, refuse decide-for-me prompts, and include injection and session-deletion checks.  
Fields can cite page and bounding-box evidence from the gold pack.  
Next.js, OpenAI, frozen HUD rules, human in the loop.”

---

## Pitch slide (if you also speak live later)

1. Problem: paperwork friction delays affordable housing  
2. Product: renter-side readiness, not decisioning  
3. Demo moment: checklist + packet  
4. Trust: citations, abstain, official pack  
5. Ask: (whatever the hackathon asks: finalist slot / feedback)

---

## Checklist before submit
- [ ] Demo ≤ 60s  
- [ ] Tech ≤ 60s  
- [ ] Audio clear, no music required  
- [ ] No real PII (use pack samples only)  
- [ ] Show refusal or “Help only. Never decides if you qualify.” at least once in demo or tech  
