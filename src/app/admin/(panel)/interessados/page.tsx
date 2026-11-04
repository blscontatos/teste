import Link from "next/link";
import { PageHeader, StatCard } from "@/components/admin/AdminShell";
import { LeadsBoard } from "@/components/admin/LeadsBoard";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { Lead } from "@/lib/types";

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "comprar", label: "Interessados em comprar" },
  { key: "vender", label: "Interessados em vender" },
  { key: "novo", label: "Novos contatos" },
  { key: "em_atendimento", label: "Em atendimento" },
  { key: "concluido", label: "Concluídos" },
] as const;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ filtro?: string; id?: string; q?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const filtro = FILTERS.some((f) => f.key === sp.filtro) ? sp.filtro! : "todos";
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*, properties(code, title, slug)").order("created_at", { ascending: false }).limit(1000);
  const all = (data ?? []) as Lead[];
  const q = (sp.q ?? "").toLowerCase().trim();
  const list = all
    .filter((l) => {
      if (filtro === "comprar" || filtro === "vender") return l.kind === filtro;
      if (filtro === "novo" || filtro === "em_atendimento" || filtro === "concluido") return l.status === filtro;
      return true;
    })
    .filter((l) => !q || [l.full_name, l.email, l.phone, l.neighborhood].some((v) => (v ?? "").toLowerCase().includes(q)));
  const count = (fn: (l: Lead) => boolean) => all.filter(fn).length;

  return (
    <>
      <PageHeader title="Interessados" subtitle="Todos os formulários enviados pelo site. Dados privados — visíveis apenas para a equipe." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Novos" value={count((l) => l.status === "novo")} accent />
        <StatCard label="Em atendimento" value={count((l) => l.status === "em_atendimento")} />
        <StatCard label="Querem comprar" value={count((l) => l.kind === "comprar")} />
        <StatCard label="Querem vender" value={count((l) => l.kind === "vender")} />
      </div>
      <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 xl:mx-0 xl:px-0">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/interessados${f.key === "todos" ? "" : `?filtro=${f.key}`}`}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${filtro === f.key ? "bg-ink text-white" : "bg-white text-ink/60 hover:text-ink"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form className="xl:w-72">
          {filtro !== "todos" && <input type="hidden" name="filtro" value={filtro} />}
          <input name="q" defaultValue={sp.q} placeholder="Buscar nome, e-mail ou telefone" className="field min-h-11 rounded-full" />
        </form>
      </div>
      <LeadsBoard leads={list} openId={sp.id ?? null} />
    </>
  );
}
