import { NextResponse } from "next/server";

const MONDAY_API = "https://api.monday.com/v2";
const API_KEY = process.env.MONDAY_API_KEY!;

// Mathildes Monday bruger-ID
const MATHILDE_USER_ID = 98590884;

// Alle relevante marketing-boards
const BOARD_IDS = [
  5090416591, // Diverse projekter
  5090440977, // Organisk indhold (årshjul)
  5090447497, // Paid kampagner
  5090646625, // Website / købsflow
  5090646530, // Performance Marketing
  5090691613, // Tyskland GTM
];

async function mondayQuery(query: string) {
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function GET() {
  try {
    const opgaver: {
      id: string;
      navn: string;
      board: string;
      status: string;
      deadline: string | null;
      prioritet: string | null;
      minOpgave: boolean;
      url: string;
    }[] = [];

    // Hent hvert board separat for at undgå kompleksitetsgrænser
    for (const boardId of BOARD_IDS) {
      const query = `{
        boards(ids: [${boardId}]) {
          id
          name
          items_page(limit: 100) {
            items {
              id
              name
              url
              column_values {
                id
                text
              }
            }
          }
        }
      }`;

      const json = await mondayQuery(query);
      const board = json?.data?.boards?.[0];
      if (!board) continue;

      for (const item of board.items_page?.items ?? []) {
        const col = (id: string): string | null =>
          item.column_values.find((c: { id: string; text: string }) => c.id === id)?.text ?? null;

        // Find alle person-kolonner og tjek om Mathildes ID er nævnt via tekst
        const personText = item.column_values
          .filter((c: { id: string; text: string | null }) =>
            c.text && (c.id === "person" || c.id.startsWith("multiple_person") || c.id.startsWith("people"))
          )
          .map((c: { text: string }) => c.text)
          .join(" ");

        if (!personText.toLowerCase().includes("mathilde")) continue;

        // Status — kolonnen hedder forskelligt på tværs af boards
        const status = col("color_mkzs68s5") || col("status") || "Ukendt";
        if (status === "Done") continue;

        const deadline =
          col("date_mkzszpd2") || col("date_mkzz49zd") || col("date4") || null;
        const prioritet =
          col("color_mm006ck0") || col("color_mkzyd4nw") || null;

        opgaver.push({
          id: item.id,
          navn: item.name,
          board: board.name,
          status,
          deadline,
          prioritet,
          minOpgave: true,
          url: item.url,
        });
      }
    }

    // Sorter efter deadline (tidligst først, ingen deadline sidst)
    opgaver.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });

    return NextResponse.json({
      sidstOpdateret: new Date().toISOString(),
      opgaver,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fejl ved hentning fra Monday" },
      { status: 500 }
    );
  }
}
