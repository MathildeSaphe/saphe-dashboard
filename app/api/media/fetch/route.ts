import { NextResponse } from "next/server";

// Denne endpoint bruges ikke længere.
// Data hentes nu automatisk fra Dropbox-mappen via /api/media (GET).
export async function POST() {
  return NextResponse.json({ ok: true, besked: "Data hentes nu automatisk fra Dropbox." });
}
