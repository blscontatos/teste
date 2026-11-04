import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, Building2, Car, Check, MapPin, Maximize2, Ruler, Sofa } from "lucide-react";
import { Gallery } from "@/components/property/Gallery";
import { PropertyCard } from "@/components/property/PropertyCard";
import { LeadForm } from "@/components/forms/LeadForms";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { getAllPublishedSlugs, getPropertyBySlug, getSettings, getSimilarProperties } from "@/lib/data";
import { coverOf, formatArea, formatBRL, priceLine, sortedImages, whatsappLink } from "@/lib/format";
import { BUSINESS_LABEL, typeLabel } from "@/lib/constants";
import { env } from "@/lib/env";

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const rows = await getAllPublishedSlugs().catch(() => []);
  return rows.slice(0, 50).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPropertyBySlug(slug);
  if (!p) return { title: "Imóvel não encontrado", robots: { index: false } };
  const price = priceLine(p);
  const cover = coverOf(p);
  const title = `${p.title} — ${typeLabel(p.type)} ${p.business === "aluguel" ? "para alugar" : "à venda"}${p.neighborhood ? ` no ${p.neighborhood}` : ""}`;
  const parts = [
    typeLabel(p.type),
    p.neighborhood,
    p.total_area ? formatArea(p.built_area ?? p.total_area) : null,
    p.bedrooms != null ? `${p.bedrooms} quartos` : null,
    p.parking_spots != null ? `${p.parking_spots} vagas` : null,
    price.main,
  ].filter(Boolean);
  const description = `${parts.join(" · ")}. Cód. ${p.code}. ${(p.description ?? "").slice(0, 120)}`.trim();
  return {
    title,
    description,
    alternates: { canonical: `/imoveis/${p.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/imoveis/${p.slug}`,
      images: cover ? [{ url: cover.url, width: cover.width ?? 1600, height: cover.height ?? 1200, alt: p.title }] : undefined,
    },
  };
}

