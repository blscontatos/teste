"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/server";

export type LeadFormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
      if (Number.isNaN(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: "Valor inválido." });
        return z.NEVER;
      }
      return n;
    });

const schema = z.object({
  kind: z.enum(["comprar", "vender"]),
  full_name: z.string().trim().min(3, "Informe seu nome completo.").max(150),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(200),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 13, "Informe um telefone com DDD."),
  age: optionalNumber(16, 120),
  neighborhood: optionalText(120),
  property_type: optionalText(60),
  price_range: optionalText(60),
  bedrooms: optionalText(20),
  desired_value: optionalNumber(0, 1_000_000_000),
  approx_area: optionalNumber(0, 1_000_000),
  message: optionalText(3000),
  property_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  consent: z.literal("on", { message: "É necessário autorizar o tratamento dos dados para continuar." }),
});

// Limite simples por IP (por instância do servidor) contra envios em massa.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 6;
}

export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  // Honeypot: campo invisível que robôs preenchem
  if (formData.get("website")) return { ok: true, message: "Solicitação enviada com sucesso." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  if (rateLimited(ip)) {
    return { ok: false, message: "Muitas solicitações em sequência. Aguarde alguns minutos e tente novamente." };
  }

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, v as string]),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      const k = String(i.path[0] ?? "form");
      if (!errors[k]) errors[k] = i.message;
    });
    return { ok: false, message: "Revise os campos destacados.", errors };
  }

  const { consent, ...data } = parsed.data;
  const supabase = createPublicClient();
  const { error } = await supabase.from("leads").insert({
    ...data,
    consent: consent === "on",
    source: data.property_id ? "pagina-imovel" : "site",
  });

  if (error) {
    console.error("[submitLead]", error.message);
    return { ok: false, message: "Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp." };
  }

  return {
    ok: true,
    message:
      data.kind === "comprar"
        ? "Recebemos sua solicitação! Em breve um corretor entrará em contato com opções selecionadas para você."
        : "Recebemos as informações do seu imóvel! Em breve entraremos em contato para conversar sobre a avaliação.",
  };
}
