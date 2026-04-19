"use client";

import { useRef, useEffect, useState } from "react";
import { logoutAction } from "@/app/(app)/user-menu-actions";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Menu Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-[4px] border border-border bg-surface-elevated px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-muted"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-accent-warm/20 text-xs font-bold text-accent-warm">
          U
        </div>
        <span className="hidden sm:inline text-foreground">Usuário</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-[4px] border border-border bg-surface-elevated shadow-lg z-50">
          {/* Perfil */}
          <a
            href="/perfil"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Meu Perfil
          </a>

          {/* Notificações */}
          <a
            href="/notificacoes"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted relative"
          >
            <div className="relative">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger"></span>
            </div>
            Avisos
          </a>

          {/* Logout */}
          <button
            onClick={async () => {
              setIsOpen(false);
              await logoutAction();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
