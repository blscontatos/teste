"use server";
// Recebe os pedidos do site. Valida os dados, aplica um limite anti-spam
// e chama as funções do banco (que recalculam os preços).
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { hasSupabase } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

// --- Anti-spam simples em memória (por instância do servidor) ---------------
const hits = new Map<string, number[]>();
function rateLimited(key: string, max = 12, windowMs = 10 * 60_000) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

async function fingerprint() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0].trim();
  // Guardamos só um resumo (hash) do IP, nunca o IP em si (LGPD).
  return createHash("sha256").update(`pk-salgados:${ip}`).digest("hex").slice(0, 32);
}

const phone = z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 10 || v.length === 11, "Telefone inválido.");

const orderSchema = z.object({
  channel: z.enum(["site", "whatsapp"]),
  customer_name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  phone,
  address: z.string().trim().max(300).default(""),
  fulfillment: z.enum(["retirada", "entrega", "consumo_local"]),
  payment: z.enum(["pix", "dinheiro", "cartao"]),
  desired_at: z.string().default(""), // vazio quando é para comer na loja (agora)
  notes: z.string().trim().max(1000).default(""),
  website: z.string().max(0, "Envio bloqueado.").optional(), // campo-isca anti-robô (fica escondido)
  items: z
    .array(
      z.object({
        product_id: z.string().uuid().optional(),
        promotion_id: z.string().uuid().optional(),
        portion_id: z.string().uuid().optional(),
        fry_option: z.enum(["congelado", "frito"]).optional(),
        flavors: z.array(z.string().max(120)).max(60).default([]),
        quantity: z.number().int().min(1).max(99),
        notes: z.string().max(500).default(""),
      }),
    )
    .min(1, "Sua sacola está vazia.")
    .max(40),
});

export type OrderInput = z.input<typeof orderSchema>;

export async function submitOrder(
  input: OrderInput,
): Promise<Result<{ number: number; total: number; subtotal: number; delivery_fee: number }>> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  if (parsed.data.fulfillment !== "consumo_local" && parsed.data.desired_at.length < 10)
    return { ok: false, error: "Informe a data e o horário desejados." };
  if (parsed.data.fulfillment === "entrega" && parsed.data.address.length < 8)
    return { ok: false, error: "Informe o endereço completo para entrega." };
  if (!hasSupabase) return { ok: false, error: "O site ainda está em modo de demonstração (banco de dados não configurado)." };

  const fp = await fingerprint();
  if (rateLimited(fp)) return { ok: false, error: "Muitos envios seguidos. Aguarde alguns minutos ou fale com a gente no WhatsApp." };

  const { website: _w, ...order } = parsed.data;
  const { data, error } = await createPublicClient().rpc("create_order", { p_order: order, p_fingerprint: fp });
  if (error) {
    console.error("create_order:", error.message);
    return { ok: false, error: error.code === "P0001" ? error.message : "Não foi possível enviar o pedido. Tente novamente." };
  }
  const r = data as { number: number; total: number; subtotal: number; delivery_fee: number };
  return { ok: true, number: r.number, total: Number(r.total), subtotal: Number(r.subtotal), delivery_fee: Number(r.delivery_fee) };
}

const cakeSchema = z.object({
    product_id: z.string().uuid().optional(),
    customer_name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
    phone,
    address: z.string().trim().min(8, "Informe o endereço completo.").max(300),
    desired_at: z.string().min(10, "Informe a data e o horário desejados."),
    size: z.string().max(120).default(""),
    dough: z.string().max(120).default(""),
    filling: z.string().max(120).default(""),
    theme_notes: z.string().trim().max(1500).default(""),
    has_inspiration: z.boolean(),
    inspiration_path: z.string().regex(/^pedidos\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/).optional(),
    website: z.string().max(0, "Envio bloqueado.").optional(),
  });
// A exigência da foto depende do modo (Configurações) e é conferida pelo banco.

export type CakeInput = z.input<typeof cakeSchema>;

export async function submitCakeOrder(input: CakeInput): Promise<Result<{ number: number }>> {
  const parsed = cakeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  if (!hasSupabase) return { ok: false, error: "O site ainda está em modo de demonstração (banco de dados não configurado)." };

  const fp = await fingerprint();
  if (rateLimited(fp)) return { ok: false, error: "Muitos envios seguidos. Aguarde alguns minutos ou fale com a gente no WhatsApp." };

  const { website: _w, ...order } = parsed.data;
  const { data, error } = await createPublicClient().rpc("create_cake_order", { p_order: order, p_fingerprint: fp });
  if (error) {
    console.error("create_cake_order:", error.message);
    return { ok: false, error: error.code === "P0001" ? error.message : "Não foi possível enviar a encomenda. Tente novamente." };
  }
  return { ok: true, number: (data as { number: number }).number };
}
