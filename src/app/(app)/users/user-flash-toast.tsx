"use client";

import { useEffect, useState } from "react";

type UserFlashToastProps = {
  kind: "success" | "error";
  message: string;
};

export function UserFlashToast({ kind, message }: UserFlashToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    const keyToDelete = kind === "success" ? "success" : "error";

    if (!url.searchParams.has(keyToDelete)) {
      return;
    }

    url.searchParams.delete(keyToDelete);
    const target = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", target);
  }, [kind]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  const toneClass =
    kind === "success"
      ? "border-success/50 bg-success/10 text-success"
      : "border-danger/50 bg-danger/10 text-danger";

  return (
    <div className="fixed right-4 top-4 z-50 w-full max-w-md">
      <div role="status" aria-live="polite" className={`rounded-2xl border p-4 shadow-lg backdrop-blur ${toneClass}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium">{message}</p>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-full border border-current/30 px-2 py-0.5 text-xs"
            aria-label="Fechar notificacao"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
