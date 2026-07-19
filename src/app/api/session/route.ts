import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

export async function POST() {
  const session = createSession();
  return NextResponse.json({ sessionId: session.id, createdAt: session.createdAt, session });
}
