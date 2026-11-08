// Teste de ponta a ponta (site + painel). Requer: supabase local rodando, `npm run dev`
// e uma dona criada:  npm run admin:criar -- dona@pksalgados.com.br "SenhaTeste123"
// Uso: node tests/e2e.mjs [http://localhost:3000]
import { createRequire } from "node:module";
// Usa o Playwright instalado no projeto ou no sistema.
const { chromium, devices } = createRequire(import.meta.url)("playwright");
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL || "dona@pksalgados.com.br";
const PASS = process.env.E2E_PASS || "SenhaTeste123";
const photo = fileURLToPath(new URL("./foto-teste.jpg", import.meta.url));
let failures = 0;
const txt = async (loc) => (await loc.textContent()).replace(/\u00a0/g, " ");
const ok = (cond, msg) => { console.log(`${cond ? "✔" : "✘"} ${msg}`); if (!cond) failures++; };

const browser = await chromium.launch();

// ---------------------------------------------------------------- Cliente (celular)
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE, { waitUntil: "networkidle" });
ok(await page.getByRole("heading", { level: 1 }).isVisible(), "Hero aparece");

// Salgado frito: porção + frito + sabores
await page.locator("#salgados").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Ver Salgados Fritos" }).click();
await page.getByRole("button", { name: "100 unidades" }).click();
await page.getByRole("button", { name: /^Frito/ }).click();
await page.getByRole("button", { name: "Coxinha", exact: true }).click();
await page.getByRole("button", { name: "Bolinha de queijo" }).click();
ok((await txt(page.getByRole("dialog"))).includes("R$ 57,00"), "Preço frito 100 un = R$ 57,00");
await page.getByRole("button", { name: "Adicionar à sacola" }).click();
await page.getByText("Adicionado à sacola").waitFor();
ok(true, "Toast 'Adicionado à sacola'");

// Promoção
await page.locator("#promocoes").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Pedir agora" }).first().click();
await page.waitForTimeout(400);

// Sacola → finalizar pelo site
await page.getByRole("button", { name: /Abrir sacola/ }).click();
ok((await txt(page.getByRole("dialog"))).includes("R$ 129,00"), "Subtotal da sacola R$ 129,00 (57 + 72)");
await page.getByRole("button", { name: "Continuar" }).click();
await page.getByRole("button", { name: "Enviar pedido pelo site" }).click();
ok(await page.getByText("Informe seu nome completo.").isVisible(), "Validação de campos obrigatórios");
await page.getByLabel("Nome completo *").fill("Maria Teste");
await page.getByLabel("Telefone / WhatsApp *").fill("21987654321");
ok((await page.getByLabel("Telefone / WhatsApp *").inputValue()) === "(21) 98765-4321", "Máscara de telefone");
const d = new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10);
await page.getByLabel("Data e horário desejados *").fill(`${d}T15:00`);
await page.getByRole("button", { name: "Enviar pedido pelo site" }).click();
await page.getByText("Recebemos seu pedido").waitFor({ timeout: 15000 });
const number = (await page.getByText(/^nº \d+/).textContent()).replace(/\D/g, "");
ok(Number(number) > 1000, `Pedido pelo site criado (nº ${number})`);
await page.getByRole("button", { name: "Voltar ao site" }).click();

// Pedido pelo WhatsApp (abre wa.me com o pedido)
await page.locator("#doces").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Ver Docinhos" }).click();
await page.getByRole("button", { name: "Brigadeiro", exact: true }).click();
await page.getByRole("button", { name: "Adicionar à sacola" }).click();
await page.getByRole("button", { name: /Abrir sacola/ }).click();
await page.getByRole("button", { name: "Continuar" }).click();
await page.getByLabel("Nome completo *").fill("João Teste");
await page.getByLabel("Telefone / WhatsApp *").fill("21912345678");
await page.getByLabel("Data e horário desejados *").fill(`${d}T11:00`);
const [popup] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: "Enviar pelo WhatsApp" }).click()]);
await page.getByText("Recebemos seu pedido").waitFor({ timeout: 15000 });
await popup.waitForURL(/wa\.me|whatsapp/, { timeout: 15000 }).catch(() => {});
const waUrl = decodeURIComponent(popup.url().replace(/\+/g, " "));
console.log("   URL WhatsApp:", waUrl.slice(0, 160));
ok(/api\.whatsapp\.com.*5521982712575/.test(waUrl) && waUrl.includes("🛍️ *Novo pedido") && waUrl.includes("Bandeja de Docinhos"), "WhatsApp aberto com o pedido formatado");
await popup.close();
await page.getByRole("button", { name: "Voltar ao site" }).click();

