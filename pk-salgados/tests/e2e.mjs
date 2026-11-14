// Teste de ponta a ponta (site + painel). Requer: supabase local rodando, `npm run dev`
// e uma dona criada:  npm run admin:criar -- dona@pksalgados.com.br "SenhaTeste123"
// Uso: node tests/e2e.mjs [http://localhost:3000]
import { createRequire } from "node:module";
// Usa o Playwright instalado no projeto ou no sistema.
const { chromium, devices } = createRequire(import.meta.url)("playwright");
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL || "dona@pksalgados.com.br";
const PASS = process.env.E2E_PASS || "SenhaTeste123";
const photo = fileURLToPath(new URL("./foto-teste.jpg", import.meta.url));
let failures = 0;
const txt = async (loc) => (await loc.textContent()).replace(/\u00a0/g, " ");
const ok = (cond, msg) => { console.log(`${cond ? "✔" : "✘"} ${msg}`); if (!cond) failures++; };

// Chave secreta lida do .env.local (nunca escrita no código).
// Para testar o site no ar: rode com as variáveis do projeto real, ex.:
//   set -a; . ./.env.production.local; set +a; node tests/e2e.mjs https://pk-salgados.vercel.app
const envFile = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const fromEnv = (k) => process.env[k] || envFile.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const service = fromEnv("SUPABASE_SERVICE_ROLE_KEY");
const ANON = fromEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!service) throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY (no .env.local) para o teste de fotos.");
const sbUrl = fromEnv("NEXT_PUBLIC_SUPABASE_URL") || "http://127.0.0.1:54321";

const listFiles = async (bucket, prefix) => {
  const r = await fetch(`${sbUrl}/storage/v1/object/list/${bucket}`, { method: "POST", headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" }, body: JSON.stringify({ prefix, limit: 1000 }) });
  return (await r.json()).map((f) => f.name);
};

// Simula a tela de compartilhar do celular e guarda o que foi compartilhado.
const fakeShare = () => {
  window.__shared = [];
  Object.defineProperty(navigator, "canShare", { configurable: true, value: (d) => !!d?.files?.length });
  Object.defineProperty(navigator, "share", { configurable: true, value: async (d) => { window.__shared.push(...d.files.map((f) => ({ name: f.name, type: f.type, size: f.size }))); } });
};

/** Preenche e envia uma encomenda de bolo com foto; devolve o texto da mensagem do WhatsApp. */
async function cakeOrder(page, name) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#doces").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Ver Bolos de Festa" }).click();
  const cake = page.getByRole("dialog");
  await cake.getByLabel("Nome completo *").fill(name);
  await cake.getByLabel("Telefone / WhatsApp *").fill(`2195555${String(Math.floor(Math.random() * 9000) + 1000)}`);
  await cake.getByLabel("Endereço completo *").fill("Rua Teste, 123 - Guadalupe");
  await cake.getByLabel("Data da retirada/entrega *").fill(nextOpen(5));
  await cake.getByLabel("Horário *").selectOption("14:00");
  await cake.getByLabel("Tamanho / quantidade de pessoas").selectOption({ index: 2 });
  await cake.getByRole("button", { name: "Sim" }).click();
  await cake.getByRole("button", { name: "Enviar encomenda pelo WhatsApp" }).click();
  const required = await cake.getByText("Envie a foto do modelo de inspiração.").isVisible();
  await page.setInputFiles("#b-foto", photo);
  await cake.getByAltText("Prévia da foto de inspiração").waitFor({ timeout: 15000 });
  const [popup] = await Promise.all([page.waitForEvent("popup"), cake.getByRole("button", { name: "Enviar encomenda pelo WhatsApp" }).click()]);
  await page.getByText(/Quase lá!|Encomenda recebida!/).waitFor({ timeout: 20000 });
  await popup.waitForURL(/whatsapp/, { timeout: 15000 }).catch(() => {});
  const msg = decodeURIComponent(popup.url().replace(/\+/g, " "));
  await popup.close();
  return { msg, required };
}

/** Datas em Brasília: "AAAA-MM-DD" daqui a N dias; próximo dia útil (seg–sáb) e próximo domingo. */
const brDate = (days) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + days * 86400_000));
const dow = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();
const nextOpen = (minDays) => { for (let i = minDays; ; i++) if (dow(brDate(i)) !== 0) return brDate(i); };
const nextSunday = (minDays) => { for (let i = minDays; ; i++) if (dow(brDate(i)) === 0) return brDate(i); };

