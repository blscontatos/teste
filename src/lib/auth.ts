import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Retorna usuário + perfil validados no servidor (getUser valida o JWT no Supabase Auth). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active, created_at")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
});

export async function requireStaff() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (!profile.active || !profile.role) redirect("/auth/sair?motivo=sem-permissao");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireStaff();
  if (profile.role !== "admin") redirect("/admin?erro=apenas-admin");
  return profile;
}

/** Para Server Actions: lança erro em vez de redirecionar. */
export async function assertStaff() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.active || !profile.role) throw new Error("Acesso não autorizado.");
  return profile;
}

export async function assertAdmin() {
  const profile = await assertStaff();
  if (profile.role !== "admin") throw new Error("Apenas administradores podem realizar esta ação.");
  return profile;
}