// Bolo de festa com foto obrigatória
await page.getByRole("button", { name: "Ver Bolos de Festa" }).click();
const cake = page.getByRole("dialog");
await cake.getByLabel("Nome completo *").fill("Ana Bolo");
await cake.getByLabel("Telefone / WhatsApp *").fill("21955554444");
await cake.getByLabel("Endereço completo *").fill("Rua Teste, 123 - Guadalupe");
const cd = new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10);
await cake.getByLabel("Data *").fill(cd);
await cake.getByLabel("Horário *").fill("14:00");
await cake.getByLabel("Tamanho / quantidade de pessoas").selectOption({ index: 2 });
await cake.getByRole("button", { name: "Sim" }).click();
await cake.getByRole("button", { name: "Enviar encomenda pelo WhatsApp" }).click();
ok(await cake.getByText("Envie a foto do modelo de inspiração.").isVisible(), "Foto obrigatória quando há inspiração");
await page.setInputFiles("#b-foto", photo);
await cake.getByAltText("Prévia da foto de inspiração").waitFor({ timeout: 15000 });
ok(true, "Prévia da foto aparece (compressão ok)");
const [popup2] = await Promise.all([page.waitForEvent("popup"), cake.getByRole("button", { name: "Enviar encomenda pelo WhatsApp" }).click()]);
await page.getByText("Encomenda recebida!").waitFor({ timeout: 20000 });
await popup2.waitForURL(/wa\.me|whatsapp/, { timeout: 15000 }).catch(() => {});
const cakeMsg = decodeURIComponent(popup2.url().replace(/\+/g, " "));
console.log("   URL bolo:", cakeMsg.slice(0, 400));
ok(cakeMsg.includes("🎂 *Nova encomenda de bolo") && cakeMsg.includes("/storage/v1/object/public/inspiration-photos/pedidos/"), "Mensagem do bolo com link da foto");
const photoUrl = cakeMsg.match(/https?:\/\/[^\s&]+inspiration-photos\/pedidos\/[^\s&]+\.jpg/)?.[0];
if (photoUrl) {
  const r = await fetch(photoUrl);
  ok(r.ok && r.headers.get("content-type")?.includes("image"), "Foto de inspiração acessível pelo link");
}
await popup2.close();
ok(!errors.length, `Sem erros de JavaScript no site${errors.length ? ": " + errors.join(" | ") : ""}`);
await ctx.close();

// ---------------------------------------------------------------- Painel
const actx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const admin = await actx.newPage();
await admin.goto(`${BASE}/admin`);
ok(admin.url().includes("/admin/login"), "Painel protegido: redireciona para o login");
await admin.getByLabel("E-mail").fill(EMAIL);
await admin.getByLabel("Senha").fill(PASS);
await admin.getByRole("button", { name: "Entrar" }).click();
await admin.getByRole("heading", { name: "Pedidos" }).waitFor({ timeout: 15000 });
await admin.waitForTimeout(1200);
ok(await admin.getByText(`nº ${number}`).isVisible(), "Pedido aparece no painel");
await admin.getByText(`nº ${number}`).click();
ok(await admin.getByRole("dialog").getByText("Sabores: Bolinha de queijo, Coxinha").isVisible() || await admin.getByRole("dialog").getByText(/Sabores: (Coxinha, Bolinha de queijo|Bolinha de queijo, Coxinha)/).isVisible(), "Detalhes mostram sabores");
await admin.getByRole("dialog").getByRole("button", { name: "Em preparo" }).click();
await admin.getByText("Status: Em preparo").waitFor();
ok(true, "Status alterado para Em preparo");
await admin.keyboard.press("Escape");

