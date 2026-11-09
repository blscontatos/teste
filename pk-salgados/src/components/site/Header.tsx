"use client";
// Cabeçalho fixo no layout aprovado: transparente sobre a foto do topo (fica creme ao rolar),
// logo grande, menu com o item da seção visível marcado, sacola e botão do WhatsApp.
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { WhatsAppIcon } from "@/components/ui/icons";
import { waLink } from "@/lib/whatsapp";

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
  const [active, setActive] = useState("#inicio");
  const bag = useAnimationControls();
  const orderLink = data.settings.whatsapp ? waLink(data.settings.whatsapp, "Olá! Gostaria de fazer um pedido.") : "#salgados";
  const solid = scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Marca no menu a seção que está no meio da tela.
  useEffect(() => {
    const sections = NAV.map((n) => document.querySelector(n.href)).filter((el): el is Element => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
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
        solid ? "bg-cream-50/95 shadow-[0_6px_20px_-12px_rgba(11,35,65,0.35)] backdrop-blur" : "bg-transparent"
      }`}
    >
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Pular para o conteúdo
      </a>
      <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-6 lg:px-[4.4vw]">
        {/* No topo da página o logo fica grande e "transborda" sobre a foto, como no modelo */}
        <a
          href="#inicio"
          className={`flex shrink-0 items-center transition-all duration-300 ${solid ? "" : "lg:ml-[1.6vw] lg:mt-0.5 lg:self-start"}`}
          aria-label={`${data.content.marca.name} — início`}
        >
          <Image
            src={data.content.marca.logo_url || "/brand/logo.png"}
            alt={data.content.marca.name}
            width={578}
            height={447}
            priority
            className={`w-auto transition-all duration-300 ${solid ? "h-12 sm:h-14" : "h-14 sm:h-16 lg:h-[11.5vw] lg:max-h-[10rem]"}`}
          />
        </a>

        <nav aria-label="Menu principal" className="hidden lg:block">
          <ul className="flex items-center gap-[clamp(0.7rem,1.5vw,2.2rem)] whitespace-nowrap">
            {NAV.map((n) => {
              const isActive = active === n.href;
              return (
                <li key={n.href}>
                  <a
                    href={n.href}
                    aria-current={isActive ? "location" : undefined}
                    className={`relative py-2 text-[clamp(0.8rem,1.05vw,1rem)] text-navy transition-colors hover:text-gold-600 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:rounded after:bg-gold after:transition-transform after:duration-300 ${
                      isActive ? "font-bold after:scale-x-100" : "font-medium after:scale-x-0 hover:after:scale-x-100"
                    }`}
                  >
                    {n.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            type="button"
            onClick={openCart}
            animate={bag}
            whileTap={{ scale: 0.9 }}
            className="relative grid h-11 w-11 place-items-center rounded-full bg-white/90 text-navy shadow-card transition-colors hover:bg-cream"
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
          <motion.a
            href={orderLink}
            target={orderLink.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, boxShadow: "0 14px 28px -10px rgba(11,35,65,0.55)" }}
            whileTap={{ scale: 0.96 }}
            className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-navy px-5 py-2.5 font-semibold text-white shadow-pill transition-colors hover:bg-navy-700 sm:inline-flex lg:px-[1.6vw] lg:py-[0.85vw] lg:text-[clamp(0.82rem,1.2vw,1.1rem)]"
          >
            <WhatsAppIcon className="h-5 w-5 lg:h-[1.7vw] lg:max-h-7 lg:w-[1.7vw] lg:max-w-7" />
            Faça seu pedido
          </motion.a>
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
                <a
                  href={orderLink}
                  target={orderLink.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-navy px-7 py-3.5 font-semibold text-white shadow-pill"
                >
                  <WhatsAppIcon className="h-5 w-5" /> Faça seu pedido
                </a>
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
