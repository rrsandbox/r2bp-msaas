"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type AppNavigationItem } from "@/config/app-navigation";
import { ThemeToggle } from "@/ui/components/theme-toggle";

interface SidebarProps {
  items: AppNavigationItem[];
  appName: string;
}

export function Sidebar({ items, appName }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-border bg-surface md:block">
      <div className="mb-8 border-b border-border px-6 pb-5 pt-7">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--highlight-soft)] text-sm font-black text-[var(--accent-warm)]">
            R2
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{appName}</h1>
            <p className="text-xs text-muted">Multi-tenant SaaS</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-[var(--highlight-soft)] px-3 py-2 text-xs text-muted">
          Ambiente de gestão
        </div>
      </div>

      <nav className="space-y-1 px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href as any}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {item.icon && <span className="text-base opacity-90 group-hover:opacity-100">{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 text-xs text-muted">
        <div className="mb-3">
          <ThemeToggle />
        </div>
        <p>© 2026 R2BP</p>
        <p>v0.1.0-alpha</p>
      </div>
    </aside>
  );
}
