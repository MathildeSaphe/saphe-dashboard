import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");
  const filename = searchParams.get("filename");

  if (!noteId || !filename) {
    return new NextResponse("Mangler parametre", { status: 400 });
  }

  const safeName = filename.replace(/\.\./g, "");
  const filePath = path.join(UPLOADS_DIR, noteId, safeName);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Fil ikke fundet", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
    },
  });
}
