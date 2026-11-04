import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Testimonials } from "@/components/home/Testimonials";
import { HelpSection } from "@/components/home/HelpSection";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { Reveal } from "@/components/ui/Reveal";
import { getFeaturedProperty, getPublishedNeighborhoods, getPublishedTestimonials, getSettings, searchProperties } from "@/lib/data";
import { whatsappLink } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, featured, latest, neighborhoods, testimonials] = await Promise.all([
    getSettings(),
    getFeaturedProperty(),
    searchProperties({}, 6),
    getPublishedNeighborhoods(),
    getPublishedTestimonials(),
  ]);
  const brokerHref = whatsappLink(settings.whatsapp_number, settings.whatsapp_message);

  return (
    <>
      <Hero settings={settings} featured={featured} brokerHref={brokerHref} />

      <section id="imoveis" className="py-24 sm:py-32">
        <div className="container-luxe">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <Reveal>
              <p className="eyebrow">Portfólio</p>
              <h2 className="heading-lg mt-5 max-w-xl">Imóveis selecionados para você</h2>
            </Reveal>
            <Reveal delay={120}>
              <Link href="/imoveis" className="btn-outline group">
                Ver todos os imóveis <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
          <Reveal delay={100} className="mb-12">
            <Suspense fallback={<div className="h-[74px] rounded-[26px] border border-line bg-white" />}>
              <PropertyFilters neighborhoods={neighborhoods} showOrder={false} />
            </Suspense>
          </Reveal>

          {latest.items.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {latest.items.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 100}>
                  <PropertyCard p={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-line bg-sand/50 px-6 py-16 text-center">
              <p className="font-display text-3xl">Novos imóveis em breve</p>
              <p className="mx-auto mt-3 max-w-md text-ink/60">
                Nossa curadoria está sendo atualizada. Fale com um corretor e conheça as oportunidades disponíveis.
              </p>
            </div>
          )}

          {latest.total > latest.items.length && (
            <div className="mt-14 text-center">
              <Link href="/imoveis" className="btn-dark group">
                Ver todos os {latest.total} imóveis <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <About settings={settings} />
      <Testimonials items={testimonials} />
      <HelpSection />
    </>
  );
}
