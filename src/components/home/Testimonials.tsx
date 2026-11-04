import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

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
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => (
            <Reveal key={t.id} delay={i * 100}>
              <figure className="relative flex h-full flex-col rounded-[28px] border border-line bg-white p-8 transition-all duration-700 ease-(--ease-luxe) hover:-translate-y-1 hover:shadow-[0_30px_60px_-35px_rgba(13,13,12,0.35)]">
                {isDemo && (
                  <span className="chip absolute top-6 right-6 bg-sand text-stone">Exemplo</span>
                )}
                <Quote className="h-8 w-8 text-gold" strokeWidth={1.2} />
                <div className="mt-5 flex gap-0.5" aria-label={`Avaliação: ${t.rating} de 5 estrelas`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`h-4 w-4 ${s < t.rating ? "fill-gold text-gold" : "text-stone-light"}`} />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 font-display text-[1.35rem] leading-snug text-ink/85">“{t.content}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-display text-lg text-gold-light">
                    {t.client_name.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-semibold">{t.client_name}</span>
                    {t.region && <span className="block text-xs text-stone">{t.region}</span>}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
