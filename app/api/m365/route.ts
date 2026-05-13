import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "m365.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ sidstOpdateret: null, møder: [], mails: [] });
  }
}