function embedUrl(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean).pop()}`;
  } catch {}
  return null;
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getPropertyBySlug(slug);
  if (!p) notFound();

  const [settings, similar] = await Promise.all([getSettings(), getSimilarProperties(p)]);
  const images = sortedImages(p);
  const price = priceLine(p);
  const interestMsg = `Olá! Tenho interesse no imóvel ${p.code} — ${p.title}${p.neighborhood ? ` (${p.neighborhood})` : ""}. Poderia me passar mais informações? ${env.siteUrl}/imoveis/${p.slug}`;
  const interestHref = whatsappLink(settings.whatsapp_number, interestMsg);
  const video = embedUrl(p.video_url);

  const facts = [
    { icon: Ruler, label: "Área total", value: p.total_area != null ? formatArea(p.total_area) : null },
    { icon: Maximize2, label: "Área construída", value: p.built_area != null ? formatArea(p.built_area) : null },
    { icon: BedDouble, label: "Quartos", value: p.bedrooms },
    { icon: Sofa, label: "Suítes", value: p.suites },
    { icon: Bath, label: "Banheiros", value: p.bathrooms },
    { icon: Car, label: "Vagas", value: p.parking_spots },
  ].filter((f) => f.value != null && f.value !== "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    url: `${env.siteUrl}/imoveis/${p.slug}`,
    datePosted: p.published_at,
    description: p.description ?? undefined,
    image: images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      price: p.business === "aluguel" ? p.rent_price : p.sale_price ?? p.rent_price,
      priceCurrency: "BRL",
      businessFunction: p.business === "aluguel" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
      availability: "https://schema.org/InStock",
    },
    about: {
      "@type": p.type === "casa" || p.type === "casa_condominio" ? "SingleFamilyResidence" : p.type === "apartamento" || p.type === "cobertura" ? "Apartment" : "Accommodation",
      floorSize: p.total_area ? { "@type": "QuantitativeValue", value: Number(p.total_area), unitCode: "MTK" } : undefined,
      numberOfRooms: p.bedrooms ?? undefined,
      numberOfBedrooms: p.bedrooms ?? undefined,
      numberOfBathroomsTotal: p.bathrooms ?? undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: p.city,
        addressRegion: p.state,
        addressCountry: "BR",
        ...(p.neighborhood ? { streetAddress: p.public_address ?? p.neighborhood } : {}),
      },
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: env.siteUrl },
      { "@type": "ListItem", position: 2, name: "Imóveis", item: `${env.siteUrl}/imoveis` },
      { "@type": "ListItem", position: 3, name: p.title, item: `${env.siteUrl}/imoveis/${p.slug}` },
    ],
  };

  return (
    <>
      <div className="container-luxe pt-28 sm:pt-32">
        <nav aria-label="Trilha" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-stone">
          <Link href="/imoveis" className="inline-flex items-center gap-1.5 font-semibold text-ink/70 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Imóveis
          </Link>
          {p.neighborhood && (
            <>
              <span>/</span>
              <Link href={`/imoveis?bairro=${encodeURIComponent(p.neighborhood)}`} className="hover:text-ink">
                {p.neighborhood}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink/50">Cód. {p.code}</span>
        </nav>
        <div className="animate-fade-up">
          <Gallery images={images} title={p.title} />
        </div>
      </div>

      <div className="container-luxe grid gap-12 py-14 lg:grid-cols-[1fr_400px] lg:gap-16">
        <article>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-ink text-white">{BUSINESS_LABEL[p.business]}</span>
            <span className="chip bg-sand text-ink/70">{typeLabel(p.type)}</span>
            <span className="chip border border-line text-ink/60">Cód. {p.code}</span>
          </div>
          <h1 className="heading-lg mt-5 text-balance">{p.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-ink/60">
            <MapPin className="h-4 w-4 text-gold-deep" />
            {[p.public_address, p.neighborhood, `${p.city} — ${p.state}`].filter(Boolean).join(", ")}
          </p>

          {facts.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 overflow-hidden rounded-[24px] border border-line bg-white sm:grid-cols-3">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="-mt-px -ml-px border-t border-l border-line p-5">
                  <Icon className="h-5 w-5 text-gold-deep" strokeWidth={1.5} />
                  <dt className="mt-3 text-xs tracking-wide text-stone uppercase">{label}</dt>
                  <dd className="mt-1 font-display text-2xl font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {p.description && (
            <Reveal className="mt-14">
              <h2 className="heading-md">Sobre o imóvel</h2>
              <div className="mt-6 space-y-4 text-[16.5px] leading-relaxed whitespace-pre-line text-ink/75">{p.description}</div>
            </Reveal>
          )}

          {p.features.length > 0 && (
            <Reveal className="mt-14">
              <h2 className="heading-md">Características do imóvel</h2>
              <FeatureList items={p.features} />
            </Reveal>
          )}

          {p.condo_features.length > 0 && (
            <Reveal className="mt-14">
              <h2 className="heading-md flex items-center gap-3">
                <Building2 className="h-7 w-7 text-gold-deep" strokeWidth={1.3} /> Condomínio
              </h2>
              <FeatureList items={p.condo_features} />
            </Reveal>
          )}

          {(p.video_url || video) && (
            <Reveal className="mt-14">
              <h2 className="heading-md">Vídeo</h2>
              {video ? (
                <div className="mt-6 aspect-video overflow-hidden rounded-[24px] bg-ink">
                  <iframe src={video} title={`Vídeo — ${p.title}`} className="h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" />
                </div>
              ) : (
                <a href={p.video_url!} target="_blank" rel="noopener noreferrer" className="btn-outline mt-6">
                  Assistir ao vídeo do imóvel
                </a>
              )}
            </Reveal>
          )}
        </article>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[28px] border border-line bg-white p-7 shadow-[0_30px_70px_-45px_rgba(13,13,12,0.45)]">
            {price.sale && (
              <div>
                <p className="text-xs tracking-wide text-stone uppercase">Valor de venda</p>
                <p className="font-display text-4xl font-semibold" data-testid="property-price">
                  {price.sale}
                </p>
              </div>
            )}
            {price.rent && (
              <div className={price.sale ? "mt-4" : ""}>
                <p className="text-xs tracking-wide text-stone uppercase">Aluguel</p>
                <p className={`font-display font-semibold ${price.sale ? "text-2xl" : "text-4xl"}`}>{price.rent}</p>
              </div>
            )}
            {!price.sale && !price.rent && <p className="font-display text-3xl font-semibold">Valor sob consulta</p>}
            {(p.condo_fee != null || p.iptu != null) && (
              <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
                {p.condo_fee != null && (
                  <div className="flex justify-between">
                    <dt className="text-stone">Condomínio</dt>
                    <dd className="font-semibold">{formatBRL(p.condo_fee)}/mês</dd>
                  </div>
                )}
                {p.iptu != null && (
                  <div className="flex justify-between">
                    <dt className="text-stone">IPTU</dt>
                    <dd className="font-semibold">{formatBRL(p.iptu)}/ano</dd>
                  </div>
                )}
              </dl>
            )}
            <a href={interestHref} target="_blank" rel="noopener noreferrer" className="btn mt-7 w-full bg-[#25D366] text-white hover:-translate-y-0.5 hover:bg-[#1fb658]" data-testid="interest-whatsapp">
              <WhatsAppIcon className="h-5 w-5" /> Tenho interesse neste imóvel
            </a>
            <p className="mt-3 text-center text-xs text-stone">Abre o WhatsApp com o código {p.code} já na mensagem.</p>
          </div>

          <div className="mt-6">
            <p className="mb-3 px-1 text-sm font-semibold">Prefere que a gente ligue para você?</p>
            <LeadForm kind="comprar" propertyId={p.id} compact defaultMessage={`Tenho interesse no imóvel ${p.code} — ${p.title}.`} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="border-t border-line bg-sand/60 py-20">
          <div className="container-luxe">
            <Reveal>
              <p className="eyebrow">Você também pode gostar</p>
              <h2 className="heading-md mt-4">Imóveis semelhantes</h2>
            </Reveal>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {similar.map((s, i) => (
                <Reveal key={s.id} delay={i * 100}>
                  <PropertyCard p={s} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
    </>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {items.map((f) => (
        <li key={f} className="flex items-center gap-3 rounded-2xl bg-sand/70 px-4 py-3 text-[15px]">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/20 text-gold-deep">
            <Check className="h-3.5 w-3.5" />
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}
