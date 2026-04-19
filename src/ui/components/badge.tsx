"use client";

interface BadgeProps {
  variant?: "default" | "success" | "danger" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-muted text-foreground",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-[#d2822b]/15 text-[#8a4f12]",
    info: "bg-primary/10 text-primary",
  };

  return (
    <span
      className={`inline-flex items-center rounded-[0.625rem] px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
