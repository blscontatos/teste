"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { assertAdmin, assertStaff } from "@/lib/auth";
import { env } from "@/lib/env";
import type { PropertyImage } from "@/lib/types";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

const fail = (error: unknown): { ok: false; error: string } => ({
  ok: false,
  error: error instanceof Error ? error.message : typeof error === "string" ? error : "Erro inesperado.",
});

function revalidatePublic() {
  revalidatePath("/", "layout");
}

// =============================================================================
// Autenticação
// =============================================================================
export async function loginAction(_: unknown, formData: FormData): Promise<{ error?: string } | undefined> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "E-mail ou senha inválidos." };

  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", data.user.id).maybeSingle();
  if (!profile?.role || !profile.active) {
    await supabase.auth.signOut();
    return { error: "Este usuário não possui permissão para acessar o painel." };
  }
  redirect(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}

export async function requestPasswordReset(_: unknown, formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "Informe um e-mail válido." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.siteUrl}/auth/callback?next=/admin/redefinir-senha`,
  });
  // Resposta idêntica exista ou não o e-mail (evita enumeração de usuários)
  return { ok: true };
}

export async function updatePasswordAction(_: unknown, formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 10) return { error: "A senha deve ter pelo menos 10 caracteres." };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { error: "Use letras e números na senha." };
  if (password !== confirm) return { error: "As senhas não coincidem." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Link expirado. Solicite uma nova recuperação de senha." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não foi possível atualizar a senha: " + error.message };
  return { ok: true };
}

// =============================================================================
// Imóveis
// =============================================================================
const num = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  });
const int = num.transform((v) => (v == null ? null : Math.min(50, Math.round(v))));
const text = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v == null ? null : v.trim() || null));

const propertySchema = z
  .object({
    business: z.enum(["venda", "aluguel", "ambos"]),
    type: z.enum(["casa", "casa_condominio", "apartamento", "cobertura", "terreno", "sala_comercial", "loja", "outros"]),
    title: z.string().trim().min(1).max(160),
    code: z
      .string()
      .trim()
      .max(30)
      .regex(/^[A-Za-z0-9-]*$/, "O código deve conter apenas letras, números e hífen.")
      .optional(),
    neighborhood: text(120),
    address: text(250),
    show_address: z.boolean(),
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().min(2).max(2),
    sale_price: num,
    rent_price: num,
    condo_fee: num,
    iptu: num,
    total_area: num,
    built_area: num,
    bedrooms: int,
    suites: int,
    bathrooms: int,
    parking_spots: int,
    description: text(10000),
    features: z.array(z.string().trim().min(1).max(80)).max(80),
    condo_features: z.array(z.string().trim().min(1).max(80)).max(80),
    video_url: text(500).refine((v) => !v || /^https?:\/\//.test(v), "Informe um link de vídeo válido (https://…)."),
    wizard_step: z.number().int().min(1).max(5),
  })
  .partial();

export type PropertyInput = z.input<typeof propertySchema>;

export async function saveProperty(id: string | null, input: PropertyInput): Promise<ActionResult<{ id: string; code: string; slug: string }>> {
  try {
    await assertStaff();
    const parsed = propertySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    const data = { ...parsed.data };
    if (data.code === "") delete data.code;
    if (data.state) data.state = data.state.toUpperCase();

    const supabase = await createClient();
    const query = id
      ? supabase.from("properties").update(data).eq("id", id)
      : supabase.from("properties").insert({ ...data, status: "draft" });
    const { data: row, error } = await query.select("id, code, slug, status").single();
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Já existe um imóvel com este código." };
      throw new Error(error.message);
    }
    if (row.status === "published") revalidatePublic();
    revalidatePath("/admin/imoveis");
    return { ok: true, data: { id: row.id, code: row.code, slug: row.slug } };
  } catch (e) {
    return fail(e);
  }
}

export async function setPropertyStatus(id: string, status: "draft" | "published" | "archived", feature = false): Promise<ActionResult> {
  try {
    await assertStaff();
    const supabase = await createClient();
    if (status === "published") {
      const { data: p } = await supabase.from("properties").select("title, neighborhood").eq("id", id).single();
      if (!p?.title || p.title === "Novo imóvel") return { ok: false, error: "Defina um título antes de publicar." };
    }
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    if (feature && status === "published") {
      const { error: fe } = await supabase.from("site_settings").update({ featured_property_id: id }).eq("id", 1);
      if (fe) throw new Error(fe.message);
    }
    revalidatePublic();
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setFeaturedProperty(id: string | null): Promise<ActionResult> {
  try {
    await assertStaff();
    const supabase = await createClient();
    const { error } = await supabase.from("site_settings").update({ featured_property_id: id }).eq("id", 1);
    if (error) throw new Error(error.message);
    revalidatePublic();
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const supabase = await createClient();
    const { data: imgs } = await supabase.from("property_images").select("storage_path").eq("property_id", id);
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) throw new Error(error.message);
    const paths = (imgs ?? []).map((i) => i.storage_path);
    if (paths.length) await supabase.storage.from("property-media").remove(paths);
    revalidatePublic();
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ----- Fotografias -----------------------------------------------------------
export async function registerImages(
  propertyId: string,
  images: { storage_path: string; url: string; width: number; height: number }[],
): Promise<ActionResult<PropertyImage[]>> {
  try {
    await assertStaff();
    const supabase = await createClient();
    const prefix = `properties/${propertyId}/`;
    if (images.some((i) => !i.storage_path.startsWith(prefix))) throw new Error("Caminho de arquivo inválido.");
    const { data: existing } = await supabase
      .from("property_images")
      .select("position, is_cover")
      .eq("property_id", propertyId)
      .order("position", { ascending: false });
    const start = (existing?.[0]?.position ?? -1) + 1;
    const hasCover = (existing ?? []).some((i) => i.is_cover);
    const publicBase = `${env.supabaseUrl}/storage/v1/object/public/property-media/`;
    const rows = images.map((img, i) => ({
      property_id: propertyId,
      storage_path: img.storage_path,
      url: publicBase + img.storage_path,
      width: img.width,
      height: img.height,
      position: start + i,
      is_cover: !hasCover && i === 0,
    }));
    const { data, error } = await supabase.from("property_images").insert(rows).select("*");
    if (error) throw new Error(error.message);
    revalidatePublic();
    return { ok: true, data: (data ?? []) as PropertyImage[] };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderImages(propertyId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await assertStaff();
    const supabase = await createClient();
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from("property_images")
        .update({ position: i })
        .eq("id", orderedIds[i])
        .eq("property_id", propertyId);
      if (error) throw new Error(error.message);
    }
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setCoverImage(propertyId: string, imageId: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const supabase = await createClient();
    const { error: e1 } = await supabase.from("property_images").update({ is_cover: false }).eq("property_id", propertyId).eq("is_cover", true);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabase.from("property_images").update({ is_cover: true }).eq("id", imageId).eq("property_id", propertyId);
    if (e2) throw new Error(e2.message);
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteImage(propertyId: string, imageId: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const supabase = await createClient();
    const { data: img } = await supabase
      .from("property_images")
      .select("id, storage_path, is_cover")
      .eq("id", imageId)
      .eq("property_id", propertyId)
      .single();
    if (!img) throw new Error("Foto não encontrada.");
    const { error } = await supabase.from("property_images").delete().eq("id", imageId);
    if (error) throw new Error(error.message);
    await supabase.storage.from("property-media").remove([img.storage_path]);
    if (img.is_cover) {
      const { data: next } = await supabase.from("property_images").select("id").eq("property_id", propertyId).order("position").limit(1);
      if (next?.[0]) await supabase.from("property_images").update({ is_cover: true }).eq("id", next[0].id);
    }
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// =============================================================================
// Interessados (leads)
// =============================================================================
export async function updateLead(
  id: string,
  patch: { status?: "novo" | "em_atendimento" | "concluido"; internal_notes?: string | null },
): Promise<ActionResult> {
  try {
    await assertStaff();
    const clean: Record<string, unknown> = {};
    if (patch.status) clean.status = z.enum(["novo", "em_atendimento", "concluido"]).parse(patch.status);
    if (patch.internal_notes !== undefined) clean.internal_notes = (patch.internal_notes ?? "").slice(0, 5000) || null;
    const supabase = await createClient();
    const { error } = await supabase.from("leads").update(clean).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteLead(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const supabase = await createClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// =============================================================================
// Depoimentos (admin)
// =============================================================================
const testimonialSchema = z.object({
  client_name: z.string().trim().min(2, "Informe o nome do cliente.").max(120),
  region: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || null),
  content: z.string().trim().min(10, "O depoimento deve ter pelo menos 10 caracteres.").max(1200),
  rating: z.coerce.number().int().min(1).max(5),
  published: z.boolean(),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveTestimonial(id: string | null, input: z.input<typeof testimonialSchema>): Promise<ActionResult> {
  try {
    await assertAdmin();
    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    const supabase = await createClient();
    const { error } = id
      ? await supabase.from("testimonials").update(parsed.data).eq("id", id)
      : await supabase.from("testimonials").insert(parsed.data);
    if (error) throw new Error(error.message);
    revalidatePublic();
    revalidatePath("/admin/depoimentos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePublic();
    revalidatePath("/admin/depoimentos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// =============================================================================
// Configurações do site
// =============================================================================
const contentFields = ["hero_title", "hero_subtitle", "hero_image_url", "about_title", "about_text", "about_image_url", "address", "instagram_url"] as const;
const adminFields = ["whatsapp_number", "whatsapp_message", "contact_email", "contact_phone", "creci"] as const;

export async function updateSettings(input: Record<string, string>): Promise<ActionResult> {
  try {
    const profile = await assertStaff();
    const allowed: readonly string[] = profile.role === "admin" ? [...contentFields, ...adminFields] : contentFields;
    const patch: Record<string, string> = {};
    for (const k of allowed) {
      if (k in input) patch[k] = String(input[k] ?? "").trim().slice(0, k === "about_text" ? 4000 : 500);
    }
    if ("whatsapp_number" in patch) {
      patch.whatsapp_number = patch.whatsapp_number.replace(/\D/g, "");
      if (patch.whatsapp_number && (patch.whatsapp_number.length < 12 || patch.whatsapp_number.length > 13))
        return { ok: false, error: "Informe o WhatsApp com DDI + DDD + número. Ex.: 5521999999999" };
    }
    if (patch.contact_email && !z.string().email().safeParse(patch.contact_email).success)
      return { ok: false, error: "E-mail de contato inválido." };
    for (const k of ["instagram_url", "hero_image_url", "about_image_url"]) {
      if (patch[k] && !/^https?:\/\//.test(patch[k])) return { ok: false, error: "Links devem começar com https://" };
    }
    if (!patch.hero_title && "hero_title" in patch) return { ok: false, error: "O título principal não pode ficar vazio." };
    const supabase = await createClient();
    const { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
    if (error) throw new Error(error.message);
    revalidatePublic();
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Configurações salvas." };
  } catch (e) {
    return fail(e);
  }
}

// =============================================================================
// Usuários (admin) — requer SUPABASE_SERVICE_ROLE_KEY no servidor
// =============================================================================
export async function createTeamUser(input: { email: string; full_name: string; role: "admin" | "corretor"; password: string }): Promise<ActionResult> {
  try {
    await assertAdmin();
    const admin = createServiceClient();
    if (!admin) return { ok: false, error: "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para cadastrar usuários." };
    const email = input.email.trim().toLowerCase();
    if (!z.string().email().safeParse(email).success) return { ok: false, error: "E-mail inválido." };
    if (input.password.length < 10) return { ok: false, error: "A senha provisória deve ter pelo menos 10 caracteres." };
    const role = z.enum(["admin", "corretor"]).parse(input.role);
    const { error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { full_name: input.full_name.trim().slice(0, 120) },
    });
    if (error) return { ok: false, error: error.message.includes("already") ? "Já existe um usuário com este e-mail." : error.message };
    revalidatePath("/admin/usuarios");
    return { ok: true, message: "Usuário criado. Envie a senha provisória com segurança e peça para trocá-la no primeiro acesso." };
  } catch (e) {
    return fail(e);
  }
}

export async function updateTeamUser(id: string, patch: { role?: "admin" | "corretor"; active?: boolean }): Promise<ActionResult> {
  try {
    const me = await assertAdmin();
    if (id === me.id) return { ok: false, error: "Você não pode alterar o seu próprio acesso." };
    const supabase = await createClient();
    const clean: Record<string, unknown> = {};
    if (patch.role) clean.role = z.enum(["admin", "corretor"]).parse(patch.role);
    if (typeof patch.active === "boolean") clean.active = patch.active;
    const { error } = await supabase.from("profiles").update(clean).eq("id", id);
    if (error) throw new Error(error.message);
    const admin = createServiceClient();
    if (admin && patch.role) await admin.auth.admin.updateUserById(id, { app_metadata: { role: patch.role } });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateOwnName(full_name: string): Promise<ActionResult> {
  try {
    const me = await assertStaff();
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({ full_name: full_name.trim().slice(0, 120) }).eq("id", me.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
