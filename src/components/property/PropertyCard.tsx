import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Property } from "@/lib/types";
import { BUSINESS_LABEL, typeLabel } from "@/lib/constants";
import { coverOf, priceLine } from "@/lib/format";
import { SmoothImage } from "@/components/ui/SmoothImage";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Specs } from "./Specs";

export function PropertyCard({ p, priority = false }: { p: Property; priority?: boolean }) {
  const cover = coverOf(p);
  const price = priceLine(p);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-white transition-all duration-700 ease-(--ease-luxe) hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_30px_60px_-30px_rgba(13,13,12,0.35)]">
      <Link href={`/imoveis/${p.slug}`} className="absolute inset-0 z-10" aria-label={`Ver imóvel: ${p.title}`} />
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {cover ? (
          <SmoothImage
            src={cover.url}
            alt={cover.alt || p.title}
            fill
            priority={priority}
            sizes="(min-width:1280px) 400px, (min-width:768px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1.6s] ease-(--ease-luxe) group-hover:scale-[1.06]"
          />
        ) : (
          <ArtPlaceholder className="absolute inset-0" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="chip bg-ink/80 text-white backdrop-blur">{BUSINESS_LABEL[p.business]}</span>
          <span className="chip bg-white/90 text-ink/70 backdrop-blur">Cód. {p.code}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/50 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        <span className="absolute right-4 bottom-4 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-gold text-ink opacity-0 transition-all duration-700 ease-(--ease-luxe) group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] text-gold-deep uppercase">
            {typeLabel(p.type)}
            {p.neighborhood && (
              <>
                <span className="text-stone-light">•</span>
                <MapPin className="h-3 w-3" />
                {p.neighborhood}
              </>
            )}
          </p>
          <h3 className="line-clamp-2 font-display text-[1.6rem] leading-tight font-medium text-ink">{p.title}</h3>
        </div>
        <Specs p={p} />
        <div className="mt-auto flex items-end justify-between border-t border-line pt-4">
          <div>
            <p className="text-[11px] tracking-wide text-stone">{price.sale ? "Venda" : price.rent ? "Aluguel" : "Valor"}</p>
            <p className="font-display text-2xl font-semibold text-ink">{price.main}</p>
            {price.sale && price.rent && <p className="text-xs text-stone">ou {price.rent}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
