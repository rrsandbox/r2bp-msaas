"use client";

import React from "react";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className = "" }: DataTableProps) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border ${className}`}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

interface DataTableHeaderProps {
  children: React.ReactNode;
}

export function DataTableHeader({ children }: DataTableHeaderProps) {
  return <thead>{children}</thead>;
}

interface DataTableRowProps {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function DataTableRow({ children, hoverable = true }: DataTableRowProps) {
  return (
    <tr
      className={`border-b border-border ${
        hoverable ? "transition-colors hover:bg-surface-muted/50" : ""
      } bg-surface`}
    >
      {children}
    </tr>
  );
}

interface DataTableCellProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function DataTableCell({ children, align = "left", className = "" }: DataTableCellProps) {
  return (
    <td
      className={`px-4 py-3 text-sm ${
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

interface DataTableHeadProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

export function DataTableHead({ children, align = "left" }: DataTableHeadProps) {
  return (
    <th
      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted ${
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

interface DataTableBodyProps {
  children: React.ReactNode;
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
