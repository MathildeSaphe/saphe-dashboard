import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "notes.json");

type Note = {
  id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
};

type NotesDB = { notes: Note[] };

function readDB(): NotesDB {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { notes: [] };
  }
}

function writeDB(db: NotesDB) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// GET – hent alle noter
export async function GET() {
  const db = readDB();
  const sorted = [...db.notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return NextResponse.json(sorted);
}

// POST – opret eller opdater en note
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, title, content, tags } = body as Partial<Note>;

  if (!id) {
    return NextResponse.json({ error: "id mangler" }, { status: 400 });
  }

  const db = readDB();
  const now = new Date().toISOString();
  const existing = db.notes.findIndex((n) => n.id === id);

  if (existing >= 0) {
    db.notes[existing] = {
      ...db.notes[existing],
      title: title ?? db.notes[existing].title,
      content: content ?? db.notes[existing].content,
      tags: tags ?? db.notes[existing].tags,
      updatedAt: now,
    };
  } else {
    db.notes.push({
      id,
      date: id,
      title: title ?? "",
      content: content ?? "",
      tags: tags ?? [],
      updatedAt: now,
    });
  }

  writeDB(db);
  return NextResponse.json({ ok: true });
}

// DELETE – slet en note
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id mangler" }, { status: 400 });
  }

  const db = readDB();
  db.notes = db.notes.filter((n) => n.id !== id);
  writeDB(db);
  return NextResponse.json({ ok: true });
}
