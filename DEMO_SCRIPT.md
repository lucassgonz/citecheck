# CiteCheck demo script (~3 minutes)

## Setup

1. `npm run dev` → localhost:3000  
2. Confirm OpenAI key in `.env.local` (optional but preferred)

## Script

1. **Consent + extract** — Profile tab, check consent, select “Pay stub — Maria Santos”, Extract. Point at evidence boxes + confidence.  
2. **Correct a field** — change household size or gross pay, Save / Confirm. Say: “downstream only uses confirmed values.”  
3. **Rules + citation** — Understand tab, ask “How is annual income calculated?” Show `[INC-03]` citation + effective date.  
4. **Refusal** — click “Try refusal prompt” / ask “Am I eligible?” Show abstain — never eligible.  
5. **Math** — Calculate. Show formula, threshold, effective date, “informational only.”  
6. **Packet** — Prepare → Build packet → show missing items → Download JSON. Say “never auto-send.”  
7. **Safety** — Safety tab → Run tests (PASS). Optionally extract adversarial doc and note injection ignored.  
8. **Delete** — Delete session; show cleared state.

## Closing line

“CiteCheck closes paperwork friction without crossing into gatekeeping — receipts on every claim, abstain when unsure, renter in control.”
