import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bath, BedDouble, Car, MapPin, Ruler } from "lucide-react";
import type { Property, SiteSettings } from "@/lib/types";
import { coverOf, formatArea, priceLine } from "@/lib/format";
import { BUSINESS_LABEL, typeLabel } from "@/lib/constants";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export function Hero({
  settings,
  featured,
  brokerHref,
}: {
  settings: SiteSettings;
  featured: Property | null;
  brokerHref: string;
}) {
  const cover = featured ? coverOf(featured) : null;
  const imageUrl = cover?.url || settings.hero_image_url || null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand via-white to-white pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gold-pale/60 blur-3xl" />
      <div className="container-luxe relative grid items-center gap-12 lg:grid-cols-[1fr_1.08fr] lg:gap-16">
        <div className="max-w-xl">
          <p className="eyebrow animate-fade-up">Barra da Tijuca · Recreio dos Bandeirantes</p>
          <h1 className="heading-xl mt-6 animate-fade-up text-balance [animation-delay:120ms]">{settings.hero_title}</h1>
          <p className="mt-7 max-w-lg animate-fade-up text-[17px] leading-relaxed text-ink/65 [animation-delay:240ms]">
            {settings.hero_subtitle}
          </p>
          <div className="mt-10 flex animate-fade-up flex-col gap-3 [animation-delay:360ms] sm:flex-row">
            <Link href="/imoveis" className="btn-dark group">
              Explorar imóveis
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            <a href={brokerHref} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Falar com um corretor
            </a>
          </div>
          <dl className="mt-14 grid animate-fade-up grid-cols-3 gap-6 border-t border-line pt-8 [animation-delay:480ms]">
            {[
              ["Curadoria", "Imóveis selecionados"],
              ["Atendimento", "Personalizado"],
              ["Negociação", "Segura e transparente"],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-display text-xl font-medium sm:text-2xl">{t}</dt>
                <dd className="mt-1 text-xs leading-snug text-stone">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] animate-scale-in overflow-hidden rounded-[36px] bg-ink shadow-[0_50px_100px_-40px_rgba(13,13,12,0.55)] sm:aspect-[5/5] lg:aspect-[4/4.6]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={featured ? `${featured.title} — ${featured.neighborhood ?? ""}` : "Imóvel de alto padrão"}
                fill
                priority
                sizes="(min-width:1024px) 55vw, 100vw"
                className="object-cover"
              />
            ) : (
              <ArtPlaceholder className="absolute inset-0" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/10" />
            {featured && (
              <span className="chip absolute top-5 left-5 bg-white/90 text-ink backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Imóvel em destaque
              </span>
            )}
          </div>

          {featured ? (
            <FeaturedCard p={featured} />
          ) : (
            <div className="relative -mt-20 mx-4 animate-fade-up rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_30px_70px_-30px_rgba(13,13,12,0.45)] backdrop-blur-xl [animation-delay:500ms] sm:mx-8 lg:absolute lg:-bottom-10 lg:-left-12 lg:mx-0 lg:mt-0 lg:w-[360px]">
              <p className="eyebrow">Curadoria exclusiva</p>
              <p className="mt-3 font-display text-2xl leading-snug">Imóveis selecionados para o seu estilo de vida.</p>
              <Link href="/imoveis" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep hover:text-ink">
                Ver imóveis disponíveis <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ p }: { p: Property }) {
  const price = priceLine(p);
  const area = p.built_area ?? p.total_area;
  return (
    <div className="relative -mt-24 mx-3 animate-fade-up rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_30px_70px_-30px_rgba(13,13,12,0.5)] backdrop-blur-xl [animation-delay:500ms] sm:mx-8 sm:p-7 lg:absolute lg:-bottom-12 lg:-left-14 lg:mx-0 lg:mt-0 lg:w-[400px]">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold tracking-[0.16em] uppercase">
        <span className="text-gold-deep">
          {typeLabel(p.type)} · {BUSINESS_LABEL[p.business]}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-1 tracking-wider text-ink/60">Cód. {p.code}</span>
      </div>
      <h2 className="mt-3 font-display text-[1.75rem] leading-tight font-medium" data-testid="hero-featured-title">
        {p.title}
      </h2>
      {p.neighborhood && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/60">
          <MapPin className="h-3.5 w-3.5 text-gold-deep" /> {p.neighborhood}
        </p>
      )}
      <div className="mt-5 grid grid-cols-4 gap-2 border-y border-line py-4 text-center">
        <Spec icon={Ruler} value={area != null ? formatArea(area) : "—"} label="Área" />
        <Spec icon={BedDouble} value={p.bedrooms ?? "—"} label="Quartos" />
        <Spec icon={Bath} value={p.bathrooms ?? "—"} label="Banheiros" />
        <Spec icon={Car} value={p.parking_spots ?? "—"} label="Vagas" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-wide text-stone">{price.sale ? "Valor de venda" : "Valor"}</p>
          <p className="font-display text-[1.7rem] leading-none font-semibold">{price.main}</p>
        </div>
        <Link href={`/imoveis/${p.slug}`} className="btn-gold group shrink-0 px-5" aria-label={`Ver imóvel ${p.title}`}>
          Ver imóvel <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45" />
        </Link>
      </div>
    </div>
  );
}

function Spec({ icon: Icon, value, label }: { icon: typeof Ruler; value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="h-4 w-4 text-gold-deep" strokeWidth={1.6} />
      <span className="text-sm font-semibold whitespace-nowrap">{value}</span>
      <span className="text-[10px] tracking-wide text-stone uppercase">{label}</span>
    </div>
  );
}
