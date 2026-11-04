/** Testa a recuperação de senha ponta a ponta usando o Mailpit do Supabase local (http://127.0.0.1:54324). */
const { chromium } = require("playwright");
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const EMAIL = "corretor@luizvieira.test";
(async () => {
  await fetch("http://127.0.0.1:54324/api/v1/messages", { method: "DELETE" });
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(`${BASE}/admin/recuperar-senha`);
  await p.fill('input[name="email"]', EMAIL);
  await p.click('button[type="submit"]');
  await p.getByText("Verifique seu e-mail").waitFor();
  let link = null;
  for (let i = 0; i < 20 && !link; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const list = await (await fetch("http://127.0.0.1:54324/api/v1/messages")).json();
    if (list.messages?.length) {
      const msg = await (await fetch(`http://127.0.0.1:54324/api/v1/message/${list.messages[0].ID}`)).json();
      link = (msg.HTML.match(/href="([^"]+)"/) || [])[1]?.replace(/&amp;/g, "&");
    }
  }
  if (!link) throw new Error("E-mail de recuperação não recebido");
  await p.goto(link);
  await p.waitForURL(/redefinir-senha/);
  await p.fill('input[name="password"]', "NovaSenha2026x");
  await p.fill('input[name="confirm"]', "NovaSenha2026x");
  await p.click('button[type="submit"]');
  await p.getByText("Senha atualizada com sucesso.").waitFor();
  // volta a senha original via novo login
  await p.goto(`${BASE}/admin/configuracoes`);
  await p.fill('input[placeholder^="Nova senha"]', "SenhaForte2026");
  await p.fill('input[placeholder="Confirmar nova senha"]', "SenhaForte2026");
  await p.getByRole("button", { name: "Atualizar senha" }).click();
  await p.getByText("Senha alterada com sucesso.").waitFor();
  await b.close();
  console.log("✔ Recuperação de senha por e-mail funcionando.");
})().catch((e) => {
  console.error("✖", e.message);
  process.exit(1);
});
