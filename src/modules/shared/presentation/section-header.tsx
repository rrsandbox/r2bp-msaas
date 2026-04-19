import { cn } from "@/lib/utils/cn";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeader({ eyebrow, title, description, align = "left" }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3", align === "center" && "items-center text-center")}>
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</span>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="max-w-2xl text-pretty text-base leading-7 text-muted">{description}</p>
    </div>
  );
}