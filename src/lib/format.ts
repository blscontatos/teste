import type { Property } from "./types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export const formatBRL = (v: number | null | undefined) => (v == null ? "" : brl.format(Number(v)));
export const formatArea = (v: number | null | undefined) => (v == null ? "" : `${num.format(Number(v))} m²`);
export const formatNumber = (v: number | null | undefined) => (v == null ? "" : num.format(Number(v)));

export function priceLine(p: Pick<Property, "business" | "sale_price" | "rent_price">) {
  const sale = p.sale_price != null && p.business !== "aluguel" ? formatBRL(p.sale_price) : null;
  const rent = p.rent_price != null && p.business !== "venda" ? `${formatBRL(p.rent_price)}/mês` : null;
  return { sale, rent, main: sale ?? rent ?? "Valor sob consulta" };
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function coverOf(p: Pick<Property, "property_images">) {
  const imgs = [...(p.property_images ?? [])].sort((a, b) => a.position - b.position);
  return imgs.find((i) => i.is_cover) ?? imgs[0] ?? null;
}

export function sortedImages(p: Pick<Property, "property_images">) {
  const imgs = [...(p.property_images ?? [])].sort((a, b) => a.position - b.position);
  const cover = imgs.find((i) => i.is_cover);
  return cover ? [cover, ...imgs.filter((i) => i.id !== cover.id)] : imgs;
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function whatsappLink(number: string, message: string) {
  const n = onlyDigits(number);
  const base = n ? `https://wa.me/${n}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Normaliza telefone brasileiro para link do WhatsApp (adiciona 55 se faltar). */
export function phoneToWhatsapp(phone: string) {
  let n = onlyDigits(phone);
  if (n.length === 10 || n.length === 11) n = `55${n}`;
  return n;
}
