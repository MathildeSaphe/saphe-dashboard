import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// I produktion (Vercel) læses fra data/media/ i projektet.
// I udvikling kan man stadig pege på Dropbox via env var.
const DROPBOX_DIR =
  process.env.DROPBOX_MEDIA_DIR ??
  path.join(process.cwd(), "data", "media");

/* ─── Typer ──────────────────────────────────────────────────────── */

type Kategori = "saphe" | "konkurrent" | "branche" | "politik";
type Sentiment = "positiv" | "neutral" | "negativ";
type Prioritet = "høj" | "mellem" | "lav";

export type Omtale = {
  id: string;
  titel: string;
  medie: string;
  url: string;
  dato: string;
  kategori: Kategori;
  sentiment: Sentiment;
  resumé: string;
  relevans: string;
  kritisk: boolean;
  prioritet: Prioritet;
};

export type FacebookOpslag = {
  id: string;
  vinkel: "nyhed" | "spørgsmål" | "indsigt";
  vinkelLabel: string;
  tekst: string;
  kildeArtikel: string;
};

export type MediaData = {
  sidstOpdateret: string | null;
  filDato: string | null;
  dagensVigtigste: string;
  signaler: string[];
  anbefalinger: string[];
  omtaler: Omtale[];
  facebookOpslag: FacebookOpslag[];
};

/* ─── Klassifikation ─────────────────────────────────────────────── */

const SAPHE_ORD   = ["saphe"];
const KONK_ORD    = ["ooono", "waze", "coyote", "google maps", "inforad", "drive one", "garmin", "tomtom"];
const POLITIK_ORD = ["færdselsloven", "politiet", "minister", "lovforslag", "hastighedsgrænse", "straf", "bøde", "datatilsynet"];

function getKategori(tekst: string): Kategori {
  const t = tekst.toLowerCase();
  if (SAPHE_ORD.some(o => t.includes(o)))   return "saphe";
  if (KONK_ORD.some(o => t.includes(o)))    return "konkurrent";
  if (POLITIK_ORD.some(o => t.includes(o))) return "politik";
  return "branche";
}

const POSITIV_ORD = ["vækst","rekord","stiger","succes","vinder","anbefaler","populær","stærk","bedre","topkarakter","lancerer","ny funktion"];
const NEGATIV_ORD = ["kritik","problem","fejl","klager","fald","svagt","dårlig","advarsel","tab","nedgang","bekymring","stiger markant"];
const KRITISK_ORD = ["tilbagekald","skandale","retssag","farlig","dødssag","erstatning","konkurs","datatilsynet","svindel","hacking"];

function getSentiment(tekst: string): Sentiment {
  const t = tekst.toLowerCase();
  const neg = NEGATIV_ORD.filter(o => t.includes(o)).length;
  const pos = POSITIV_ORD.filter(o => t.includes(o)).length;
  if (neg > pos) return "negativ";
  if (pos > neg) return "positiv";
  return "neutral";
}

function isKritisk(tekst: string): boolean {
  const t = tekst.toLowerCase();
  return KRITISK_ORD.some(o => t.includes(o));
}

function extractMedie(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const known: Record<string, string> = {
      "berlingske.dk": "Berlingske", "politiken.dk": "Politiken",
      "jyllands-posten.dk": "Jyllands-Posten", "bt.dk": "BT",
      "ekstrabladet.dk": "Ekstra Bladet", "tv2.dk": "TV 2", "dr.dk": "DR",
      "borsen.dk": "Børsen", "business.dk": "Børsen",
      "version2.dk": "Version2", "computerworld.dk": "ComputerWorld",
      "fdm.dk": "FDM", "bilstatistik.dk": "Bilstatistik.dk",
      "vejdirektoratet.dk": "Vejdirektoratet",
      "motormagasinet.dk": "Motor Magasinet", "autoit.dk": "AutoIT",
    };
    return known[host] ?? host;
  } catch {
    return "Ukendt medie";
  }
}

