import { NextResponse } from "next/server";
import { answerOfficialRules } from "@/lib/rules";
import { audit, resolveSession, saveSession, type OfficialSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    sessionId?: string;
    session?: OfficialSession | null;
    question?: string;
  };
  if (!body.question?.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  const result = await answerOfficialRules(body.question);
  let session = null as OfficialSession | null;
  if (body.sessionId || body.session?.id) {
    session = resolveSession(body);
    if (session) {
      audit(session, result.abstained ? "rules_abstain" : "rules_answer", body.question.slice(0, 120));
      saveSession(session);
    }
  }
  return NextResponse.json({ ...result, sessionId: session?.id, session });
}
