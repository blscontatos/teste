"use client";
// Depoimentos. Quando há mais do que cabem na tela, eles passam sozinhos para o lado
// em movimento contínuo e recomeçam sem "pular" (pausa ao passar o mouse/tocar).
// Para quem desativa animações no celular, viram uma fileira parada que dá para arrastar.
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play, Quote } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { Leaves, SectionTitle, Stars, Wave } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";
import type { Testimonial } from "@/lib/types";

function Card({ d }: { d: Testimonial }) {
  return (
    <figure className="relative flex h-full w-[260px] flex-col rounded-3xl bg-cream-50 p-5 shadow-card sm:w-[300px]">
      <Quote className="absolute right-4 top-4 h-7 w-7 text-gold/40" aria-hidden />
      <Stars n={d.stars} className="h-3.5 w-3.5" />
      <blockquote className="mt-3 flex-1 font-title text-[1.02rem] font-semibold leading-snug text-navy">“{d.text}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-sm font-bold text-navy" aria-hidden>
          {d.name.charAt(0)}
        </span>
        <span className="text-sm font-semibold text-navy">{d.name}</span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const { data } = useShop();
  const list = data.testimonials;
  const t = data.content.depoimentos;
  const reduce = useReducedMotion();
  const [fits, setFits] = useState(3);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  // Quantos cartões cabem lado a lado (cartão de ~300px + espaço).
  useEffect(() => {
    const update = () => setFits(Math.max(1, Math.floor(Math.min(window.innerWidth, 1280) / 320)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!list.length) return null;
  const moving = !reduce && list.length > fits;
  // Velocidade constante: ~6 segundos por depoimento.
  const duration = `${list.length * 6}s`;
  const stopped = paused || userPaused;

  return (
    <section id="depoimentos" className="relative">
      <Wave fill="#0B2341" />
      <div className="relative overflow-hidden bg-navy py-12 sm:py-16">
        <Leaves className="absolute -left-2 top-6 h-44 w-20 opacity-50" />
        <Leaves className="absolute -right-2 bottom-6 h-44 w-20 opacity-50" flip />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} light />
          </Reveal>
        </div>

        {moving ? (
          <div
            className="relative mt-8"
            role="region"
            aria-roledescription="carrossel"
            aria-label="Depoimentos de clientes"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            {/* Bordas esmaecidas para o cartão "entrar" e "sair" suavemente */}
            <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
              <div
                className="flex w-max animate-[pk-marquee_linear_infinite] py-2"
                style={{ animationDuration: duration, animationPlayState: stopped ? "paused" : "running" }}
              >
                {/* A lista aparece duas vezes: quando a primeira sai, a cópia já está no lugar → loop sem pulo */}
                {[0, 1].map((copy) => (
                  <ul key={copy} className="flex" aria-hidden={copy === 1}>
                    {list.map((d) => (
                      <li key={`${copy}-${d.id}`} className="px-2.5">
                        <Card d={d} />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Retomar movimento dos depoimentos" : "Pausar movimento dos depoimentos"}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {userPaused ? "Continuar" : "Pausar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
            <ul className="snap-row -mx-4 flex gap-5 overflow-x-auto px-4 py-2 sm:justify-center" aria-label="Depoimentos de clientes">
              {list.map((d) => (
                <li key={d.id} className="shrink-0">
                  <Card d={d} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Wave fill="#0B2341" flip />
    </section>
  );
}
