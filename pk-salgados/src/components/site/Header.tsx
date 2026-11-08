"use client";
// Cabeçalho fixo: logo, menu, botão de pedido e sacola com contador.
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { PillButton } from "@/components/ui/PillButton";

export const NAV = [
  { href: "#inicio", label: "Início" },
  { href: "#salgados", label: "Salgados" },
  { href: "#doces", label: "Doces" },
  { href: "#promocoes", label: "Promoções" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#quem-somos", label: "Quem Somos" },
  { href: "#contato", label: "Contato" },
];

export function Header() {
  const { data, count, openCart, bump } = useShop();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bag = useAnimationControls();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pequena animação na sacola quando um item é adicionado.
  useEffect(() => {
    if (bump) bag.start({ scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, -12, 10, -4, 0], transition: { duration: 0.6 } });
  }, [bump, bag]);

  // Trava a rolagem da página com o menu aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background,box-shadow] duration-300 ${
        scrolled || open ? "bg-cream-50/95 shadow-[0_6px_20px_-12px_rgba(11,35,65,0.35)] backdrop-blur" : "bg-cream-50/70 backdrop-blur-sm"
      }`}
    >
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-6">
        <a href="#inicio" className="flex shrink-0 items-center" aria-label={`${data.content.marca.name} — início`}>
          <Image
            src={data.content.marca.logo_url || "/brand/logo.png"}
            alt={data.content.marca.name}
            width={410}
            height={240}
            priority
            className="h-12 w-auto sm:h-14"
          />
        </a>

        <nav aria-label="Menu principal" className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="relative rounded-full px-3 py-2 text-[0.92rem] font-medium text-navy transition-colors hover:text-gold-600 after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded after:bg-gold after:transition-transform hover:after:scale-x-100"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:block">
            <PillButton href="#salgados" size="sm" arrow>
              Faça seu pedido
            </PillButton>
          </span>
          <motion.button
            type="button"
            onClick={openCart}
            animate={bag}
            whileTap={{ scale: 0.9 }}
            className="relative grid h-11 w-11 place-items-center rounded-full bg-white text-navy shadow-card transition-colors hover:bg-cream"
            aria-label={`Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}`}
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[0.7rem] font-bold text-navy"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full text-navy lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-celular"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "m"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Menu do celular */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-celular"
            aria-label="Menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-navy/10 bg-cream-50 lg:hidden"
          >
            <motion.ul
              className="flex h-[calc(100dvh-68px)] flex-col gap-1 overflow-y-auto px-4 pb-8 pt-4"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
            >
              {NAV.map((n) => (
                <motion.li key={n.href} variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}>
                  <a
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3.5 font-title text-2xl text-navy hover:bg-cream"
                  >
                    {n.label}
                  </a>
                </motion.li>
              ))}
              <motion.li variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mt-4 px-2">
                <PillButton href="#salgados" size="lg" className="w-full" arrow onClick={() => setOpen(false)}>
                  Faça seu pedido
                </PillButton>
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
