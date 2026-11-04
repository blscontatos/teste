"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, LoaderCircle, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import { deleteTestimonial, saveTestimonial } from "@/app/admin/actions";
import { useToast } from "./Toast";

type Draft = { client_name: string; region: string; content: string; rating: number; published: boolean; position: number };
const EMPTY: Draft = { client_name: "", region: "", content: "", rating: 5, published: true, position: 0 };

export function TestimonialsManager({ items }: { items: Testimonial[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<string | "new" | null>(items.length ? null : "new");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [pending, start] = useTransition();

  const open = (t?: Testimonial) => {
    setEditing(t?.id ?? "new");
    setDraft(t ? { client_name: t.client_name, region: t.region ?? "", content: t.content, rating: t.rating, published: t.published, position: t.position } : EMPTY);
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast("ok", msg);
        after?.();
        router.refresh();
      } else toast("error", r.error ?? "Erro.");
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <button type="button" className="btn-gold" onClick={() => open()}>
          <Plus className="h-4 w-4" /> Novo depoimento
        </button>
        {items.length === 0 && <p className="rounded-[20px] border border-dashed border-line bg-white p-8 text-center text-sm text-ink/60">Nenhum depoimento cadastrado.</p>}
        {items.map((t) => (
          <article key={t.id} className={`rounded-[20px] border bg-white p-5 ${editing === t.id ? "border-gold" : "border-line"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{t.client_name}</p>
                <p className="text-xs text-stone">{t.region}</p>
              </div>
              <span className={`chip ${t.published ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>{t.published ? "Publicado" : "Oculto"}</span>
            </div>
            <div className="mt-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-gold text-gold" : "text-stone-light"}`} />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">“{t.content}”</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
              <button type="button" className="btn-outline btn-sm" onClick={() => open(t)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                disabled={pending}
                onClick={() =>
                  run(
                    () => saveTestimonial(t.id, { client_name: t.client_name, region: t.region ?? "", content: t.content, rating: t.rating, published: !t.published, position: t.position }),
                    t.published ? "Depoimento ocultado." : "Depoimento publicado.",
                  )
                }
              >
                {t.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {t.published ? "Ocultar" : "Publicar"}
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm text-red-700 hover:bg-red-50"
                disabled={pending}
                onClick={() => confirm("Remover este depoimento?") && run(() => deleteTestimonial(t.id), "Depoimento removido.")}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <form
          className="h-fit space-y-4 rounded-[24px] border border-line bg-white p-6 lg:sticky lg:top-8"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveTestimonial(editing === "new" ? null : editing, draft), "Depoimento salvo.", () => {
              setEditing(null);
              setDraft(EMPTY);
            });
          }}
        >
          <h2 className="font-display text-2xl">{editing === "new" ? "Novo depoimento" : "Editar depoimento"}</h2>
          <label className="block">
            <span className="field-label">Nome do cliente *</span>
            <input className="field" required value={draft.client_name} onChange={(e) => setDraft({ ...draft, client_name: e.target.value })} maxLength={120} />
          </label>
          <label className="block">
            <span className="field-label">Bairro ou região</span>
            <input className="field" value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} maxLength={120} />
          </label>
          <label className="block">
            <span className="field-label">Depoimento *</span>
            <textarea className="field" required value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} maxLength={1200} />
          </label>
          <div>
            <span className="field-label">Avaliação</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setDraft({ ...draft, rating: n })} aria-label={`${n} estrelas`} className="p-1">
                  <Star className={`h-7 w-7 ${n <= draft.rating ? "fill-gold text-gold" : "text-stone-light"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="field-label">Ordem</span>
              <input type="number" min={0} max={999} className="field" value={draft.position} onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })} />
            </label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-[#b8955a]" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              Publicar no site
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-dark" disabled={pending}>
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Salvar
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
