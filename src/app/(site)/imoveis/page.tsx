import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { getPublishedNeighborhoods, searchProperties, type PropertyFilters as F } from "@/lib/data";
import { PROPERTY_TYPES } from "@/lib/constants";

type SP = Promise<Record<string, string | string[] | undefined>>;

function normalize(sp: Record<string, string | string[] | undefined>): F {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? undefined;
  return {
    q: g("q"),
    negocio: g("negocio"),
    bairro: g("bairro"),
    tipo: g("tipo"),
    preco: g("preco"),
    quartos: g("quartos"),
    vagas: g("vagas"),
    ordem: g("ordem"),
    pagina: g("pagina"),
  };
}

function headline(f: F) {
  const tipo = PROPERTY_TYPES.find((t) => t.value === f.tipo)?.plural ?? "Imóveis";
  const neg = f.negocio === "comprar" ? " à venda" : f.negocio === "alugar" ? " para alugar" : "";
  const local = f.bairro ? ` ${f.bairro.startsWith("Barra") ? "na" : "no"} ${f.bairro}` : " na Barra da Tijuca e Recreio";
  return `${tipo}${neg}${local}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const f = normalize(await searchParams);
  const title = headline(f);
  const qs = new URLSearchParams();
  if (f.negocio) qs.set("negocio", f.negocio);
  if (f.bairro) qs.set("bairro", f.bairro);
  if (f.tipo) qs.set("tipo", f.tipo);
  const canonical = `/imoveis${qs.toString() ? `?${qs}` : ""}`;
  return {
    title,
    description: `${title}: casas, apartamentos e coberturas de alto padrão selecionados pela Luiz Vieira Negócios Imobiliários. Filtre por bairro, preço, quartos e vagas.`,
    alternates: { canonical },
    openGraph: { title, url: canonical },
    robots: f.q || f.preco || f.quartos || f.vagas || f.ordem || f.pagina ? { index: false, follow: true } : undefined,
  };
}

export default async function PropertiesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const f = normalize(sp);
  const [{ items, total, page, pageSize }, neighborhoods] = await Promise.all([searchProperties(f), getPublishedNeighborhoods()]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && k !== "pagina" && qs.set(k, v));
    if (n > 1) qs.set("pagina", String(n));
    return `/imoveis${qs.toString() ? `?${qs}` : ""}`;
  };

  return (
    <>
      <section className="bg-gradient-to-b from-sand to-white pt-32 pb-10 sm:pt-40">
        <div className="container-luxe">
          <p className="eyebrow animate-fade-up">Portfólio</p>
          <h1 className="heading-lg mt-5 max-w-3xl animate-fade-up text-balance [animation-delay:100ms]">{headline(f)}</h1>
          <p className="mt-4 animate-fade-up text-ink/60 [animation-delay:200ms]">
            {total === 0 ? "Nenhum imóvel encontrado" : `${total} ${total === 1 ? "imóvel encontrado" : "imóveis encontrados"}`}
          </p>
          <div className="mt-10 animate-fade-up [animation-delay:250ms]">
            <Suspense fallback={<div className="h-[74px] rounded-[26px] border border-line bg-white" />}>
              <PropertyFilters neighborhoods={neighborhoods} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="pb-28">
        <div className="container-luxe">
          {items.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-testid="property-grid">
              {items.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${(i % 6) * 70}ms` }}>
                  <PropertyCard p={p} priority={i < 3} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-line bg-sand/50 px-6 py-20 text-center">
              <p className="font-display text-3xl">Nenhum imóvel com esses critérios</p>
              <p className="mx-auto mt-3 max-w-md text-ink/60">
                Ajuste os filtros ou conte para nós o que procura — selecionamos opções sob medida, inclusive fora do portfólio publicado.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/imoveis" className="btn-outline">
                  Limpar filtros
                </Link>
                <Link href="/contato#quero-comprar" className="btn-gold">
                  Quero receber opções
                </Link>
              </div>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Paginação" className="mt-14 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="btn-outline btn-sm" aria-label="Página anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((n) => Math.abs(n - page) <= 2 || n === 1 || n === pages)
                .map((n) => (
                  <Link
                    key={n}
                    href={pageHref(n)}
                    aria-current={n === page ? "page" : undefined}
                    className={`grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold ${
                      n === page ? "bg-ink text-white" : "text-ink/60 hover:bg-sand"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
              {page < pages && (
                <Link href={pageHref(page + 1)} className="btn-outline btn-sm" aria-label="Próxima página">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
