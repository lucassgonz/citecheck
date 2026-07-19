import { randomUUID } from "crypto";
import type { ExtractedOfficialField } from "./extract";

export type SessionDocState = {
  documentId: string;
  householdId: string;
  documentType: string;
  fileName: string;
  pdfUrl: string;
  fields: ExtractedOfficialField[];
  containsAdversarialText?: boolean;
};

export type OfficialSession = {
  id: string;
  createdAt: string;
  consentAt: string | null;
  householdId: string | null;
  documents: SessionDocState[];
  activeDocumentId: string | null;
  deleted: boolean;
  audit: Array<{ at: string; action: string; detail: string }>;
};

const g = globalThis as unknown as { __citecheckOfficial?: Map<string, OfficialSession> };

function store() {
  if (!g.__citecheckOfficial) g.__citecheckOfficial = new Map();
  return g.__citecheckOfficial;
}

export function createSession(): OfficialSession {
  const session: OfficialSession = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    consentAt: null,
    householdId: null,
    documents: [],
    activeDocumentId: null,
    deleted: false,
    audit: [
      {
        at: new Date().toISOString(),
        action: "session_created",
        detail: "Ephemeral RealDoor session (official starter pack).",
      },
    ],
  };
  store().set(session.id, session);
  return session;
}

export function getSession(id: string) {
  const s = store().get(id);
  if (!s || s.deleted) return null;
  return s;
}

export function saveSession(s: OfficialSession) {
  store().set(s.id, s);
  return s;
}

/** Prefer client snapshot so sessions survive serverless cold starts (e.g. Vercel). */
export function resolveSession(input: {
  sessionId?: string;
  session?: OfficialSession | null;
}): OfficialSession | null {
  if (input.session?.id && !input.session.deleted) {
    saveSession(input.session);
    return input.session;
  }
  if (input.sessionId) return getSession(input.sessionId);
  return null;
}

export function deleteSession(id: string) {
  const s = store().get(id);
  if (!s) return false;
  store().delete(id);
  return true;
}

export function audit(s: OfficialSession, action: string, detail: string) {
  s.audit.push({ at: new Date().toISOString(), action, detail });
}
