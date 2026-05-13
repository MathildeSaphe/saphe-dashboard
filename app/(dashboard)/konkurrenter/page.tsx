"use client";

import { useState } from "react";

/* ─── DATA ───────────────────────────────────────────────────────── */

const DIMENSIONER = ["Hardware", "App", "Community", "Pris/TCO", "Design", "Sikkerhed", "Brand"];

const KONKURRENTER: {
  navn: string;
  farve: string;
  scores: number[]; // 7 dims, 1-5
}[] = [
  { navn: "Saphe",      farve: "#E1306C", scores: [5, 4, 5, 4, 5, 5, 4] },
  { navn: "Ooono",      farve: "#F59E0B", scores: [4, 3, 4, 5, 3, 4, 3] },
  { navn: "Coyote",     farve: "#3B82F6", scores: [4, 4, 3, 2, 3, 4, 3] },
  { navn: "Waze",       farve: "#10B981", scores: [1, 5, 5, 5, 4, 3, 4] },
  { navn: "Inforad",    farve: "#8B5CF6", scores: [4, 2, 2, 3, 2, 3, 2] },
];

const FEATURES = [
  { navn: "Realtids-advarsler",       saphe: true,  ooono: true,  coyote: true,  waze: true,  inforad: true  },
  { navn: "Dedicated hardware",       saphe: true,  ooono: true,  coyote: true,  waze: false, inforad: true  },
  { navn: "Community-rapporter",      saphe: true,  ooono: true,  coyote: false, waze: true,  inforad: false },
  { navn: "Ingen abonnement (basis)", saphe: true,  ooono: true,  coyote: false, waze: true,  inforad: false },
  { navn: "Offline funktion",         saphe: true,  ooono: false, coyote: true,  waze: false, inforad: true  },
  { navn: "iOS + Android app",        saphe: true,  ooono: true,  coyote: true,  waze: true,  inforad: false },
  { navn: "Android Auto / CarPlay",   saphe: true,  ooono: false, coyote: false, waze: true,  inforad: false },
  { navn: "Visuelt display",          saphe: true,  ooono: false, coyote: true,  waze: false, inforad: true  },
  { navn: "Dokumenteret sikk.-eff.",  saphe: true,  ooono: false, coyote: false, waze: false, inforad: false },
  { navn: "EU-dækning",               saphe: true,  ooono: true,  coyote: true,  waze: true,  inforad: false },
];

const TRUSLER = [
  { navn: "Ooono",       farve: "#F59E0B", niveau: 5, beskrivelse: "Nærmeste direkte rival — billigt hardware, stor community. Aggressiv prisstrategi presser margin." },
  { navn: "Google Maps", farve: "#EA4335", niveau: 4, beskrivelse: "Ubegrænsede ressourcer, integreret i Android. Risiko ved OS-niveau-integration." },
  { navn: "Coyote",      farve: "#3B82F6", niveau: 3, beskrivelse: "Stærk i Frankrig og Sydeuropa. Abonnementsmodel giver høj LTV men svækker reach." },
  { navn: "Waze",        farve: "#10B981", niveau: 4, beskrivelse: "Gratis og community-drevet. Mangler hardware-USP men dominerer app-segmentet." },
  { navn: "Tryg Drive",  farve: "#7C3AED", niveau: 2, beskrivelse: "Forsikringsbaseret — anden go-to-market. Risiko hvis banker/forsikring adopterer." },
  { navn: "Inforad",     farve: "#6B7280", niveau: 2, beskrivelse: "Nichespiller, stagnerende. Lav innovationsrate." },
];

const TCO_DATA = [
  { navn: "Waze / Google Maps", pris: 0,     farve: "#10B981" },
  { navn: "Ooono CO-Driver",    pris: 399,   farve: "#F59E0B" },
  { navn: "Saphe Drive+",       pris: 599,   farve: "#E1306C" },
  { navn: "Saphe Drive Pro",    pris: 1099,  farve: "#E1306C" },
  { navn: "Coyote Mini",        pris: 1299,  farve: "#3B82F6" },
  { navn: "Coyote MAX",         pris: 6250,  farve: "#3B82F6" },
];