const browser = await chromium.launch();

// ---------------------------------------------------------------- Cliente (celular)
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
await ctx.addInitScript(fakeShare);
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

// Mini quiche (20 un): só 1 sabor por bandeja; com 2 bandejas, libera o 2º
await page.locator("#salgados").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Ver Mini Quiches" }).click();
await page.getByRole("button", { name: "Queijo", exact: true }).click();
await page.getByRole("button", { name: "Alho-poró" }).click();
const pressed = async (n) => (await page.getByRole("button", { name: n, exact: true }).getAttribute("aria-pressed")) === "true";
ok(!(await pressed("Queijo")) && (await pressed("Alho-poró")) && (await page.getByText("1 de 1 sabor").isVisible()), "Mini quiche: 1 sabor por bandeja de 20");
await page.getByRole("button", { name: "Aumentar" }).click();
await page.getByRole("button", { name: "Queijo", exact: true }).click();
ok((await pressed("Queijo")) && (await pressed("Alho-poró")), "Com 2 bandejas, pode escolher 2 sabores");
await page.getByRole("button", { name: "Fechar" }).click();

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
// Domingo: loja fechada
await page.getByLabel("Data da retirada *").fill(nextSunday(2));
ok(await page.getByText("A loja não abre nesse dia").isVisible() && (await page.getByLabel("Horário *").isDisabled()), "Domingo aparece fechado (sem horários)");
const d = nextOpen(3);
await page.getByLabel("Data da retirada *").fill(d);
const slots = await page.getByLabel("Horário *").locator("option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
ok(slots[0] === "09:00" && slots[slots.length - 1] === "18:00" && slots.length === 19, `Horários de 9h às 18h (${slots[0]}…${slots[slots.length - 1]})`);
await page.getByLabel("Horário *").selectOption("15:00");
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
await page.getByLabel("Data da retirada *").fill(d);
await page.getByLabel("Horário *").selectOption("11:00");
const [popup] = await Promise.all([page.waitForEvent("popup"), page.getByRole("button", { name: "Enviar pelo WhatsApp" }).click()]);
await page.getByText("Recebemos seu pedido").waitFor({ timeout: 15000 });
await popup.waitForURL(/wa\.me|whatsapp/, { timeout: 15000 }).catch(() => {});
const waUrl = decodeURIComponent(popup.url().replace(/\+/g, " "));
console.log("   URL WhatsApp:", waUrl.slice(0, 160));
ok(/api\.whatsapp\.com.*5521982712575/.test(waUrl) && waUrl.includes("🛍️ *Novo pedido") && waUrl.includes("Bandeja de Docinhos"), "WhatsApp aberto com o pedido formatado");
await popup.close();
await page.getByRole("button", { name: "Voltar ao site" }).click();

// Bolo de festa — modo padrão: o cliente envia a foto no WhatsApp (não vai para o site)
const cakeFilesBefore = await listFiles("inspiration-photos", "pedidos");
const w = await cakeOrder(page, "Ana Bolo");
ok(w.required, "Foto obrigatória quando há inspiração");
ok(w.msg.includes("🎂 *Nova encomenda de bolo") && w.msg.includes("vou enviar a foto em seguida") && !w.msg.includes("inspiration-photos"), "Mensagem sem link e avisando que a foto vem na conversa");
ok(await page.getByText("Quase lá!").isVisible(), "Tela com os 2 passos (mensagem + foto)");
await page.getByRole("button", { name: "Enviar a foto do modelo" }).click();
const shared = await page.evaluate(() => window.__shared);
ok(shared.length === 1 && shared[0].type === "image/jpeg" && shared[0].size > 0, "Foto entregue à tela de compartilhar do celular");
ok((await listFiles("inspiration-photos", "pedidos")).length === cakeFilesBefore.length, "Nenhuma foto foi enviada ao site");
const up = await fetch(`${sbUrl}/storage/v1/object/inspiration-photos/pedidos/${crypto.randomUUID()}.jpg`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "image/jpeg" }, body: new Uint8Array([1, 2, 3]) });
ok(!up.ok, "Upload direto de foto de bolo é recusado no modo WhatsApp");
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
const res = await fetch(`${sbUrl}/rest/v1/rpc/create_order`, {
  method: "POST",
  headers: { apikey: ANON, "Content-Type": "application/json" },
  body: JSON.stringify({ p_order: { channel: "site", customer_name: "Tempo Real", phone: "21933332222", fulfillment: "retirada", payment: "pix", desired_at: `${nextOpen(3)}T15:00:00-03:00`, items: [{ product_id: "00000000-0000-4000-8000-000200000001", portion_id: "00000000-0000-4000-8000-000300000101", flavors: ["Mini hot dog"], quantity: 1 }] } }),
});
const rt = await res.json();
await admin.locator("li").getByText(`nº ${rt.number}`, { exact: true }).waitFor({ timeout: 15000 });
ok((await admin.locator("li").count()) > before, `Tempo real: pedido nº ${rt.number} apareceu sozinho`);

