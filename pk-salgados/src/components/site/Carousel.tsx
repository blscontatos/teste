"use client";
// Carrossel leve: rolagem nativa com "encaixe" (arrastar no celular), setas FORA dos cartões
// e passagem suave (animação com aceleração e freio), cartão por cartão.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Curva de animação: começa devagar, acelera e freia no final. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function Carousel({ children, label }: { children: React.ReactNode[]; label: string }) {
  const row = useRef<HTMLDivElement>(null);
  const anim = useRef(0);
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
    return () => {
      ro.disconnect();
      cancelAnimationFrame(anim.current);
    };
  }, [measure, children.length]);

  /** Rola até a posição com animação suave (sem animação para quem prefere menos movimento). */
  const scrollToSmooth = (target: number) => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const to = Math.max(0, Math.min(max, target));
    const from = el.scrollLeft;
    cancelAnimationFrame(anim.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(to - from) < 2) {
      el.scrollLeft = to;
      return;
    }
    // O "encaixe" é desligado durante a animação para não brigar com ela.
    el.style.scrollSnapType = "none";
    const duration = Math.min(900, 450 + Math.abs(to - from) * 0.35);
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      el.scrollLeft = from + (to - from) * easeInOutCubic(p);
      if (p < 1) anim.current = requestAnimationFrame(step);
      else el.style.scrollSnapType = "";
    };
    anim.current = requestAnimationFrame(step);
  };

  /** Posição de rolagem de cada cartão (alinhada ao início, como o encaixe). */
  const cardPositions = () => {
    const el = row.current;
    if (!el) return [];
    const items = Array.from(el.children) as HTMLElement[];
    const first = items[0]?.offsetLeft ?? 0;
    return items.map((c) => c.offsetLeft - first);
  };

  const go = (dir: number) => {
    const el = row.current;
    if (!el) return;
    const pos = cardPositions();
    if (!pos.length) return;
    const current = pos.reduce((best, p, i) => (Math.abs(p - el.scrollLeft) < Math.abs(pos[best] - el.scrollLeft) ? i : best), 0);
    const cardStep = pos[1] ?? el.clientWidth;
    const perView = Math.max(1, Math.floor((el.clientWidth + 8) / cardStep));
    const next = Math.max(0, Math.min(pos.length - 1, current + dir * perView));
    scrollToSmooth(pos[next]);
  };
  const goTo = (i: number) => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = cardPositions();
    const target = pages > 1 ? (max * i) / (pages - 1) : 0;
    // Vai para o cartão mais próximo dessa página, para terminar encaixado.
    const nearest = pos.reduce((best, p) => (Math.abs(p - target) < Math.abs(best - target) ? p : best), 0);
    scrollToSmooth(i === pages - 1 ? max : nearest);
  };

  return (
    <div className="relative md:px-14" role="region" aria-roledescription="carrossel" aria-label={label}>
      <div
        ref={row}
        onScroll={measure}
        onPointerDown={() => cancelAnimationFrame(anim.current)}
        className="snap-row -mx-4 flex scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 pt-2 sm:-mx-6 sm:scroll-px-6 sm:gap-6 sm:px-6 md:mx-0 md:scroll-px-1 md:px-1"
        tabIndex={0}
      >
        {children}
      </div>

      {pages > 1 && (
        <>
          {/* Setas na lateral, fora dos cartões */}
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={edges.start}
            aria-label="Anterior"
            className="absolute left-0 top-[42%] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-navy text-white shadow-pill transition hover:scale-105 active:scale-95 disabled:cursor-default disabled:opacity-25 md:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={edges.end}
            aria-label="Próximo"
            className="absolute right-0 top-[42%] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-navy text-white shadow-pill transition hover:scale-105 active:scale-95 disabled:cursor-default disabled:opacity-25 md:grid"
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
                className={`h-2.5 rounded-full transition-all duration-500 ${i === page ? "w-7 bg-gold" : "w-2.5 bg-navy/25 hover:bg-navy/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
