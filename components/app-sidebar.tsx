"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Newspaper,
  TrendingUp,
  Target,
  Bot,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Medieovervågning",  href: "/medier",       icon: Newspaper  },
  { label: "SoMe performance",  href: "/some",         icon: TrendingUp },
  { label: "Konkurrentanalyse", href: "/konkurrenter", icon: Target     },
  { label: "Chatbot",           href: "/chatbot",      icon: Bot        },
  { label: "Idéudvikling",      href: "/ideer",        icon: Lightbulb  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col bg-white border-r border-border">

      {/* Saphe logo-header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Image
            src="/saphe-logo.png"
            alt="Saphe"
            width={100}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
          <p className="text-xs font-semibold text-primary">
            Danmarks største trafikfællesskab 🚦
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            saphe.com
          </p>
        </div>
      </div>

    </aside>
  );
}
