import { NextResponse } from "next/server";
import { buildOfficialPacket } from "@/lib/packet";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const session = getSession(body.sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const packet = buildOfficialPacket(session);
  return NextResponse.json({ packet, downloadable: true, autoSend: false });
}
