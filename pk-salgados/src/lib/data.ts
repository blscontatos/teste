import "server-only";
import { cache } from "react";
import { hasSupabase } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import {
  defaultCategories, defaultContent, defaultProducts, defaultPromotions,
  defaultSettings, defaultTestimonials,
} from "@/lib/defaults";
import type { Product, Promotion, SiteContent, SiteData } from "@/lib/types";

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Junta o conteúdo do banco com o padrão (campos novos nunca ficam vazios). */
export function mergeContent(rows: { key: string; data: unknown; draft?: unknown }[], useDraft = false): SiteContent {
  const content = structuredClone(defaultContent) as SiteContent;
  for (const row of rows) {
    const k = row.key as keyof SiteContent;
    if (!(k in content)) continue;
    const src = (useDraft && row.draft ? row.draft : row.data) as Record<string, unknown>;
    Object.assign(content[k], src ?? {});
  }
  return content;
}

function demoData(): SiteData {
  const now = Date.now();
  return {
    content: defaultContent,
    settings: defaultSettings,
    categories: defaultCategories,
    products: defaultProducts,
    promotions: defaultPromotions.filter(
      (p) => p.active && (!p.ends_at || new Date(p.ends_at).getTime() > now),
    ),
    testimonials: defaultTestimonials,
  };
}

/** Busca tudo o que a página inicial precisa. Promoções vencidas já vêm filtradas pelo banco. */
export const getSiteData = cache(async (opts: { preview?: boolean } = {}): Promise<SiteData> => {
  if (!hasSupabase) return demoData();
  const sb = createPublicClient();
  const [content, settings, categories, products, promotions, testimonials] = await Promise.all([
    sb.from("site_content").select("key, data, draft"),
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("categories").select("*").eq("visible", true).order("sort_order"),
    sb
      .from("products")
      .select("*, portions:product_portions(*), flavors:product_flavors(*)")
      .eq("visible", true)
      .order("sort_order"),
    sb.from("promotions").select("*, items:promotion_items(*)").order("sort_order"),
    sb.from("testimonials").select("*").eq("visible", true).order("sort_order"),
  ]);
  const err = content.error || settings.error || categories.error || products.error || promotions.error || testimonials.error;
  if (err) {
    console.error("Erro ao carregar dados do Supabase:", err.message);
    return demoData();
  }

  return {
    content: mergeContent(content.data ?? [], opts.preview),
    settings: { ...defaultSettings, ...(settings.data ?? {}), delivery_fee: Number(settings.data?.delivery_fee ?? 0) },
    categories: categories.data ?? [],
    products: (products.data ?? []).map(normalizeProduct),
    promotions: (promotions.data ?? []).map(normalizePromotion),
    testimonials: testimonials.data ?? [],
  };
});

export function normalizeProduct(p: Record<string, unknown>): Product {
  const prod = p as unknown as Product;
  return {
    ...prod,
    price: num(prod.price),
    portions: [...(prod.portions ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((po) => ({
        ...po,
        price: num(po.price),
        price_frozen: num(po.price_frozen),
        price_fried: num(po.price_fried),
      })),
    flavors: [...(prod.flavors ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function normalizePromotion(p: Record<string, unknown>): Promotion {
  const promo = p as unknown as Promotion;
  return {
    ...promo,
    price: Number(promo.price),
    old_price: num(promo.old_price),
    items: [...(promo.items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}
