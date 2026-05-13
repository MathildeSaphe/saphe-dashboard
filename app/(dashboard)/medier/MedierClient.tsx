"use client";

import { useCallback, useEffect, useState } from "react";

type Kategori = "saphe" | "konkurrent" | "branche" | "politik";
type Sentiment = "positiv" | "neutral" | "negativ";

type Omtale = {
  id: string;
  titel: string;
  medie: string;
  url: string;
  dato: string;
  kategori: Kategori;
  sentiment: Sentiment;
  resumé: string;
  kritisk: boolean;
  prioritet: "høj" | "mellem" | "lav";
};

type FacebookOpslag = {
  id: string;
  vinkel: "nyhed" | "spørgsmål" | "indsigt";
  vinkelLabel: string;
  tekst: string;
  kildeArtikel: string;
};

type MediaData = {
  sidstOpdateret: string | null;
  filDato: string | null;
  dagensVigtigste: string;
  signaler: string[];
  anbefalinger: string[];
  omtaler: Omtale[];
  facebookOpslag: FacebookOpslag[];
};

const KATEGORIER: { key: Kategori | "alle"; label: string }[] = [
  { key: "alle",       label: "Alle" },
  { key: "saphe",      label: "Saphe" },
  { key: "konkurrent", label: "Konkurrenter" },
  { key: "branche",    label: "Branche" },
  { key: "politik",    label: "Politik & lov" },
];

const SENTIMENT_LABELS: { key: Sentiment | "alle"; label: string }[] = [
  { key: "alle",    label: "Alle" },
  { key: "positiv", label: "Positiv" },
  { key: "neutral", label: "Neutral" },
  { key: "negativ", label: "Negativ" },
];

function sentimentStyle(s: Sentiment) {
  return {
    positiv: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    negativ: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  }[s];
}

function kategoriStyle(k: Kategori) {
  return {
    saphe:      "bg-primary/10 text-primary",
    konkurrent: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    branche:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    politik:    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  }[k];
}

function kategoriLabel(k: Kategori) {
  return { saphe: "Saphe", konkurrent: "Konkurrent", branche: "Branche", politik: "Politik" }[k];
}

