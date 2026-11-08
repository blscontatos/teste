import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabase) {
    return (
      <main className="grid min-h-dvh place-items-center bg-cream p-6 text-center">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-card">
          <h1 className="font-title text-3xl text-navy">Painel indisponível</h1>
          <p className="mt-3 text-muted">Configure as variáveis do Supabase (veja o README) para usar o painel.</p>
        </div>
      </main>
    );
  }
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login?erro=sem-acesso");
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
