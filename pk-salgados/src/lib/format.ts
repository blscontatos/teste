// Funções de formatação (dinheiro, telefone, datas) em português.

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (v: number | null | undefined) => brl.format(Number(v ?? 0));

/** Aplica a máscara (00) 00000-0000 enquanto a pessoa digita. */
export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
export const onlyDigits = (v: string) => v.replace(/\D/g, "");
export const isValidPhone = (v: string) => [10, 11].includes(onlyDigits(v).length);

const TZ = "America/Sao_Paulo";
export const formatDateTime = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso))
    : "—";
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "long" }).format(new Date(iso));

/** Converte "2026-11-20T15:30" (horário do Rio) para ISO com fuso -03:00. */
export function localInputToIso(v: string) {
  if (!v) return "";
  return `${v}:00-03:00`;
}

/** Valor mínimo para <input type="datetime-local"> a partir de agora + horas. */
export function minDateTimeLocal(hoursAhead: number) {
  const d = new Date(Date.now() + hoursAhead * 3600_000);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(d);
  return parts.replace(" ", "T");
}
export function minDateLocal(daysAhead: number) {
  const d = new Date(Date.now() + daysAhead * 86400_000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
}

export const statusLabels = {
  novo: "Novo",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
} as const;
export const paymentLabels = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão na entrega" } as const;
export const fulfillmentLabels = { retirada: "Retirada na loja", entrega: "Entrega" } as const;
export const fryLabels = { congelado: "Congelado", frito: "Frito" } as const;

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
