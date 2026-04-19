"use client";

import { useState } from "react";

type DeleteCommentButtonProps = {
  className?: string;
  confirmMessage?: string;
};

export function DeleteCommentButton({
  className = "rounded-[4px] border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/15",
  confirmMessage = "Tem certeza que deseja excluir este comentario da landing?",
}: DeleteCommentButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button type="button" className={className} onClick={() => setIsConfirming(true)}>
        Excluir
      </button>
    );
  }

  return (
    <div className="rounded-[4px] border border-danger/30 bg-danger/5 p-2">
      <p className="text-xs text-danger">{confirmMessage}</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          className="rounded-[4px] border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Cancelar
        </button>
        <button type="submit" className={className}>
          Confirmar exclusao
        </button>
      </div>
    </div>
  );
}