// Encomenda de bolo com foto no painel
await admin.selectOption('select[aria-label="Tipo de pedido"]', "bolo");
await admin.getByRole("button", { name: /^Todos/ }).click();
await admin.getByText("Ana Bolo").first().click();
ok(await admin.getByText("A foto não fica no site").waitFor({ timeout: 8000 }).then(() => true, () => false), "Painel avisa que a foto está no WhatsApp");
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

// ---------------------------------------------------------------- Horários
const sun = nextSunday(4); // domingo com antecedência suficiente até para bolo (3 dias)
const rej = await fetch(`${sbUrl}/rest/v1/rpc/create_order`, {
  method: "POST",
  headers: { apikey: ANON, "Content-Type": "application/json" },
  body: JSON.stringify({ p_order: { channel: "site", customer_name: "Domingo Teste", phone: "21933331111", fulfillment: "retirada", payment: "pix", desired_at: `${sun}T12:00:00-03:00`, items: [{ product_id: "00000000-0000-4000-8000-000200000001", portion_id: "00000000-0000-4000-8000-000300000101", flavors: ["Mini hot dog"], quantity: 1 }] } }),
});
ok(!rej.ok && /fechada/.test((await rej.json()).message ?? ""), "Banco recusa pedido para domingo");
await admin.goto(`${BASE}/admin/horarios`);
await admin.getByLabel("Data", { exact: true }).fill(sun);
await admin.getByLabel("Abre às", { exact: true }).fill("10:00");
await admin.getByLabel("Fecha às", { exact: true }).fill("14:00");
await admin.getByRole("button", { name: "Adicionar data especial" }).click();
await admin.getByText("Horários salvos!").waitFor();
const cakeSlots = async () => {
  await site.goto(BASE, { waitUntil: "networkidle" });
  await site.locator("#doces").scrollIntoViewIfNeeded();
  await site.getByRole("button", { name: "Ver Bolos de Festa" }).click();
  await site.getByLabel("Data da retirada/entrega *").fill(sun);
  return site.getByLabel("Horário *").locator("option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
};
let sl = await cakeSlots();
ok(sl[0] === "10:00" && sl[sl.length - 1] === "14:00", `Domingo especial aberto no site (${sl[0]}…${sl[sl.length - 1]})`);
await admin.getByRole("button", { name: `Remover ${sun}` }).click();
await admin.getByRole("button", { name: `Remover ${sun}` }).waitFor({ state: "detached" });
await admin.waitForTimeout(1500); // espera o site ser atualizado
sl = await cakeSlots();
ok(sl.length === 0, "Removendo a data especial, o domingo volta a fechar");

// ---------------------------------------------------------------- Correções e novidades (nov/2026)
// 1) Produto oculto: a categoria some do site quando todos os produtos dela estão ocultos
await admin.goto(`${BASE}/admin/produtos/00000000-0000-4000-8000-000200000011`); // Brigadeiro
await admin.getByRole("switch", { name: "Mostrar no site" }).click();
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.getByText("Produto salvo!").waitFor();
await admin.waitForTimeout(800);
await site.goto(BASE, { waitUntil: "networkidle" });
ok((await site.getByRole("button", { name: "Ver Brigadeiro" }).count()) === 0, "Produto oculto: a categoria some do site");
await admin.getByRole("switch", { name: "Mostrar no site" }).click();
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.getByText("Produto salvo!").last().waitFor();
await admin.waitForTimeout(800);
await site.goto(BASE, { waitUntil: "networkidle" });
ok((await site.getByRole("button", { name: "Ver Brigadeiro" }).count()) === 1, "Mostrando de novo, a categoria volta");

// 2) Foto trocada no produto aparece no cartão da página principal
await admin.goto(`${BASE}/admin/produtos/00000000-0000-4000-8000-000200000004`); // Folhados
await admin.locator('input[type="file"]').nth(1).setInputFiles(photo);
await admin.getByRole("button", { name: "Usar sem recortar" }).click();
await admin.getByText("Imagem enviada").waitFor();
await admin.getByRole("button", { name: "★ Usar como foto principal" }).click();
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.getByText("Produto salvo!").last().waitFor();
await admin.waitForTimeout(800);
await site.goto(BASE, { waitUntil: "networkidle" });
const cardSrc = await site.getByRole("button", { name: "Ver Folhados" }).locator("img").getAttribute("src");
ok(decodeURIComponent(cardSrc ?? "").includes("/storage/v1/object/public/site-images/produtos/"), "Foto nova do produto aparece no cartão");

// 3) Galeria "Bolos que já fizemos"
await admin.goto(`${BASE}/admin/produtos/00000000-0000-4000-8000-000200000012`); // Bolo de Festa
await admin.locator('input[type="file"]').nth(1).setInputFiles(photo);
await admin.getByRole("button", { name: "Usar sem recortar" }).click();
await admin.getByText("Imagem enviada").waitFor();
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.getByText("Produto salvo!").last().waitFor();
await admin.waitForTimeout(800);
await site.goto(BASE, { waitUntil: "networkidle" });
await site.locator("#doces").scrollIntoViewIfNeeded();
await site.getByRole("button", { name: "Ver Bolos de Festa" }).click();
ok(await site.getByText("Bolos que já fizemos").isVisible(), "Galeria de bolos no formulário");
await site.getByRole("button", { name: "Ver bolo 1 em tamanho grande" }).click();
await site.getByRole("button", { name: "Quero um parecido" }).click();
ok((await site.getByLabel("Tema / observações").inputValue()).includes("nº 1"), "“Quero um parecido” preenche o tema");

// 4) Só WhatsApp + comer na loja
await admin.goto(`${BASE}/admin/configuracoes`);
await admin.getByRole("switch", { name: "Pedidos pelo site e pelo WhatsApp" }).click();
await admin.getByText("Configurações salvas!").last().waitFor();
await admin.waitForTimeout(800);
const c2 = await browser.newContext({ ...devices["iPhone 13"] });
const p2 = await c2.newPage();
await p2.goto(BASE, { waitUntil: "networkidle" });
await p2.locator("#promocoes").scrollIntoViewIfNeeded();
await p2.getByRole("button", { name: "Pedir agora" }).first().click();
await p2.getByRole("button", { name: /Abrir sacola/ }).click();
await p2.getByRole("button", { name: "Continuar" }).click();
ok((await p2.getByRole("button", { name: "Enviar pedido pelo site" }).count()) === 0 && (await p2.getByRole("button", { name: "Enviar pelo WhatsApp" }).isVisible()), "Só WhatsApp: botão do site some");
await p2.getByRole("button", { name: "Comer na loja" }).click();
ok((await p2.getByLabel("Data da retirada *").count()) === 0 && (await p2.getByLabel("Horário *").count()) === 0, "Comer na loja: sem dia e horário");
const openNow = !(await p2.getByText("A loja está fechada agora").isVisible());
await p2.getByLabel("Nome completo *").fill("Cliente Balcão");
await p2.getByLabel("Telefone / WhatsApp *").fill("21977776666");
if (openNow) {
  const [pop] = await Promise.all([p2.waitForEvent("popup"), p2.getByRole("button", { name: "Enviar pelo WhatsApp" }).click()]);
  await p2.getByText("Recebemos seu pedido").waitFor({ timeout: 15000 });
  await pop.waitForURL(/whatsapp/, { timeout: 15000 }).catch(() => {});
  const msg = decodeURIComponent(pop.url().replace(/\+/g, " "));
  await pop.close();
  ok(msg.includes("Comer na loja") && msg.includes("Para agora"), "Pedido para comer na loja enviado (loja aberta)");
} else {
  ok(true, "Comer na loja: loja fechada agora, aviso exibido (teste de envio pulado)");
}
await c2.close();
await admin.getByRole("switch", { name: "Pedidos só pelo WhatsApp" }).click();
await admin.getByText("Configurações salvas!").last().waitFor();
const rejSite = await fetch(`${sbUrl}/rest/v1/rpc/create_order`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: "{}" });
ok(rejSite.status >= 400, "Banco valida o pedido (chamada vazia recusada)");

