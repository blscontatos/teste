import type { MetadataRoute } from "next";
import { getAllPublishedSlugs } from "@/lib/data";
import { env } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const rows = await getAllPublishedSlugs().catch(() => []);
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/imoveis`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/imoveis?negocio=comprar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/imoveis?bairro=${encodeURIComponent("Recreio dos Bandeirantes")}`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/imoveis?bairro=${encodeURIComponent("Barra da Tijuca")}`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/imoveis?bairro=${encodeURIComponent("Barra Olímpica")}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/imoveis?bairro=${encodeURIComponent("Angra dos Reis")}`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/vender`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/sobre`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contato`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/politica-de-privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  return [
    ...statics,
    ...rows.map((r) => ({
      url: `${base}/imoveis/${r.slug}`,
      lastModified: new Date(r.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
