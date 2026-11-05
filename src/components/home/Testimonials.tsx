import type { Testimonial } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialsCarousel } from "./TestimonialsCarousel";

/**
 * Conteúdo DEMONSTRATIVO — exibido apenas enquanto não houver depoimentos reais
 * publicados no painel. Sempre identificado visualmente como exemplo.
 */
const DEMO: Pick<Testimonial, "id" | "client_name" | "region" | "content" | "rating">[] = [
  {
    id: "demo-1",
    client_name: "Exemplo de cliente",
    region: "Recreio dos Bandeirantes",
    content:
      "Desde a primeira conversa senti que entenderam exatamente o que a minha família precisava. As visitas foram certeiras e a negociação foi tranquila do começo ao fim.",
    rating: 5,
  },
  {
    id: "demo-2",
    client_name: "Exemplo de cliente",
    region: "Barra da Tijuca",
    content:
      "Atendimento ágil e muito transparente. Recebi todas as informações com clareza, inclusive sobre documentação, e fechei a compra com segurança.",
    rating: 5,
  },
  {
    id: "demo-3",
    client_name: "Exemplo de cliente",
    region: "Barra Olímpica",
    content:
      "Coloquei meu apartamento à venda e fui acompanhado em cada etapa. A avaliação foi realista e o imóvel foi apresentado a compradores realmente interessados.",
    rating: 5,
  },
];

export function Testimonials({ items }: { items: Testimonial[] }) {
  const isDemo = items.length === 0;
  const list = isDemo ? DEMO : items;
  return (
    <section id="depoimentos" className="bg-sand py-24 sm:py-32">
      <div className="container-luxe">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">Depoimentos</p>
          <h2 className="heading-lg mt-5">O que nossos clientes dizem</h2>
          {isDemo && (
            <p className="mx-auto mt-5 inline-flex rounded-full border border-gold/40 bg-white px-4 py-2 text-xs font-semibold text-gold-deep">
              Conteúdo de demonstração — depoimentos ilustrativos, não são avaliações reais.
            </p>
          )}
        </Reveal>
      </div>
      <Reveal delay={120}>
        <TestimonialsCarousel items={list} isDemo={isDemo} />
      </Reveal>
    </section>
  );
}
