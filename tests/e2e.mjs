/**
 * Teste ponta a ponta (Playwright) dos fluxos principais.
 * Pré-requisitos: Supabase local rodando, app em http://localhost:3000 (npm run build && npm start),
 * usuários de teste criados (ver README) e fotos de exemplo em E2E_PHOTOS_DIR.
 *
 * Uso: E2E_PHOTOS_DIR=/caminho/fotos node tests/e2e.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const PASS = process.env.TEST_PASSWORD ?? "SenhaForte2026";
const PHOTOS = process.env.E2E_PHOTOS_DIR;
const SHOTS = process.env.E2E_SCREENSHOTS_DIR ?? "test-results";
fs.mkdirSync(SHOTS, { recursive: true });
const photos = PHOTOS ? fs.readdirSync(PHOTOS).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => path.join(PHOTOS, f)) : [];
assert.ok(photos.length >= 4, "Forneça ao menos 4 fotos em E2E_PHOTOS_DIR");

const browser = await chromium.launch();
let failures = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log("  ✔", name);
  } catch (e) {
    failures++;
    console.log("  ✖", name, "\n     ", String(e.message).split("\n").slice(0, 4).join("\n      "));
  }
};
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
const stamp = Date.now().toString().slice(-5);
const code1 = `E2E${stamp}A`;
const code2 = `E2E${stamp}B`;

async function login(page, email) {
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASS);
  await Promise.all([page.waitForURL(`${BASE}/admin`), page.click('button[type="submit"]')]);
}

async function createProperty(page, { code, title, type, neighborhood, price, area, beds, photos: files, publish }) {
  await page.goto(`${BASE}/admin/imoveis/novo`);
  await page.getByRole("button", { name: "Venda", exact: true }).click();
  await page.getByRole("button", { name: type, exact: true }).click();
  await page.getByLabel("Título do anúncio *").fill(title);
  await page.getByLabel(/Código do imóvel/).fill(code);
  await page.getByLabel("Bairro *").fill(neighborhood);
  await page.getByLabel("Endereço", { exact: true }).fill("Avenida das Américas, 1000");
  await page.click('[data-testid="wizard-next"]');
  await page.getByText("Deixe em branco os campos").waitFor();
  await page.getByLabel("Preço de venda").fill(String(price));
  await page.getByLabel("Condomínio").fill("2800");
  await page.getByLabel("Área total").fill(String(area));
  for (let i = 0; i < beds; i++) await page.getByLabel("Aumentar Quartos").click();
  for (let i = 0; i < 2; i++) await page.getByLabel("Aumentar Suítes").click();
  for (let i = 0; i < 3; i++) await page.getByLabel("Aumentar Banheiros").click();
  for (let i = 0; i < 2; i++) await page.getByLabel("Aumentar Vagas de garagem").click();
  await page.click('[data-testid="wizard-next"]');
  await page.locator('[data-testid="photo-input"]').setInputFiles(files);
  await page.locator('[data-testid="photo-grid"] li').nth(files.length - 1).waitFor({ timeout: 60000 });
  // define a 2ª foto como principal
  await page.locator('[data-testid="photo-grid"] li').nth(1).getByLabel("Definir como principal").click();
  await page.getByText("Foto principal definida.").waitFor();
  await page.click('[data-testid="wizard-next"]');
  await page.getByLabel(/Descrição completa/).fill(
    "Imóvel com acabamento de alto padrão, ambientes amplos e integrados, iluminação natural abundante e vista definitiva.\n\nCondomínio com infraestrutura completa de lazer e segurança 24 horas.",
  );
  await page.getByRole("button", { name: "Varanda gourmet" }).click();
  await page.getByRole("button", { name: "Vista para o mar" }).click();
  await page.getByRole("button", { name: "Piscina" }).click();
  await page.getByRole("button", { name: "Portaria 24 horas" }).click();
  await page.getByPlaceholder("Adicionar outra característica").first().fill("Automação residencial");
  await page.getByRole("button", { name: "Adicionar" }).first().click();
  await page.click('[data-testid="wizard-next"]');
  await page.getByText("Confira como o anúncio será apresentado").waitFor();
  if (publish === "feature") {
    await Promise.all([page.waitForURL(/aba=published/), page.click('[data-testid="wizard-publish-feature"]')]);
  } else if (publish === "publish") {
    await Promise.all([page.waitForURL(/aba=published/), page.click('[data-testid="wizard-publish"]')]);
  }
}

// =============================================================================
console.log("\n▸ Proteção do painel");
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await step("visitante é redirecionado ao login em /admin", async () => {
    await page.goto(`${BASE}/admin`);
    assert.match(page.url(), /\/admin\/login/);
  });
  await step("visitante é redirecionado ao login em /admin/interessados", async () => {
    await page.goto(`${BASE}/admin/interessados`);
    assert.match(page.url(), /\/admin\/login\?redirect=%2Fadmin%2Finteressados/);
  });
  await step("senha incorreta é recusada", async () => {
    await page.fill('input[name="email"]', "admin@luizvieira.test");
    await page.fill('input[name="password"]', "senha-errada-123");
    await page.click('button[type="submit"]');
    await page.getByText("E-mail ou senha inválidos.").waitFor();
  });
  await shot(page, "01-login");
  await ctx.close();
}

// =============================================================================
console.log("\n▸ Administrador");
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());

await step("login do administrador", () => login(page, "admin@luizvieira.test"));
await shot(page, "02-dashboard");

await step("configura WhatsApp", async () => {
  await page.goto(`${BASE}/admin/configuracoes`);
  await page.fill('[data-testid="settings-whatsapp"]', "5521988887777");
  await page.getByLabel("Telefone exibido no site").fill("(21) 98888-7777");
  await page.getByRole("button", { name: "Salvar" }).first().click();
  await page.getByText("Configurações salvas.").waitFor();
});

await step("cadastra imóvel em 5 etapas e publica como destaque", () =>
  createProperty(page, {
    code: code1,
    title: "Cobertura duplex com vista para o mar",
    type: "Cobertura",
    neighborhood: "Recreio dos Bandeirantes",
    price: 3450000,
    area: 320,
    beds: 4,
    photos: photos.slice(0, 4),
    publish: "feature",
  }),
);
await shot(page, "03-admin-imoveis");

await step("cadastra segundo imóvel (Barra da Tijuca) e publica", () =>
  createProperty(page, {
    code: code2,
    title: "Apartamento alto padrão próximo à praia",
    type: "Apartamento",
    neighborhood: "Barra da Tijuca",
    price: 1890000,
    area: 165,
    beds: 3,
    photos: photos.slice(2, 6),
    publish: "publish",
  }),
);

await step("dados persistem após recarregar a página", async () => {
  await page.reload();
  await page.locator(`[data-testid="admin-card-${code1}"]`).waitFor();
  await page.locator(`[data-testid="admin-card-${code2}"]`).waitFor();
});

// =============================================================================
console.log("\n▸ Site público");
const pub = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const site = await pub.newPage();

await step("home exibe o imóvel em destaque escolhido no painel", async () => {
  await site.goto(BASE);
  const t = await site.locator('[data-testid="hero-featured-title"]').textContent();
  assert.equal(t?.trim(), "Cobertura duplex com vista para o mar");
  assert.ok(await site.getByText(`Cód. ${code1}`).first().isVisible());
});
await site.waitForTimeout(1200);
await shot(site, "04-home-hero");

await step("trocar destaque no painel altera a home automaticamente", async () => {
  await page.goto(`${BASE}/admin/imoveis?aba=published`);
  await page.locator(`[data-testid="admin-card-${code2}"]`).getByRole("button", { name: "Definir como destaque" }).click();
  await page.getByText("Imóvel definido como destaque").waitFor();
  await site.goto(BASE);
  const t = await site.locator('[data-testid="hero-featured-title"]').textContent();
  assert.equal(t?.trim(), "Apartamento alto padrão próximo à praia");
  // botão do hero leva à página do imóvel
  await site.getByRole("link", { name: /Ver imóvel Apartamento alto padrão/ }).click();
  await site.waitForURL(/\/imoveis\/apartamento-alto-padrao/);
});

await step("página do imóvel: dados, galeria ampliável e WhatsApp com código", async () => {
  await site.getByRole("heading", { level: 1, name: "Apartamento alto padrão próximo à praia" }).waitFor();
  assert.match((await site.locator('[data-testid="property-price"]').textContent()) ?? "", /1\.890\.000/);
  const href = await site.locator('[data-testid="interest-whatsapp"]').getAttribute("href");
  assert.ok(href.startsWith("https://wa.me/5521988887777"), href);
  assert.ok(decodeURIComponent(href).includes(code2), "mensagem sem código");
  await site.getByText("Vista para o mar").first().waitFor();
  await site.getByText("Automação residencial").first().waitFor();
  assert.equal(await site.getByText("Avenida das Américas").count(), 0, "endereço exato exposto");
  await shot(site, "05-imovel");
  await site.getByRole("button", { name: "Ampliar fotografia" }).click();
  await site.getByRole("dialog", { name: "Galeria ampliada" }).waitFor();
  await site.keyboard.press("ArrowRight");
  await shot(site, "06-galeria");
  await site.keyboard.press("Escape");
  const ld = await site.locator('script[type="application/ld+json"]').allTextContents();
  assert.ok(ld.some((s) => s.includes('"RealEstateListing"')), "sem JSON-LD do imóvel");
  assert.ok(await site.getByText("Imóveis semelhantes").isVisible());
});

await step("metadados SEO individuais (title, og:image, canonical)", async () => {
  assert.match(await site.title(), /Apartamento alto padrão próximo à praia/);
  assert.ok(await site.locator('meta[property="og:image"]').count());
  assert.match((await site.locator('link[rel="canonical"]').getAttribute("href")) ?? "", /\/imoveis\/apartamento-alto-padrao/);
});

await step("filtros e busca da listagem", async () => {
  await site.goto(`${BASE}/imoveis?bairro=${encodeURIComponent("Barra da Tijuca")}`);
  const grid = site.locator('[data-testid="property-grid"]');
  assert.ok(await grid.getByText("Apartamento alto padrão próximo à praia").isVisible());
  assert.equal(await grid.getByText("Cobertura duplex com vista para o mar").count(), 0);
  await site.goto(`${BASE}/imoveis?q=${code1}`);
  assert.ok(await site.getByText("Cobertura duplex com vista para o mar").first().isVisible());
  await site.goto(`${BASE}/imoveis?negocio=comprar&tipo=cobertura&quartos=4`);
  assert.ok(await site.getByText("Cobertura duplex com vista para o mar").first().isVisible());
  await site.goto(`${BASE}/imoveis?preco=0-500000`);
  await site.getByText("Nenhum imóvel com esses critérios").waitFor();
  await site.goto(`${BASE}/imoveis`);
  await site.getByRole("button", { name: /Filtros/ }).click();
  await site.getByLabel("Tipo de imóvel").selectOption("apartamento");
  await site.waitForURL(/tipo=apartamento/);
  await site.locator('[data-testid="property-grid"]').getByText("Apartamento alto padrão").waitFor();
  await shot(site, "07-listagem");
});

await step("formulário 'Quero vender' grava no banco e mostra sucesso", async () => {
  await site.goto(`${BASE}/#como-ajudar`);
  await site.getByRole("tab", { name: /Quero vender meu imóvel/ }).click();
  const form = site.locator("form").filter({ hasText: "Enviar solicitação" });
  await form.getByLabel(/Nome completo/).fill("Teste E2E Vendedor");
  await form.getByLabel(/E-mail/).fill("vendedor@exemplo.com");
  await form.getByLabel(/Telefone/).fill("(21) 97777-6666");
  await form.getByLabel("Idade", { exact: true }).fill("52");
  await form.getByLabel("Bairro do imóvel").selectOption("Barra Olímpica");
  await form.locator('select[name="property_type"]').selectOption("Apartamento");
  await form.getByLabel(/Valor aproximado/).fill("1.200.000");
  await form.getByLabel(/Metragem/).fill("110");
  await form.getByLabel("Mensagem adicional").fill("Apartamento reformado, quero vender em até 6 meses.");
  // sem consentimento → erro
  await site.getByRole("button", { name: "Enviar solicitação" }).click();
  await site.getByText("É necessário autorizar o tratamento dos dados").waitFor();
  assert.equal(await site.getByLabel(/Nome completo/).inputValue(), "Teste E2E Vendedor", "campos foram limpos");
  await site.locator('input[name="consent"]').check();
  await site.getByRole("button", { name: "Enviar solicitação" }).click();
  await site.getByText("Solicitação enviada").waitFor();
  await shot(site, "08-lead-sucesso");
});

await step("formulário 'Quero comprar' grava no banco", async () => {
  await site.goto(`${BASE}/contato`);
  await site.getByRole("tab", { name: /Quero comprar/ }).click();
  await site.getByLabel(/Nome completo/).fill("Teste E2E Comprador");
  await site.getByLabel(/E-mail/).fill("comprador@exemplo.com");
  await site.getByLabel(/Telefone/).fill("21966665555");
  await site.getByLabel("Bairro de interesse").selectOption("Recreio dos Bandeirantes");
  await site.getByLabel("Faixa de preço").selectOption({ index: 3 });
  await site.getByLabel("Quantidade de quartos").selectOption("4");
  await site.locator('input[name="consent"]').check();
  await site.getByRole("button", { name: "Enviar solicitação" }).click();
  await site.getByText("Solicitação enviada").waitFor();
});

await step("botão flutuante do WhatsApp usa o número configurado", async () => {
  const href = await site.getByRole("link", { name: "Conversar pelo WhatsApp" }).getAttribute("href");
  assert.ok(href.startsWith("https://wa.me/5521988887777?text="), href);
  assert.match(decodeURIComponent(href), /Acessei o site Luiz Vieira/);
});

await step("depoimentos de demonstração identificados como exemplo", async () => {
  await site.goto(BASE);
  await site.getByText("Conteúdo de demonstração").waitFor();
});

// =============================================================================
console.log("\n▸ Interessados, depoimentos e arquivamento");
await step("contatos aparecem no painel com data e tipo", async () => {
  await page.goto(`${BASE}/admin/interessados?filtro=vender`);
  await page.getByRole("cell", { name: /Teste E2E Vendedor/ }).waitFor();
  assert.equal(await page.getByText("Teste E2E Comprador").count(), 0, "filtro vender mostrou comprador");
  await page.goto(`${BASE}/admin/interessados?filtro=comprar`);
  await page.getByText("Teste E2E Comprador").first().waitFor();
});
await step("abre contato, altera status e salva observação", async () => {
  await page.goto(`${BASE}/admin/interessados`);
  await page.getByText("Teste E2E Vendedor").first().click();
  const dlg = page.getByRole("dialog");
  await dlg.getByText("Barra Olímpica").waitFor();
  const wa = await dlg.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
  assert.ok(wa.startsWith("https://wa.me/5521977776666"), wa);
  await dlg.getByRole("button", { name: "Em atendimento" }).click();
  await page.getByText("Status: Em atendimento.").waitFor();
  await dlg.getByLabel("Observações internas").fill("Ligar sexta à tarde para agendar avaliação.");
  await dlg.getByRole("button", { name: "Salvar observações" }).click();
  await page.getByText("Observações salvas.").waitFor();
  await shot(page, "09-interessados");
  await page.reload();
  await page.goto(`${BASE}/admin/interessados?filtro=em_atendimento`);
  await page.getByText("Teste E2E Vendedor").first().click();
  assert.equal(await page.getByLabel("Observações internas").inputValue(), "Ligar sexta à tarde para agendar avaliação.");
  await page.keyboard.press("Escape");
});

await step("cadastra depoimento real e ele substitui os exemplos no site", async () => {
  await page.goto(`${BASE}/admin/depoimentos`);
  await page.getByRole("button", { name: "Novo depoimento" }).click();
  await page.getByLabel("Nome do cliente *").fill("Cliente E2E");
  await page.getByLabel("Bairro ou região").fill("Barra da Tijuca");
  await page.getByLabel("Depoimento *").fill("Atendimento excelente do início ao fim, recomendo de olhos fechados.");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await page.getByText("Depoimento salvo.").waitFor();
  await site.goto(BASE);
  await site.getByText("Atendimento excelente do início ao fim").waitFor();
  assert.equal(await site.getByText("Conteúdo de demonstração").count(), 0);
  await page.goto(`${BASE}/admin/depoimentos`);
  await page.locator("article").filter({ hasText: "Cliente E2E" }).first().getByRole("button", { name: "Ocultar" }).click();
  await page.getByText("Depoimento ocultado.").waitFor();
  await site.goto(BASE);
  await site.getByText("Conteúdo de demonstração").waitFor();
});

await step("arquivar imóvel em destaque remove do site e do hero", async () => {
  await page.goto(`${BASE}/admin/imoveis?aba=published`);
  await page.locator(`[data-testid="admin-card-${code2}"]`).getByRole("button", { name: "Arquivar" }).click();
  await page.getByText("Imóvel arquivado.").waitFor();
  await site.goto(BASE);
  assert.equal(await site.locator('[data-testid="hero-featured-title"]').count(), 0);
  const res = await site.goto(`${BASE}/imoveis?q=${code2}`);
  assert.equal(res.status(), 200);
  await site.getByText("Nenhum imóvel com esses critérios").waitFor();
});

await step("despublicar e republicar imóvel", async () => {
  await page.goto(`${BASE}/admin/imoveis?aba=published`);
  await page.locator(`[data-testid="admin-card-${code1}"]`).getByRole("button", { name: "Despublicar" }).click();
  await page.getByText("Imóvel retirado do site.").waitFor();
  await site.goto(`${BASE}/imoveis?q=${code1}`);
  await site.getByText("Nenhum imóvel com esses critérios").waitFor();
  await page.goto(`${BASE}/admin/imoveis?aba=draft`);
  await page.locator(`[data-testid="admin-card-${code1}"]`).getByRole("button", { name: "Publicar" }).click();
  await page.getByText("Imóvel publicado.").waitFor();
  await page.goto(`${BASE}/admin/imoveis?aba=published`);
  await page.locator(`[data-testid="admin-card-${code1}"]`).getByRole("button", { name: "Definir como destaque" }).click();
  await page.getByText("Imóvel definido como destaque").waitFor();
});

await step("rascunho é preservado quando o usuário sai no meio do cadastro", async () => {
  await page.goto(`${BASE}/admin/imoveis/novo`);
  await page.getByLabel("Título do anúncio *").fill(`Rascunho E2E ${stamp}`);
  await page.locator('[data-testid="save-state"]').getByText("Rascunho salvo").waitFor({ timeout: 10000 });
  await page.goto(`${BASE}/admin/imoveis?aba=draft`);
  await page.getByText(`Rascunho E2E ${stamp}`).waitFor();
  await page.getByText(`Rascunho E2E ${stamp}`).locator("xpath=ancestor::article").getByRole("link", { name: "Editar" }).click();
  assert.equal(await page.getByLabel("Título do anúncio *").inputValue(), `Rascunho E2E ${stamp}`);
});

await step("excluir imóvel (admin) remove do banco", async () => {
  await page.goto(`${BASE}/admin/imoveis?aba=draft`);
  const card = page.getByText(`Rascunho E2E ${stamp}`).locator("xpath=ancestor::article");
  await card.getByRole("button", { name: "Excluir" }).click();
  await page.getByText("Imóvel excluído.").waitFor();
  await page.reload();
  assert.equal(await page.getByText(`Rascunho E2E ${stamp}`).count(), 0);
});

await step("excluir contato", async () => {
  await page.goto(`${BASE}/admin/interessados`);
  await page.getByText("Teste E2E Comprador").first().click();
  await page.getByRole("button", { name: "Excluir contato" }).click();
  await page.getByText("Contato excluído.").waitFor();
});

await step("logout encerra a sessão", async () => {
  await page.getByRole("button", { name: "Sair" }).first().click();
  await page.waitForURL(/\/admin\/login/);
  await page.goto(`${BASE}/admin`);
  assert.match(page.url(), /\/admin\/login/);
});

// =============================================================================
console.log("\n▸ Corretor (permissões)");
{
  const c = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await c.newPage();
  await step("corretor entra e não vê menus exclusivos do admin", async () => {
    await login(p, "corretor@luizvieira.test");
    assert.equal(await p.getByRole("link", { name: "Depoimentos" }).count(), 0);
    assert.equal(await p.getByRole("link", { name: "Usuários" }).count(), 0);
  });
  await step("corretor é barrado em /admin/depoimentos e /admin/usuarios", async () => {
    await p.goto(`${BASE}/admin/depoimentos`);
    await p.getByText("exclusiva para administradores").waitFor();
    await p.goto(`${BASE}/admin/usuarios`);
    await p.getByText("exclusiva para administradores").waitFor();
  });
  await step("corretor não tem botão excluir e não edita WhatsApp", async () => {
    await p.goto(`${BASE}/admin/imoveis`);
    assert.equal(await p.getByRole("button", { name: "Excluir" }).count(), 0);
    await p.goto(`${BASE}/admin/configuracoes`);
    assert.ok(await p.locator('[data-testid="settings-whatsapp"]').isDisabled());
  });
  await c.close();
}

// =============================================================================
console.log("\n▸ Mobile");
{
  const m = await browser.newContext({ ...devices["iPhone 13"] });
  const p = await m.newPage();
  await step("home mobile: menu, hero e cards", async () => {
    await p.goto(BASE);
    await p.waitForTimeout(1200);
    await shot(p, "10-mobile-home");
    await p.getByRole("button", { name: "Abrir menu" }).click();
    await p.getByRole("navigation", { name: "Menu móvel" }).getByRole("link", { name: "Vender seu imóvel" }).click();
    await p.waitForURL(/\/vender/);
    await p.waitForTimeout(600);
    await shot(p, "11-mobile-vender");
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, "rolagem horizontal no mobile");
  });
  await step("página do imóvel no mobile", async () => {
    await p.goto(`${BASE}/imoveis`);
    await p.locator('[data-testid="property-grid"] article').first().click();
    await p.waitForURL(/\/imoveis\/.+/);
    await p.waitForTimeout(800);
    await shot(p, "12-mobile-imovel");
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, "rolagem horizontal no mobile");
  });
  await step("painel no mobile", async () => {
    await login(p, "admin@luizvieira.test");
    await p.goto(`${BASE}/admin/imoveis`);
    await shot(p, "13-mobile-admin");
    await p.getByRole("button", { name: "Abrir menu do painel" }).click();
    await p.getByRole("link", { name: /Interessados/ }).last().click();
    await p.waitForURL(/interessados/);
  });
  await m.close();
}

await step("sitemap e robots", async () => {
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  assert.ok(sm.includes("/imoveis/cobertura-duplex"), "imóvel não está no sitemap");
  const rb = await (await fetch(`${BASE}/robots.txt`)).text();
  assert.match(rb, /Disallow: \/admin/);
});

await browser.close();
console.log(failures ? `\n${failures} falha(s).` : "\nTodos os testes ponta a ponta passaram.");
process.exit(failures ? 1 : 0);
