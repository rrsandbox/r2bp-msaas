"use client";

import React from "react";

interface SearchBoxProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  defaultValue?: string;
  className?: string;
}

export function SearchBox({
  placeholder = "Buscar...",
  onChange,
  className = "",
  ...props
}: SearchBoxProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className={`h-10 rounded-lg border border-border bg-background px-3 text-sm placeholder-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
      {...props}
    />
  );
}

interface FilterProps {
  children: React.ReactNode;
  className?: string;
}

export function Filter({ children, className = "" }: FilterProps) {
  return <div className={`flex flex-wrap items-end gap-3 ${className}`}>{children}</div>;
}

interface FilterGroupProps {
  label?: string;
  children: React.ReactNode;
}

export function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      {children}
    </div>
  );
}
