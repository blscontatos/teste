"use client";
// Quem Somos: texto, botão e foto das donas (de preferência PNG sem fundo).
import Image from "next/image";
import { useShop } from "@/components/order/ShopProvider";
import { Leaves } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";
import { PillButton } from "@/components/ui/PillButton";

export function About() {
  const { data } = useShop();
  const q = data.content.quem_somos;
  // PNG/WebP com transparência = "recortada, sem fundo" (fica solta sobre o círculo).
  const isCutout = /\.png($|\?)/i.test(q.image_url);

  return (
    <section id="quem-somos" className="relative overflow-hidden py-14 sm:py-20">
      <Leaves className="absolute right-0 top-8 hidden h-60 w-28 opacity-60 md:block" flip />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-14">
        <Reveal className="order-2 md:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{q.eyebrow}</p>
          <h2 className="mt-2 font-title text-4xl text-navy sm:text-5xl">{q.title}</h2>
          <div className="mt-3 flex items-center gap-2" aria-hidden>
            <span className="h-px w-10 bg-gold" />
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          </div>
          <div className="mt-5 space-y-4 text-[1.02rem] leading-relaxed text-muted">
            {q.text.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <PillButton href="#salgados" size="lg" arrow className="mt-8">
            {q.cta_label}
          </PillButton>
        </Reveal>

        <Reveal className="order-1 md:order-2" delay={0.1}>
          <div className="relative mx-auto aspect-square w-full max-w-[460px]">
            <div className="absolute inset-[6%] rounded-full bg-navy" aria-hidden />
            <div className="absolute inset-[4%] rounded-full border-4 border-gold" aria-hidden />
            {q.image_url &&
              (isCutout ? (
                <Image src={q.image_url} alt={q.image_alt} fill sizes="(max-width: 768px) 90vw, 460px" className="object-contain object-bottom drop-shadow-2xl" />
              ) : (
                <div className="absolute inset-[9%] overflow-hidden rounded-full">
                  <Image src={q.image_url} alt={q.image_alt} fill sizes="(max-width: 768px) 80vw, 420px" className="object-cover" />
                </div>
              ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
