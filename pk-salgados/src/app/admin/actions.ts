"use server";
// Ações do painel que precisam rodar no servidor.
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Sb = Awaited<ReturnType<typeof createClient>>;
type StoredFile = { path: string; size: number; created_at: string };

/** Fotos enviadas há menos tempo que isso nunca são apagadas automaticamente
 *  (protege uma foto recém-enviada num formulário que ainda não foi salvo). */
const GRACE_MS = 24 * 3600_000;

/** Atualiza o site público na hora e apaga fotos do site que não são mais usadas. */
export async function revalidateSite() {
  await assertAdmin();
  revalidatePath("/", "layout");
  try {
    await removeUnusedSiteImages(await createClient(), true);
  } catch (e) {
    console.error("Limpeza de fotos:", e);
  }
}

/** Lista todos os arquivos de um bucket, entrando nas pastas. */
async function listAll(sb: Sb, bucket: string, prefix = ""): Promise<StoredFile[]> {
  const out: StoredFile[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) out.push(...(await listAll(sb, bucket, path))); // é uma pasta
      else out.push({ path, size: Number(item.metadata?.size ?? 0), created_at: item.created_at ?? "" });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Endereços de foto usados hoje em produtos, categorias, promoções e textos (publicados e rascunhos). */
async function usedImageUrls(sb: Sb) {
  const [p, c, pr, sc] = await Promise.all([
    sb.from("products").select("images"),
    sb.from("categories").select("image_url"),
    sb.from("promotions").select("images"),
    sb.from("site_content").select("data, draft"),
  ]);
  const err = p.error || c.error || pr.error || sc.error;
  if (err) throw err;
  // Junta tudo num texto só: basta o nome do arquivo aparecer em algum lugar.
  return JSON.stringify([p.data, c.data, pr.data, sc.data]);
}

/** Apaga do armazenamento as fotos do site que nenhum produto/categoria/promoção/texto usa mais. */
async function removeUnusedSiteImages(sb: Sb, respectGrace: boolean) {
  const [files, used] = await Promise.all([listAll(sb, "site-images"), usedImageUrls(sb)]);
  const now = Date.now();
  const unused = files.filter(
    (f) => !used.includes(f.path) && (!respectGrace || !f.created_at || now - new Date(f.created_at).getTime() > GRACE_MS),
  );
  for (let i = 0; i < unused.length; i += 100) {
    const { error } = await sb.storage.from("site-images").remove(unused.slice(i, i + 100).map((f) => f.path));
    if (error) throw error;
  }
  return { count: unused.length, bytes: unused.reduce((s, f) => s + f.size, 0) };
}

// ---------------------------------------------------------------------------
// Tela "Armazenamento de fotos" (Configurações)
// ---------------------------------------------------------------------------

export async function getStorageUsage() {
  await assertAdmin();
  const sb = await createClient();
  const [site, cakes, used] = await Promise.all([listAll(sb, "site-images"), listAll(sb, "inspiration-photos"), usedImageUrls(sb)]);
  const sum = (l: StoredFile[]) => l.reduce((s, f) => s + f.size, 0);
  const unused = site.filter((f) => !used.includes(f.path));
  return {
    siteBytes: sum(site),
    siteCount: site.length,
    unusedCount: unused.length,
    unusedBytes: sum(unused),
    cakeBytes: sum(cakes),
    cakeCount: cakes.length,
  };
}

/** Botão "Apagar fotos do site que não são usadas" (sem esperar 24h). */
export async function cleanUnusedSiteImages() {
  await assertAdmin();
  return removeUnusedSiteImages(await createClient(), false);
}

/** Apaga a foto de inspiração de uma encomenda de bolo. */
export async function deleteCakePhoto(cakeOrderId: string) {
  await assertAdmin();
  const sb = await createClient();
  const { data } = await sb.from("cake_orders").select("inspiration_path").eq("id", cakeOrderId).maybeSingle();
  if (!data?.inspiration_path) return { ok: true };
  const { error } = await sb.storage.from("inspiration-photos").remove([data.inspiration_path]);
  if (error) return { ok: false, error: "Não foi possível apagar a foto." };
  await sb.from("cake_orders").update({ inspiration_path: null }).eq("id", cakeOrderId);
  return { ok: true };
}

/** Apaga as fotos de inspiração de encomendas com data de entrega há mais de N dias. */
export async function deleteOldCakePhotos(days: number) {
  await assertAdmin();
  const sb = await createClient();
  const limit = new Date(Date.now() - Math.max(1, days) * 86400_000).toISOString();
  const { data, error } = await sb
    .from("cake_orders")
    .select("id, inspiration_path")
    .not("inspiration_path", "is", null)
    .lt("desired_at", limit);
  if (error) return { ok: false as const, error: "Não foi possível buscar as encomendas." };
  const rows = data ?? [];
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error: e } = await sb.storage.from("inspiration-photos").remove(chunk.map((r) => r.inspiration_path as string));
    if (e) return { ok: false as const, error: "Não foi possível apagar algumas fotos." };
    await sb.from("cake_orders").update({ inspiration_path: null }).in("id", chunk.map((r) => r.id));
  }
  return { ok: true as const, count: rows.length };
}