// Tempo real: pedido novo aparece sem recarregar
await admin.getByRole("button", { name: "Novo", exact: false }).first().click();
await admin.locator('[data-realtime="on"]').waitFor({ timeout: 15000 });
await admin.waitForTimeout(2500); // o Realtime leva um instante para começar a ouvir o banco
const before = await admin.locator("li").count();
const anon = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const res = await fetch("http://127.0.0.1:54321/rest/v1/rpc/create_order", {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ p_order: { channel: "site", customer_name: "Tempo Real", phone: "21933332222", fulfillment: "retirada", payment: "pix", desired_at: new Date(Date.now() + 3 * 86400_000).toISOString(), items: [{ product_id: "00000000-0000-4000-8000-000200000001", portion_id: "00000000-0000-4000-8000-000300000101", flavors: ["Mini hot dog"], quantity: 1 }] } }),
});
const rt = await res.json();
await admin.locator("li").getByText(`nº ${rt.number}`, { exact: true }).waitFor({ timeout: 15000 });
ok((await admin.locator("li").count()) > before, `Tempo real: pedido nº ${rt.number} apareceu sozinho`);

// Encomenda de bolo com foto no painel
await admin.selectOption('select[aria-label="Tipo de pedido"]', "bolo");
await admin.getByRole("button", { name: /^Todos/ }).click();
await admin.getByText("Ana Bolo").first().click();
ok(await admin.getByAltText("Foto de inspiração enviada pelo cliente").waitFor({ timeout: 8000 }).then(() => true, () => false), "Foto de inspiração no painel");
await admin.keyboard.press("Escape");

// Configurações: loja fechada → aviso no site
await admin.goto(`${BASE}/admin/configuracoes`);
await admin.getByRole("switch").first().click();
await admin.getByText("Configurações salvas!").waitFor();
const site = await actx.newPage();
await site.goto(BASE, { waitUntil: "networkidle" });
ok(await site.getByText("Hoje não estamos aceitando pedidos").isVisible(), "Aviso de loja fechada aparece no site");
await admin.getByRole("switch").first().click();
await admin.getByText("Configurações salvas!").last().waitFor();

// Textos: rascunho → prévia → publicar
await admin.goto(`${BASE}/admin/conteudo`);
await admin.getByLabel("Selo").fill("Selo de teste E2E");
await admin.getByRole("button", { name: "Salvar rascunho" }).click();
await admin.waitForTimeout(800);
await site.goto(BASE, { waitUntil: "networkidle" });
ok(!(await site.getByText("Selo de teste E2E").isVisible()), "Rascunho não aparece no site antes de publicar");
await site.goto(`${BASE}/previa`, { waitUntil: "networkidle" });
ok(await site.getByText("Selo de teste E2E").isVisible(), "Prévia mostra o rascunho");
admin.on("dialog", (dlg) => dlg.accept());
await admin.getByRole("button", { name: "Publicar" }).click();
await admin.getByText("Publicado!").waitFor();
await site.goto(BASE, { waitUntil: "networkidle" });
ok(await site.getByText("Selo de teste E2E").isVisible(), "Publicado aparece no site");
await admin.getByLabel("Selo").fill("Feito para momentos especiais");
await admin.getByRole("button", { name: "Publicar" }).click();
await admin.getByText("Publicado!").last().waitFor();

// Produto: marcar sabor esgotado
await admin.goto(`${BASE}/admin/produtos/00000000-0000-4000-8000-000200000002`);
await admin.getByRole("button", { name: "Disponível" }).first().click();
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.getByText("Produto salvo!").waitFor();
await site.goto(BASE, { waitUntil: "networkidle" });
await site.getByRole("button", { name: "Ver Mini Pizzas" }).click();
ok(await site.getByRole("button", { name: /Muçarela.*esgotado/i }).isDisabled(), "Sabor esgotado aparece bloqueado no site");
await admin.getByRole("button", { name: "Esgotado" }).first().click();
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.getByText("Produto salvo!").last().waitFor();

await browser.close();
console.log(failures ? `\n${failures} falha(s)` : "\nTudo certo!");
process.exit(failures ? 1 : 0);