// ---------------------------------------------------------------- Fotos: apagar

// 1) Foto enviada e salva num produto (em uso)
await admin.goto(`${BASE}/admin/produtos/00000000-0000-4000-8000-000200000003`);
await admin.locator('input[type="file"]').nth(1).setInputFiles(photo);
await admin.getByRole("button", { name: "Usar sem recortar" }).click();
await admin.getByText("Imagem enviada").waitFor();
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.getByText("Produto salvo!").waitFor();
const usedFiles = await listFiles("site-images", "produtos");
// 2) Foto sem uso (enviada direto, como se tivesse sido trocada)
await fetch(`${sbUrl}/storage/v1/object/site-images/produtos/sem-uso-teste.webp`, { method: "POST", headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "image/webp" }, body: new Uint8Array([1, 2, 3]) });
await admin.goto(`${BASE}/admin/configuracoes`);
await admin.getByText(/foto\(s\) do site sem uso/).waitFor({ timeout: 15000 });
await admin.getByRole("button", { name: "Apagar fotos sem uso" }).click();
await admin.getByText(/foto\(s\) apagada\(s\)/).waitFor();
const after = await listFiles("site-images", "produtos");
ok(!after.includes("sem-uso-teste.webp"), "Botão apaga a foto que não é usada");
ok(usedFiles.length > 0 && usedFiles.every((f) => after.includes(f)), "Foto em uso no produto NÃO é apagada");
// 3) Modo "Guardar no site e mandar link" (trocado nas Configurações)
await admin.goto(`${BASE}/admin/configuracoes`);
await admin.getByRole("button", { name: /Guardar no site e mandar link/ }).click();
await admin.getByRole("button", { name: "Salvar configurações" }).click();
await admin.getByText("Configurações salvas!").last().waitFor();
const mctx = await browser.newContext({ ...devices["iPhone 13"] });
const mpage = await mctx.newPage();
const l = await cakeOrder(mpage, "Bia Link");
await mctx.close();
const linkUrl = l.msg.match(/https?:\/\/[^\s&]+inspiration-photos\/pedidos\/[^\s&]+\.jpg/)?.[0];
ok(!!linkUrl && (await fetch(linkUrl)).ok, "Modo link: foto vai para o site e segue como link");
const cakesBefore = await listFiles("inspiration-photos", "pedidos");
await admin.goto(`${BASE}/admin`);
await admin.selectOption('select[aria-label="Tipo de pedido"]', "bolo");
await admin.getByRole("button", { name: /^Todos/ }).click();
await admin.getByText("Bia Link").first().click();
ok(await admin.getByAltText("Foto de inspiração enviada pelo cliente").waitFor({ timeout: 8000 }).then(() => true, () => false), "Modo link: foto aparece no painel");
await admin.getByRole("button", { name: "Apagar foto" }).click();
await admin.getByText("A foto não fica no site").waitFor();
const cakesAfter = await listFiles("inspiration-photos", "pedidos");
ok(cakesAfter.length === cakesBefore.length - 1, "Foto do bolo apagada do armazenamento");
await admin.keyboard.press("Escape");
// volta ao padrão
await admin.goto(`${BASE}/admin/configuracoes`);
await admin.getByRole("button", { name: /Cliente envia pelo WhatsApp/ }).click();
await admin.getByRole("button", { name: "Salvar configurações" }).click();
await admin.getByText("Configurações salvas!").last().waitFor();

await browser.close();
console.log(failures ? `\n${failures} falha(s)` : "\nTudo certo!");
process.exit(failures ? 1 : 0);
