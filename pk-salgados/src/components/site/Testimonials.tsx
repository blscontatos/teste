"use client";
// Depoimentos em carrossel com autoplay lento (pausa ao passar o mouse/tocar).
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, Quote } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { Leaves, SectionTitle, Stars, Wave } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";

export function Testimonials() {
  const { data } = useShop();
  const list = data.testimonials;
  const t = data.content.depoimentos;
  const reduce = useReducedMotion();
  const [perView, setPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const mq = [window.matchMedia("(min-width: 1024px)"), window.matchMedia("(min-width: 640px)")];
    const update = () => setPerView(mq[0].matches ? 3 : mq[1].matches ? 2 : 1);
    update();
    mq.forEach((m) => m.addEventListener("change", update));
    return () => mq.forEach((m) => m.removeEventListener("change", update));
  }, []);

  const pages = Math.max(1, Math.ceil(list.length / perView));
  const page = Math.min(index, pages - 1);

  const go = useCallback(
    (d: number) => {
      setDir(d);
      setIndex((i) => (Math.min(i, pages - 1) + d + pages) % pages);
    },
    [pages],
  );

  // Autoplay lento (7s). Desligado para quem prefere menos movimento.
  useEffect(() => {
    if (reduce || paused || userPaused || pages < 2) return;
    const timer = setInterval(() => go(1), 7000);
    return () => clearInterval(timer);
  }, [go, paused, userPaused, reduce, pages]);

  if (!list.length) return null;
  const visible = list.slice(page * perView, page * perView + perView);

  return (
    <section id="depoimentos" className="relative">
      <Wave fill="#0B2341" />
      <div className="relative overflow-hidden bg-navy py-14 sm:py-20">
        <Leaves className="absolute -left-2 top-6 h-52 w-24 opacity-50" />
        <Leaves className="absolute -right-2 bottom-6 h-52 w-24 opacity-50" flip />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} light />
          </Reveal>

          <div
            className="relative mt-10"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            role="region"
            aria-roledescription="carrossel"
            aria-label="Depoimentos de clientes"
          >
            <div className="overflow-hidden px-1 py-2">
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                  key={`${page}-${perView}`}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ x: d * 80, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d * -80, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  drag={pages > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(1);
                    else if (info.offset.x > 60) go(-1);
                  }}
                  className="grid cursor-grab gap-5 active:cursor-grabbing sm:grid-cols-2 lg:grid-cols-3"
                  aria-live={paused || userPaused ? "polite" : "off"}
                >
                  {visible.map((d) => (
                    <figure key={d.id} className="relative flex h-full flex-col rounded-[1.75rem] bg-cream-50 p-6 shadow-card sm:p-7">
                      <Quote className="absolute right-5 top-5 h-9 w-9 text-gold/40" aria-hidden />
                      <Stars n={d.stars} />
                      <blockquote className="mt-4 flex-1 font-title text-lg font-semibold leading-snug text-navy sm:text-xl">
                        “{d.text}”
                      </blockquote>
                      <figcaption className="mt-5 flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-gold font-bold text-navy" aria-hidden>
                          {d.name.charAt(0)}
                        </span>
                        <span className="font-semibold text-navy">{d.name}</span>
                      </figcaption>
                    </figure>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button type="button" onClick={() => go(-1)} aria-label="Depoimento anterior" className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white/10">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: pages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDir(i > page ? 1 : -1);
                        setIndex(i);
                      }}
                      aria-label={`Ir para o grupo ${i + 1}`}
                      aria-current={i === page}
                      className={`h-2.5 rounded-full transition-all duration-300 ${i === page ? "w-7 bg-gold" : "w-2.5 bg-white/30"}`}
                    />
                  ))}
                </div>
                <button type="button" onClick={() => go(1)} aria-label="Próximo depoimento" className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white transition hover:bg-white/10">
                  <ChevronRight className="h-5 w-5" />
                </button>
                {!reduce && (
                  <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    aria-label={userPaused ? "Retomar passagem automática" : "Pausar passagem automática"}
                    className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition hover:text-white"
                  >
                    {userPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Wave fill="#0B2341" flip />
    </section>
  );
}
