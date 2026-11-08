"use client";
// Depoimentos: adicionar, editar, ocultar, excluir e reordenar.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidateSite } from "@/app/admin/actions";
import { Stars } from "@/components/ui/Decor";
import type { Testimonial } from "@/lib/types";
import { Btn, Modal, PageHeader, Switch, useToast } from "./ui";
import { SortableList, saveOrder } from "./SortableList";

export function TestimonialsManager() {
  const sb = useMemo(() => createClient(), []);
  const toast = useToast();
  const [list, setList] = useState<Testimonial[]>([]);
  const [edit, setEdit] = useState<Partial<Testimonial> | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("testimonials").select("*").order("sort_order");
    setList((data ?? []) as Testimonial[]);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const after = async (msg: string) => {
    await load();
    await revalidateSite();
    toast(msg);
  };

  const save = async () => {
    if (!edit?.name?.trim() || !edit.text?.trim()) return toast("Preencha o nome e a frase.", "erro");
    const row = { name: edit.name.trim(), text: edit.text.trim(), stars: edit.stars ?? 5, visible: edit.visible ?? true };
    const { error } = edit.id
      ? await sb.from("testimonials").update(row).eq("id", edit.id)
      : await sb.from("testimonials").insert({ ...row, sort_order: list.length });
    if (error) return toast("Não foi possível salvar.", "erro");
    setEdit(null);
    after("Depoimento salvo!");
  };

  return (
    <div>
      <PageHeader title="Depoimentos" subtitle="Aparecem no carrossel azul do site.">
        <Btn onClick={() => setEdit({ stars: 5, visible: true })}><Plus className="h-4 w-4" /> Novo depoimento</Btn>
      </PageHeader>
      <SortableList
        items={list}
        onReorder={setList}
        onDrop={async () => { if (await saveOrder(sb as never, "testimonials", list.map((x) => x.id))) { await revalidateSite(); toast("Ordem salva"); } }}
        render={(t) => (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${t.visible ? "text-navy" : "text-navy/40 line-through"}`}>{t.name}</p>
                <Stars n={t.stars} className="h-3 w-3" />
              </div>
              <p className="line-clamp-2 text-sm text-muted">“{t.text}”</p>
            </div>
            <button type="button" onClick={async () => { await sb.from("testimonials").update({ visible: !t.visible }).eq("id", t.id); after(t.visible ? "Ocultado" : "Visível no site"); }} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-cream" aria-label={t.visible ? "Ocultar" : "Mostrar"}>
              {t.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => setEdit(t)} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-cream" aria-label={`Editar depoimento de ${t.name}`}><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={async () => { if (!confirm("Excluir este depoimento?")) return; await sb.from("testimonials").delete().eq("id", t.id); after("Depoimento excluído"); }} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50" aria-label={`Excluir depoimento de ${t.name}`}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />
      <AnimatePresence>
        {edit && (
          <Modal title={edit.id ? "Editar depoimento" : "Novo depoimento"} onClose={() => setEdit(null)}>
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="t-nome">Nome da cliente</label>
                <input id="t-nome" className="field" value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="t-frase">Frase</label>
                <textarea id="t-frase" className="field min-h-28" maxLength={400} value={edit.text ?? ""} onChange={(e) => setEdit({ ...edit, text: e.target.value })} />
              </div>
              <div>
                <p className="label">Estrelas</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setEdit({ ...edit, stars: n })} className={`text-3xl ${n <= (edit.stars ?? 5) ? "text-gold" : "text-navy/20"}`} aria-label={`${n} estrela${n > 1 ? "s" : ""}`}>★</button>
                  ))}
                </div>
              </div>
              <Switch label="Mostrar no site" checked={edit.visible ?? true} onChange={(v) => setEdit({ ...edit, visible: v })} />
              <div className="flex justify-end gap-2">
                <Btn variant="ghost" onClick={() => setEdit(null)}>Cancelar</Btn>
                <Btn onClick={save}>Salvar</Btn>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
