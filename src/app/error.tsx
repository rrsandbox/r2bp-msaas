"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App segment error:", error);
  }, [error]);

  return (
    <main className="app-shell flex flex-1 items-center py-10">
      <section className="glass-panel mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-[1.125rem] p-8">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-danger">Falha tratada</span>
        <h1 className="text-4xl font-semibold tracking-tight">Nao foi possivel carregar esta pagina</h1>
        <p className="text-sm leading-7 text-muted">
          A excecao foi capturada pelo boundary global do App Router. Tente novamente ou volte ao dashboard.
        </p>
        <div className="flex gap-3">
          <button className="h-11 rounded-[0.875rem] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" onClick={reset}>
            Tentar novamente
          </button>
          <a href="/dashboard" className="inline-flex h-11 items-center rounded-[0.875rem] border border-border px-5 text-sm font-medium transition-colors hover:bg-surface-muted/50 hover:border-border/70">
            Ir para dashboard
          </a>
        </div>
      </section>
    </main>
  );
}