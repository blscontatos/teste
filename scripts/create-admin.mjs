#!/usr/bin/env node
/**
 * Configuração inicial segura: cria (ou promove) o PRIMEIRO ADMINISTRADOR.
 *
 * Executado apenas pelo responsável técnico, no terminal, com a chave service role.
 * A chave nunca vai para o navegador. Não existe cadastro público de administradores.
 *
 * Uso:
 *   node --env-file=.env.local scripts/create-admin.mjs --email voce@dominio.com --name "Luiz Vieira"
 *   (a senha é solicitada de forma oculta; ou use --password, apenas em ambientes controlados)
 */
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, []),
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✖ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ex.: node --env-file=.env.local …).");
  process.exit(1);
}
const email = (args.email ?? "").trim().toLowerCase();
const name = args.name ?? "Administrador";
const role = args.role === "corretor" ? "corretor" : "admin";
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("✖ Informe um e-mail válido: --email voce@dominio.com");
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
      else rl.output.write("*");
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

let password = args.password;
if (!password) {
  password = await askHidden("Senha do administrador (mín. 10 caracteres, letras e números): ");
  const confirm = await askHidden("Confirme a senha: ");
  if (password !== confirm) {
    console.error("✖ As senhas não coincidem.");
    process.exit(1);
  }
}
if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error("✖ A senha deve ter ao menos 10 caracteres, com letras e números.");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Procura usuário existente
let existing = null;
for (let page = 1; page < 50 && !existing; page++) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("✖", error.message);
    process.exit(1);
  }
  existing = data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 200) break;
}

let userId;
if (existing) {
  const { error } = await sb.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...existing.app_metadata, role },
    user_metadata: { ...existing.user_metadata, full_name: name },
  });
  if (error) {
    console.error("✖", error.message);
    process.exit(1);
  }
  userId = existing.id;
  console.log(`• Usuário já existia — senha e permissão atualizadas.`);
} else {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: name },
  });
  if (error) {
    console.error("✖", error.message);
    process.exit(1);
  }
  userId = data.user.id;
}

const { error: pErr } = await sb.from("profiles").upsert({ id: userId, email, full_name: name, role, active: true });
if (pErr) {
  console.error("✖ Falha ao gravar perfil:", pErr.message);
  process.exit(1);
}
console.log(`✔ ${role === "admin" ? "Administrador" : "Corretor"} pronto: ${email}`);
console.log("  Acesse /admin/login para entrar no painel.");
