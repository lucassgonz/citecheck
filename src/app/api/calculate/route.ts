import { NextResponse } from "next/server";
import { buildOfficialPacket } from "@/lib/packet";
import { resolveSession, type OfficialSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json()) as { sessionId?: string; session?: OfficialSession | null };
  if (!body.sessionId && !body.session?.id) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const session = resolveSession(body);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const packet = buildOfficialPacket(session);
  return NextResponse.json({
    packet,
    sessionId: session.id,
    session,
    calc: "calc" in packet ? packet.calc : null,
  });
}
