// Monta links e mensagens do WhatsApp (o link só aceita texto, não anexos).
// Usamos api.whatsapp.com/send em vez de wa.me porque o redirecionamento do wa.me
// estraga emojis como 🎂 e 🛍️. Os dois abrem o app do WhatsApp no celular.
import type { CartItem, Fulfillment, PaymentMethod } from "./types";
import { formatDateTime, fryLabels, fulfillmentLabels, money, paymentLabels } from "./format";

export const waLink = (phone: string, text?: string) =>
  `https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, "")}${text ? `&text=${encodeURIComponent(text)}` : ""}`;

export function orderMessage(o: {
  number: number;
  name: string;
  phone: string;
  address: string;
  fulfillment: Fulfillment;
  payment: PaymentMethod;
  desired_at: string;
  notes: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}) {
  const lines = [
    `🛍️ *Novo pedido — PK Salgados e Doces*`,
    `Pedido nº ${o.number}`,
    ``,
    ...o.items.flatMap((i) => {
      const det = [i.portion_label, i.fry_option ? fryLabels[i.fry_option] : ""].filter(Boolean).join(" | ");
      return [
        `• ${i.quantity}x ${i.name}${det ? ` (${det})` : ""} — ${money(i.unit_price * i.quantity)}`,
        ...(i.flavors.length ? [`   Sabores: ${i.flavors.join(", ")}`] : []),
        ...(i.notes ? [`   Obs.: ${i.notes}`] : []),
      ];
    }),
    ``,
    `Subtotal: ${money(o.subtotal)}`,
    ...(o.delivery_fee ? [`Entrega: ${money(o.delivery_fee)}`] : []),
    `*Total: ${money(o.total)}*`,
    ``,
    `Nome: ${o.name}`,
    `Telefone: ${o.phone}`,
    `${fulfillmentLabels[o.fulfillment]}${o.fulfillment === "entrega" ? `: ${o.address}` : ""}`,
    `Pagamento: ${paymentLabels[o.payment]}`,
    `Data/horário: ${formatDateTime(o.desired_at)}`,
    ...(o.notes ? [`Observações: ${o.notes}`] : []),
  ];
  return lines.join("\n");
}

export function cakeMessage(o: {
  number: number;
  name: string;
  phone: string;
  address: string;
  desired_at: string;
  size: string;
  dough: string;
  filling: string;
  theme_notes: string;
  has_inspiration: boolean;
  photo_url?: string; // modo "link"; sem link = o cliente envia a foto na conversa
}) {
  return [
    `🎂 *Nova encomenda de bolo — PK Salgados e Doces*`,
    `Nome: ${o.name}`,
    `Telefone: ${o.phone}`,
    `Endereço: ${o.address}`,
    `Data/horário: ${formatDateTime(o.desired_at)}`,
    `Tamanho: ${o.size || "—"} | Massa: ${o.dough || "—"} | Recheio: ${o.filling || "—"}`,
    `Tema/observações: ${o.theme_notes || "—"}`,
    `Modelo de inspiração: ${
      !o.has_inspiration ? "Não" : o.photo_url ? `Sim — foto: ${o.photo_url}` : "Sim — vou enviar a foto em seguida nesta conversa 📷"
    }`,
    `Pedido nº ${o.number}`,
  ].join("\n");
}
