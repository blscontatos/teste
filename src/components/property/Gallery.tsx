"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { PropertyImage } from "@/lib/types";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";

export function Gallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const total = images.length;

  const go = useCallback((d: number) => setActive((i) => (i + d + total) % total), [total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  // Gestos de deslizar no celular
  const [touchX, setTouchX] = useState<number | null>(null);
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => setTouchX(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      setTouchX(null);
    },
  };

  if (!total) return <ArtPlaceholder className="aspect-[16/10] rounded-[32px]" label="Fotografias em breve" />;

  const current = images[active];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative aspect-[4/3] overflow-hidden rounded-[32px] bg-sand sm:aspect-[16/10]"
          aria-label="Ampliar fotografia"
          {...swipe}
        >
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt || `${title} — foto ${active + 1}`}
            fill
            priority
            sizes="(min-width:1024px) 70vw, 100vw"
            className="animate-fade-in object-cover transition-transform duration-[1.6s] ease-(--ease-luxe) group-hover:scale-[1.03]"
          />
          <span className="chip absolute right-5 bottom-5 bg-ink/75 py-2 text-white backdrop-blur">
            <Expand className="h-3.5 w-3.5" /> {active + 1} / {total}
          </span>
          {total > 1 && (
            <>
              <NavBtn side="left" onClick={(e) => (e.stopPropagation(), go(-1))} />
              <NavBtn side="right" onClick={(e) => (e.stopPropagation(), go(1))} />
            </>
          )}
        </button>
        <div className="hidden grid-rows-2 gap-3 lg:grid">
          {images.slice(1, 3).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                setActive(i + 1);
                setOpen(true);
              }}
              className="group relative overflow-hidden rounded-[24px] bg-sand"
              aria-label={`Ampliar foto ${i + 2}`}
            >
              <Image src={img.url} alt={img.alt || `${title} — foto ${i + 2}`} fill sizes="280px" className="object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
              {i === 1 && total > 3 && (
                <span className="absolute inset-0 grid place-items-center bg-ink/50 font-display text-2xl text-white">+{total - 3} fotos</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition-all duration-300 sm:h-20 sm:w-28 ${
                i === active ? "ring-2 ring-gold ring-offset-2" : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === active}
            >
              <Image src={img.url} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Galeria ampliada" className="fixed inset-0 z-[70] flex animate-fade-in flex-col bg-ink/95 backdrop-blur" {...swipe}>
          <div className="flex items-center justify-between p-4 text-white sm:p-6">
            <span className="text-sm text-white/60">
              {active + 1} / {total}
            </span>
            <button type="button" onClick={() => setOpen(false)} className="grid h-12 w-12 place-items-center rounded-full border border-white/20 hover:bg-white/10" aria-label="Fechar galeria">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex-1">
            <Image key={current.id} src={current.url} alt={current.alt || title} fill sizes="100vw" className="animate-fade-in object-contain" />
            {total > 1 && (
              <>
                <NavBtn side="left" onClick={() => go(-1)} dark />
                <NavBtn side="right" onClick={() => go(1)} dark />
              </>
            )}
          </div>
          <div className="h-6" />
        </div>
      )}
    </div>
  );
}

function NavBtn({ side, onClick, dark }: { side: "left" | "right"; onClick: (e: React.MouseEvent) => void; dark?: boolean }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick(e as unknown as React.MouseEvent)}
      aria-label={side === "left" ? "Foto anterior" : "Próxima foto"}
      className={`absolute top-1/2 ${side === "left" ? "left-4" : "right-4"} grid h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full backdrop-blur transition hover:scale-105 ${
        dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/85 text-ink hover:bg-white"
      }`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
