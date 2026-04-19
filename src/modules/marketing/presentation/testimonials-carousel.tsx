"use client";

import { useMemo, useState } from "react";

import { Button } from "@/ui/components/button";
import { cn } from "@/lib/utils/cn";
import type { LandingPublicComment } from "@/modules/marketing/application/public-comment-service";

type TestimonialsCarouselProps = {
  items: LandingPublicComment[];
};

export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = items.length;

  const sorted = useMemo(
    () => [...items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [items],
  );

  const goNext = () => {
    if (total === 0) {
      return;
    }

    setActiveIndex((current) => (current + 1) % total);
  };

  const goPrev = () => {
    if (total === 0) {
      return;
    }

    setActiveIndex((current) => (current - 1 + total) % total);
  };

  if (total === 0) {
    return (
      <article className="glass-panel rounded-[1.75rem] p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Depoimentos</p>
        <p className="mt-4 text-base leading-7 text-muted">
          Ainda nao existem comentarios publicados por super usuarios de tenant.
        </p>
      </article>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {sorted.map((item) => (
            <article key={item.id} className="glass-panel w-full shrink-0 rounded-[1.75rem] p-6">
              <p className="text-base leading-7 text-foreground">"{item.comment}"</p>
              <p className="mt-6 text-sm font-semibold">{item.authorName}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                {item.authorRole} · {item.tenantName}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {activeIndex + 1} / {total}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={goPrev} aria-label="Comentario anterior">
            Anterior
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={goNext} aria-label="Proximo comentario">
            Proximo
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sorted.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "h-1.5 min-w-7 rounded-full transition-colors",
              index === activeIndex ? "bg-primary" : "bg-border",
            )}
            onClick={() => setActiveIndex(index)}
            aria-label={`Ir para comentario ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
