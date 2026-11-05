import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import type { Property, SiteSettings, Testimonial } from "@/lib/types";
import { env } from "@/lib/env";
import { DEFAULT_WHATSAPP_MESSAGE } from "@/lib/constants";

/** Colunas públicas — o endereço só sai via public_address (respeita show_address). */
export const PUBLIC_PROPERTY_COLUMNS =
  "id, code, slug, status, business, type, title, neighborhood, city, state, sale_price, rent_price, condo_fee, iptu, total_area, built_area, bedrooms, suites, bathrooms, parking_spots, description, features, condo_features, video_url, published_at, updated_at, show_address, public_address, property_images(id, property_id, storage_path, url, width, height, alt, position, is_cover)";

const CARD_COLUMNS =
  "id, code, slug, status, business, type, title, neighborhood, city, state, sale_price, rent_price, total_area, built_area, bedrooms, suites, bathrooms, parking_spots, published_at, updated_at, show_address, features, condo_features, property_images(id, property_id, storage_path, url, width, height, alt, position, is_cover)";

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  featured_property_id: null,
  whatsapp_number: "",
  whatsapp_message: DEFAULT_WHATSAPP_MESSAGE,
  contact_email: "",
  contact_phone: "",
  creci: "",
  address: "Recreio dos Bandeirantes · Barra da Tijuca · Angra dos Reis — RJ",
  instagram_url: "",
  hero_title: "Encontramos o imóvel que combina com a sua próxima conquista.",
  hero_subtitle:
    "Uma curadoria exclusiva de imóveis na Barra da Tijuca, no Recreio dos Bandeirantes e em Angra dos Reis. Atendimento personalizado para quem busca mais do que um endereço.",
  hero_image_url: "",
  about_title: "Mais do que intermediar negócios, acreditamos em entender pessoas.",
  about_text: "",
  about_image_url: "",
  updated_at: new Date(0).toISOString(),
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const sb = createPublicClient();
  const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    if (error) console.error("[settings]", error.message);
    return { ...DEFAULT_SETTINGS, whatsapp_number: env.whatsappFallback };
  }
  return { ...data, whatsapp_number: data.whatsapp_number || env.whatsappFallback } as SiteSettings;
});

export const getFeaturedProperty = cache(async (): Promise<Property | null> => {
  const settings = await getSettings();
  if (!settings.featured_property_id) return null;
  const sb = createPublicClient();
  const { data } = await sb
    .from("properties")
    .select(CARD_COLUMNS)
    .eq("id", settings.featured_property_id)
    .eq("status", "published")
    .maybeSingle();
  return (data as Property | null) ?? null;
});

export interface PropertyFilters {
  q?: string;
  negocio?: string; // comprar | alugar
  bairro?: string;
  tipo?: string;
  preco?: string; // "min-max"
  quartos?: string; // mínimo
  vagas?: string; // mínimo
  ordem?: string;
  pagina?: string;
}

export const PAGE_SIZE = 12;

export async function searchProperties(f: PropertyFilters, limit = PAGE_SIZE) {
  const sb = createPublicClient();
  const page = Math.max(1, Number(f.pagina) || 1);
  let q = sb.from("properties").select(CARD_COLUMNS, { count: "exact" }).eq("status", "published");

  const rent = f.negocio === "alugar";
  if (f.negocio === "comprar") q = q.in("business", ["venda", "ambos"]);
  if (rent) q = q.in("business", ["aluguel", "ambos"]);
  if (f.bairro) q = q.or(`neighborhood.eq.${JSON.stringify(f.bairro)},city.eq.${JSON.stringify(f.bairro)}`);
  if (f.tipo) q = q.eq("type", f.tipo);
  if (f.quartos && Number(f.quartos) > 0) q = q.gte("bedrooms", Number(f.quartos));
  if (f.vagas && Number(f.vagas) > 0) q = q.gte("parking_spots", Number(f.vagas));
  if (f.preco) {
    const [min, max] = f.preco.split("-").map((v) => (v ? Number(v) : null));
    const col = rent ? "rent_price" : "sale_price";
    if (min != null && !Number.isNaN(min)) q = q.gte(col, min);
    if (max != null && !Number.isNaN(max)) q = q.lte(col, max);
  }
  if (f.q) {
    const term = f.q.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
    if (term) q = q.or(`code.ilike.%${term}%,title.ilike.%${term}%,neighborhood.ilike.%${term}%,city.ilike.%${term}%`);
  }

  switch (f.ordem) {
    case "menor-preco":
      q = q.order(rent ? "rent_price" : "sale_price", { ascending: true, nullsFirst: false });
      break;
    case "maior-preco":
      q = q.order(rent ? "rent_price" : "sale_price", { ascending: false, nullsFirst: false });
      break;
    case "maior-area":
      q = q.order("total_area", { ascending: false, nullsFirst: false });
      break;
    default:
      q = q.order("published_at", { ascending: false, nullsFirst: false });
  }

  const from = (page - 1) * limit;
  const { data, count, error } = await q.range(from, from + limit - 1);
  if (error) console.error("[searchProperties]", error.message);
  return { items: (data ?? []) as Property[], total: count ?? 0, page, pageSize: limit };
}

export const getPropertyBySlug = cache(async (slug: string): Promise<Property | null> => {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("properties")
    .select(PUBLIC_PROPERTY_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("[getPropertyBySlug]", error.message);
  return (data as Property | null) ?? null;
});

export async function getSimilarProperties(p: Property, limit = 3) {
  const sb = createPublicClient();
  const { data } = await sb
    .from("properties")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .neq("id", p.id)
    .or(`neighborhood.eq.${JSON.stringify(p.neighborhood ?? "")},type.eq.${p.type}`)
    .order("published_at", { ascending: false })
    .limit(12);
  const items = (data ?? []) as Property[];
  // Prioriza mesmo bairro + mesmo tipo, depois faixa de preço próxima
  const ref = p.sale_price ?? p.rent_price ?? 0;
  const score = (x: Property) =>
    (x.neighborhood === p.neighborhood ? 2 : 0) +
    (x.type === p.type ? 2 : 0) +
    (ref ? 1 - Math.min(1, Math.abs((x.sale_price ?? x.rent_price ?? 0) - ref) / ref) : 0);
  const ranked = items.sort((a, b) => score(b) - score(a)).slice(0, limit);
  if (ranked.length >= limit) return ranked;
  // Completa com os imóveis mais recentes para a seção nunca ficar vazia
  const { data: recent } = await sb
    .from("properties")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .not("id", "in", `(${[p.id, ...ranked.map((r) => r.id)].join(",")})`)
    .order("published_at", { ascending: false })
    .limit(limit - ranked.length);
  return [...ranked, ...((recent ?? []) as Property[])];
}

export async function getPublishedNeighborhoods(): Promise<string[]> {
  const sb = createPublicClient();
  const { data } = await sb.from("properties").select("neighborhood").eq("status", "published");
  return [...new Set((data ?? []).map((r) => r.neighborhood).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("testimonials")
    .select("*")
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);
  return (data ?? []) as Testimonial[];
}

export async function getAllPublishedSlugs() {
  const sb = createPublicClient();
  const { data } = await sb
    .from("properties")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5000);
  return data ?? [];
}