function prioritetStyle(p: "høj" | "mellem" | "lav") {
  return {
    høj:    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
    mellem: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    lav:    "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  }[p];
}

function formatDato(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function formatTidspunkt(iso: string) {
  return new Date(iso).toLocaleString("da-DK", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Minibar: omtaler pr. dag ──────────────────────────────────── */
function OmtalerGraf({ omtaler }: { omtaler: Omtale[] }) {
  const days: { dato: string; label: string; antal: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      dato: iso,
      label: d.toLocaleDateString("da-DK", { weekday: "short" }),
      antal: omtaler.filter((o) => o.dato === iso).length,
    });
  }
  const max = Math.max(...days.map((d) => d.antal), 1);
  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <p className="text-sm font-semibold text-foreground mb-4">Omtaler de seneste 7 dage</p>
      <div className="flex items-end gap-2 h-28">
        {days.map((d) => (
          <div key={d.dato} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-foreground">
              {d.antal > 0 ? d.antal : ""}
            </span>
            <div className="w-full rounded-t-md bg-muted relative" style={{ height: "80px" }}>
              <div
                className="w-full rounded-t-md bg-primary absolute bottom-0 transition-all duration-500"
                style={{ height: `${(d.antal / max) * 80}px` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground capitalize">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Spinner ───────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
  );
}

/* ─── Hoved-komponent ───────────────────────────────────────────── */
export default function MedierClient() {
  const [data, setData]       = useState<MediaData>({
    sidstOpdateret: null, filDato: null,
    dagensVigtigste: "", signaler: [], anbefalinger: [], omtaler: [], facebookOpslag: [],
  });
  const [kopieret, setKopieret] = useState<string | null>(null);
  const [katFilter, setKatFilter]   = useState<Kategori | "alle">("alle");
  const [sentFilter, setSentFilter] = useState<Sentiment | "alle">("alle");
  const [søgning, setSøgning]       = useState("");
  const [henter, setHenter]         = useState(false);

  /* Hent data fra API (læser nyeste Dropbox-fil) */
  const indlæs = useCallback(async (vis?: boolean) => {
    if (vis) setHenter(true);
    try {
      const res  = await fetch("/api/media", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      if (vis) setHenter(false);
    }
  }, []);

  /* Første indlæsning */
  useEffect(() => { indlæs(); }, [indlæs]);

  /* Auto-poll hvert 5. minut */
  useEffect(() => {
    const id = setInterval(() => indlæs(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [indlæs]);

  /* Opdater ved sidefokus (brugeren vender tilbage til tabben) */
  useEffect(() => {
    const handler = () => indlæs();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [indlæs]);

  /* Filtrering */
  const filtrerede = data.omtaler.filter((o) => {
    if (katFilter !== "alle" && o.kategori !== katFilter) return false;
    if (sentFilter !== "alle" && o.sentiment !== sentFilter) return false;
    if (søgning &&
        !o.titel.toLowerCase().includes(søgning.toLowerCase()) &&
        !o.medie.toLowerCase().includes(søgning.toLowerCase()) &&
        !o.resumé.toLowerCase().includes(søgning.toLowerCase())) return false;
    return true;
  });

  const kritiske     = data.omtaler.filter((o) => o.kritisk);
  const positivePct  = data.omtaler.length
    ? Math.round((data.omtaler.filter((o) => o.sentiment === "positiv").length / data.omtaler.length) * 100)
    : 0;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Medieovervågning</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.sidstOpdateret
              ? `Seneste fil: ${data.filDato ?? "–"} · indlæst ${formatTidspunkt(data.sidstOpdateret)}`
              : "Venter på daglig Dropbox-fil…"}
          </p>
        </div>
        <button
          onClick={() => indlæs(true)}
          disabled={henter}
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {henter ? <><Spinner /> Indlæser…</> : "↻ Genindlæs"}
        </button>
      </div>

      {/* ── Ingen data endnu ── */}
      {!data.sidstOpdateret && (
        <div className="rounded-2xl bg-card border border-dashed border-border p-14 text-center">
          <p className="text-3xl mb-3">📂</p>
          <p className="font-semibold text-foreground">Ingen Dropbox-fil fundet endnu</p>
          <p className="text-sm text-muted-foreground mt-1">
            Dashboardet opdaterer automatisk, når dagens fil lander i mappen kl. 8–8:30.
          </p>
        </div>
      )}

      {/* ── Kritisk-alarm ── */}
      {kritiske.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-6 py-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🚨</span>
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-400">
              {kritiske.length} kritisk{kritiske.length > 1 ? "e" : ""} omtale{kritiske.length > 1 ? "r" : ""} kræver opmærksomhed
            </p>
            <ul className="mt-1 space-y-0.5">
              {kritiske.map((o) => (
                <li key={o.id}>
                  <a href={o.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-red-700 dark:text-red-400 hover:underline">
                    {o.titel}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data.sidstOpdateret && (
        <>
          {/* ── Dagens vigtigste ── */}
          {data.dagensVigtigste && (
            <div className="rounded-2xl bg-primary/5 border border-primary/20 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/70 mb-2">
                📋 Dagens vigtigste
              </p>
              <p className="text-sm text-foreground leading-relaxed">{data.dagensVigtigste}</p>
            </div>
          )}

          {/* ── Stat-kort + graf ── */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl bg-primary/15 border border-primary/20 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary/70">Omtaler i alt</p>
              <p className="text-4xl font-bold mt-2 text-primary">{data.omtaler.length}</p>
            </div>
            <div className="rounded-2xl bg-card border border-border px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Saphe</p>
              <p className="text-4xl font-bold mt-2 text-foreground">
                {data.omtaler.filter((o) => o.kategori === "saphe").length}
              </p>
            </div>
            <div className="rounded-2xl bg-card border border-border px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Positiv %</p>
              <p className="text-4xl font-bold mt-2 text-foreground">{positivePct}%</p>
            </div>
            <div className="rounded-2xl bg-card border border-border px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kritiske</p>
              <p className={`text-4xl font-bold mt-2 ${kritiske.length > 0 ? "text-red-600" : "text-foreground"}`}>
                {kritiske.length}
              </p>
            </div>
          </div>

          <OmtalerGraf omtaler={data.omtaler} />

          {/* ── Facebook-opslag ── */}
          {data.facebookOpslag.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📘</span>
                <h2 className="text-base font-semibold text-foreground">Forslag til Facebook-opslag</h2>
                <span className="text-xs text-muted-foreground ml-1">— baseret på dagens nyheder</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.facebookOpslag.map((opslag) => (
                  <div key={opslag.id}
                    className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
                    {/* Vinkel-header */}
                    <div className="px-4 py-2.5 bg-[#1877F2]/8 border-b border-border flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1877F2]">{opslag.vinkelLabel}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={opslag.kildeArtikel}>
                        ↑ {opslag.kildeArtikel.slice(0, 30)}…
                      </span>
                    </div>
                    {/* Tekst */}
                    <pre className="flex-1 px-4 py-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                      {opslag.tekst}
                    </pre>
                    {/* Kopier-knap */}
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(opslag.tekst);
                          setKopieret(opslag.id);
                          setTimeout(() => setKopieret(null), 2000);
                        }}
                        className={`w-full rounded-xl py-2 text-xs font-semibold transition-all ${
                          kopieret === opslag.id
                            ? "bg-emerald-500 text-white"
                            : "bg-[#1877F2] text-white hover:bg-[#1877F2]/90"
                        }`}
                      >
                        {kopieret === opslag.id ? "✓ Kopieret!" : "Kopiér tekst"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Signaler + Anbefalinger ── */}
          {(data.signaler.length > 0 || data.anbefalinger.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.signaler.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    📡 Signaler & tendenser
                  </p>
                  <ul className="space-y-2">
                    {data.signaler.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground leading-snug">
                        <span className="text-primary mt-0.5 shrink-0">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.anbefalinger.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    🎯 Anbefalet opmærksomhed
                  </p>
                  <ul className="space-y-2">
                    {data.anbefalinger.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground leading-snug">
                        <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Filtre ── */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-border bg-card overflow-hidden">
              {KATEGORIER.map(({ key, label }) => (
                <button key={key} onClick={() => setKatFilter(key)}
                  className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                    katFilter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl border border-border bg-card overflow-hidden">
              {SENTIMENT_LABELS.map(({ key, label }) => (
                <button key={key} onClick={() => setSentFilter(key)}
                  className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                    sentFilter === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Søg i omtaler…"
              value={søgning}
              onChange={(e) => setSøgning(e.target.value)}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ml-auto"
            />
          </div>

          {/* ── Artikel-liste ── */}
          {filtrerede.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">Ingen omtaler matcher dine filtre</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtrerede.map((omtale) => (
                <a key={omtale.id} href={omtale.url} target="_blank" rel="noopener noreferrer"
                  className={`block rounded-2xl bg-card border px-6 py-4 hover:shadow-md transition-all ${
                    omtale.kritisk ? "border-red-300 bg-red-50/30 dark:bg-red-950/20" : "border-border"
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {omtale.kritisk && (
                          <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            🚨 Kritisk
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${kategoriStyle(omtale.kategori)}`}>
                          {kategoriLabel(omtale.kategori)}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${sentimentStyle(omtale.sentiment)}`}>
                          {omtale.sentiment.charAt(0).toUpperCase() + omtale.sentiment.slice(1)}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${prioritetStyle(omtale.prioritet)}`}>
                          {omtale.prioritet.charAt(0).toUpperCase() + omtale.prioritet.slice(1)} prioritet
                        </span>
                      </div>
                      <p className="font-semibold text-foreground leading-snug">{omtale.titel}</p>
                      {omtale.resumé && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {omtale.resumé}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">{omtale.medie}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDato(omtale.dato)}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
