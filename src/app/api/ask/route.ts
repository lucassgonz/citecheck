import { NextResponse } from "next/server";
import { answerOfficialRules } from "@/lib/rules";
import { audit, getSession, saveSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json()) as { sessionId?: string; question?: string };
  if (!body.question?.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  const result = await answerOfficialRules(body.question);
  if (body.sessionId) {
    const session = getSession(body.sessionId);
    if (session) {
      audit(session, result.abstained ? "rules_abstain" : "rules_answer", body.question.slice(0, 120));
      saveSession(session);
    }
  }
  return NextResponse.json(result);
}
