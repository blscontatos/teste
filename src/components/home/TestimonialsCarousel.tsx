"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Quote, Star } from "lucide-react";

export type CarouselTestimonial = { id: string; client_name: string; region: string | null; content: string; rating: number };

/** Velocidade da rolagem automática, em pixels por segundo (bem devagar). */
const SPEED = 22;
/** Tempo para voltar a rolar sozinho depois que a pessoa interage. */
const RESUME_AFTER_MS = 4000;

export function TestimonialsCarousel({ items, isDemo }: { items: CarouselTestimonial[]; isDemo: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false); // pausa escolhida pelo visitante (botão)
  const hovering = useRef(false);
  const holdUntil = useRef(0);
  const dragging = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const reduced = useRef(false);

  // Repete a lista para o loop ser contínuo
  const loop = items.length > 1;
  const rendered = loop ? [...items, ...items] : items;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPaused(true);
  }, []);

  const hold = () => (holdUntil.current = performance.now() + RESUME_AFTER_MS);

  // Mantém a posição dentro da primeira cópia (loop infinito sem "pulo" visível)
  const wrap = useCallback(() => {
    const el = trackRef.current;
    if (!el || !loop) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft <= 0) el.scrollLeft += half;
  }, [loop]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return;
    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const active = !paused && !hovering.current && !dragging.current && now > holdUntil.current && !document.hidden;
      if (active) {
        carry += (SPEED * dt) / 1000;
        const step = Math.floor(carry);
        if (step >= 1) {
          el.scrollLeft += step;
          carry -= step;
          wrap();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, loop, wrap]);

  function go(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    hold();
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    const half = el.scrollWidth / 2;
    if (loop && dir === -1 && el.scrollLeft < step) el.scrollLeft += half;
    if (loop && dir === 1 && el.scrollLeft + step >= half) el.scrollLeft -= half;
    el.scrollBy({ left: dir * step, behavior: reduced.current ? "auto" : "smooth" });
  }

  // Arrastar com o mouse (no toque, a rolagem nativa já funciona)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current!;
    dragging.current = { x: e.clientX, left: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragging.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 3) d.moved = true;
    trackRef.current!.scrollLeft = d.left - dx;
    wrap();
  };
  const endDrag = () => {
    if (dragging.current) hold();
    dragging.current = null;
  };

  return (
    <div className="relative mt-14" aria-roledescription="carrossel" aria-label="Depoimentos de clientes">
      <div
        ref={trackRef}
        className="no-scrollbar flex cursor-grab gap-6 overflow-x-auto px-5 pb-4 select-none active:cursor-grabbing sm:px-8 lg:px-12"
        onMouseEnter={() => (hovering.current = true)}
        onMouseLeave={() => {
          hovering.current = false;
          endDrag();
        }}
        onTouchStart={hold}
        onTouchEnd={hold}
        onWheel={hold}
        onFocus={() => (hovering.current = true)}
        onBlur={() => (hovering.current = false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onScroll={() => !dragging.current && wrap()}
      >
        {rendered.map((t, i) => {
          const clone = loop && i >= items.length;
          return (
            <figure
              key={`${t.id}-${i}`}
              data-card
              aria-hidden={clone || undefined}
              className="relative flex w-[82vw] max-w-[420px] shrink-0 flex-col rounded-[28px] border border-line bg-white p-8 transition-shadow duration-500 hover:shadow-[0_30px_60px_-35px_rgba(13,13,12,0.35)] sm:w-[420px]"
            >
              {isDemo && <span className="chip absolute top-6 right-6 bg-sand text-stone">Exemplo</span>}
              <Quote className="h-8 w-8 text-gold" strokeWidth={1.2} />
              <div className="mt-5 flex gap-0.5" aria-label={`Avaliação: ${t.rating} de 5 estrelas`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={`h-4 w-4 ${s < t.rating ? "fill-gold text-gold" : "text-stone-light"}`} />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 font-display text-[1.3rem] leading-snug text-ink/85">“{t.content}”</blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-display text-lg text-gold-light">{t.client_name.charAt(0)}</span>
                <span>
                  <span className="block font-semibold">{t.client_name}</span>
                  {t.region && <span className="block text-xs text-stone">{t.region}</span>}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Esmaecimento nas bordas */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-sand to-transparent sm:w-20" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-sand to-transparent sm:w-20" />

      {loop && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button type="button" onClick={() => go(-1)} className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white transition hover:border-gold" aria-label="Depoimento anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold transition hover:border-gold"
            aria-pressed={paused}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? "Continuar" : "Pausar"}
          </button>
          <button type="button" onClick={() => go(1)} className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white transition hover:border-gold" aria-label="Próximo depoimento">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
