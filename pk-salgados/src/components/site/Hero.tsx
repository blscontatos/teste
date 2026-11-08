"use client";
// Seção principal: selo, título, subtítulo, botão e imagens (bolo + coxinha) com parallax leve.
import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { PillButton } from "@/components/ui/PillButton";
import { Leaves, Wave } from "@/components/ui/Decor";
import { waLink } from "@/lib/whatsapp";

export function Hero() {
  const { data } = useShop();
  const h = data.content.hero;
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yMain = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const ySec = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -50]);

  const ease = [0.22, 1, 0.36, 1] as const;
  // Quantidade de sabores cadastrados (arredondada para baixo, de 10 em 10).
  const totalFlavors = data.products.reduce((s, p) => s + p.flavors.length, 0);
  const flavorsBadge = totalFlavors >= 10 ? `+${Math.floor(totalFlavors / 10) * 10}` : String(totalFlavors);

  return (
    <section id="inicio" ref={ref} className="relative overflow-hidden bg-cream pt-[68px] sm:pt-[76px]">
      {/* Mancha azul no canto, como no layout */}
      <div aria-hidden className="absolute -right-16 -top-24 hidden h-[520px] w-[520px] rounded-full bg-navy md:block" />
      <div aria-hidden className="absolute -right-16 -top-24 hidden h-[532px] w-[532px] rounded-full border-4 border-gold/80 md:block" />
      <Leaves className="absolute -left-4 bottom-10 hidden h-64 w-28 opacity-70 md:block" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-6 pt-8 sm:px-6 md:grid-cols-2 md:gap-6 md:pb-16 md:pt-16">
        <div className="relative z-10 text-center md:text-left">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-navy"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
            {h.badge}
          </motion.p>
          <h1 className="mt-5 font-title text-[2.6rem] leading-[1.05] text-navy sm:text-6xl lg:text-7xl">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
            >
              {h.title_line1}
            </motion.span>
            <motion.span
              className="relative block text-gold-600"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
            >
              {h.title_line2}
            </motion.span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="mx-auto mt-5 max-w-md text-base text-muted sm:text-lg md:mx-0"
          >
            {h.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease }}
            className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start"
          >
            <PillButton href="#salgados" size="lg" arrow>
              {h.cta_label}
            </PillButton>
            {data.settings.whatsapp && (
              <PillButton href={waLink(data.settings.whatsapp, "Olá! Gostaria de fazer um pedido.")} variant="outline" size="lg" whatsapp>
                Pedir no WhatsApp
              </PillButton>
            )}
          </motion.div>
        </div>

        {/* Imagens */}
        <div className="relative mx-auto h-[330px] w-full max-w-[460px] sm:h-[440px] md:h-[520px] md:max-w-none">
          {/* No celular, o círculo azul fica atrás das fotos */}
          <div aria-hidden className="absolute -right-10 top-[4%] aspect-square h-[86%] rounded-full bg-navy md:hidden" />
          <div aria-hidden className="absolute -right-12 top-[2%] aspect-square h-[90%] rounded-full border-4 border-gold/80 md:hidden" />
          <motion.div
            style={{ y: yMain }}
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="absolute right-[6%] top-0 h-[88%] w-[66%] overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-card-hover"
          >
            <Image src={h.image_main} alt={h.image_main_alt} fill priority sizes="(max-width: 768px) 70vw, 34vw" className="object-cover" />
          </motion.div>
          <motion.div
            style={{ y: ySec }}
            initial={{ opacity: 0, x: -40, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.45, ease }}
            className="absolute bottom-[2%] left-0 h-[46%] w-[52%] overflow-hidden rounded-full border-[6px] border-white shadow-card-hover"
          >
            <Image src={h.image_secondary} alt={h.image_secondary_alt} fill sizes="(max-width: 768px) 50vw, 26vw" className="object-cover" />
          </motion.div>
          {totalFlavors > 0 && <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8, type: "spring" }}
            className="absolute right-0 bottom-[14%] rounded-2xl bg-white px-4 py-3 shadow-card"
          >
            <p className="font-title text-xl leading-none text-navy">{flavorsBadge}</p>
            <p className="text-[0.7rem] font-medium text-muted">sabores</p>
          </motion.div>}
        </div>
      </div>
      <Wave fill="#FFF7EE" />
    </section>
  );
}
