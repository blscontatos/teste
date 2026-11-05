import type { Metadata } from "next";
import { BadgeCheck, Camera, Handshake, TrendingUp } from "lucide-react";
import { LeadForms } from "@/components/forms/LeadForms";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Vender seu imóvel",
  description:
    "Venda seu imóvel na Barra da Tijuca, no Recreio dos Bandeirantes ou em Angra dos Reis com avaliação realista, divulgação qualificada e acompanhamento completo.",
  alternates: { canonical: "/vender" },
};

export default function SellPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-sand to-white pt-36 pb-12 sm:pt-44">
        <div className="container-luxe grid gap-12 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow animate-fade-up">Vender seu imóvel</p>
            <h1 className="heading-xl mt-6 animate-fade-up text-balance [animation-delay:100ms]">Seu imóvel apresentado como ele merece.</h1>
          </div>
          <p className="animate-fade-up text-lg leading-relaxed text-ink/65 [animation-delay:200ms]">
            Avaliação alinhada ao mercado, apresentação cuidadosa e contato com compradores qualificados. Conte-nos sobre o seu
            imóvel e retornaremos para uma conversa sem compromisso.
          </p>
        </div>
      </section>
      <section className="pb-10">
        <div className="container-luxe grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [TrendingUp, "Avaliação realista", "Preço definido com base em dados da região."],
            [Camera, "Apresentação premium", "Fotografias e anúncio que valorizam o imóvel."],
            [BadgeCheck, "Compradores qualificados", "Visitas com quem tem perfil e intenção real."],
            [Handshake, "Acompanhamento", "Negociação e documentação com segurança."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof TrendingUp;
            return (
              <Reveal key={t as string} delay={i * 80} className="rounded-[24px] border border-line bg-white p-6">
                <I className="h-6 w-6 text-gold-deep" strokeWidth={1.4} />
                <p className="mt-4 font-semibold">{t as string}</p>
                <p className="mt-1 text-sm text-ink/60">{d as string}</p>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section className="py-16 sm:py-24">
        <div className="container-luxe max-w-4xl">
          <LeadForms initial="vender" lockKind />
        </div>
      </section>
    </>
  );
}
