"use client";

import { useEffect, useState } from "react";

type Platform = "linkedin" | "facebook" | "instagram_dk" | "instagram_de" | "tiktok_dk" | "tiktok_de";

type OpslagData = {
  id: string;
  tekst: string;
  dato: string;
  likes: number;
  kommentarer: number;
  visninger: number;
  engagement: number;
  type: "video" | "billede" | "tekst" | "karusel";
  url: string;
};

type PlatformData = {
  label: string;
  land: string;
  farveBg: string;
  farveHex: string;
  følgere: number;
  nyeFølgere: number | null;
  følgereVækst: number;
  rækkevidde: number;
  engagement: number;
  visninger: number;
  live: boolean;
  opslag: OpslagData[];
  graf: number[];
};

function tomPlatform(label: string, land: string, farveBg: string, farveHex: string, live: boolean): PlatformData {
  return { label, land, farveBg, farveHex, live, følgere: 0, nyeFølgere: null, følgereVækst: 0, rækkevidde: 0, engagement: 0, visninger: 0, graf: Array(30).fill(0), opslag: [] };
}

const STARTDATA: Record<Platform, PlatformData> = {
  linkedin:     tomPlatform("LinkedIn",  "",   "bg-[#0A66C2]",  "#0A66C2", false),
  facebook:     tomPlatform("Facebook",  "",   "bg-[#1877F2]",  "#1877F2", true),
  instagram_dk: tomPlatform("Instagram", "DK", "bg-[#E1306C]",  "#E1306C", true),
  instagram_de: tomPlatform("Instagram", "DE", "bg-[#E1306C]",  "#E1306C", false),
  tiktok_dk:    tomPlatform("TikTok",    "DK", "bg-neutral-900", "#171717", false),
  tiktok_de:    tomPlatform("TikTok",    "DE", "bg-neutral-900", "#171717", false),
};

const TABS: { key: Platform; symbol: string }[] = [
  { key: "linkedin",     symbol: "in" },
  { key: "facebook",     symbol: "f"  },
  { key: "instagram_dk", symbol: "◈"  },
  { key: "instagram_de", symbol: "◈"  },
  { key: "tiktok_dk",    symbol: "♪"  },
  { key: "tiktok_de",    symbol: "♪"  },
];

function formatTal(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function TypeBadge({ type }: { type: OpslagData["type"] }) {
  const map = { video: "bg-purple-100 text-purple-700", billede: "bg-blue-100 text-blue-700", tekst: "bg-gray-100 text-gray-600", karusel: "bg-amber-100 text-amber-700" };
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${map[type]}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>;
}

function MiniGraf({ data, farveStroke }: { data: number[]; farveStroke: string }) {
  const max = Math.max(...data, 1);
  const W = 500;
  const H = 90;
  const pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / max) * (H - pad * 2));
    return [x, y] as [number, number];
  });

  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;

  const total = data.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / data.length);

  return (
    <div className="rounded-2xl bg-white border border-border p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Daglig rækkevidde</p>
        <span className="text-xs text-muted-foreground">seneste 30 dage</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="grafGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={farveStroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={farveStroke} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#grafGradient)" />
        <path d={linePath} fill="none" stroke={farveStroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
        {["U1","U2","U3","U4"].map((u) => <span key={u}>{u}</span>)}
        <span className="ml-auto text-foreground font-medium">Snit: {avg.toLocaleString("da-DK")}</span>
      </div>
    </div>
  );
}

