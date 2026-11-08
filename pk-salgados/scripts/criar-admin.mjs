// Cria (ou libera) o acesso de uma dona ao painel.
// Uso: npm run admin:criar -- email@exemplo.com "SenhaForte123"
// Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Lê o .env.local sem precisar de bibliotecas extras.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const [email, password] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !password) {
  console.error('Uso: npm run admin:criar -- email@exemplo.com "SenhaForte123"');
  process.exit(1);
}
if (!url || !key) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}
if (password.length < 8) {
  console.error("A senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const { data: created, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  // Já existe? Procura o usuário e atualiza a senha.
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error("Erro ao criar usuário:", error.message);
    process.exit(1);
  }
  userId = existing.id;
  await sb.auth.admin.updateUserById(userId, { password });
  console.log("Usuário já existia — senha atualizada.");
} else {
  userId = created.user.id;
}

const { error: e2 } = await sb.from("admin_users").upsert({ user_id: userId, email });
if (e2) {
  console.error("Erro ao liberar acesso ao painel:", e2.message);
  process.exit(1);
}
console.log(`Pronto! ${email} já pode entrar em /admin`);
