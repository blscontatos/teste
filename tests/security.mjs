/**
 * Testes de segurança (RLS / Storage / Auth) contra o Supabase configurado em .env.local.
 * Uso: node --env-file=.env.local tests/security.mjs
 * Requer usuários de teste: admin@luizvieira.test e corretor@luizvieira.test (senha em TEST_PASSWORD).
 */
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASS = process.env.TEST_PASSWORD ?? "SenhaForte2026";
const mk = () => createClient(url, anonKey, { auth: { persistSession: false } });

let failures = 0;
async function t(name, fn) {
  try {
    await fn();
    console.log("  ✔", name);
  } catch (e) {
    failures++;
    console.log("  ✖", name, "\n     ", e.message);
  }
}

const anon = mk();
const admin = mk();
const corretor = mk();
await admin.auth.signInWithPassword({ email: "admin@luizvieira.test", password: PASS });
await corretor.auth.signInWithPassword({ email: "corretor@luizvieira.test", password: PASS });

// Dados de apoio criados pelo admin
const { data: draft } = await admin.from("properties").insert({ title: "Teste RLS rascunho", neighborhood: "Barra da Tijuca", address: "Rua Secreta, 123" }).select("id").single();
const { data: pub } = await admin
  .from("properties")
  .insert({ title: "Teste RLS publicado", neighborhood: "Recreio dos Bandeirantes", address: "Av. Privada, 999", status: "published", show_address: false })
  .select("id")
  .single();

console.log("\nVisitante (anônimo)");
await t("não lê contatos (leads)", async () => {
  const { data, error } = await anon.from("leads").select("*");
  assert.ok(error || (data ?? []).length === 0, "visitante conseguiu ler leads");
});
await t("pode enviar formulário (insert em leads)", async () => {
  const { error } = await anon.from("leads").insert({ kind: "comprar", full_name: "Teste Seguranca", email: "t@t.com", phone: "21999999999", consent: true });
  assert.equal(error, null, error?.message);
});
await t("não envia lead sem consentimento LGPD", async () => {
  const { error } = await anon.from("leads").insert({ kind: "comprar", full_name: "Sem consentimento", email: "t@t.com", phone: "21999999999", consent: false });
  assert.ok(error, "insert sem consentimento foi aceito");
});
await t("não define status/observações internas ao enviar lead", async () => {
  const { error } = await anon.from("leads").insert({ kind: "comprar", full_name: "Hacker", email: "t@t.com", phone: "21999999999", consent: true, status: "concluido", internal_notes: "x" });
  assert.ok(error, "visitante definiu colunas internas");
});
await t("não vê imóveis em rascunho", async () => {
  const { data } = await anon.from("properties").select("id").eq("id", draft.id);
  assert.equal((data ?? []).length, 0);
});
await t("vê imóveis publicados", async () => {
  const { data, error } = await anon.from("properties").select("id, title").eq("id", pub.id);
  assert.equal(error, null, error?.message);
  assert.equal(data.length, 1);
});
await t("não lê endereço exato oculto (coluna address)", async () => {
  const { error } = await anon.from("properties").select("address").eq("id", pub.id);
  assert.ok(error, "coluna address exposta");
  const { data } = await anon.from("properties").select("public_address").eq("id", pub.id).single();
  assert.equal(data.public_address, null);
});
await t("não cria imóveis", async () => {
  const { error } = await anon.from("properties").insert({ title: "invasão" });
  assert.ok(error);
});
await t("não altera imóveis", async () => {
  const { data } = await anon.from("properties").update({ title: "hackeado" }).eq("id", pub.id).select("id");
  assert.equal((data ?? []).length, 0);
});
await t("não altera o destaque/configurações", async () => {
  const { data } = await anon.from("site_settings").update({ whatsapp_number: "5500000000000" }).eq("id", 1).select("id");
  assert.equal((data ?? []).length, 0);
});
await t("não envia arquivos ao storage", async () => {
  const { error } = await anon.storage.from("property-media").upload(`properties/x/${Date.now()}.png`, new Blob(["x"], { type: "image/png" }));
  assert.ok(error, "upload anônimo aceito");
});
await t("não consegue criar conta (cadastro público desativado)", async () => {
  const { error } = await anon.auth.signUp({ email: `novo${Date.now()}@teste.com`, password: "SenhaForte2026" });
  assert.ok(error, "cadastro público aberto");
});
await t("não lê perfis da equipe", async () => {
  const { data } = await anon.from("profiles").select("*");
  assert.equal((data ?? []).length, 0);
});

console.log("\nCorretor");
await t("lê contatos", async () => {
  const { data, error } = await corretor.from("leads").select("id");
  assert.equal(error, null);
  assert.ok(data.length > 0);
});
await t("edita imóveis", async () => {
  const { data, error } = await corretor.from("properties").update({ title: "Teste RLS rascunho editado" }).eq("id", draft.id).select("id");
  assert.equal(error, null, error?.message);
  assert.equal(data.length, 1);
});
await t("define destaque", async () => {
  const { error } = await corretor.from("site_settings").update({ featured_property_id: pub.id }).eq("id", 1);
  assert.equal(error, null, error?.message);
});
await t("não destaca imóvel não publicado", async () => {
  const { error } = await corretor.from("site_settings").update({ featured_property_id: draft.id }).eq("id", 1);
  assert.ok(error);
});
await t("não altera WhatsApp (somente admin)", async () => {
  const { error } = await corretor.from("site_settings").update({ whatsapp_number: "5500000000000" }).eq("id", 1);
  assert.ok(error, "corretor alterou whatsapp");
});
await t("não exclui imóveis (somente admin)", async () => {
  const { data } = await corretor.from("properties").delete().eq("id", draft.id).select("id");
  assert.equal((data ?? []).length, 0);
});
await t("não gerencia depoimentos (somente admin)", async () => {
  const { error } = await corretor.from("testimonials").insert({ client_name: "X", content: "Depoimento qualquer", rating: 5 });
  assert.ok(error);
});
await t("não promove a si mesmo", async () => {
  const { data: me } = await corretor.auth.getUser();
  const { error } = await corretor.from("profiles").update({ role: "admin" }).eq("id", me.user.id);
  assert.ok(error, "corretor virou admin");
});

console.log("\nAdministrador");
await t("altera WhatsApp", async () => {
  const { data: cur } = await admin.from("site_settings").select("whatsapp_number").eq("id", 1).single();
  const { error } = await admin.from("site_settings").update({ whatsapp_number: cur.whatsapp_number }).eq("id", 1);
  assert.equal(error, null, error?.message);
});
await t("arquivar o destaque remove o destaque automaticamente", async () => {
  await admin.from("properties").update({ status: "archived" }).eq("id", pub.id);
  const { data } = await admin.from("site_settings").select("featured_property_id").eq("id", 1).single();
  assert.notEqual(data.featured_property_id, pub.id);
});
await t("exclui imóveis", async () => {
  const { data, error } = await admin.from("properties").delete().in("id", [draft.id, pub.id]).select("id");
  assert.equal(error, null);
  assert.equal(data.length, 2);
});
await t("exclui leads de teste", async () => {
  const { error } = await admin.from("leads").delete().eq("full_name", "Teste Seguranca");
  assert.equal(error, null);
});

console.log(failures ? `\n${failures} falha(s).` : "\nTodos os testes de segurança passaram.");
process.exit(failures ? 1 : 0);
