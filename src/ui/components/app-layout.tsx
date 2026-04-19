"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type RoleKey } from "@prisma/client";
import { Sidebar } from "@/ui/components/sidebar";
import { UserMenu } from "@/ui/components/user-menu";
import { type AppNavigationItem } from "@/config/app-navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  navigationItems: AppNavigationItem[];
  appName?: string;
  currentTenant?: string;
  role: RoleKey;
  isProfileComplete: boolean;
  tenantOnboardingStatus?: string;
}

export function AppLayout({
  children,
  navigationItems,
  appName = "R2BP",
  currentTenant,
  role,
  isProfileComplete,
  tenantOnboardingStatus,
}: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mainContentRef = useRef<HTMLElement | null>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    if (!mainContentRef.current) {
      return;
    }

    mainContentRef.current.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/perfil") {
      return;
    }

    if (!isProfileComplete) {
      router.replace("/perfil?step=profile");
      return;
    }

    if (role === "ADMIN" && tenantOnboardingStatus !== "COMPLETED") {
      router.replace("/perfil?step=tenant");
    }
  }, [isProfileComplete, pathname, role, router, tenantOnboardingStatus]);

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <Sidebar items={navigationItems} appName={appName} />

      <div className="flex h-screen flex-col md:ml-64">
        <div className="shrink-0 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--highlight-soft)] text-xs font-bold text-[var(--accent-warm)]">
                R2
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Workspace</p>
                <h1 className="text-base font-semibold">{appName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserMenu />
            </div>
          </div>
          {currentTenant && <p className="mt-2 text-xs text-muted">Tenant atual: {currentTenant}</p>}
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as any}
                className={`whitespace-nowrap rounded-[0.75rem] border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive(item.href)
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {currentTenant && (
          <header className="hidden shrink-0 border-b border-border bg-surface px-8 py-4 md:flex md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Tenant Atual</p>
              <h2 className="text-lg font-semibold text-foreground">{currentTenant}</h2>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
            </div>
          </header>
        )}

        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="app-shell">{children}</div>
        </main>
      </div>
    </div>
  );
}