const APP_RATINGS = [
  { navn: "Saphe",   ios: 4.7, android: 4.5, farve: "#E1306C" },
  { navn: "Ooono",   ios: 4.5, android: 4.3, farve: "#F59E0B" },
  { navn: "Waze",    ios: 4.4, android: 4.3, farve: "#10B981" },
  { navn: "Coyote",  ios: 3.8, android: 3.6, farve: "#3B82F6" },
  { navn: "Inforad", ios: 3.2, android: 2.9, farve: "#8B5CF6" },
];

const MULIGHEDER = [
  { ikon: "🚗", titel: "OBD2 & Connected Car", tekst: "Integration med bilens ECU giver personaliserede hastighedsadvarsler og proaktiv vedligeholdelse — ingen konkurrent tilbyder dette i dag." },
  { ikon: "🏢", titel: "Fleet / B2B segment", tekst: "Flådestyringsmarkedet er umodenhed — Saphe-hardware + fleet-dashboard kan differentiere markant fra consumer-fokuserede rivaler." },
  { ikon: "🇩🇪", titel: "Tysk markedsekspansion", tekst: "Coyote og Ooono har svag penetration i DE. Saphe Instagram DE viser potentiale — koordineret launch kan vinde first-mover." },
  { ikon: "🤝", titel: "Forsikringspartnerskaber", tekst: "Tryg Drive viser at forsikringsselskaber betaler for telematikdata. Saphe kan co-brande og få subsidie på hardware." },
  { ikon: "📊", titel: "Safety-dokumentation som USP", tekst: "Dokumenteret 2 % reduktion i ulykker er unikt. Brug det aktivt i B2B-salg og PR — Ooono og Waze mangler tilsvarende data." },
];

/* ─── SPIDER CHART ───────────────────────────────────────────────── */

