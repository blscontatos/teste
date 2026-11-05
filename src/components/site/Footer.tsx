import Link from "next/link";
import { AtSign, Mail, MapPin, Phone } from "lucide-react";
import { LogoFull } from "./Logo";
import type { SiteSettings } from "@/lib/types";
import { COMPANY } from "@/lib/constants";

export function Footer({ settings, whatsappHref }: { settings: SiteSettings; whatsappHref: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-ink text-white/70">
      <div className="grain absolute inset-0" />
      <div className="container-luxe relative grid gap-12 py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-6">
          <LogoFull width={190} className="h-auto w-[170px]" />
          <p className="max-w-xs text-sm leading-relaxed">
            Imóveis selecionados na Barra da Tijuca, Recreio dos Bandeirantes e regiões próximas, com atendimento
            personalizado do primeiro contato à entrega das chaves.
          </p>
          {settings.creci && <p className="text-xs tracking-wider text-gold-light/80">CRECI {settings.creci}</p>}
        </div>

        <div>
          <h3 className="mb-5 text-xs font-semibold tracking-[0.25em] text-gold-light uppercase">Navegação</h3>
          <ul className="space-y-3 text-sm">
            {[
              ["/imoveis", "Todos os imóveis"],
              ["/imoveis?negocio=comprar", "Comprar"],
              ["/imoveis?negocio=alugar", "Alugar"],
              ["/vender", "Vender seu imóvel"],
              ["/sobre", "Sobre"],
              ["/contato", "Contato"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-gold-light">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-semibold tracking-[0.25em] text-gold-light uppercase">Regiões</h3>
          <ul className="space-y-3 text-sm">
            {["Recreio dos Bandeirantes", "Barra da Tijuca", "Barra Olímpica"].map((b) => (
              <li key={b}>
                <Link href={`/imoveis?bairro=${encodeURIComponent(b)}`} className="transition-colors hover:text-gold-light">
                  Imóveis em {b}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-semibold tracking-[0.25em] text-gold-light uppercase">Contato</h3>
          <ul className="space-y-4 text-sm">
            <li>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-gold-light">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {settings.contact_phone || "WhatsApp"}
              </a>
            </li>
            {settings.contact_email && (
              <li>
                <a href={`mailto:${settings.contact_email}`} className="flex items-start gap-3 break-all hover:text-gold-light">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {settings.contact_email}
                </a>
              </li>
            )}
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {settings.address}
            </li>
            {settings.instagram_url && (
              <li>
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-gold-light">
                  <AtSign className="h-4 w-4 text-gold" /> Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-luxe flex flex-col gap-3 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY.name}. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/politica-de-privacidade" className="hover:text-gold-light">
              Política de Privacidade
            </Link>
            <Link href="/admin/login" className="hover:text-gold-light" rel="nofollow">
              Área restrita
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
