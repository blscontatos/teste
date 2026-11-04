"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Archive, Crown, Eye, EyeOff, LoaderCircle, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import type { Property } from "@/lib/types";
import { STATUS_LABEL, typeLabel } from "@/lib/constants";
import { coverOf, priceLine } from "@/lib/format";
import { deleteProperty, setFeaturedProperty, setPropertyStatus } from "@/app/admin/actions";
import { useToast } from "./Toast";

const STATUS_STYLE = {
  published: "bg-emerald-50 text-emerald-800",
  draft: "bg-amber-50 text-amber-800",
  archived: "bg-stone-100 text-stone-600",
} as const;

export function AdminPropertyList({ items, featuredId, isAdmin }: { items: Property[]; featuredId: string | null; isAdmin: boolean }) {
  if (!items.length)
    return (
      <div className="mt-8 rounded-[24px] border border-dashed border-line bg-white p-12 text-center">
        <p className="font-display text-2xl">Nenhum imóvel aqui</p>
        <p className="mt-2 text-sm text-ink/60">Cadastre um imóvel para começar a montar o portfólio.</p>
        <Link href="/admin/imoveis/novo" className="btn-gold mt-6">
          + Cadastrar imóvel
        </Link>
      </div>
    );
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <AdminCard key={p.id} p={p} featured={p.id === featuredId} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function AdminCard({ p, featured, isAdmin }: { p: Property; featured: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const cover = coverOf(p);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast("ok", success);
        router.refresh();
      } else toast("error", r.error ?? "Erro.");
    });

  return (
    <article data-testid={`admin-card-${p.code}`} className={`relative flex flex-col overflow-hidden rounded-[24px] border bg-white transition-shadow hover:shadow-lg ${featured ? "border-gold ring-2 ring-gold/30" : "border-line"}`}>
      <div className="relative aspect-[16/10] bg-sand">
        {cover ? <Image src={cover.url} alt="" fill sizes="(min-width:1280px) 400px, 50vw" className="object-cover" /> : <div className="grid h-full place-items-center text-xs text-stone">Sem fotos</div>}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className={`chip ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
          {featured && (
            <span className="chip bg-gold text-ink">
              <Crown className="h-3 w-3" /> Destaque
            </span>
          )}
        </div>
        {pending && (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold tracking-wider text-stone uppercase">
          Cód. {p.code} · {typeLabel(p.type)}
          {p.neighborhood ? ` · ${p.neighborhood}` : ""}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-display text-xl leading-snug">{p.title}</h3>
        <p className="mt-2 font-semibold">{priceLine(p).main}</p>
        {p.status === "draft" && (p.wizard_step ?? 1) < 5 && <p className="mt-1 text-xs text-amber-700">Cadastro na etapa {p.wizard_step} de 5</p>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          <Link href={`/admin/imoveis/${p.id}`} className="btn-outline btn-sm">
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Link>
          {p.status === "published" && (
            <Link href={`/imoveis/${p.slug}`} target="_blank" className="btn-ghost btn-sm">
              <Eye className="h-3.5 w-3.5" /> Ver no site
            </Link>
          )}
          {p.status !== "published" ? (
            <button type="button" disabled={pending} onClick={() => run(() => setPropertyStatus(p.id, "published"), "Imóvel publicado.")} className="btn-ghost btn-sm text-emerald-700">
              <Send className="h-3.5 w-3.5" /> Publicar
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={() => run(() => setPropertyStatus(p.id, "draft"), "Imóvel retirado do site.")} className="btn-ghost btn-sm">
              <EyeOff className="h-3.5 w-3.5" /> Despublicar
            </button>
          )}
          {p.status === "published" &&
            (featured ? (
              <button type="button" disabled={pending} onClick={() => run(() => setFeaturedProperty(null), "Destaque removido.")} className="btn-ghost btn-sm text-gold-deep">
                <Undo2 className="h-3.5 w-3.5" /> Remover destaque
              </button>
            ) : (
              <button type="button" disabled={pending} onClick={() => run(() => setFeaturedProperty(p.id), "Imóvel definido como destaque da página inicial.")} className="btn-ghost btn-sm text-gold-deep">
                <Crown className="h-3.5 w-3.5" /> Definir como destaque
              </button>
            ))}
          {p.status !== "archived" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => confirm("Arquivar este imóvel? Ele sairá do site, mas continuará salvo no painel.") && run(() => setPropertyStatus(p.id, "archived"), "Imóvel arquivado.")}
              className="btn-ghost btn-sm"
            >
              <Archive className="h-3.5 w-3.5" /> Arquivar
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                confirm(`Excluir definitivamente o imóvel ${p.code}? As fotos também serão apagadas. Esta ação não pode ser desfeita.`) &&
                run(() => deleteProperty(p.id), "Imóvel excluído.")
              }
              className="btn-ghost btn-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
