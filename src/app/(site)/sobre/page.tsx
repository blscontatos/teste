import type { Metadata } from "next";
import { About } from "@/components/home/About";
import { Testimonials } from "@/components/home/Testimonials";
import { HelpSection } from "@/components/home/HelpSection";
import { Reveal } from "@/components/ui/Reveal";
import { getPublishedTestimonials, getSettings } from "@/lib/data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a Luiz Vieira Negócios Imobiliários: atendimento personalizado e curadoria de imóveis na Barra da Tijuca, Recreio dos Bandeirantes, Barra Olímpica e Angra dos Reis.",
  alternates: { canonical: "/sobre" },
};

export default async function AboutPage() {
  const [settings, testimonials] = await Promise.all([getSettings(), getPublishedTestimonials()]);
  return (
    <>
      <section className="bg-gradient-to-b from-sand to-white pt-36 pb-16 sm:pt-44">
        <div className="container-luxe max-w-4xl text-center">
          <p className="eyebrow animate-fade-up justify-center">Luiz Vieira Negócios Imobiliários</p>
          <h1 className="heading-xl mt-6 animate-fade-up text-balance [animation-delay:100ms]">Pessoas, objetivos e momentos de vida.</h1>
        </div>
      </section>
      <About settings={settings} showLink={false} />
      <section className="py-24">
        <div className="container-luxe grid gap-10 md:grid-cols-3">
          {[
            ["01", "Escuta", "Entendemos o seu momento, a rotina da família e o que realmente importa antes de sugerir qualquer imóvel."],
            ["02", "Curadoria", "Selecionamos opções com critério — localização, conservação, documentação e potencial de valorização."],
            ["03", "Acompanhamento", "Da primeira visita à assinatura, cuidamos de cada etapa com transparência e agilidade."],
          ].map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 120} className="border-t border-gold/40 pt-8">
              <span className="font-display text-5xl text-gold">{n}</span>
              <h2 className="mt-4 font-display text-3xl">{t}</h2>
              <p className="mt-3 leading-relaxed text-ink/65">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <Testimonials items={testimonials} />
      <HelpSection />
    </>
  );
}
