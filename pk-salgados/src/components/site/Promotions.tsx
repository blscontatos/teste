"use client";
// Promoções e combos. As vencidas já não chegam aqui (o banco filtra pela data).
import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { SectionTitle } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";
import { Carousel } from "./Carousel";
import { PillButton } from "@/components/ui/PillButton";
import { formatDate, money } from "@/lib/format";

export function Promotions() {
  const { data, addPromotion } = useShop();
  const now = Date.now();
  const promos = data.promotions.filter(
    (p) =>
      p.active &&
      (!p.starts_at || new Date(p.starts_at).getTime() <= now) &&
      (!p.ends_at || new Date(p.ends_at).getTime() > now),
  );
  if (!promos.length) return null;
  const t = data.content.promocoes;

  return (
    <section id="promocoes" className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionTitle eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        </Reveal>
        <div className="mt-10">
        <Carousel label={t.title}>
          {promos.map((p, index) => {
            const discount = p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.55, delay: Math.min(index, 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="w-[85%] shrink-0 sm:w-[58%] lg:w-[38%]"
              >
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-cream-50 shadow-card ring-1 ring-navy/5 transition-shadow hover:shadow-card-hover"
                >
                  <div className="relative aspect-[16/11] overflow-hidden bg-cream">
                    {p.images[0] && (
                      <Image
                        src={p.images[0]}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                    {p.badge && (
                      <span className="absolute left-4 top-4 rounded-full bg-gold px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-navy shadow">
                        {p.badge}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="absolute right-4 top-4 grid h-14 w-14 place-items-center rounded-full bg-navy text-center text-xs font-bold leading-tight text-white shadow">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="font-title text-2xl text-navy">{p.title}</h3>
                    {p.description && <p className="mt-2 text-sm text-muted">{p.description}</p>}
                    {p.items.length > 0 && (
                      <ul className="mt-3 space-y-1 text-sm text-ink">
                        {p.items.map((i) => (
                          <li key={i.id} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden />
                            {i.description}
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.ends_at && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold-600">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                        Válido até {formatDate(p.ends_at)}
                      </p>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <div>
                        {p.old_price && p.old_price > p.price && (
                          <p className="text-sm text-muted line-through" aria-label={`De ${money(p.old_price)}`}>
                            {money(p.old_price)}
                          </p>
                        )}
                        <p className="font-title text-3xl text-navy">
                          <span className="sr-only">Por </span>
                          {money(p.price)}
                        </p>
                      </div>
                      <PillButton onClick={() => addPromotion(p)} arrow size="sm" disabled={data.settings.store_closed}>
                        Pedir agora
                      </PillButton>
                    </div>
                  </div>
                </motion.article>
              </motion.div>
            );
          })}
        </Carousel>
        </div>
      </div>
    </section>
  );
}
