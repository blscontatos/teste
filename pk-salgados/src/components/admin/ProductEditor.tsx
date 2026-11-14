"use client";
// Cadastro/edição de produto: dados, fotos, porções (com preços) e sabores.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidateSite } from "@/app/admin/actions";
import { slugify } from "@/lib/format";
import type { Category, Flavor, Portion, Product, ProductKind } from "@/lib/types";
import { Btn, Card, MoneyInput, PageHeader, Switch, toNumber, useToast } from "./ui";
import { ImageUpload } from "./ImageUpload";
import { SortableList } from "./SortableList";

type EditPortion = Omit<Portion, "product_id" | "sort_order"> & { _new?: boolean };
type EditFlavor = Omit<Flavor, "product_id" | "sort_order"> & { _new?: boolean };

const newId = () => crypto.randomUUID();
const blank: Omit<Product, "id" | "portions" | "flavors" | "sort_order"> = {
  category_id: null, kind: "comum", name: "", slug: "", description: "", images: [], price: null,
  max_flavors: 2, price_per_flavor: false, available: true, visible: true, featured: false,
};

export function ProductEditor({ id, initialCategoryId }: { id?: string; initialCategoryId?: string }) {
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const toast = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [p, setP] = useState({ ...blank, category_id: initialCategoryId ?? null });
  const [portions, setPortions] = useState<EditPortion[]>([]);
  const [flavors, setFlavors] = useState<EditFlavor[]>([]);
  const [removed, setRemoved] = useState<{ portions: string[]; flavors: string[] }>({ portions: [], flavors: [] });
  const [newFlavor, setNewFlavor] = useState("");
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sb.from("categories").select("*").order("sort_order").then(({ data }) => {
      const list = (data ?? []) as Category[];
      setCats(list);
      // Produto novo vindo de "Adicionar produto nesta categoria": categoria de fritos já começa como "Salgado frito".
      const cat = !id && initialCategoryId ? list.find((c) => c.id === initialCategoryId) : undefined;
      if (cat && /frit/i.test(cat.name)) setP((x) => ({ ...x, kind: "frito" }));
    });
    if (!id) return;
    sb.from("products")
      .select("*, portions:product_portions(*), flavors:product_flavors(*)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return router.replace("/admin/produtos");
        const prod = data as Product;
        setP(prod);
        setPortions([...prod.portions].sort((a, b) => a.sort_order - b.sort_order));
        setFlavors([...prod.flavors].sort((a, b) => a.sort_order - b.sort_order));
        setLoading(false);
      });
  }, [id, sb, router, initialCategoryId]);

  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => setP((x) => ({ ...x, [k]: v }));
  const setPortion = (pid: string, patch: Partial<EditPortion>) => setPortions((l) => l.map((x) => (x.id === pid ? { ...x, ...patch } : x)));

  const addFlavor = () => {
    const names = newFlavor.split(/[,\n•]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    setFlavors((l) => [...l, ...names.filter((n) => !l.some((f) => f.name.toLowerCase() === n.toLowerCase())).map((name) => ({ id: newId(), name, sold_out: false, price: null, _new: true }))]);
    setNewFlavor("");
  };

  const save = async () => {
    if (!p.name.trim()) return toast("Dê um nome ao produto.", "erro");
    const perFlavor = p.kind !== "bolo_festa" && p.price_per_flavor;
    if (perFlavor) {
      // Preço por sabor: cada sabor disponível precisa de preço.
      if (p.available && !flavors.length) return toast("Cadastre os sabores com o preço de cada um.", "erro");
      if (flavors.some((f) => !f.sold_out && f.price == null)) return toast("Preencha o preço de todos os sabores (ou marque como esgotado).", "erro");
    } else {
      if (p.kind !== "bolo_festa" && !portions.length) return toast("Cadastre pelo menos uma porção com preço.", "erro");
      const bad = portions.find((po) => !po.label.trim() || (p.kind === "frito" ? po.price_frozen == null && po.price_fried == null : po.price == null));
      if (p.kind !== "bolo_festa" && bad) return toast("Preencha o nome e o preço de todas as porções.", "erro");
    }

    setSaving(true);
    const prices = (perFlavor
      ? flavors.filter((f) => !f.sold_out).map((f) => f.price)
      : portions.map((po) => (p.kind === "frito" ? po.price_frozen ?? po.price_fried : po.price))
    ).filter((v): v is number => v != null);
    const row = {
      category_id: p.category_id,
      kind: p.kind,
      name: p.name.trim(),
      description: p.description,
      images: p.images.filter(Boolean),
      price: prices.length ? Math.min(...prices) : p.price,
      max_flavors: Math.max(1, p.max_flavors || 1),
      price_per_flavor: perFlavor,
      available: p.available,
      visible: p.visible,
      featured: p.featured,
    };
    let productId = id;
    if (id) {
      const { error } = await sb.from("products").update(row).eq("id", id);
      if (error) return fail();
    } else {
      const { data, error } = await sb
        .from("products")
        .insert({ ...row, slug: `${slugify(row.name)}-${Date.now().toString(36)}`, sort_order: 999 })
        .select("id")
        .single();
      if (error || !data) return fail();
      productId = data.id;
    }

    // Porções e sabores: apaga os removidos e grava os demais na ordem da tela.
    const ops = [];
    if (removed.portions.length) ops.push(sb.from("product_portions").delete().in("id", removed.portions));
    if (removed.flavors.length) ops.push(sb.from("product_flavors").delete().in("id", removed.flavors));
    // No preço por sabor não há porções: apaga as que existiam.
    if (perFlavor && portions.some((po) => !po._new)) ops.push(sb.from("product_portions").delete().eq("product_id", productId!));
    if (!perFlavor && p.kind !== "bolo_festa" && portions.length)
      ops.push(
        sb.from("product_portions").upsert(
          portions.map((po, i) => ({
            id: po.id, product_id: productId, label: po.label.trim(), units: po.units,
            price: p.kind === "frito" ? null : po.price,
            price_frozen: p.kind === "frito" ? po.price_frozen : null,
            price_fried: p.kind === "frito" ? po.price_fried : null,
            max_flavors: po.max_flavors, sort_order: i,
          })),
        ),
      );
    if (flavors.length)
      ops.push(sb.from("product_flavors").upsert(flavors.map((f, i) => ({ id: f.id, product_id: productId, name: f.name.trim(), sold_out: f.sold_out, price: perFlavor ? f.price : null, sort_order: i }))));
    const results = await Promise.all(ops);
    if (results.some((r) => r.error)) return fail();

    await revalidateSite();
    setSaving(false);
    toast("Produto salvo!");
    setRemoved({ portions: [], flavors: [] });
    if (!id) router.replace(`/admin/produtos/${productId}`);
  };
  const fail = () => {
    setSaving(false);
    toast("Não foi possível salvar. Tente novamente.", "erro");
  };

  if (loading) return <p className="py-10 text-center text-muted">Carregando…</p>;
  const isFried = p.kind === "frito";
  const isCake = p.kind === "bolo_festa";

  return (
    <div className="pb-24">
      <PageHeader title={id ? "Editar produto" : "Novo produto"}>
        <Link href="/admin/produtos" className="rounded-full px-4 py-2.5 text-sm font-semibold text-navy hover:bg-cream">← Voltar</Link>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <div>
              <label className="label" htmlFor="p-nome">Nome *</label>
              <input id="p-nome" className="field" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Salgados Assados" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="p-cat">Categoria</label>
                <select id="p-cat" className="field" value={p.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
                  <option value="">Sem categoria (não aparece)</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.section === "salgado" ? "salgado" : "doce"})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="p-tipo">Tipo de produto</label>
                <select id="p-tipo" className="field" value={p.kind} onChange={(e) => set("kind", e.target.value as ProductKind)}>
                  <option value="comum">Comum (pedido pelo site)</option>
                  <option value="frito">Salgado frito (congelado ou frito)</option>
                  <option value="bolo_festa">Bolo de festa (encomenda pelo WhatsApp)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="p-desc">Descrição</label>
              <textarea id="p-desc" className="field min-h-24" value={p.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </Card>

          {!isCake && (
            <Card>
              <Switch
                label="Preço diferente para cada sabor"
                hint="Para itens vendidos por unidade em que cada sabor tem um valor (ex.: pastel de feira). O cliente escolhe quantos quer de cada sabor."
                checked={p.price_per_flavor}
                onChange={(v) => set("price_per_flavor", v)}
              />
            </Card>
          )}

          {!isCake && !p.price_per_flavor && (
            <Card className="space-y-3">
              <div>
                <h2 className="font-semibold text-navy">Porções e preços</h2>
                <p className="text-xs text-muted">
                  {isFried ? "Para cada porção, informe o preço congelado e o preço frito." : "Ex.: “20 unidades — R$ 21,00”."} Regra da loja: 1 sabor a cada 20 unidades (20 un = 1, 50 un = 2, 100 un = 5). Deixe “Máx. sabores” vazio para usar o limite geral.
                </p>
              </div>
              <SortableList
                items={portions}
                onReorder={setPortions}
                render={(po) => (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.8fr_0.7fr_0.9fr_0.9fr_0.7fr_auto] sm:items-end">
                    <label className="col-span-2 sm:col-span-1"><span className="text-[0.7rem] font-semibold text-muted">Porção</span>
                      <input className="field" value={po.label} onChange={(e) => setPortion(po.id, { label: e.target.value })} placeholder="50 unidades" /></label>
                    <label><span className="text-[0.7rem] font-semibold text-muted">Unidades</span>
                      <input className="field" inputMode="numeric" value={po.units ?? ""} onChange={(e) => {
                        const units = toNumber(e.target.value);
                        // Regra da loja: 1 sabor a cada 20 unidades (preenche se o limite estiver vazio)
                        setPortion(po.id, { units, ...(po.max_flavors == null && units ? { max_flavors: Math.max(1, Math.floor(units / 20)) } : {}) });
                      }} /></label>
                    {isFried ? (
                      <>
                        <label><span className="text-[0.7rem] font-semibold text-muted">Congelado R$</span>
                          <MoneyInput value={po.price_frozen} onChange={(v) => setPortion(po.id, { price_frozen: v })} /></label>
                        <label><span className="text-[0.7rem] font-semibold text-muted">Frito R$</span>
                          <MoneyInput value={po.price_fried} onChange={(v) => setPortion(po.id, { price_fried: v })} /></label>
                      </>
                    ) : (
                      <label className="sm:col-span-2"><span className="text-[0.7rem] font-semibold text-muted">Preço R$</span>
                        <MoneyInput value={po.price} onChange={(v) => setPortion(po.id, { price: v })} /></label>
                    )}
                    <label><span className="text-[0.7rem] font-semibold text-muted">Máx. sabores</span>
                      <input className="field" inputMode="numeric" value={po.max_flavors ?? ""} onChange={(e) => setPortion(po.id, { max_flavors: toNumber(e.target.value) })} /></label>
                    <button type="button" onClick={() => { setPortions((l) => l.filter((x) => x.id !== po.id)); if (!po._new) setRemoved((r) => ({ ...r, portions: [...r.portions, po.id] })); }} className="grid h-11 w-11 place-items-center justify-self-end rounded-full text-red-600 hover:bg-red-50" aria-label="Remover porção">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
              <Btn variant="outline" onClick={() => setPortions((l) => [...l, { id: newId(), label: "", units: null, price: null, price_frozen: null, price_fried: null, max_flavors: null, _new: true }])}>
                <Plus className="h-4 w-4" /> Adicionar porção
              </Btn>
            </Card>
          )}

          {!isCake && (
            <Card className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-navy">Sabores</h2>
                  <p className="text-xs text-muted">
                    {p.price_per_flavor ? "Coloque o preço de cada sabor (por unidade). " : ""}Marque “Esgotado” quando acabar algum sabor.
                  </p>
                </div>
                {!p.price_per_flavor && <label className="text-sm font-semibold text-navy">
                  Limite de sabores por porção
                  <input className="field mt-1 w-28" inputMode="numeric" value={p.max_flavors} onChange={(e) => set("max_flavors", Number(e.target.value.replace(/\D/g, "")) || 1)} />
                </label>}
              </div>
              <SortableList
                items={flavors}
                onReorder={setFlavors}
                render={(f) => (
                  <div className="flex items-center gap-2">
                    <input className="field" value={f.name} onChange={(e) => setFlavors((l) => l.map((x) => (x.id === f.id ? { ...x, name: e.target.value } : x)))} aria-label="Nome do sabor" />
                    {p.price_per_flavor && (
                      <label className="flex shrink-0 items-center gap-1 text-sm font-semibold text-navy">
                        R$
                        <MoneyInput
                          className="field w-24"
                          aria-label={`Preço de ${f.name}`}
                          value={f.price}
                          onChange={(v) => setFlavors((l) => l.map((x) => (x.id === f.id ? { ...x, price: v } : x)))}
                        />
                      </label>
                    )}
                    <button type="button" onClick={() => setFlavors((l) => l.map((x) => (x.id === f.id ? { ...x, sold_out: !x.sold_out } : x)))} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${f.sold_out ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                      {f.sold_out ? "Esgotado" : "Disponível"}
                    </button>
                    <button type="button" onClick={() => { setFlavors((l) => l.filter((x) => x.id !== f.id)); if (!f._new) setRemoved((r) => ({ ...r, flavors: [...r.flavors, f.id] })); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-red-600 hover:bg-red-50" aria-label={`Remover ${f.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
              <div className="flex gap-2">
                <input className="field" value={newFlavor} onChange={(e) => setNewFlavor(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFlavor(); } }} placeholder="Novo sabor (pode colar vários separados por vírgula)" />
                <Btn variant="outline" onClick={addFlavor}><Plus className="h-4 w-4" /> Adicionar</Btn>
              </div>
            </Card>
          )}
          {isCake && (
            <Card>
              <p className="text-sm text-muted">
                Bolo de festa abre o formulário de encomenda. Tamanhos, massas e recheios ficam em <Link href="/admin/configuracoes" className="font-semibold text-navy underline">Configurações</Link>.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="space-y-4">
            <div>
              <h2 className="font-semibold text-navy">Fotos</h2>
              <p className="text-xs text-muted">
                {isCake
                  ? "A foto principal aparece no cartão e no topo do formulário. As outras aparecem como “Bolos que já fizemos”."
                  : "A foto principal aparece no cartão do site e no topo do produto."}
              </p>
            </div>
            {[...p.images, ""].slice(0, isCake ? 16 : 6).map((img, i) => (
              <div key={`${i}-${img}`} className={`rounded-2xl p-2 ${i === 0 && img ? "bg-gold-100 ring-2 ring-gold" : ""}`}>
                <ImageUpload
                  folder="produtos"
                  aspect={isCake ? 1 : 16 / 9}
                  label={i === 0 ? "★ Foto principal" : img ? `Foto ${i + 1}` : isCake ? "Adicionar foto de bolo já feito" : "Adicionar foto"}
                  value={img}
                  onChange={(url) => {
                    const list = [...p.images];
                    if (url) list[i] = url;
                    else list.splice(i, 1);
                    set("images", list.filter(Boolean));
                  }}
                />
                {i > 0 && img && (
                  <Btn
                    variant="ghost"
                    className="mt-1"
                    onClick={() => set("images", [img, ...p.images.filter((_, k) => k !== i)])}
                  >
                    ★ Usar como foto principal
                  </Btn>
                )}
              </div>
            ))}
            <p className="hint">Depois de mudar as fotos, clique em “Salvar produto”.</p>
          </Card>
          <div className="space-y-2">
            <Switch label="Mostrar no site" hint="Desligado = oculto" checked={p.visible} onChange={(v) => set("visible", v)} />
            <Switch label="Disponível para pedido" hint="Desligado = aparece como indisponível" checked={p.available} onChange={(v) => set("available", v)} />
            <Switch label="Destaque" checked={p.featured} onChange={(v) => set("featured", v)} />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end gap-2">
          <Link href="/admin/produtos" className="rounded-full px-4 py-2.5 text-sm font-semibold text-navy hover:bg-cream">Cancelar</Link>
          <Btn onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar produto"}</Btn>
        </div>
      </div>
    </div>
  );
}
