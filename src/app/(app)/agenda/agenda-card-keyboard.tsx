"use client";

import type { ReactNode } from "react";

type AgendaCardKeyboardProps = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
};

export function AgendaCardKeyboard({ children, ariaLabel, className }: AgendaCardKeyboardProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    const primaryButton = event.currentTarget.querySelector<HTMLButtonElement>("[data-primary-action='true']");

    if (primaryButton) {
      primaryButton.click();
    }
  };

  return (
    <article
      tabIndex={0}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </article>
  );
}