function PostRangliste({ opslag }: { opslag: OpslagData[] }) {
  if (opslag.length === 0) return null;

  // Sorter efter likes + kommentarer
  const sorterede = [...opslag].sort((a, b) => (b.likes + b.kommentarer) - (a.likes + a.kommentarer)).slice(0, 3);
  const max = sorterede[0].likes + sorterede[0].kommentarer;
  const medaljer = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-2xl bg-white border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-foreground">Post performance</p>
        <span className="text-xs text-muted-foreground">Sorteret efter engagement</span>
      </div>
      <div className="space-y-4">
        {sorterede.map((o, i) => {
          const score = o.likes + o.kommentarer;
          const pct = Math.round((score / max) * 100);
          return (
            <a key={o.id} href={o.url} target="_blank" rel="noopener noreferrer"
              className="block group">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{medaljer[i] ?? "·"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {o.tekst.slice(0, 60)}{o.tekst.length > 60 ? "…" : ""}
                    </p>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      <span>❤️ {formatTal(o.likes)}</span>
                      <span>💬 {o.kommentarer}</span>
                      <TypeBadge type={o.type} />
                    </div>
                  </div>
                  {/* Performance bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${pct}%`, opacity: i === 0 ? 1 : 0.5 + (0.5 * pct / 100) }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(o.dato).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{pct}% af bedste</span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function SoMePerformance() {
  const [aktiv, setAktiv] = useState<Platform>("instagram_dk");
  const [platforms, setPlatforms] = useState<Record<Platform, PlatformData>>(STARTDATA);
  const [henter, setHenter] = useState(true);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((meta) => {
        if (meta.error) return;
        setPlatforms((prev) => ({
          ...prev,
          facebook: {
            ...prev.facebook,
            følgere:    meta.facebook.følgere,
            nyeFølgere: meta.facebook.nyeFølgere,
            rækkevidde: meta.facebook.rækkevidde,
            visninger:  meta.facebook.visninger,
            engagement: meta.facebook.engagement,
            graf:       meta.facebook.graf.length ? meta.facebook.graf : prev.facebook.graf,
            opslag:     meta.facebook.opslag,
          },
          instagram_dk: {
            ...prev.instagram_dk,
            følgere:    meta.instagram_dk.følgere,
            nyeFølgere: meta.instagram_dk.nyeFølgere,
            rækkevidde: meta.instagram_dk.rækkevidde,
            visninger:  meta.instagram_dk.visninger,
            engagement: meta.instagram_dk.engagement,
            graf:       meta.instagram_dk.graf.length ? meta.instagram_dk.graf : prev.instagram_dk.graf,
            opslag:     meta.instagram_dk.opslag,
          },
        }));
      })
      .finally(() => setHenter(false));
  }, []);

  const p = platforms[aktiv];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">SoMe performance</h1>
          <p className="text-sm text-muted-foreground mt-1">Saphes sociale kanaler · seneste 30 dage</p>
        </div>
        <div className={`rounded-xl px-4 py-2 text-xs font-medium border ${henter ? "bg-muted border-border text-muted-foreground" : p.live ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          {henter ? "Henter…" : p.live ? "● Live data fra Meta" : "Ingen data endnu · API mangler"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, symbol }) => {
          const pl = platforms[key];
          const isActive = aktiv === key;
          return (
            <button key={key} onClick={() => setAktiv(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border ${isActive ? "bg-white border-primary shadow-sm text-foreground" : "bg-white border-border text-muted-foreground hover:border-primary/30"}`}>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? pl.farveBg + " text-white" : "bg-muted text-muted-foreground"}`}>{symbol}</span>
              {pl.label}
              {pl.land && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{pl.land}</span>
              )}
              {pl.live && <span className="text-[9px] text-emerald-600 font-semibold">●</span>}
            </button>
          );
        })}
      </div>

      {/* Stat-kort */}
      <div className="grid grid-cols-4 gap-4">
        {/* Følgere med vækst */}
        <div className="rounded-2xl bg-primary/15 border border-primary/20 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-primary/70">Følgere</p>
          <p className="text-4xl font-bold mt-2 text-primary">{formatTal(p.følgere)}</p>
          {p.nyeFølgere !== null && p.nyeFølgere > 0 ? (
            <p className="text-xs mt-1 font-medium text-emerald-600">+{p.nyeFølgere} de seneste 30 dage</p>
          ) : p.følgereVækst > 0 ? (
            <p className="text-xs mt-1 font-medium text-emerald-600">+{p.følgereVækst}% denne måned</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white border border-border px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rækkevidde</p>
          <p className="text-4xl font-bold mt-2 text-foreground">{p.rækkevidde > 0 ? formatTal(p.rækkevidde) : "—"}</p>
          <p className="text-xs mt-1 text-muted-foreground">seneste 30 dage</p>
        </div>

        <div className="rounded-2xl bg-white border border-border px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Engagement</p>
          <p className="text-4xl font-bold mt-2 text-foreground">{p.engagement > 0 ? `${p.engagement}%` : "—"}</p>
          <p className="text-xs mt-1 text-muted-foreground">gennemsnit pr. opslag</p>
        </div>

        <div className="rounded-2xl bg-white border border-border px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visninger</p>
          <p className="text-4xl font-bold mt-2 text-foreground">{p.visninger > 0 ? formatTal(p.visninger) : "—"}</p>
          <p className="text-xs mt-1 text-muted-foreground">seneste 30 dage</p>
        </div>
      </div>

      {/* Graf + rangliste side om side */}
      <div className="grid grid-cols-2 gap-4">
        <MiniGraf data={p.graf} farveStroke={p.farveHex} />
        <PostRangliste opslag={p.opslag} />
      </div>

      {/* Seneste opslag */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Seneste opslag</p>
        {p.opslag.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">{henter ? "Henter opslag…" : "Ingen opslag fundet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...p.opslag].sort((a, b) => b.dato.localeCompare(a.dato)).slice(0, 3).map((o) => (
              <a key={o.id} href={o.url} target="_blank" rel="noopener noreferrer"
                className="block rounded-2xl bg-white border border-border px-6 py-4 hover:shadow-md hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <TypeBadge type={o.type} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.dato).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-2">{o.tekst}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-muted-foreground">❤️ {formatTal(o.likes)}</span>
                      <span className="text-xs text-muted-foreground">💬 {o.kommentarer}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-primary shrink-0 mt-1">↗ Åbn opslag</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
