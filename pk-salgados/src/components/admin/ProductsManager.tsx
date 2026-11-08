"use client";
// Lista de produtos (por categoria) e gestão das categorias.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidateSite } from "@/app/admin/actions";
import { slugify } from "@/lib/format";
import type { Category, CategorySection, Product } from "@/lib/types";
import { Btn, Modal, PageHeader, Switch, useToast } from "./ui";
import { ImageUpload } from "./ImageUpload";
import { SortableList, saveOrder } from "./SortableList";

const kindLabel = { comum: "Comum", frito: "Salgado frito", bolo_festa: "Bolo de festa" };

export function ProductsManager() {
  const sb = useMemo(() => createClient(), []);
  const toast = useToast();
  const [tab, setTab] = useState<"produtos" | "categorias">("produtos");
  const [cats, setCats] = useState<Category[]>([]);
  const [prods, setProds] = useState<Product[]>([]);
  const [editCat, setEditCat] = useState<Partial<Category> | null>(null);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      sb.from("categories").select("*").order("sort_order"),
      sb.from("products").select("*, portions:product_portions(id), flavors:product_flavors(id)").order("sort_order"),
    ]);
    setCats((c.data ?? []) as Category[]);
    setProds((p.data ?? []) as Product[]);
  }, [sb]);
  useEffect(() => {
    load();
  }, [load]);

  const done = async (msg: string) => {
    await revalidateSite();
    toast(msg);
  };

  const patchProduct = async (p: Product, patch: Partial<Product>) => {
    setProds((list) => list.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    const { error } = await sb.from("products").update(patch).eq("id", p.id);
    if (error) return toast("Não foi possível salvar.", "erro");
    done("Salvo");
  };
  const deleteProduct = async (p: Product) => {
    if (!confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.\n\nDica: para tirar do site sem apagar, use "Ocultar".`)) return;
    const { error } = await sb.from("products").delete().eq("id", p.id);
    if (error) return toast("Não foi possível excluir.", "erro");
    setProds((l) => l.filter((x) => x.id !== p.id));
    done("Produto excluído");
  };

  const saveCategory = async () => {
    if (!editCat?.name?.trim()) return toast("Dê um nome para a categoria.", "erro");
    const row = {
      name: editCat.name.trim(),
      section: editCat.section ?? "salgado",
      description: editCat.description ?? "",
      image_url: editCat.image_url ?? "",
      visible: editCat.visible ?? true,
    };
    const { error } = editCat.id
      ? await sb.from("categories").update(row).eq("id", editCat.id)
      : await sb.from("categories").insert({ ...row, slug: `${slugify(row.name)}-${Date.now().toString(36)}`, sort_order: cats.length });
    if (error) return toast("Não foi possível salvar a categoria.", "erro");
    setEditCat(null);
    await load();
    done("Categoria salva");
  };
  const deleteCategory = async (c: Category) => {
    const n = prods.filter((p) => p.category_id === c.id).length;
    if (!confirm(`Excluir a categoria "${c.name}"?${n ? `\n\n${n} produto(s) ficarão sem categoria (não aparecem no site).` : ""}`)) return;
    const { error } = await sb.from("categories").delete().eq("id", c.id);
    if (error) return toast("Não foi possível excluir.", "erro");
    await load();
    done("Categoria excluída");
  };

  const groups: { title: string; cat?: Category; items: Product[] }[] = [
    ...cats.map((c) => ({ title: `${c.name} · ${c.section === "salgado" ? "Salgados" : "Doces"}`, cat: c, items: prods.filter((p) => p.category_id === c.id) })),
    { title: "Sem categoria", cat: undefined, items: prods.filter((p) => !p.category_id || !cats.some((c) => c.id === p.category_id)) },
  ].filter((g) => g.items.length || g.cat);

  return (
    <div>
      <PageHeader title="Produtos" subtitle="Arraste pela alça ⋮⋮ para mudar a ordem no site.">
        {tab === "produtos" ? (
          <Link href="/admin/produtos/novo" className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-pill">
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        ) : (
          <Btn onClick={() => setEditCat({ section: "salgado", visible: true })}><Plus className="h-4 w-4" /> Nova categoria</Btn>
        )}
      </PageHeader>

      <div className="mb-5 inline-flex rounded-full bg-white p-1 shadow-card">
        {(["produtos", "categorias"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-semibold capitalize ${tab === t ? "bg-navy text-white" : "text-navy"}`}>{t}</button>
        ))}
      </div>

      {tab === "produtos" ? (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.cat?.id ?? "sem"}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold text-navy">
                {g.title}
                {g.cat && !g.cat.visible && <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs">categoria oculta</span>}
              </h2>
              {!g.items.length ? (
                <p className="rounded-2xl border-2 border-dashed border-navy/15 p-4 text-sm text-muted">Nenhum produto. No site aparece “Consulte pelo WhatsApp”.</p>
              ) : (
                <SortableList
                  items={g.items}
                  onReorder={(items) => setProds((all) => [...all.filter((p) => !items.some((i) => i.id === p.id)), ...items])}
                  onDrop={async () => {
                    const ok = await saveOrder(sb as never, "products", g.items.map((i) => i.id));
                    if (ok) done("Ordem salva");
                  }}
                  render={(p) => (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-semibold ${p.visible ? "text-navy" : "text-navy/40 line-through"}`}>{p.name}</p>
                        <p className="text-xs text-muted">
                          {kindLabel[p.kind]} · {p.portions.length} porção(ões) · {p.flavors.length} sabor(es)
                          {!p.available && " · indisponível"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => patchProduct(p, { featured: !p.featured })} className={`grid h-9 w-9 place-items-center rounded-full ${p.featured ? "text-gold" : "text-navy/30"} hover:bg-cream`} aria-label={p.featured ? "Tirar destaque" : "Destacar"} title="Destaque">
                          <Star className="h-4 w-4" fill={p.featured ? "currentColor" : "none"} />
                        </button>
                        <button type="button" onClick={() => patchProduct(p, { available: !p.available })} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.available ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`} title="Disponível / indisponível">
                          {p.available ? "Disponível" : "Indisponível"}
                        </button>
                        <button type="button" onClick={() => patchProduct(p, { visible: !p.visible })} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-cream" aria-label={p.visible ? "Ocultar do site" : "Mostrar no site"} title={p.visible ? "Ocultar" : "Mostrar"}>
                          {p.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <Link href={`/admin/produtos/${p.id}`} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-cream" aria-label={`Editar ${p.name}`}><Pencil className="h-4 w-4" /></Link>
                        <button type="button" onClick={() => deleteProduct(p)} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50" aria-label={`Excluir ${p.name}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                />
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {(["salgado", "doce"] as CategorySection[]).map((section) => {
            const list = cats.filter((c) => c.section === section);
            return (
              <section key={section}>
                <h2 className="mb-2 font-semibold text-navy">{section === "salgado" ? "Nossos Salgados" : "Nossos Doces"}</h2>
                <SortableList
                  items={list}
                  onReorder={(items) => setCats((all) => [...all.filter((c) => c.section !== section), ...items])}
                  onDrop={async () => {
                    if (await saveOrder(sb as never, "categories", list.map((i) => i.id))) done("Ordem salva");
                  }}
                  render={(c) => (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {c.image_url && <img src={c.image_url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-semibold ${c.visible ? "text-navy" : "text-navy/40 line-through"}`}>{c.name}</p>
                        <p className="truncate text-xs text-muted">{prods.filter((p) => p.category_id === c.id).length} produto(s)</p>
                      </div>
                      <button type="button" onClick={() => setEditCat(c)} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-cream" aria-label={`Editar ${c.name}`}><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => deleteCategory(c)} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50" aria-label={`Excluir ${c.name}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                />
              </section>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editCat && (
          <Modal title={editCat.id ? "Editar categoria" : "Nova categoria"} onClose={() => setEditCat(null)}>
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="cat-nome">Nome</label>
                <input id="cat-nome" className="field" value={editCat.name ?? ""} onChange={(e) => setEditCat({ ...editCat, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="cat-sec">Aparece em</label>
                <select id="cat-sec" className="field" value={editCat.section} onChange={(e) => setEditCat({ ...editCat, section: e.target.value as CategorySection })}>
                  <option value="salgado">Nossos Salgados</option>
                  <option value="doce">Nossos Doces</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="cat-desc">Descrição curta</label>
                <input id="cat-desc" className="field" value={editCat.description ?? ""} onChange={(e) => setEditCat({ ...editCat, description: e.target.value })} />
              </div>
              <ImageUpload label="Foto do cartão" folder="categorias" aspect={4 / 3.4} value={editCat.image_url ?? ""} onChange={(url) => setEditCat({ ...editCat, image_url: url })} />
              <Switch label="Mostrar no site" checked={editCat.visible ?? true} onChange={(v) => setEditCat({ ...editCat, visible: v })} />
              <div className="flex justify-end gap-2">
                <Btn variant="ghost" onClick={() => setEditCat(null)}>Cancelar</Btn>
                <Btn onClick={saveCategory}>Salvar</Btn>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
