"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  Target,
  NotebookPen,
  Bot,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Min arbejdsdag",  href: "/",            icon: LayoutDashboard },
  { label: "Medieovervågning",href: "/medier",       icon: Newspaper       },
  { label: "SoMe performance",href: "/some",         icon: TrendingUp      },
  { label: "Konkurrentanalyse",href: "/konkurrenter",icon: Target          },
  { label: "Notes / dagbog", href: "/notes",        icon: NotebookPen     },
  { label: "Chatbot",         href: "/chatbot",      icon: Bot             },
  { label: "Idéudvikling",    href: "/ideer",        icon: Lightbulb       },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col bg-white border-r border-border">

      {/* Avatar / bruger-sektion */}
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              Mathilde
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              Kommunikation · Saphe
            </p>
          </div>
        </div>
      </div>

      {/* Saphe app-titel */}
      <div className="flex items-center gap-2.5 px-5 py-3">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[10px] shrink-0">
          S
        </div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground/60"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4">
        <div className="rounded-xl bg-primary/8 px-4 py-3">
          <p className="text-xs font-medium text-primary">
            Klar til en stærk dag? 🚦
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Danmarks største trafikfællesskab
          </p>
        </div>
      </div>
    </aside>
  );
}

function Avatar() {
  const [imgFejl, setImgFejl] = useState(false);

  if (!imgFejl) {
    return (
      <img
        src="/avatar.jpg"
        alt="Mathilde"
        onError={() => setImgFejl(true)}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
      />
    );
  }

  // Fallback: initialer
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-primary">M</span>
    </div>
  );
}
