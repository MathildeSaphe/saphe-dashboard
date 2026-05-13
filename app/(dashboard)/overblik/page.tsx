"use client";

import { TrendingUp, TrendingDown, Users, MousePointerClick, Flame, Zap, ArrowRight, Radio } from "lucide-react";

/* ─── Demo-data ──────────────────────────────────────────────────── */

const kpiKort = [
  {
    label: "Månedlig trafik",
    værdi: "1,24M",
    ændring: "+12%",
    op: true,
    sub: "vs. sidste måned",
    farve: "blue",
    ikon: MousePointerClick,
  },
  {
    label: "Engagement rate",
    værdi: "4,7%",
    ændring: "+0,3pp",
    op: true,
    sub: "tværs af platforme",
    farve: "violet",
    ikon: Flame,
  },
  {
    label: "Nye leads",
    værdi: "318",
    ændring: "-4%",
    op: false,
    sub: "denne måned",
    farve: "amber",
    ikon: Users,
  },
  {
    label: "Følgervækst",
    værdi: "+2.140",
    ændring: "+18%",
    op: true,
    sub: "alle SoMe-kanaler",
    farve: "emerald",
    ikon: TrendingUp,
  },
];

// Ugentlig trafik (12 uger)
const trafikData = [820, 940, 880, 1050, 990, 1120, 1080, 1200, 1150, 1280, 1240, 1310];
const maxTrafik = Math.max(...trafikData);

// Content momentum – de seneste 6 uger
const contentMomentum = [
  { uge: "U18", opslag: 12, rækkevidde: 48200 },
  { uge: "U19", opslag: 9,  rækkevidde: 39100 },
  { uge: "U20", opslag: 14, rækkevidde: 61400 },
  { uge: "U21", opslag: 11, rækkevidde: 52800 },
  { uge: "U22", opslag: 16, rækkevidde: 74200 },
  { uge: "U23", opslag: 13, rækkevidde: 58600 },
];
const maxRækkevidde = Math.max(...contentMomentum.map((u) => u.rækkevidde));

// Platformfordeling
const platforme = [
  { navn: "Facebook",  pct: 38, farve: "#1877F2" },
  { navn: "Instagram", pct: 28, farve: "#E1306C" },
  { navn: "LinkedIn",  pct: 19, farve: "#0A66C2" },
  { navn: "TikTok",    pct: 9,  farve: "#010101" },
  { navn: "Andet",     pct: 6,  farve: "#94a3b8" },
];

// Live-feeds / smarte widgets
const senesteMedier = [
  { kilde: "Ekstra Bladet",  titel: "Saphe advarer mod ny fartkontrol på E20",  tid: "08:14" },
  { kilde: "TV 2 Lorry",     titel: "Fartfælder spreder sig til ringvejene",    tid: "07:52" },
  { kilde: "Motoristen.dk",  titel: "Anmeldelse: Saphe One Mini 2",             tid: "06:30" },
];

const kommendePosts = [
  { platform: "Facebook",  emne: "Ny fartfælde-update – Storkøbenhavn", dag: "I dag 12:00" },
  { platform: "Instagram", emne: "Behind-the-scenes: teamet bag kortet",   dag: "Tors 09:00" },
  { platform: "LinkedIn",  emne: "Case study: B2B flådeløsning",           dag: "Fre 08:30" },
];

/* ─── Hjælpefunktioner ───────────────────────────────────────────── */

const farveKlasser: Record<string, { bg: string; text: string; badge: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    badge: "bg-blue-100 text-blue-700"    },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600",  badge: "bg-violet-100 text-violet-700" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   badge: "bg-amber-100 text-amber-700"  },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
};

/* ─── Sparkline ──────────────────────────────────────────────────── */

function Sparkline({ data, max }: { data: number[]; max: number }) {
  const W = 260, H = 56, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / max) * (H - pad * 2));
    return `${x},${y}`;
  });
  const areaBottom = `${pts[pts.length - 1].split(",")[0]},${H} ${pts[0].split(",")[0]},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pts.join(" ")} ${areaBottom}`}
        fill="url(#spark-grad)"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sidste punkt */}
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r="3.5"
        fill="#6366f1"
      />
    </svg>
  );
}

