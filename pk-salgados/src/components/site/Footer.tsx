"use client";
// Rodapé: marca, navegação, "Fale conosco" e direitos autorais.
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Wave } from "@/components/ui/Decor";
import { maskPhone } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { NAV } from "./Header";

export function Footer() {
  const { data } = useShop();
  const s = data.settings;
  const c = data.content;
  const waDisplay = s.whatsapp ? maskPhone(s.whatsapp.replace(/^55/, "")) : "";

  return (
    <footer id="contato" className="relative mt-6 text-white">
      <Wave fill="#0B2341" />
      <div className="bg-navy">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-8 sm:px-6 md:grid-cols-[1.2fr_1fr_1.4fr]">
          <div>
            <Image src={c.marca.logo_white_url || "/brand/logo-white.png"} alt={c.marca.name} width={410} height={240} className="h-20 w-auto" />
            <p className="mt-4 max-w-xs text-sm text-white/75">{c.rodape.description}</p>
            <div className="mt-5 flex gap-3">
              {s.instagram && (
                <a href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-gold hover:text-navy">
                  <InstagramIcon />
                </a>
              )}
              {s.facebook && (
                <a href={`https://facebook.com/${s.facebook}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-gold hover:text-navy">
                  <FacebookIcon />
                </a>
              )}
              {s.whatsapp && (
                <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-gold hover:text-navy">
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Rodapé">
            <h3 className="font-title text-xl text-gold">Navegação</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-white/80 transition hover:text-gold">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-title text-xl text-gold">Fale conosco</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              {s.whatsapp && (
                <li>
                  <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-gold">
                    <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <span>{waDisplay}</span>
                  </a>
                </li>
              )}
              {s.phone_secondary && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                  <a href={`tel:+55${s.phone_secondary.replace(/\D/g, "")}`} className="hover:text-gold">{s.phone_secondary}</a>
                </li>
              )}
              {s.instagram && (
                <li>
                  <a href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-gold">
                    <InstagramIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <span>@{s.instagram.replace(/^@/, "")}</span>
                  </a>
                </li>
              )}
              {s.address && (
                <li>
                  <a href={s.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-gold">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                    <span>{s.address}</span>
                  </a>
                </li>
              )}
              {s.opening_hours && (
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                  <span>{s.opening_hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row sm:px-6">
            <p>
              © {new Date().getFullYear()} {c.rodape.copyright}
            </p>
            <Link href="/privacidade" className="hover:text-gold">
              Política de privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
