import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const noteId = formData.get("noteId") as string | null;

  if (!file || !noteId) {
    return NextResponse.json({ error: "Fil eller noteId mangler" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Kun PDF-filer er tilladt" }, { status: 400 });
  }

  // Gem filen i data/uploads/[noteId]/
  const noteUploadsDir = path.join(UPLOADS_DIR, noteId);
  fs.mkdirSync(noteUploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9æøåÆØÅ._-]/g, "_");
  const filePath = path.join(noteUploadsDir, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return NextResponse.json({ filename: safeName });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");

  if (!noteId) {
    return NextResponse.json([]);
  }

  const noteUploadsDir = path.join(UPLOADS_DIR, noteId);
  if (!fs.existsSync(noteUploadsDir)) {
    return NextResponse.json([]);
  }

  const files = fs.readdirSync(noteUploadsDir).filter((f) => f.endsWith(".pdf"));
  return NextResponse.json(files);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("noteId");
  const filename = searchParams.get("filename");

  if (!noteId || !filename) {
    return NextResponse.json({ error: "Mangler parametre" }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, noteId, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return NextResponse.json({ ok: true });
}
