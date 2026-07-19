# CiteCheck (RealDoor)

Renter-side **application-readiness copilot** for the RealPage RealDoor challenge, wired to the **official starter pack**.

**AI extracts, explains, prepares. The renter confirms. A human decides.**  
Outputs `READY_TO_REVIEW` / `NEEDS_REVIEW` only — never eligibility.

## Official pack location

`data/organizer/realdoor-hackathon-starter-pack/`  
PDFs served from `public/docs/`.

Includes: FY2026 MTSP Boston-Cambridge-Quincy, rule corpus, 24 synthetic PDFs, gold fields + bbox, checklists, adversarial fixtures.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Ensure `.env` has `OPENAI_API_KEY`.

## Demo path

1. Consent → load **HH-001** → extract pay stub → show page/bbox evidence  
2. Confirm fields → Save  
3. Ask MTSP 60% question → citation `[HUD-MTSP-002]`  
4. Build packet → annualized income vs frozen 60% threshold → `READY_TO_REVIEW`  
5. Try adversarial doc / “Am I eligible?” → refuse  
6. Safety suite + delete session  

Verified against gold: HH-001 annualized **$56,316** vs threshold **$72,000** → `READY_TO_REVIEW`.

## Docs

- `DEMO_SCRIPT.md`
- `ARCHITECTURE_AND_RISK.md`
- Organizer guide: `data/organizer/.../participant-guide/RealDoor_Starter_Pack_Guide.pdf`
