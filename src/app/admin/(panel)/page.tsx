import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Crown, Plus } from "lucide-react";
import { PageHeader, StatCard } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { coverOf, formatDateTime, priceLine } from "@/lib/format";
import { LEAD_STATUS_LABEL } from "@/lib/constants";
import type { Lead, Property } from "@/lib/types";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const profile = await requireStaff();
  const sp = await searchParams;
  const supabase = await createClient();
  const countBy = (status: string) => supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", status);
  const [pub, drafts, newLeads, allLeads, settings, recent] = await Promise.all([
    countBy("published"),
    countBy("draft"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "novo"),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("site_settings").select("featured_property_id").eq("id", 1).single(),
    supabase.from("leads").select("id, kind, status, full_name, neighborhood, created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  let featured: Property | null = null;
  if (settings.data?.featured_property_id) {
    const { data } = await supabase.from("properties").select("*, property_images(*)").eq("id", settings.data.featured_property_id).maybeSingle();
    featured = data as Property | null;
  }
  const cover = featured ? coverOf(featured) : null;

  return (
    <>
      {sp.erro === "apenas-admin" && (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Esta área é exclusiva para administradores.</p>
      )}
      <PageHeader
        title={`Olá, ${(profile.full_name || "").split(" ")[0] || "bem-vindo"}`}
        subtitle="Acompanhe o portfólio e os contatos recebidos pelo site."
        actions={
          <Link href="/admin/imoveis/novo" className="btn-gold">
            <Plus className="h-4 w-4" /> Cadastrar imóvel
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Publicados" value={pub.count ?? 0} hint="visíveis no site" accent />
        <StatCard label="Rascunhos" value={drafts.count ?? 0} hint="aguardando publicação" />
        <StatCard label="Novos contatos" value={newLeads.count ?? 0} hint="sem atendimento" />
        <StatCard label="Total de contatos" value={allLeads.count ?? 0} hint="desde o início" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-[24px] border border-line bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <Crown className="h-5 w-5 text-gold-deep" /> Destaque da página inicial
            </h2>
            <Link href="/admin/imoveis?aba=published" className="text-sm font-semibold text-gold-deep hover:text-ink">
              Alterar
            </Link>
          </div>
          {featured ? (
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sand sm:w-56">
                {cover && <Image src={cover.url} alt={featured.title} fill sizes="224px" className="object-cover" />}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-stone uppercase">Cód. {featured.code}</p>
                <p className="mt-1 font-display text-2xl">{featured.title}</p>
                <p className="text-sm text-ink/60">{featured.neighborhood}</p>
                <p className="mt-3 font-semibold">{priceLine(featured).main}</p>
                <Link href={`/imoveis/${featured.slug}`} target="_blank" className="mt-4 inline-flex text-sm font-semibold text-gold-deep">
                  Ver no site →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink/60">
              Nenhum imóvel em destaque. A página inicial exibe uma composição institucional.
              <br />
              <Link href="/admin/imoveis?aba=published" className="mt-3 inline-flex font-semibold text-gold-deep">
                Escolher um imóvel publicado
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Contatos recentes</h2>
            <Link href="/admin/interessados" className="inline-flex items-center gap-1 text-sm font-semibold text-gold-deep hover:text-ink">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {(recent.data as Lead[] | null)?.length ? (
            <ul className="divide-y divide-line">
              {(recent.data as Lead[]).map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/interessados?id=${l.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <span className={`chip ${l.kind === "comprar" ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-800"}`}>
                      {l.kind === "comprar" ? "Comprar" : "Vender"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{l.full_name}</span>
                      <span className="block text-xs text-stone">
                        {l.neighborhood ?? "—"} · {formatDateTime(l.created_at)}
                      </span>
                    </span>
                    <span className="text-xs text-stone">{LEAD_STATUS_LABEL[l.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-ink/60">Nenhum contato recebido ainda.</p>
          )}
        </section>
      </div>
    </>
  );
}
