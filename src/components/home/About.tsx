import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Handshake, ShieldCheck, Sparkles } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";

export const DEFAULT_ABOUT = [
  "Mais do que intermediar negócios, acreditamos em entender pessoas, objetivos e momentos de vida.",
  "Atuamos com dedicação na seleção de imóveis na Barra da Tijuca, Recreio dos Bandeirantes e regiões próximas, oferecendo um atendimento personalizado, transparente e direcionado às necessidades de cada cliente.",
  "Nosso compromisso é transformar a busca por um imóvel em uma experiência segura, simples e satisfatória.",
];

export function About({ settings, showLink = true }: { settings: SiteSettings; showLink?: boolean }) {
  const paragraphs = settings.about_text ? settings.about_text.split(/\n\s*\n/).filter(Boolean) : DEFAULT_ABOUT;
  return (
    <section id="sobre" className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div className="grain absolute inset-0" />
      <div className="container-luxe relative grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[36px]">
            {settings.about_image_url ? (
              <Image src={settings.about_image_url} alt="Luiz Vieira Negócios Imobiliários" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
            ) : (
              <ArtPlaceholder className="absolute inset-0" />
            )}
          </div>
          <div className="absolute -right-3 -bottom-8 hidden max-w-[260px] rounded-[24px] bg-gold p-6 text-ink shadow-2xl sm:block lg:-right-10">
            <p className="font-display text-2xl leading-snug italic">“Cada cliente, uma história. Cada imóvel, uma escolha cuidadosa.”</p>
          </div>
        </Reveal>
        <div>
          <Reveal>
            <p className="eyebrow text-gold-light">Sobre nós</p>
            <h2 className="heading-lg mt-5 text-balance">{settings.about_title}</h2>
          </Reveal>
          <Reveal delay={120} className="mt-8 space-y-5 text-[16.5px] leading-relaxed text-white/70">
            {paragraphs.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </Reveal>
          <Reveal delay={220} className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Sparkles, t: "Curadoria", d: "Imóveis escolhidos com critério" },
              { icon: Handshake, t: "Proximidade", d: "Atendimento do início ao fim" },
              { icon: ShieldCheck, t: "Segurança", d: "Negociação transparente" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                <p className="mt-3 font-semibold">{t}</p>
                <p className="mt-1 text-xs text-white/55">{d}</p>
              </div>
            ))}
          </Reveal>
          {showLink && (
            <Reveal delay={300} className="mt-10">
              <Link href="/sobre" className="btn-outline-light group">
                Conheça nossa história <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