function parsePrioritet(tekst: string): Prioritet {
  const match = tekst.match(/prioritet:\s*(høj|mellem|lav)/i);
  if (!match) return "lav";
  const v = match[1].toLowerCase();
  if (v === "høj") return "høj";
  if (v === "mellem") return "mellem";
  return "lav";
}

/* Udtræk Relevans-teksten fra et artikelblok */
function parseRelevans(indhold: string): string {
  const m = indhold.match(/Relevans:\s*([\s\S]*?)(?=\nPrioritet:|\nKilde|\n###|\s*$)/i);
  if (!m) return "";
  return m[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

/* Udtræk alle (url, tekst)-par fra Markdown-links: [tekst](url) */
function extractLinks(tekst: string): { url: string; label: string }[] {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const links: { url: string; label: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(tekst)) !== null) {
    links.push({ label: m[1], url: m[2] });
  }
  return links;
}

function extractBullets(tekst: string): string[] {
  return tekst
    .split("\n")
    .filter(l => l.trim().startsWith("- "))
    .map(l => l.replace(/^[\s-]+/, "").trim())
    .filter(Boolean);
}

/* ─── Facebook-opslags-generator ─────────────────────────────────── */

// Emojis koblet til nøgleord i titel/relevans
const EMOJIS: [RegExp, string][] = [
  [/elbil|elektrisk|ev\b/i,           "⚡🚗"],
  [/varebil|erhverv|fleet|b2b/i,      "🚐💼"],
  [/trafik|vej|e45|kø/i,              "🛣️"],
  [/brændstof|benzin|diesel|pris/i,   "⛽"],
  [/sikkerhed|ulykke|fart/i,          "🛡️"],
  [/rekord|vækst|stiger/i,            "📈"],
  [/lov|regler|politik/i,             "⚖️"],
];

function vælgEmoji(tekst: string): string {
  for (const [re, emoji] of EMOJIS) {
    if (re.test(tekst)) return emoji;
  }
  return "🚗";
}

const HASHTAGS: [RegExp, string[]][] = [
  [/elbil|elektrisk/i,           ["#Elbil", "#Fremtidensbil", "#ElectricCar"]],
  [/varebil|fleet|erhverv/i,     ["#Varebiler", "#B2B", "#Fleet"]],
  [/trafik|vej|e45/i,            ["#Trafik", "#Vejarbejde", "#Pendler"]],
  [/brændstof|benzin|diesel/i,   ["#Brændstof", "#Biløkonomi"]],
  [/sikkerhed/i,                 ["#Trafiksikkerhed", "#Sikkerhed"]],
];

function vælgHashtags(tekst: string): string {
  for (const [re, tags] of HASHTAGS) {
    if (re.test(tekst)) return [...tags, "#Saphe", "#Trafikalarm"].join(" ");
  }
  return "#Saphe #Trafik #Trafikalarm";
}

// Sætninger der kobler nyheden til Saphe
const SAPHE_BROER = [
  "Det er præcis den verden, Saphe er bygget til – en smartere og mere tryg køreoplevelse.",
  "Hos Saphe følger vi nøje med i udviklingen, så din køreoplevelse altid er et skridt foran.",
  "Det minder os om, hvorfor vi gør det vi gør – gøre hverdagen bag rattet mere tryg og smart.",
  "Saphe holder dig opdateret i realtid, uanset hvad der sker på vejene.",
  "Netop derfor er Saphe med dig bag rattet – altid opdateret, altid relevant.",
];

function vælgBro(index: number): string {
  return SAPHE_BROER[index % SAPHE_BROER.length];
}

type ArtikelbasisData = {
  titel: string;
  resumé: string;
  relevans: string;
  url: string;
  prioritet: Prioritet;
};

function genererFacebookOpslag(artikler: ArtikelbasisData[]): FacebookOpslag[] {
  // Tag de 3 vigtigste artikler (høj prioritet først, derefter rækkefølge)
  const top = [...artikler]
    .sort((a, b) => {
      const order = { høj: 0, mellem: 1, lav: 2 };
      return order[a.prioritet] - order[b.prioritet];
    })
    .slice(0, 3);

  if (top.length === 0) return [];

  const opslag: FacebookOpslag[] = [];

  // ── Opslag 1: Nyhedskrog (fakta + kontekst) ─────────────────────
  if (top[0]) {
    const a = top[0];
    const emoji = vælgEmoji(a.titel + a.relevans);
    const tags = vælgHashtags(a.titel + a.relevans);
    const bro = vælgBro(0);
    const tekst =
`${emoji} ${a.titel}

${a.resumé.slice(0, 180).trim()}…

${bro}

👉 Læs mere: ${a.url}

${tags}`;

    opslag.push({
      id: "fb-1",
      vinkel: "nyhed",
      vinkelLabel: "📰 Nyhedskrog",
      tekst,
      kildeArtikel: a.titel,
    });
  }

  // ── Opslag 2: Spørgsmål (engagement-drevet) ──────────────────────
  if (top[1] ?? top[0]) {
    const a = top[1] ?? top[0];
    const emoji = vælgEmoji(a.titel + a.relevans);
    const tags = vælgHashtags(a.titel + a.relevans);
    const bro = vælgBro(1);
    // Byg et spørgsmål ud fra relevansen
    const rel = a.relevans.slice(0, 160).trim();
    const tekst =
`${emoji} Har du lagt mærke til det?

${a.titel} – og det har konsekvenser for os alle bag rattet.

${rel}…

${bro}

Hvad tænker du? Skriv gerne en kommentar 👇

👉 ${a.url}

${tags}`;

    opslag.push({
      id: "fb-2",
      vinkel: "spørgsmål",
      vinkelLabel: "💬 Engagementsspørgsmål",
      tekst,
      kildeArtikel: a.titel,
    });
  }

  // ── Opslag 3: Indsigt (Saphes perspektiv) ───────────────────────
  if (top[2] ?? top[0]) {
    const a = top[2] ?? top[0];
    const emoji = vælgEmoji(a.titel + a.relevans);
    const tags = vælgHashtags(a.titel + a.relevans);
    const bro = vælgBro(2);
    const rel = a.relevans.slice(0, 200).trim();
    const tekst =
`${emoji} Vores take på ugens nyheder

${a.titel}

${rel}

${bro}

Følg med i trafikken – og i alt det der former den 🛡️

${tags}`;

    opslag.push({
      id: "fb-3",
      vinkel: "indsigt",
      vinkelLabel: "💡 Saphes perspektiv",
      tekst,
      kildeArtikel: a.titel,
    });
  }

  return opslag;
}

/* ─── Markdown-parser ────────────────────────────────────────────── */

function parseMarkdown(md: string, dato: string): Omtale[] {
  const omtaler: Omtale[] = [];

  const historierMatch = md.match(/##\s+Historier[^\n]*\n([\s\S]*?)(?=\n##\s|\s*$)/i);
  if (!historierMatch) return [];

  const historierBlok = historierMatch[1];
  const artikler = historierBlok.split(/(?=###\s)/);

  for (const blok of artikler) {
    const linjer = blok.trim().split("\n");
    if (!linjer.length || !linjer[0].startsWith("###")) continue;

    const titel    = linjer[0].replace(/^###\s+/, "").trim();
    const indhold  = linjer.slice(1).join("\n").trim();
    const links    = extractLinks(indhold);
    if (links.length === 0) continue;

    const prioritet = parsePrioritet(indhold);
    const relevans  = parseRelevans(indhold);
    const allText   = `${titel} ${indhold}`;
    const hoved     = links[0];
    const ekstraLinks = links.slice(1);

    const resuméLinjer = indhold
      .split("\n")
      .filter(l =>
        !l.startsWith("Relevans:") &&
        !l.startsWith("Prioritet:") &&
        !l.startsWith("Kilde:") &&
        !l.startsWith("Kilder:") &&
        !l.match(/^\[/) &&
        l.trim().length > 0
      );
    const resumé = resuméLinjer.join(" ").replace(/\s+/g, " ").slice(0, 220).trim();
    const id = crypto.createHash("md5").update(`${titel}::${hoved.url}`).digest("hex").slice(0, 8);

    omtaler.push({
      id, titel,
      medie: extractMedie(hoved.url),
      url: hoved.url,
      dato,
      kategori: getKategori(allText),
      sentiment: getSentiment(allText),
      resumé,
      relevans,
      kritisk: isKritisk(allText) || (prioritet === "høj" && getKategori(allText) === "saphe"),
      prioritet,
    });

    for (const link of ekstraLinks) {
      const eid = crypto.createHash("md5").update(`${titel}::${link.url}`).digest("hex").slice(0, 8);
      omtaler.push({
        id: eid,
        titel: link.label,
        medie: extractMedie(link.url),
        url: link.url,
        dato,
        kategori: getKategori(allText),
        sentiment: getSentiment(allText),
        resumé: "",
        relevans: "",
        kritisk: false,
        prioritet,
      });
    }
  }

  return omtaler;
}

function parseSignaler(md: string): string[] {
  const m = md.match(/##\s+Signaler[^\n]*\n([\s\S]*?)(?=\n##\s|\s*$)/i);
  return m ? extractBullets(m[1]) : [];
}

function parseAnbefalinger(md: string): string[] {
  const m = md.match(/##\s+Anbefalet[^\n]*\n([\s\S]*?)(?=\n##\s|\s*$)/i);
  return m ? extractBullets(m[1]) : [];
}

function parseDagensVigtigste(md: string): string {
  const m = md.match(/##\s+Dagens vigtigste\n([\s\S]*?)(?=\n##\s|\s*$)/i);
  if (!m) return "";
  return m[1].trim().replace(/\n+/g, " ").slice(0, 400);
}

function parseDato(filnavn: string, md: string): string {
  const fraFil = filnavn.match(/(\d{4}-\d{2}-\d{2})/);
  if (fraFil) return fraFil[1];
  const fraHeader = md.match(/^#\s+Medieovervågning\s*[-–]\s*(\d{4}-\d{2}-\d{2})/im);
  if (fraHeader) return fraHeader[1];
  return new Date().toISOString().slice(0, 10);
}

/* ─── Find nyeste fil ────────────────────────────────────────────── */

function nyesteFil(): { filnavn: string; sti: string } | null {
  try {
    const filer = fs
      .readdirSync(DROPBOX_DIR)
      .filter(f => f.endsWith(".md"))
      .sort()
      .reverse();
    if (!filer.length) return null;
    return { filnavn: filer[0], sti: path.join(DROPBOX_DIR, filer[0]) };
  } catch {
    return null;
  }
}

/* ─── GET ────────────────────────────────────────────────────────── */

export async function GET() {
  const fil = nyesteFil();

  if (!fil) {
    const tom: MediaData = {
      sidstOpdateret: null,
      filDato: null,
      dagensVigtigste: "",
      signaler: [],
      anbefalinger: [],
      omtaler: [],
      facebookOpslag: [],
    };
    return NextResponse.json(tom);
  }

  const md   = fs.readFileSync(fil.sti, "utf-8");
  const dato = parseDato(fil.filnavn, md);
  const stat = fs.statSync(fil.sti);
  const omtaler = parseMarkdown(md, dato);

  // Brug kun hoved-omtaler (med resumé) som basis for opslag
  const basis = omtaler
    .filter(o => o.resumé.length > 0)
    .map(o => ({ titel: o.titel, resumé: o.resumé, relevans: o.relevans, url: o.url, prioritet: o.prioritet }));

  const data: MediaData = {
    sidstOpdateret: stat.mtime.toISOString(),
    filDato: dato,
    dagensVigtigste: parseDagensVigtigste(md),
    signaler: parseSignaler(md),
    anbefalinger: parseAnbefalinger(md),
    omtaler,
    facebookOpslag: genererFacebookOpslag(basis),
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
