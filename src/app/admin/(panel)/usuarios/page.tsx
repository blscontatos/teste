import { PageHeader } from "@/components/admin/AdminShell";
import { UsersManager } from "@/components/admin/UsersManager";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export default async function UsersPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email, role, active, created_at").order("created_at");
  return (
    <>
      <PageHeader title="Usuários" subtitle="Somente administradores podem criar acessos. Não existe cadastro público." />
      <UsersManager users={(data ?? []) as Profile[]} meId={me.id} serviceConfigured={!!process.env.SUPABASE_SERVICE_ROLE_KEY} />
    </>
  );
}
