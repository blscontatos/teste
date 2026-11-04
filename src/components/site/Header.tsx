"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/imoveis?negocio=comprar", label: "Comprar" },
  { href: "/vender", label: "Vender seu imóvel" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header({ whatsappHref }: { whatsappHref: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname, search]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => {
    const [path, qs] = href.split("?");
    if (path === "/") return pathname === "/";
    if (qs) return pathname === path && search.toString() === qs;
    return pathname === path && (path !== "/imoveis" || !search.get("negocio"));
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-(--ease-luxe) ${
        scrolled ? "border-b border-line/80 bg-white/85 py-3 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl" : "bg-transparent py-5"
      }`}
    >
      <div className="container-luxe flex items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-1 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors duration-300 ${
                isActive(item.href) ? "text-ink" : "text-ink/60 hover:text-ink"
              }`}
            >
              {item.label}
              <span
                className={`absolute inset-x-4 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-500 ease-(--ease-luxe) ${
                  isActive(item.href) ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-dark hidden sm:inline-flex">
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            Falar no WhatsApp
          </a>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white/70 backdrop-blur xl:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-50 xl:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-ink text-white transition-transform duration-700 ease-(--ease-luxe) ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <Logo light />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/15"
              aria-label="Fechar menu"
              tabIndex={open ? 0 : -1}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Menu móvel" className="flex flex-1 flex-col gap-1 px-6 pt-8">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={open ? 0 : -1}
                className={`border-b border-white/10 py-4 font-display text-3xl transition-all duration-700 ease-(--ease-luxe) ${
                  open ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                } ${isActive(item.href) ? "text-gold-light" : "text-white/90"}`}
                style={{ transitionDelay: open ? `${120 + i * 50}ms` : "0ms" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-6">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-gold w-full" tabIndex={open ? 0 : -1}>
              <WhatsAppIcon className="h-5 w-5" /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
