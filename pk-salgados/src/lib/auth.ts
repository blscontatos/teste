import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Retorna o usuário logado se ele for uma das donas (tabela admin_users). */
export const getAdmin = cache(async () => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admin_users").select("user_id, email").eq("user_id", user.id).maybeSingle();
  return data ? { id: user.id, email: user.email ?? data.email } : null;
});

export async function getIsAdmin() {
  return Boolean(await getAdmin());
}

/** Para páginas do painel: manda para o login se não for dona. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Para ações do painel: lança erro se não for dona. */
export async function assertAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Acesso não autorizado. Entre novamente.");
  return admin;
}
