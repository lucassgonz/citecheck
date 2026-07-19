import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";

const DOCS = path.join(
  process.cwd(),
  "data/organizer/realdoor-hackathon-starter-pack/synthetic_documents/documents",
);

/** Best-effort text extract from organizer PDFs (for OpenAI path). */
export function extractPdfText(fileName: string): string {
  const pdfPath = path.join(DOCS, fileName);
  try {
    const out = execFileSync(
      "python3",
      [
        "-c",
        "from pypdf import PdfReader; import sys; r=PdfReader(sys.argv[1]); print('\\n'.join((p.extract_text() or '') for p in r.pages))",
        pdfPath,
      ],
      { encoding: "utf8", timeout: 10000 },
    );
    if (out.trim()) return out;
  } catch {
    // fall through
  }

  try {
    const buf = readFileSync(pdfPath);
    const asString = buf.toString("latin1");
    const matches = [...asString.matchAll(/\(([^)]{2,80})\)\s*Tj/g)].map((m) => m[1]);
    return matches.join("\n");
  } catch {
    return "";
  }
}
