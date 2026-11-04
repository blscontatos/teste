import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, StatCard } from "@/components/admin/AdminShell";
import { AdminPropertyList } from "@/components/admin/AdminPropertyList";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { Property } from "@/lib/types";

const TABS = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "draft", label: "Rascunhos" },
  { key: "archived", label: "Arquivados" },
] as const;

export default async function AdminProperties({ searchParams }: { searchParams: Promise<{ aba?: string; q?: string }> }) {
  const profile = await requireStaff();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.aba) ? sp.aba! : "all";
  const supabase = await createClient();

  const [{ data: all }, { data: settings }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, code, slug, status, business, type, title, neighborhood, sale_price, rent_price, updated_at, wizard_step, property_images(id, url, is_cover, position)")
      .order("updated_at", { ascending: false }),
    supabase.from("site_settings").select("featured_property_id").eq("id", 1).single(),
  ]);
  const list = (all ?? []) as unknown as Property[];
  const counts = {
    all: list.length,
    published: list.filter((p) => p.status === "published").length,
    draft: list.filter((p) => p.status === "draft").length,
    archived: list.filter((p) => p.status === "archived").length,
  };
  const q = (sp.q ?? "").toLowerCase().trim();
  const filtered = list
    .filter((p) => tab === "all" || p.status === tab)
    .filter((p) => !q || [p.code, p.title, p.neighborhood].some((v) => (v ?? "").toLowerCase().includes(q)));

  return (
    <>
      <PageHeader
        title="Imóveis"
        subtitle="Cadastre, publique e escolha o destaque da página inicial."
        actions={
          <Link href="/admin/imoveis/novo" className="btn-gold">
            <Plus className="h-4 w-4" /> Cadastrar imóvel
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de imóveis" value={counts.all} accent />
        <StatCard label="Publicados" value={counts.published} />
        <StatCard label="Rascunhos" value={counts.draft} />
        <StatCard label="Arquivados" value={counts.archived} />
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/imoveis${t.key === "all" ? "" : `?aba=${t.key}`}`}
              role="tab"
              aria-selected={tab === t.key}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                tab === t.key ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"
              }`}
            >
              {t.label} <span className="ml-1 opacity-60">{counts[t.key]}</span>
            </Link>
          ))}
        </div>
        <form className="md:w-80">
          {tab !== "all" && <input type="hidden" name="aba" value={tab} />}
          <input name="q" defaultValue={sp.q} placeholder="Buscar por código, título ou bairro" className="field min-h-11 rounded-full" />
        </form>
      </div>

      <AdminPropertyList items={filtered} featuredId={settings?.featured_property_id ?? null} isAdmin={profile.role === "admin"} />
    </>
  );
}
