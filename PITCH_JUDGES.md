# CiteCheck — Judge-aligned pitch (record soon)

Judges care about **three** things only:

1. **Creativity** — sharp, original idea  
2. **Technical depth** — meaningful code  
3. **Presentation** — clear and convincing  

Frame everything as: **real problem → measurable impact → looks good.**

---

## How CiteCheck hits each criterion

| Criterion | Your proof (say + show) |
|-----------|-------------------------|
| **Creativity** | Not another eligibility bot. Renter-side **readiness**: guided checklist, plain language, human decides. Original angle for RealDoor. |
| **Technical depth** | Official pack + OpenAI extraction + **deterministic** MTSP math in code + page/bbox citations + refusal / injection / delete safety. |
| **Presentation** | 3-step flow anyone gets in under a minute: documents → what you need → packet. Clean UI, clear CTA. |

### Measurable impact (use these numbers)
- Affordable housing apps delayed by missing / wrong paperwork (weeks of friction).  
- Demo proof: Mara North yearly income **$56,316** vs frozen 60% limit **$72,000** in seconds.  
- Output: **Ready for review** or **Needs work** with human-readable next steps (not a black-box “approved”).

---

## Demo Video (max 60s) — Creativity + Presentation

| Beat | SAY (English) | SHOW |
|------|---------------|------|
| 1 | “Affordable housing applications stall on paperwork, not on people. CiteCheck helps renters get ready for review. We never decide who qualifies.” | Hero: CiteCheck title + subtitle. |
| 2 | “Our idea is simple and sharp: guide the renter, don’t quiz them. Load official sample docs, read a pay stub, pull out the facts.” | Consent → Mara North → Load sample files → Read this PDF. |
| 3 | “You confirm or fix each value. What you save is what the packet uses.” | Mark all as looks right → Save these facts. |
| 4 | “Instead of forcing people to invent questions, we show what’s done and what’s still missing.” | Tab **What you need** + checklist. |
| 5 | “Then we build a clear packet: yearly income versus the published limit, plus next steps. Measurable, human-readable impact.” | **Build my packet** + dollars on screen. |
| 6 | “CiteCheck: extract, guide, prepare. Look good, stay honest. A person decides.” | Freeze on packet + footer. |

**Continuous Demo script (~58s)**  
“Affordable housing applications stall on paperwork, not on people. CiteCheck helps renters get ready for review. We never decide who qualifies. The idea is sharp: guide the renter, don’t quiz them. We load official sample documents, read a pay stub, and extract the facts. You confirm or fix each value. Then we show a checklist of what’s done and what’s still missing. Finally we build a packet with a yearly income estimate versus the published limit, and clear next steps. Extract, guide, prepare. A person decides.”

---

## Tech Video (max 60s) — Technical depth (+ a touch of creativity)

| Beat | SAY (English) | SHOW |
|------|---------------|------|
| 1 | “Under the hood, CiteCheck is real product engineering on the official RealDoor pack, not a thin chat wrapper.” | Folder `data/organizer/realdoor-hackathon-starter-pack/`. |
| 2 | “Frozen FY2026 MTSP limits, a cited rule corpus, and twenty-four synthetic PDFs with gold fields and source boxes.” | `mtsp_2026_...csv` or `rule_corpus.jsonl`. |
| 3 | “Next.js and TypeScript App Router APIs. OpenAI extracts only allowlisted fields from PDF text.” | `src/app/api/`. |
| 4 | “The meaningful depth: income annualization and the sixty percent MTSP compare are deterministic code, matching the organizer calculator, not LLM math.” | `src/lib/calculate.ts` → then packet dollars. |
| 5 | “Safety is implemented, not promised: eligibility refusal, prompt-injection resistance, and session deletion. Outputs are Ready for review or Needs review, never eligible or denied.” | Refusal button **or** Safety Pass list. |
| 6 | “Every field can cite page and bounding box evidence. Stack: Next.js, TypeScript, OpenAI, official RealDoor data. Human in the loop by design.” | Field evidence line → freeze. |

**Continuous Tech script (~58s)**  
“Under the hood, CiteCheck is real product engineering on the official RealDoor pack, not a thin chat wrapper. We use frozen FY2026 MTSP limits, a cited rule corpus, and synthetic PDFs with gold fields and source boxes. The stack is Next.js and TypeScript. App Router APIs call OpenAI only for allowlisted extraction. The meaningful depth is deterministic income annualization and the sixty percent MTSP comparison in code, not in the model. Safety is implemented: eligibility refusal, prompt-injection resistance, and session deletion. Every field can cite page and bounding-box evidence. Next.js, OpenAI, official RealDoor data, human in the loop.”

---

## One sentence per criterion (memorize)

- **Creativity:** “We built a readiness guide, not an eligibility oracle.”  
- **Technical depth:** “LLM for extraction; code for money math and safety.”  
- **Presentation:** “Three steps, plain language, numbers you can see.”  

---

## Recording checklist
- [ ] Demo ≤ 60s, browser only, Mara North  
- [ ] Tech ≤ 60s, Cursor + browser  
- [ ] Say “never decide / never eligible” once in Demo  
- [ ] Show deterministic math + safety once in Tech  
- [ ] Show checklist (Creativity/Presentation) and packet dollars (Impact)  
