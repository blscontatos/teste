import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/admin/Toast";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const supabase = await createClient();
  const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo");
  return (
    <AdminShell name={profile.full_name || profile.email || "Usuário"} role={profile.role!} newLeads={count ?? 0}>
      <Toaster>{children}</Toaster>
    </AdminShell>
  );
}
