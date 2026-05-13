"use client";

import { useEffect, useState } from "react";

type Møde = {
  id: string;
  emne: string;
  start: string;
  slut: string;
  sted: string;
  organisator: string;
  link: string;
};

type Mail = {
  id: string;
  emne: string;
  afsender: string;
  modtaget: string;
  resumé: string;
  læst: boolean;
  link: string;
};

type M365Data = {
  sidstOpdateret: string | null;
  møder: Møde[];
  mails: Mail[];
};

type Opgave = {
  id: string;
  navn: string;
  board: string;
  status: string;
  deadline: string | null;
  prioritet: string | null;
  minOpgave: boolean;
  url: string;
};

type MondayData = {
  sidstOpdateret: string | null;
  opgaver: Opgave[];
};

function formatTid(iso: string) {
  return new Date(iso).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
}

function formatDato(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function dagetilbage(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} dage over`;
  if (diff === 0) return "i dag";
  if (diff === 1) return "i morgen";
  return `om ${diff} dage`;
}

function statusStyle(status: string) {
  return {
    "In progress": "bg-blue-100 text-blue-700",
    "Done": "bg-emerald-100 text-emerald-700",
    "Blocked": "bg-red-100 text-red-700",
    "Not started": "bg-gray-100 text-gray-600",
    "Planned": "bg-amber-100 text-amber-700",
    "On hold": "bg-gray-100 text-gray-500",
  }[status] ?? "bg-gray-100 text-gray-600";
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 10) return "God morgen, Mathilde 👋";
  if (hour < 13) return "Klar til en stærk dag, Mathilde?";
  if (hour < 17) return "Hvad er næste skridt, Mathilde?";
  return "Godt arbejde i dag, Mathilde 🌙";
}

export default function MinArbejdsdag() {
  const now = new Date();
  const greeting = getGreeting(now);
  const dateStr = now.toLocaleDateString("da-DK", {
    weekday: "long", day: "numeric", month: "long",
  });

  const [m365, setM365] = useState<M365Data>({ sidstOpdateret: null, møder: [], mails: [] });
  const [monday, setMonday] = useState<MondayData>({ sidstOpdateret: null, opgaver: [] });

  useEffect(() => {
    fetch("/api/m365").then((r) => r.json()).then(setM365);
    fetch("/api/monday").then((r) => r.json()).then(setMonday);
  }, []);

  const dagensMøder = m365.møder.filter((m) => {
    const dato = new Date(m.start).toISOString().slice(0, 10);
    return dato === new Date().toISOString().slice(0, 10);
  });

  const aktiveOpgaver = monday.opgaver.filter((o) => o.status !== "Done");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        <h1 className="text-4xl font-bold text-foreground mt-1 tracking-tight">{greeting}</h1>
      </div>

      {/* Stat-række */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Møder i dag" value={String(dagensMøder.length)} primary />
        <StatCard label="Aktive opgaver" value={String(aktiveOpgaver.length)} />
        <StatCard label="Ulæste mails" value={String(m365.mails.filter((m) => !m.læst).length)} />
        <StatCard label="Teams-omtaler" value="—" />
      </div>

      {/* Hoved-grid */}
      <div className="grid grid-cols-2 gap-4">

        {/* Kalender */}
        <div className="rounded-2xl bg-white border border-border flex flex-col min-h-[200px] hover:border-primary/30 transition-colors">
          <div className="flex flex-col flex-1 p-6 gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Kalender i dag</h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">Outlook</span>
            </div>
            {dagensMøder.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">Ingen møder planlagt i dag 🎉</p>
            ) : (
              <div className="flex flex-col gap-2 flex-1">
                {dagensMøder.map((m) => (
                  <a key={m.id} href={m.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-xl bg-primary/5 px-3 py-2.5 hover:bg-primary/10 transition-colors">
                    <div className="shrink-0 text-right min-w-[40px]">
                      <p className="text-xs font-semibold text-primary">{formatTid(m.start)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTid(m.slut)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.emne}</p>
                      {m.sted && <p className="text-xs text-muted-foreground">{m.sted}</p>}
                    </div>
                  </a>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground/50 border-t border-border pt-3">Klik for at åbne i Outlook</p>
          </div>
        </div>

        {/* Monday-opgaver */}
        <div className="rounded-2xl bg-white border border-border flex flex-col min-h-[200px] hover:border-primary/30 transition-colors">
          <div className="flex flex-col flex-1 p-6 gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Mine opgaver</h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Monday</span>
            </div>
            {aktiveOpgaver.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">Ingen aktive opgaver ✅</p>
            ) : (
              <div className="flex flex-col gap-2 flex-1">
                {aktiveOpgaver.map((o) => (
                  <a key={o.id} href={o.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors ${o.minOpgave ? "bg-primary/5" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {o.minOpgave && <span className="text-[10px] font-semibold text-primary shrink-0">Dig</span>}
                        <p className="text-sm font-medium text-foreground truncate">{o.navn}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusStyle(o.status)}`}>
                          {o.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{o.board}</span>
                        {o.deadline && (
                          <span className="text-[10px] text-muted-foreground">· {dagetilbage(o.deadline)}</span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground/50 border-t border-border pt-3">Klik for at åbne i Monday</p>
          </div>
        </div>

        {/* Mails */}
        <div className="rounded-2xl bg-white border border-border flex flex-col min-h-[200px] hover:border-primary/30 transition-colors">
          <div className="flex flex-col flex-1 p-6 gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Seneste mails</h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Mail</span>
            </div>
            {m365.mails.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">Ingen mails hentet endnu.</p>
            ) : (
              <div className="flex flex-col gap-1 flex-1">
                {m365.mails.slice(0, 3).map((m) => (
                  <a key={m.id} href={m.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{m.emne}</p>
                        <p className="text-[10px] text-muted-foreground shrink-0">{formatDato(m.modtaget)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.afsender}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground/50 border-t border-border pt-3">Klik for at åbne i Outlook</p>
          </div>
        </div>

        {/* Dagens mål */}
        <div className="rounded-2xl bg-white border border-border flex flex-col min-h-[200px] hover:border-primary/30 transition-colors">
          <div className="flex flex-col flex-1 p-6 gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Dagens mål</h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">Fokus</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Hvad vil du nå i dag? Dine 3 vigtigste prioriteter vises her, når du tilføjer dem.
            </p>
            <p className="text-xs text-muted-foreground/50 border-t border-border pt-3">Klik for at redigere</p>
          </div>
        </div>
      </div>

      {/* Fokus-banner */}
      <div className="rounded-2xl bg-white border border-border px-7 py-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">Alt er forbundet — Outlook, Monday og mere</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sig "opdater data" til mig for at hente de seneste møder og opgaver.
          </p>
        </div>
        <span className="text-2xl">🎯</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className={`rounded-2xl px-6 py-5 ${primary ? "bg-primary/15 border border-primary/20" : "bg-white border border-border"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${primary ? "text-primary/70" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className={`text-4xl font-bold mt-2 ${primary ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