/* ─── Søjlediagram (content momentum) ───────────────────────────── */

function MomentumBars() {
  return (
    <div className="flex items-end gap-2 h-28 mt-2">
      {contentMomentum.map((u) => {
        const højde = Math.round((u.rækkevidde / maxRækkevidde) * 100);
        return (
          <div key={u.uge} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-[9px] text-muted-foreground font-medium">
              {(u.rækkevidde / 1000).toFixed(0)}k
            </span>
            <div className="w-full rounded-t-md bg-primary/20 relative" style={{ height: `${højde}%` }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-md bg-primary"
                style={{ height: `${Math.min(100, (u.opslag / 16) * 100)}%`, opacity: 0.85 }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{u.uge}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Platform donut ─────────────────────────────────────────────── */

function PlatformDonut() {
  const R = 40, cx = 56, cy = 56, stroke = 14;
  const omkreds = 2 * Math.PI * R;
  let offset = 0;
  const segmenter = platforme.map((p) => {
    const dash = (p.pct / 100) * omkreds;
    const gap = omkreds - dash;
    const seg = { ...p, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={112} height={112} viewBox="0 0 112 112">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {segmenter.map((s) => (
          <circle
            key={s.navn}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={s.farve}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + omkreds * 0.25}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs font-bold fill-foreground" fontSize={11} fontWeight={700}>SoMe</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>fordeling</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {platforme.map((p) => (
          <div key={p.navn} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.farve }} />
            <span className="text-xs text-foreground">{p.navn}</span>
            <span className="text-xs text-muted-foreground ml-auto pl-4 font-medium">{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Hoved-komponent ────────────────────────────────────────────── */

export default function OverblikPage() {
  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overblik</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Dit marketing-univers på ét blik</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white border border-border rounded-xl px-3 py-2">
          <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          Opdateret i dag
        </div>
      </div>

      {/* KPI-kort */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiKort.map((k) => {
          const cls = farveKlasser[k.farve];
          const Ikon = k.ikon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                <div className={`${cls.bg} ${cls.text} p-1.5 rounded-lg`}>
                  <Ikon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{k.værdi}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
              </div>
              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${cls.badge}`}>
                {k.op ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {k.ændring} vs. sidste md.
              </div>
            </div>
          );
        })}
      </div>

      {/* Trafik-trend + Content momentum */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Trafik-sparkline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Trafikudvikling</h2>
              <p className="text-xs text-muted-foreground">Sidste 12 uger · alle kanaler</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12%
            </span>
          </div>
          <Sparkline data={trafikData} max={maxTrafik} />
          <div className="flex justify-between mt-1">
            {["U12","","","U15","","","U18","","","U21","","U23"].map((l, i) => (
              <span key={i} className="text-[9px] text-muted-foreground">{l}</span>
            ))}
          </div>
        </div>

        {/* Content momentum */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">Content momentum</h2>
          <p className="text-xs text-muted-foreground mb-1">Opslag & rækkevidde pr. uge</p>
          <MomentumBars />
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-[10px] text-muted-foreground">Opslag</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
              <span className="text-[10px] text-muted-foreground">Rækkevidde</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform-fordeling + Kommende posts + Seneste medier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Platform donut */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Platform-fordeling</h2>
          <PlatformDonut />
        </div>

        {/* Kommende opslag */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Kommende opslag</h2>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {kommendePosts.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.emne}</p>
                  <p className="text-[10px] text-muted-foreground">{p.platform} · {p.dag}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <a href="/some" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Se SoMe-oversigt <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Seneste medieomtale */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Seneste medieomtale</h2>
            <Radio className="h-4 w-4 text-violet-500" />
          </div>
          <div className="space-y-3">
            {senesteMedier.map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{m.titel}</p>
                  <p className="text-[10px] text-muted-foreground">{m.kilde} · {m.tid}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <a href="/medier" className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Se medieovervågning <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>

      </div>

      {/* Demo-disclaimer */}
      <p className="text-[11px] text-muted-foreground/60 text-center pb-2">
        Tal er illustrative demo-data · forbindes med rigtige kilder løbende
      </p>

    </div>
  );
}
