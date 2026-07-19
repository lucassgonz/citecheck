import { NextResponse } from "next/server";
import {
  docsForHousehold,
  getGoldDoc,
  listHouseholds,
  programOfficial,
} from "@/lib/organizer";
import { extractOfficialDocument } from "@/lib/extract";
import { extractPdfText } from "@/lib/pdfText";
import { audit, getSession, saveSession } from "@/lib/session";

export async function GET() {
  return NextResponse.json({
    households: listHouseholds(),
    program: programOfficial,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    sessionId?: string;
    householdId?: string;
    documentId?: string;
    consent?: boolean;
    confirmAll?: boolean;
  };

  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const session = getSession(body.sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (body.consent) {
    session.consentAt = new Date().toISOString();
    audit(session, "consent", "Renter consented to allowlisted extraction for this session.");
  }
  if (!session.consentAt) {
    return NextResponse.json({ error: "Consent required" }, { status: 400 });
  }

  if (body.householdId) {
    session.householdId = body.householdId;
    session.documents = [];
    session.activeDocumentId = null;
    audit(session, "household_selected", `Selected ${body.householdId}`);
    saveSession(session);
    return NextResponse.json({
      sessionId: session.id,
      householdId: body.householdId,
      documents: docsForHousehold(body.householdId).map((d) => ({
        document_id: d.document_id,
        document_type: d.document_type,
        file_name: d.file_name,
        pdfUrl: `/docs/${d.file_name}`,
        contains_adversarial_text: d.contains_adversarial_text,
        rasterized: d.rasterized,
      })),
    });
  }

  if (!body.documentId) {
    return NextResponse.json({ error: "documentId or householdId required" }, { status: 400 });
  }

  const gold = getGoldDoc(body.documentId);
  if (!gold) return NextResponse.json({ error: "Unknown document" }, { status: 404 });

  session.householdId = gold.household_id;
  const pdfText = extractPdfText(gold.file_name);
  const extracted = await extractOfficialDocument(body.documentId, pdfText);

  let fields = extracted.fields;
  if (body.confirmAll) {
    fields = fields.map((f) => ({ ...f, confirmed: f.value != null }));
  }

  const existingIdx = session.documents.findIndex((d) => d.documentId === body.documentId);
  const docState = {
    documentId: gold.document_id,
    householdId: gold.household_id,
    documentType: gold.document_type,
    fileName: gold.file_name,
    pdfUrl: `/docs/${gold.file_name}`,
    fields,
    containsAdversarialText: gold.contains_adversarial_text,
  };

  if (existingIdx >= 0) session.documents[existingIdx] = docState;
  else session.documents.push(docState);
  session.activeDocumentId = gold.document_id;

  audit(
    session,
    "extract",
    `Extracted ${gold.document_id} (usedGold=${extracted.usedGold}, ignoredAdversarial=${extracted.ignoredAdversarial})`,
  );
  saveSession(session);

  return NextResponse.json({
    document: {
      id: gold.document_id,
      type: gold.document_type,
      fileName: gold.file_name,
      pdfUrl: `/docs/${gold.file_name}`,
      containsAdversarialText: gold.contains_adversarial_text,
    },
    fields,
    usedGold: extracted.usedGold,
    ignoredAdversarial: extracted.ignoredAdversarial,
    notice:
      "Confirm each field before reuse. Evidence includes page + PDF bbox from the official gold pack when available.",
  });
}
