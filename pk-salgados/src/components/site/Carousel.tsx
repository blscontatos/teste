"use client";
// Carrossel leve: rolagem nativa com "encaixe" (arrastar no celular), setas e indicadores.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Carousel({ children, label }: { children: React.ReactNode[]; label: string }) {
  const row = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil((el.scrollWidth - 4) / el.clientWidth));
    setPages(total);
    const max = el.scrollWidth - el.clientWidth;
    setPage(max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (total - 1)));
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
  }, []);

  useEffect(() => {
    measure();
    const el = row.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children.length]);

  const go = (dir: number) => {
    const el = row.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  const goTo = (i: number) => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: pages > 1 ? (max * i) / (pages - 1) : 0, behavior: "smooth" });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carrossel" aria-label={label}>
      <div
        ref={row}
        onScroll={measure}
        className="snap-row -mx-4 flex gap-4 overflow-x-auto px-4 pb-6 pt-2 sm:-mx-6 sm:gap-6 sm:px-6"
        tabIndex={0}
      >
        {children}
      </div>

      {pages > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={edges.start}
            aria-label="Anterior"
            className="absolute -left-2 top-[42%] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-navy text-white shadow-pill transition hover:scale-105 disabled:opacity-0 md:grid lg:-left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={edges.end}
            aria-label="Próximo"
            className="absolute -right-2 top-[42%] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-navy text-white shadow-pill transition hover:scale-105 disabled:opacity-0 md:grid lg:-right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-1 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir para a página ${i + 1}`}
                aria-current={i === page}
                className={`h-2.5 rounded-full transition-all duration-300 ${i === page ? "w-7 bg-gold" : "w-2.5 bg-navy/25 hover:bg-navy/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
