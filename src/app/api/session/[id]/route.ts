import { NextResponse } from "next/server";
import { deleteSession, getSession, resolveSession, type OfficialSession } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const snapshot = url.searchParams.get("session");
  let session = getSession(id);
  if (!session && snapshot) {
    try {
      session = resolveSession({ session: JSON.parse(snapshot) as OfficialSession });
    } catch {
      session = null;
    }
  }
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as { session?: OfficialSession | null };
    if (body.session?.id) resolveSession(body);
  } catch {
    // no body is fine
  }
  const ok = deleteSession(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