function SpiderChart({ synlige }: { synlige: Set<string> }) {
  const W = 420; const H = 420; const cx = W / 2; const cy = H / 2; const R = 160;
  const n = DIMENSIONER.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const gridPoint = (level: number, i: number) => {
    const r = (level / 5) * R;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };

  const polygon = (scores: number[]) =>
    scores.map((s, i) => {
      const r = (s / 5) * R;
      return `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`;
    }).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md mx-auto">
      {/* Grid rings */}
      {[1, 2, 3, 4, 5].map(lvl => (
        <polygon
          key={lvl}
          points={DIMENSIONER.map((_, i) => gridPoint(lvl, i).join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />
      ))}
      {/* Spokes */}
      {DIMENSIONER.map((dim, i) => {
        const [x, y] = gridPoint(5, i);
        const [lx, ly] = [
          cx + (R + 28) * Math.cos(angle(i)),
          cy + (R + 28) * Math.sin(angle(i)),
        ];
        return (
          <g key={dim}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
            <text
              x={lx} y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="currentColor"
              fillOpacity={0.7}
              fontWeight={500}
            >
              {dim}
            </text>
          </g>
        );
      })}
      {/* Competitor polygons */}
      {KONKURRENTER.filter(k => synlige.has(k.navn)).map(k => (
        <polygon
          key={k.navn}
          points={polygon(k.scores)}
          fill={k.farve}
          fillOpacity={k.navn === "Saphe" ? 0.25 : 0.08}
          stroke={k.farve}
          strokeWidth={k.navn === "Saphe" ? 2.5 : 1.5}
          strokeOpacity={0.9}
        />
      ))}
      {/* Score dots for Saphe */}
      {KONKURRENTER[0].scores.map((s, i) => {
        if (!synlige.has("Saphe")) return null;
        const r = (s / 5) * R;
        return (
          <circle key={i} cx={cx + r * Math.cos(angle(i))} cy={cy + r * Math.sin(angle(i))}
            r={4} fill="#E1306C" stroke="white" strokeWidth={1.5} />
        );
      })}
    </svg>
  );
}

/* ─── POSITIONING MAP ────────────────────────────────────────────── */

type Punkt = { navn: string; x: number; y: number; farve: string };

function PositioningMap({ xLabel, yLabel, punkter, xLow, xHigh, yLow, yHigh }: {
  xLabel: string; yLabel: string;
  xLow: string; xHigh: string; yLow: string; yHigh: string;
  punkter: Punkt[];
}) {
  const W = 320; const H = 260; const pad = 40;
  const toX = (v: number) => pad + ((v - 1) / 4) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - 1) / 4) * (H - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Axes */}
      <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 3" />
      {/* Axis labels */}
      <text x={pad} y={H / 2 - 8} fontSize={9} fill="currentColor" fillOpacity={0.5} textAnchor="middle">{xLow}</text>
      <text x={W - pad} y={H / 2 - 8} fontSize={9} fill="currentColor" fillOpacity={0.5} textAnchor="middle">{xHigh}</text>
      <text x={W / 2} y={pad - 6} fontSize={9} fill="currentColor" fillOpacity={0.5} textAnchor="middle">{yHigh}</text>
      <text x={W / 2} y={H - pad + 14} fontSize={9} fill="currentColor" fillOpacity={0.5} textAnchor="middle">{yLow}</text>
      {/* X label */}
      <text x={W / 2} y={H - 4} fontSize={10} fill="currentColor" fillOpacity={0.6} textAnchor="middle" fontWeight={600}>{xLabel}</text>
      {/* Points */}
      {punkter.map(p => {
        const px = toX(p.x); const py = toY(p.y);
        return (
          <g key={p.navn}>
            <circle cx={px} cy={py} r={p.navn === "Saphe" ? 10 : 7}
              fill={p.farve} fillOpacity={p.navn === "Saphe" ? 0.9 : 0.7}
              stroke="white" strokeWidth={1.5} />
            <text x={px} y={py - 13} fontSize={9} fill="currentColor" fillOpacity={0.8}
              textAnchor="middle" fontWeight={p.navn === "Saphe" ? 700 : 400}>
              {p.navn}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── TRUSSEL DOT ────────────────────────────────────────────────── */
function TrusselDots({ niveau, farve }: { niveau: number; farve: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="w-2.5 h-2.5 rounded-full border border-border"
          style={{ background: i <= niveau ? farve : "transparent" }} />
      ))}
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────────────────────── */

export default function Konkurrenter() {
  const [synlige, setSynlige] = useState<Set<string>>(
    new Set(KONKURRENTER.map(k => k.navn))
  );

  const toggle = (navn: string) => {
    if (navn === "Saphe") return;
    setSynlige(prev => {
      const next = new Set(prev);
      next.has(navn) ? next.delete(navn) : next.add(navn);
      return next;
    });
  };

  const maxTCO = Math.max(...TCO_DATA.map(d => d.pris));

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Konkurrentanalyse</h1>
          <p className="text-sm text-muted-foreground mt-1">Baseret på Saphe Konkurrentanalyse · Maj 2026</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 px-4 py-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
          <span className="text-base">🔍</span> 11 konkurrenter analyseret
        </div>
      </div>

      {/* ── Trusselsoverblik ── */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">Trusselsoverblik</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TRUSLER.map(t => (
            <div key={t.navn} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">{t.navn}</span>
                <TrusselDots niveau={t.niveau} farve={t.farve} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.beskrivelse}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span className="inline-flex gap-1">
            {[1,2,3,4,5].map(i => <span key={i} className="w-2 h-2 rounded-full bg-rose-400 inline-block" style={{ opacity: i * 0.2 }} />)}
          </span>
          = Trusselsniveau (1 lav → 5 høj)
        </p>
      </section>

      {/* ── Spider Chart ── */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Kompetenceprofil</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Klik for at til-/fravælge konkurrenter</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {KONKURRENTER.map(k => (
              <button
                key={k.navn}
                onClick={() => toggle(k.navn)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all"
                style={{
                  borderColor: synlige.has(k.navn) ? k.farve : undefined,
                  background: synlige.has(k.navn) ? `${k.farve}18` : undefined,
                  color: synlige.has(k.navn) ? k.farve : undefined,
                  opacity: k.navn === "Saphe" ? 1 : undefined,
                }}
                disabled={k.navn === "Saphe"}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: k.farve }} />
                {k.navn}
              </button>
            ))}
          </div>
        </div>
        <SpiderChart synlige={synlige} />
      </section>

      {/* ── Feature matrix ── */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">Feature-matrix</h2>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Feature</th>
                {["Saphe", "Ooono", "Coyote", "Waze", "Inforad"].map((n, i) => (
                  <th key={n} className="text-center px-3 py-3 font-semibold text-xs"
                    style={{ color: KONKURRENTER[i]?.farve ?? "#6B7280" }}>
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, fi) => (
                <tr key={f.navn} className={fi % 2 === 0 ? "bg-muted/30" : ""}>
                  <td className="px-4 py-2.5 text-foreground text-xs">{f.navn}</td>
                  {[f.saphe, f.ooono, f.coyote, f.waze, f.inforad].map((v, i) => (
                    <td key={i} className="text-center px-3 py-2.5">
                      {v
                        ? <span className="text-emerald-500 font-bold text-base">✓</span>
                        : <span className="text-rose-300 text-base">✗</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Positioning Maps ── */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">Positioneringskort</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Brand-narrativ</p>
            <PositioningMap
              xLabel="Pris-fokus → Sikkerheds-fokus"
              yLabel="Niche → Mass-market"
              xLow="Billig" xHigh="Premium"
              yLow="Niche" yHigh="Mass-market"
              punkter={[
                { navn: "Saphe",   x: 3.8, y: 3.5, farve: "#E1306C" },
                { navn: "Ooono",   x: 2.2, y: 3.0, farve: "#F59E0B" },
                { navn: "Coyote",  x: 4.2, y: 2.5, farve: "#3B82F6" },
                { navn: "Waze",    x: 1.5, y: 4.5, farve: "#10B981" },
                { navn: "Inforad", x: 3.0, y: 1.5, farve: "#8B5CF6" },
              ]}
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Forretningsmodel</p>
            <PositioningMap
              xLabel="App-only → Hardware+App"
              yLabel="Gratis → Abonnement"
              xLow="App" xHigh="Hardware"
              yLow="Gratis" yHigh="Abonnement"
              punkter={[
                { navn: "Saphe",   x: 4.5, y: 2.0, farve: "#E1306C" },
                { navn: "Ooono",   x: 4.0, y: 1.5, farve: "#F59E0B" },
                { navn: "Coyote",  x: 4.2, y: 4.5, farve: "#3B82F6" },
                { navn: "Waze",    x: 1.5, y: 1.0, farve: "#10B981" },
                { navn: "Inforad", x: 3.8, y: 3.5, farve: "#8B5CF6" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── TCO ── */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-1">Total Cost of Ownership (3 år)</h2>
        <p className="text-xs text-muted-foreground mb-4">Hardware + abonnement samlet over 3 år, DKK</p>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          {TCO_DATA.map(d => (
            <div key={d.navn} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{d.navn}</span>
              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{ width: `${(d.pris / maxTCO) * 100}%`, background: d.farve, opacity: 0.85 }}
                />
              </div>
              <span className="text-xs font-semibold text-foreground w-16 text-right">
                {d.pris === 0 ? "Gratis" : `${d.pris.toLocaleString("da-DK")} kr`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── App ratings ── */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">App Store-ratings</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          {APP_RATINGS.map(a => (
            <div key={a.navn}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-foreground">{a.navn}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>iOS {a.ios.toFixed(1)} ★</span>
                  <span>Android {a.android.toFixed(1)} ★</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12">iOS</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(a.ios / 5) * 100}%`, background: a.farve, opacity: 0.8 }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12">Android</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(a.android / 5) * 100}%`, background: a.farve, opacity: 0.55 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Saphe USPs ── */}
      <section className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
        <h2 className="text-base font-semibold mb-4">Saphes stærkeste differentiering</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { ikon: "📺", titel: "Visuelt display", tekst: "Eneste aktør med dedikeret skærm — øget opmærksomhed vs. lyd-only." },
            { ikon: "📉", titel: "2% sikkerhedseffekt", tekst: "Dokumenteret reduktion i ulykker — unikt salgsargument." },
            { ikon: "🌍", titel: "Community-størrelse", tekst: "Stor aktiv Saphe-brugerbase skaber netværkseffekt der er svær at kopiere." },
          ].map(u => (
            <div key={u.titel} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-2">{u.ikon}</div>
              <div className="text-sm font-semibold mb-1">{u.titel}</div>
              <div className="text-xs text-white/80 leading-relaxed">{u.tekst}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strategiske muligheder ── */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3">Strategiske muligheder</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MULIGHEDER.map(m => (
            <div key={m.titel} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
              <div className="text-2xl">{m.ikon}</div>
              <div className="text-sm font-semibold text-foreground">{m.titel}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{m.tekst}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
