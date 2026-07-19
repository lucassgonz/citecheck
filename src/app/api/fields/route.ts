import { NextResponse } from "next/server";
import { audit, resolveSession, saveSession, type OfficialSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    sessionId?: string;
    session?: OfficialSession | null;
    documentId?: string;
    updates?: Array<{ field: string; value: string | number | null; confirmed?: boolean }>;
  };

  if ((!body.sessionId && !body.session?.id) || !body.documentId) {
    return NextResponse.json({ error: "sessionId and documentId required" }, { status: 400 });
  }

  const session = resolveSession(body);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const doc = session.documents.find((d) => d.documentId === body.documentId);
  if (!doc) return NextResponse.json({ error: "Document not in session" }, { status: 404 });

  for (const u of body.updates ?? []) {
    const field = doc.fields.find((f) => f.field === u.field);
    if (!field) continue;
    const prev = field.value;
    let next = u.value;
    if (
      typeof next === "string" &&
      ["gross_pay", "household_size", "hourly_rate", "monthly_benefit", "regular_hours", "weekly_hours", "net_pay"].includes(
        u.field,
      )
    ) {
      const n = Number(String(next).replace(/[$,]/g, ""));
      next = Number.isFinite(n) ? n : null;
    }
    field.value = next;
    if (u.confirmed != null) field.confirmed = u.confirmed;
    if (prev !== next) field.corrected = true;
  }

  audit(session, "fields_updated", `Updated ${body.documentId}`);
  saveSession(session);
  return NextResponse.json({ document: doc, sessionId: session.id, session });
}
