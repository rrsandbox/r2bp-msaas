"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { deleteUserFeaturePermissionAction } from "@/app/(app)/acessos/actions";

type DeleteAccessPermissionButtonProps = {
  permissionId: string;
  userLabel: string;
  featureLabel: string;
  returnTo: string;
};

export function DeleteAccessPermissionButton({
  permissionId,
  userLabel,
  featureLabel,
  returnTo,
}: DeleteAccessPermissionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      triggerButtonRef.current?.focus();
      return;
    }

    cancelButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialogElement = dialogRef.current;

      if (!dialogElement) {
        return;
      }

      const focusableElements = dialogElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        ref={triggerButtonRef}
        onClick={() => setIsOpen(true)}
        className="h-9 rounded-full border border-danger/40 px-4 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
      >
        Remover permissao
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setIsOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            ref={dialogRef}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id={titleId} className="text-base font-semibold text-foreground">Confirmar remocao da permissao</h3>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              A permissao da feature {featureLabel} para {userLabel} sera removida. Deseja continuar?
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                ref={cancelButtonRef}
                onClick={() => setIsOpen(false)}
                className="h-9 rounded-full border border-border px-4 text-xs font-medium text-muted transition-colors hover:bg-surface-muted"
              >
                Cancelar
              </button>

              <form action={deleteUserFeaturePermissionAction}>
                <input type="hidden" name="permissionId" value={permissionId} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <SubmitDeleteButton />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SubmitDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-9 rounded-full border border-danger/40 px-4 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Removendo..." : "Confirmar remocao"}
    </button>
  );
}
