"use client";
// Seção principal, no layout aprovado pela loja: texto à esquerda (selo com traços dourados,
// título em duas linhas, pincelada dourada, subtítulo e botão do WhatsApp) e a foto do bolo
// com a coxinha ocupando a metade direita, de ponta a ponta, por trás do cabeçalho.
// As medidas seguem as proporções do modelo (1024 × 391 px).
import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Wave } from "@/components/ui/Decor";
import { waLink } from "@/lib/whatsapp";

/** Cor do fundo da foto do modelo, para a foto "derreter" na área do texto. */
const HERO_BG = "#FAECDE";

/** Pincelada dourada embaixo do título. */
function Swash({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M2 13 C 70 4, 170 2, 298 6 C 200 7, 110 10, 4 16 Z" fill="#E8A33A" />
    </svg>
  );
}

export function Hero() {
  const { data } = useShop();
  const h = data.content.hero;
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const ease = [0.22, 1, 0.36, 1] as const;
  const orderLink = data.settings.whatsapp ? waLink(data.settings.whatsapp, "Olá! Gostaria de fazer um pedido.") : "#salgados";

  const fade = (delay: number, y = 22) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  });

  return (
    <section id="inicio" ref={ref} className="relative overflow-hidden" style={{ backgroundColor: HERO_BG }}>
      <div className="relative lg:h-[38.2vw]">
        {/* Foto: metade direita no computador; em cima, largura total, no celular */}
        <motion.div
          style={{ y: yImg }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
          className="relative aspect-[1288/782] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[63%]"
        >
          {h.image_main && (
            <Image src={h.image_main} alt={h.image_main_alt} fill priority sizes="(max-width: 1024px) 100vw, 63vw" className="object-cover object-right" />
          )}
          {/* degradê para a foto se misturar com o fundo do texto */}
          <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[12%] lg:block" style={{ background: `linear-gradient(to right, ${HERO_BG}, transparent)` }} />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[18%] lg:hidden" style={{ background: `linear-gradient(to top, ${HERO_BG}, transparent)` }} />
        </motion.div>

        {/* Texto */}
        <div className="relative z-10 flex flex-col items-center px-5 pb-10 text-center lg:absolute lg:inset-y-0 lg:left-0 lg:w-[46%] lg:items-start lg:justify-end lg:px-0 lg:pb-[1.85vw] lg:pl-[4.4vw] lg:text-left">
          <motion.p {...fade(0, 14)} className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-navy lg:text-[clamp(0.72rem,1.07vw,1rem)]">
            <span aria-hidden className="h-[2px] w-8 rounded bg-gold lg:w-[5.6vw] lg:max-w-[90px]" />
            {h.badge}
            <span aria-hidden className="h-[2px] w-8 rounded bg-gold lg:w-[3.2vw] lg:max-w-[52px]" />
          </motion.p>

          <h1 className="mt-3 font-serif font-extrabold leading-[1.02] text-navy lg:mt-[0.9vw]">
            <motion.span {...fade(0.1, 30)} className="block text-[1.8rem] sm:text-5xl lg:text-[clamp(1.9rem,3.55vw,4.3rem)]">
              {h.title_line1}
            </motion.span>
            <motion.span {...fade(0.22, 30)} className="block italic text-[2.15rem] sm:text-6xl lg:text-[clamp(2.3rem,4.45vw,5.3rem)]">
              {h.title_line2}
            </motion.span>
          </h1>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.45, ease }}
            className="mt-1 w-[78%] max-w-[360px] origin-left lg:ml-[10.5vw] lg:mt-[0.2vw] lg:w-[24.5vw] lg:max-w-[480px]"
          >
            <Swash className="h-3 w-full lg:h-[1.3vw]" />
          </motion.div>

          <motion.p {...fade(0.35)} className="mt-4 max-w-[30rem] text-[0.98rem] leading-relaxed text-ink/85 lg:mt-[1.1vw] lg:max-w-[29.6vw] lg:text-[clamp(0.78rem,1.3vw,1.3rem)] lg:leading-[1.55]">
            {h.subtitle}
          </motion.p>

          <motion.div {...fade(0.5)} className="w-full lg:w-auto">
          <motion.a
            href={orderLink}
            target={orderLink.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, boxShadow: "0 14px 28px -10px rgba(11,35,65,0.55)" }}
            whileTap={{ scale: 0.96 }}
            className="group mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-full bg-navy px-6 py-3.5 font-semibold text-white shadow-pill transition-colors hover:bg-navy-700 lg:mt-[1.9vw] lg:w-auto lg:max-w-none lg:gap-[0.8vw] lg:px-[2vw] lg:py-[0.95vw] lg:text-[clamp(0.8rem,1.32vw,1.25rem)]"
          >
            <WhatsAppIcon className="h-5 w-5 text-gold lg:h-[2.2vw] lg:max-h-9 lg:w-[2.2vw] lg:max-w-9" />
            {h.cta_label}
            <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 lg:h-[1.4vw] lg:max-h-6 lg:w-[1.4vw] lg:max-w-6" />
          </motion.a>
          </motion.div>
        </div>
      </div>
      <Wave fill="#FFF7EE" />
    </section>
  );
}
