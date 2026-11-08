"use client";
// Promoções e combos: criar, editar, excluir, período de validade e itens do combo.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidateSite } from "@/app/admin/actions";
import { formatDateTime, money } from "@/lib/format";
import type { Product, Promotion, PromotionItem } from "@/lib/types";
import { Btn, Modal, PageHeader, Switch, toNumber, useToast } from "./ui";
import { ImageUpload } from "./ImageUpload";
import { SortableList, saveOrder } from "./SortableList";

type Edit = Omit<Promotion, "id" | "sort_order" | "items"> & { id?: string; items: (Omit<PromotionItem, "promotion_id" | "sort_order"> & { _new?: boolean })[] };

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(" ", "T");
};
const fromLocal = (v: string) => (v ? new Date(`${v}:00-03:00`).toISOString() : null);

function statusOf(p: Promotion) {
  const now = Date.now();
  if (!p.active) return { label: "Inativa", cls: "bg-navy/10 text-navy" };
  if (p.starts_at && new Date(p.starts_at).getTime() > now) return { label: "Agendada", cls: "bg-blue-100 text-blue-800" };
  if (p.ends_at && new Date(p.ends_at).getTime() <= now) return { label: "Vencida", cls: "bg-red-100 text-red-700" };
  return { label: "No ar", cls: "bg-emerald-100 text-emerald-800" };
}

