"use client";

import { useMemo, useState } from "react";

import { Button } from "@/ui/components";

type DashboardCommentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  returnTo?: string;
};

const COMMENT_MIN = 8;
const COMMENT_MAX = 400;

export function DashboardCommentForm({ action, returnTo = "/dashboard" }: DashboardCommentFormProps) {
  const [comment, setComment] = useState("");

  const characterCount = comment.length;
  const trimmedLength = useMemo(() => comment.trim().length, [comment]);
  const isWithinLimit = characterCount <= COMMENT_MAX;
  const isValid = trimmedLength >= COMMENT_MIN && isWithinLimit;

  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      <textarea
        name="comment"
        minLength={COMMENT_MIN}
        maxLength={COMMENT_MAX}
        required
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Escreva um comentario curto sobre a experiencia do tenant..."
        className="min-h-28 w-full rounded-[4px] border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs ${isValid ? "text-muted" : "text-danger"}`}>
          {characterCount}/{COMMENT_MAX} caracteres • minimo {COMMENT_MIN}
        </p>
        <Button type="submit" variant="primary" disabled={!isValid}>
          Publicar comentario
        </Button>
      </div>
    </form>
  );
}
