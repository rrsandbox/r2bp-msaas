"use client";

import { useFormStatus } from "react-dom";

type AgendaSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  className: string;
  pendingClassName?: string;
  primaryAction?: boolean;
};

export function AgendaSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  pendingClassName,
  primaryAction,
}: AgendaSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      data-primary-action={primaryAction ? "true" : undefined}
      className={`${className} ${pending ? `cursor-not-allowed opacity-60 ${pendingClassName ?? ""}` : ""}`.trim()}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
