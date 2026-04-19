"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-[122px] rounded-[0.875rem] border border-border bg-surface-muted" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="inline-flex items-center gap-1 rounded-[0.875rem] border border-border bg-surface-muted p-1 text-xs">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-[0.625rem] px-3 py-1.5 font-medium transition-colors ${
          !isDark ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
        }`}
        aria-label="Ativar tema claro"
      >
        Claro
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-[0.625rem] px-3 py-1.5 font-medium transition-colors ${
          isDark ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
        }`}
        aria-label="Ativar tema escuro"
      >
        Escuro
      </button>
    </div>
  );
}