export function PromotionsManager() {
  const sb = useMemo(() => createClient(), []);
  const toast = useToast();
  const [list, setList] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Pick<Product, "id" | "name">[]>([]);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [removedItems, setRemovedItems] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [p, pr] = await Promise.all([
      sb.from("promotions").select("*, items:promotion_items(*)").order("sort_order"),
      sb.from("products").select("id, name").order("name"),
    ]);
    setList(((p.data ?? []) as Promotion[]).map((x) => ({ ...x, items: [...x.items].sort((a, b) => a.sort_order - b.sort_order) })));
    setProducts(pr.data ?? []);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!edit) return;
    if (!edit.title.trim()) return toast("Dê um nome para a promoção.", "erro");
    if (edit.price == null || isNaN(edit.price)) return toast("Informe o preço promocional.", "erro");
    if (edit.starts_at && edit.ends_at && edit.ends_at <= edit.starts_at) return toast("A data de fim precisa ser depois do início.", "erro");
    const row = {
      title: edit.title.trim(), description: edit.description, images: edit.images.filter(Boolean), badge: edit.badge.trim(),
      old_price: edit.old_price, price: edit.price, starts_at: edit.starts_at, ends_at: edit.ends_at, active: edit.active,
    };
    let id = edit.id;
    if (id) {
      const { error } = await sb.from("promotions").update(row).eq("id", id);
      if (error) return toast("Não foi possível salvar.", "erro");
    } else {
      const { data, error } = await sb.from("promotions").insert({ ...row, sort_order: list.length }).select("id").single();
      if (error || !data) return toast("Não foi possível salvar.", "erro");
      id = data.id;
    }
    const ops = [];
    if (removedItems.length) ops.push(sb.from("promotion_items").delete().in("id", removedItems));
    const items = edit.items.filter((i) => i.description.trim());
    if (items.length)
      ops.push(sb.from("promotion_items").upsert(items.map((i, k) => ({ id: i.id, promotion_id: id, product_id: i.product_id, description: i.description.trim(), quantity: i.quantity || 1, sort_order: k }))));
    const r = await Promise.all(ops);
    if (r.some((x) => x.error)) return toast("Promoção salva, mas houve erro nos itens.", "erro");
    setEdit(null);
    setRemovedItems([]);
    await load();
    await revalidateSite();
    toast("Promoção salva!");
  };

  const remove = async (p: Promotion) => {
    if (!confirm(`Excluir a promoção "${p.title}"?`)) return;
    const { error } = await sb.from("promotions").delete().eq("id", p.id);
    if (error) return toast("Não foi possível excluir.", "erro");
    await load();
    await revalidateSite();
    toast("Promoção excluída");
  };

  const toggle = async (p: Promotion) => {
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
    await sb.from("promotions").update({ active: !p.active }).eq("id", p.id);
    await revalidateSite();
    toast(p.active ? "Promoção desativada" : "Promoção ativada");
  };

  return (
    <div>
      <PageHeader title="Promoções e combos" subtitle="Promoções vencidas somem do site sozinhas.">
        <Btn onClick={() => setEdit({ title: "", description: "", images: [], badge: "Promoção", old_price: null, price: 0, starts_at: null, ends_at: null, active: true, items: [] })}>
          <Plus className="h-4 w-4" /> Nova promoção
        </Btn>
      </PageHeader>

      {!list.length ? (
        <p className="rounded-3xl bg-white p-10 text-center text-muted shadow-card">Nenhuma promoção cadastrada.</p>
      ) : (
        <SortableList
          items={list}
          onReorder={setList}
          onDrop={async () => { if (await saveOrder(sb as never, "promotions", list.map((x) => x.id))) { await revalidateSite(); toast("Ordem salva"); } }}
          render={(p) => {
            const st = statusOf(p);
            return (
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-navy">{p.title}</p>
                  <p className="text-xs text-muted">
                    {p.old_price ? <s>{money(p.old_price)}</s> : null} <strong className="text-navy">{money(p.price)}</strong>
                    {p.ends_at && ` · até ${formatDateTime(p.ends_at)}`}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
                <button type="button" onClick={() => toggle(p)} className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-navy">{p.active ? "Desativar" : "Ativar"}</button>
                <button type="button" onClick={() => { setRemovedItems([]); setEdit({ ...p, items: p.items }); }} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-cream" aria-label={`Editar ${p.title}`}><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(p)} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50" aria-label={`Excluir ${p.title}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          }}
        />
      )}

      <AnimatePresence>
        {edit && (
          <Modal title={edit.id ? "Editar promoção" : "Nova promoção"} onClose={() => setEdit(null)} wide>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <div>
                  <label className="label" htmlFor="pr-nome">Nome *</label>
                  <input id="pr-nome" className="field" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="pr-etq">Etiqueta</label>
                  <input id="pr-etq" className="field" list="etiquetas" value={edit.badge} onChange={(e) => setEdit({ ...edit, badge: e.target.value })} />
                  <datalist id="etiquetas"><option value="Mais pedido" /><option value="Promoção" /><option value="Combo" /><option value="Novidade" /></datalist>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="pr-desc">Descrição</label>
                <textarea id="pr-desc" className="field min-h-20" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="pr-de">Preço antigo (riscado)</label>
                  <input id="pr-de" className="field" inputMode="decimal" value={edit.old_price ?? ""} onChange={(e) => setEdit({ ...edit, old_price: toNumber(e.target.value) })} />
                </div>
                <div>
                  <label className="label" htmlFor="pr-por">Preço promocional *</label>
                  <input id="pr-por" className="field" inputMode="decimal" value={edit.price ?? ""} onChange={(e) => setEdit({ ...edit, price: toNumber(e.target.value) ?? 0 })} />
                </div>
                <div>
                  <label className="label" htmlFor="pr-ini">Começa em</label>
                  <input id="pr-ini" type="datetime-local" className="field" value={toLocal(edit.starts_at)} onChange={(e) => setEdit({ ...edit, starts_at: fromLocal(e.target.value) })} />
                  <p className="hint">Vazio = já começa</p>
                </div>
                <div>
                  <label className="label" htmlFor="pr-fim">Termina em</label>
                  <input id="pr-fim" type="datetime-local" className="field" value={toLocal(edit.ends_at)} onChange={(e) => setEdit({ ...edit, ends_at: fromLocal(e.target.value) })} />
                  <p className="hint">Vazio = sem data para acabar</p>
                </div>
              </div>
              <div>
                <p className="label">Itens incluídos no combo</p>
                <div className="space-y-2">
                  {edit.items.map((it) => (
                    <div key={it.id} className="grid grid-cols-[4rem_1fr_auto] gap-2 sm:grid-cols-[4rem_1.4fr_1fr_auto]">
                      <input className="field" inputMode="numeric" aria-label="Quantidade" value={it.quantity} onChange={(e) => setEdit({ ...edit, items: edit.items.map((x) => (x.id === it.id ? { ...x, quantity: Number(e.target.value) || 1 } : x)) })} />
                      <input className="field" placeholder="Ex.: 50 salgados fritos" aria-label="Descrição do item" value={it.description} onChange={(e) => setEdit({ ...edit, items: edit.items.map((x) => (x.id === it.id ? { ...x, description: e.target.value } : x)) })} />
                      <select className="field col-span-3 sm:col-span-1" aria-label="Produto relacionado" value={it.product_id ?? ""} onChange={(e) => setEdit({ ...edit, items: edit.items.map((x) => (x.id === it.id ? { ...x, product_id: e.target.value || null } : x)) })}>
                        <option value="">Produto (opcional)</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button type="button" onClick={() => { setEdit({ ...edit, items: edit.items.filter((x) => x.id !== it.id) }); if (!it._new) setRemovedItems((r) => [...r, it.id]); }} className="row-start-1 col-start-3 grid h-11 w-11 place-items-center rounded-full text-red-600 hover:bg-red-50 sm:col-start-4" aria-label="Remover item">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Btn variant="outline" className="mt-2" onClick={() => setEdit({ ...edit, items: [...edit.items, { id: crypto.randomUUID(), product_id: null, description: "", quantity: 1, _new: true }] })}>
                  <Plus className="h-4 w-4" /> Adicionar item
                </Btn>
              </div>
              <ImageUpload label="Foto" folder="promocoes" aspect={16 / 11} value={edit.images[0] ?? ""} onChange={(url) => setEdit({ ...edit, images: url ? [url, ...edit.images.slice(1)] : edit.images.slice(1) })} />
              <Switch label="Promoção ativa" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} />
              <div className="flex justify-end gap-2">
                <Btn variant="ghost" onClick={() => setEdit(null)}>Cancelar</Btn>
                <Btn onClick={save}>Salvar promoção</Btn>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
