import { PageHeader } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  const profile = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  return (
    <>
      <PageHeader title="Configurações" subtitle="Informações institucionais, WhatsApp e textos do site — sem precisar mexer em código." />
      <SettingsForm settings={data as SiteSettings} isAdmin={profile.role === "admin"} profileName={profile.full_name ?? ""} />
    </>
  );
}
