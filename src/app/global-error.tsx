"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global app crash:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="app-shell flex min-h-screen items-center py-10">
          <section className="glass-panel mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-[1.125rem] p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-danger">Erro global</span>
            <h1 className="text-4xl font-semibold tracking-tight">A aplicacao encontrou uma falha critica</h1>
            <p className="text-sm leading-7 text-muted">
              O erro foi capturado pelo boundary global. Voce pode tentar recarregar para recuperar a sessao.
            </p>
            <button className="h-11 w-fit rounded-[0.875rem] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" onClick={reset}>
              Recarregar
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}