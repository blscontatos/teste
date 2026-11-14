"use client";
// Seções "Nossos Salgados" e "Nossos Doces": carrossel de categorias.
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";
import { Carousel } from "./Carousel";
import { Leaves, SectionTitle } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";
import { money } from "@/lib/format";
import type { Category, CategorySection } from "@/lib/types";

function priceFrom(products: { price: number | null; kind: string; portions: { price: number | null; price_frozen: number | null }[] }[]) {
  const values = products.flatMap((p) => [
    p.price,
    ...p.portions.map((po) => po.price ?? po.price_frozen),
  ]).filter((v): v is number => typeof v === "number" && v > 0);
  return values.length ? Math.min(...values) : null;
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const { data, openCategory } = useShop();
  const prods = data.products.filter((p) => p.category_id === category.id);
  const from = priceFrom(prods);
  const isCake = prods.some((p) => p.kind === "bolo_festa");
  // Foto do cartão: a que as donas enviaram para a categoria; se ela ainda for a foto de
  // exemplo que veio com o site, usa a foto principal do primeiro produto.
  const isExampleImage = !category.image_url || category.image_url.startsWith("/images/");
  const productImage = prods.find((p) => p.images[0])?.images[0];
  const cardImage = isExampleImage && productImage ? productImage : category.image_url;
  const noProducts = prods.length === 0;

  return (
    <motion.button
      type="button"
      onClick={() => openCategory(category)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.55, delay: Math.min(index, 5) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group flex w-[72%] shrink-0 flex-col overflow-hidden rounded-[1.75rem] bg-white text-left shadow-card transition-shadow hover:shadow-card-hover sm:w-[42%] md:w-[30%] lg:w-[23%]"
      aria-label={`Ver ${category.name}`}
    >
      <div className="relative aspect-[4/3.4] w-full overflow-hidden bg-cream">
        {cardImage && (
          <Image
            src={cardImage}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 40vw, 23vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        )}
        {(isCake || noProducts) && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-navy">
            Sob encomenda
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 bg-cream-50 px-5 pb-5 pt-4">
        <h3 className="font-title text-xl text-navy">{category.name}</h3>
        {category.description && <p className="line-clamp-2 text-sm text-muted">{category.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold text-navy">
            {from ? (
              <>
                a partir de <span className="text-gold-600">{money(from)}</span>
              </>
            ) : isCake ? (
              "Faça sua encomenda"
            ) : (
              "Consulte"
            )}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-white transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export function MenuSection({ section }: { section: CategorySection }) {
  const { data } = useShop();
  const cats = data.categories.filter((c) => c.section === section);
  const text = section === "salgado" ? data.content.salgados : data.content.doces;
  const id = section === "salgado" ? "salgados" : "doces";
  if (!cats.length) return null;

  return (
    <section id={id} className={`relative overflow-hidden py-14 sm:py-20 ${section === "doce" ? "bg-cream/60" : ""}`}>
      <Leaves className={`absolute top-10 hidden h-56 w-24 opacity-60 lg:block ${section === "salgado" ? "-right-2" : "-left-2"}`} flip={section === "salgado"} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionTitle eyebrow={text.eyebrow} title={text.title} subtitle={text.subtitle} />
        </Reveal>
        <div className="mt-10">
          <Carousel label={text.title}>
            {cats.map((c, i) => (
              <CategoryCard key={c.id} category={c} index={i} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
