"use client";
// Detalhes do produto: porção, sabores (com limite), congelado/frito, observação e total na hora.
import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, Plus, Snowflake, Flame } from "lucide-react";
import { useShop } from "./ShopProvider";
import { PillButton } from "@/components/ui/PillButton";
import { money } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { Category, FryOption, Product } from "@/lib/types";

/** Lista de produtos de uma categoria. */
export function CategoryList({ category }: { category: Category }) {
  const { data, openProduct } = useShop();
  const prods = data.products.filter((p) => p.category_id === category.id);

  if (!prods.length) {
    return (
      <div className="p-6 text-center">
        {category.image_url && (
          <div className="relative mx-auto mb-5 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-3xl">
            <Image src={category.image_url} alt={category.name} fill sizes="400px" className="object-cover" />
          </div>
        )}
        <p className="text-muted">{category.description || "Feito sob encomenda."}</p>
        <p className="mt-2 text-sm text-muted">Fale com a gente no WhatsApp para saber os sabores e valores.</p>
        {data.settings.whatsapp && (
          <PillButton
            whatsapp
            className="mt-6"
            href={waLink(data.settings.whatsapp, `Olá! Gostaria de saber mais sobre ${category.name}.`)}
          >
            Consultar no WhatsApp
          </PillButton>
        )}
      </div>
    );
  }

  return (
    <ul className="grid gap-3 p-4 sm:p-5">
      {prods.map((p, i) => {
        const prices = p.portions.map((po) => po.price ?? po.price_frozen).filter((v): v is number => v != null);
        const from = prices.length ? Math.min(...prices) : p.price;
        return (
          <motion.li key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <button
              type="button"
              onClick={() => openProduct(p, category)}
              className="group flex w-full items-center gap-4 rounded-3xl bg-white p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream">
                {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-title text-lg text-navy">{p.name}</p>
                <p className="line-clamp-2 text-sm text-muted">{p.description}</p>
                <p className="mt-1 text-sm font-semibold text-gold-600">
                  {!p.available ? "Indisponível no momento" : from ? `a partir de ${money(from)}` : "Sob encomenda"}
                </p>
              </div>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}

/** Tela de detalhes com as escolhas do produto. */
/** Escolhe a tela certa: preço por sabor (ex.: pastel de feira) ou porções. */
export function ProductDetail({ product }: { product: Product }) {
  return product.price_per_flavor ? <PerFlavorDetail product={product} /> : <PortionProductDetail product={product} />;
}

/** Preço por sabor: o cliente escolhe quantas unidades quer de cada sabor. */
function PerFlavorDetail({ product }: { product: Product }) {
  const { addItem, close, data } = useShop();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const flavors = product.flavors.filter((f) => f.price != null);
  const totalUnits = flavors.reduce((s, f) => s + (qty[f.id] ?? 0), 0);
  const total = flavors.reduce((s, f) => s + (qty[f.id] ?? 0) * (f.price ?? 0), 0);
  const closed = data.settings.store_closed;
  const change = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, n)) }));

  const submit = () => {
    if (!totalUnits || closed || !product.available) return;
    flavors.forEach((f, i) => {
      const n = qty[f.id] ?? 0;
      if (!n) return;
      addItem({
        product_id: product.id,
        name: `${product.name} — ${f.name}`,
        image: product.images[0],
        portion_label: "unidade",
        flavors: [f.name],
        quantity: n,
        unit_price: f.price ?? 0,
        notes: i === flavors.findIndex((x) => (qty[x.id] ?? 0) > 0) ? notes.trim() : "",
      });
    });
    close();
  };

  return (
    <div className="flex flex-col">
      <div className="relative aspect-[16/9] w-full bg-cream">
        {product.images[0] && <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />}
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <h3 className="font-title text-3xl text-navy">{product.name}</h3>
          {product.description && <p className="mt-2 text-muted">{product.description}</p>}
          {(!product.available || !flavors.length) && (
            <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-navy">Este produto está indisponível no momento.</p>
          )}
        </div>

        {flavors.length > 0 && (
          <fieldset>
            <legend className="label">Sabores (preço por unidade)</legend>
            <p className="hint mb-2">Escolha quantos você quer de cada sabor.</p>
            <ul className="divide-y divide-navy/10 rounded-2xl bg-white shadow-card">
              {flavors.map((f) => {
                const n = qty[f.id] ?? 0;
                return (
                  <li key={f.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${f.sold_out ? "opacity-50" : ""}`}>
                    <div className="min-w-0">
                      <p className={`font-semibold text-navy ${f.sold_out ? "line-through" : ""}`}>{f.name}</p>
                      <p className="text-sm text-gold-600">{f.sold_out ? "Esgotado" : money(f.price)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <button type="button" onClick={() => change(f.id, n - 1)} disabled={f.sold_out || n === 0} className="grid h-9 w-9 place-items-center rounded-full bg-cream text-navy disabled:opacity-40" aria-label={`Menos ${f.name}`}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center font-bold text-navy" aria-live="polite" aria-label={`${n} de ${f.name}`}>{n}</span>
                      <button type="button" onClick={() => change(f.id, n + 1)} disabled={f.sold_out} className="grid h-9 w-9 place-items-center rounded-full bg-navy text-white disabled:opacity-40" aria-label={`Mais ${f.name}`}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        <div>
          <label htmlFor="obs-sabor" className="label">Observação (opcional)</label>
          <textarea id="obs-sabor" className="field min-h-20" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: bem passado" />
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-navy/10 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-xs text-muted">{totalUnits ? `${totalUnits} ${totalUnits === 1 ? "unidade" : "unidades"}` : "Total"}</p>
          <motion.p key={total} initial={{ scale: 0.9, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="font-title text-2xl text-navy">
            {money(total)}
          </motion.p>
        </div>
        <PillButton onClick={submit} disabled={closed || !product.available || !totalUnits} size="lg">
          {closed ? "Loja fechada hoje" : "Adicionar à sacola"}
        </PillButton>
      </div>
    </div>
  );
}

/** Produto com porções (bandejas, salgados fritos…). */
function PortionProductDetail({ product }: { product: Product }) {
  const { addItem, close, data } = useShop();
  const isFried = product.kind === "frito";
  const [portionId, setPortionId] = useState(product.portions[0]?.id ?? "");
  const [fry, setFry] = useState<FryOption | null>(null);
  const [qty, setQty] = useState(1);
  const [flavors, setFlavors] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);

  const portion = product.portions.find((p) => p.id === portionId);
  const maxFlavors = (portion?.max_flavors ?? product.max_flavors) * qty;
  const hasFlavors = product.flavors.length > 0;

  const unit = useMemo(() => {
    if (!portion) return 0;
    if (isFried) return (fry === "frito" ? portion.price_fried : portion.price_frozen) ?? 0;
    return portion.price ?? 0;
  }, [portion, fry, isFried]);

  // Se a quantidade diminuir, remove os sabores excedentes.
  const changeQty = (n: number) => {
    const next = Math.max(1, Math.min(99, n));
    setQty(next);
    const max = (portion?.max_flavors ?? product.max_flavors) * next;
    setFlavors((f) => f.slice(0, max));
  };
  const changePortion = (id: string) => {
    setPortionId(id);
    const po = product.portions.find((p) => p.id === id);
    const max = (po?.max_flavors ?? product.max_flavors) * qty;
    setFlavors((f) => f.slice(0, max));
  };

  const toggleFlavor = (name: string) => {
    setFlavors((f) => {
      if (f.includes(name)) return f.filter((x) => x !== name);
      if (maxFlavors === 1) return [name];
      if (f.length >= maxFlavors) return f;
      return [...f, name];
    });
  };

  const errors = {
    portion: !portion ? "Escolha a porção." : "",
    fry: isFried && !fry ? "Escolha congelado ou frito." : "",
    flavors: hasFlavors && flavors.length === 0 ? "Escolha pelo menos um sabor." : "",
  };
  const valid = !errors.portion && !errors.fry && !errors.flavors;
  const closed = data.settings.store_closed;

  const submit = () => {
    setTried(true);
    if (!valid || !portion || closed || !product.available) return;
    addItem({
      product_id: product.id,
      portion_id: portion.id,
      name: product.name,
      image: product.images[0],
      portion_label: portion.label,
      fry_option: isFried ? fry! : undefined,
      flavors,
      quantity: qty,
      unit_price: unit,
      notes: notes.trim(),
    });
    close();
  };

  return (
    <div className="flex flex-col">
      <div className="relative aspect-[16/9] w-full bg-cream">
        {product.images[0] && <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />}
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <h3 className="font-title text-3xl text-navy">{product.name}</h3>
          {product.description && <p className="mt-2 text-muted">{product.description}</p>}
          {!product.available && <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-navy">Este produto está indisponível no momento.</p>}
        </div>

        {/* Porção */}
        <fieldset>
          <legend className="label">{isFried ? "Número de porções" : "Quantidade / porção"}</legend>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {product.portions.map((po) => {
              const price = isFried ? (fry === "frito" ? po.price_fried : po.price_frozen) : po.price;
              const active = po.id === portionId;
              return (
                <button
                  key={po.id}
                  type="button"
                  onClick={() => changePortion(po.id)}
                  aria-pressed={active}
                  className={`rounded-2xl border-2 px-3 py-2.5 text-left transition ${active ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy hover:border-navy/40"}`}
                >
                  <span className="block text-sm font-semibold">{po.label}</span>
                  {price != null && <span className={`text-xs ${active ? "text-gold" : "text-muted"}`}>{money(price)}</span>}
                </button>
              );
            })}
          </div>
          {tried && errors.portion && <p className="error-text">{errors.portion}</p>}
        </fieldset>

        {/* Congelado ou frito */}
        {isFried && portion && (
          <fieldset>
            <legend className="label">Congelado ou frito?</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(
                [
                  { v: "congelado", label: "Congelado", sub: "para fritar em casa", price: portion.price_frozen, Icon: Snowflake },
                  { v: "frito", label: "Frito", sub: "pronto para servir", price: portion.price_fried, Icon: Flame },
                ] as const
              ).map(({ v, label, sub, price, Icon }) => {
                const active = fry === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFry(v)}
                    aria-pressed={active}
                    disabled={price == null}
                    className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition disabled:opacity-40 ${active ? "border-gold bg-gold-100" : "border-navy/15 bg-white hover:border-navy/40"}`}
                  >
                    <Icon className={`h-6 w-6 shrink-0 ${v === "frito" ? "text-gold-600" : "text-navy-600"}`} aria-hidden />
                    <span>
                      <span className="block text-sm font-bold text-navy">
                        {label} {price != null && `· ${money(price)}`}
                      </span>
                      <span className="text-xs text-muted">{sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {tried && errors.fry && <p className="error-text">{errors.fry}</p>}
          </fieldset>
        )}

        {/* Quantidade de porções */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-card">
          <span className="text-sm font-semibold text-navy">Quantas {portion?.label ? `de ${portion.label}` : "porções"}?</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => changeQty(qty - 1)} className="grid h-9 w-9 place-items-center rounded-full bg-cream text-navy disabled:opacity-40" disabled={qty <= 1} aria-label="Diminuir">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-bold text-navy" aria-live="polite">{qty}</span>
            <button type="button" onClick={() => changeQty(qty + 1)} className="grid h-9 w-9 place-items-center rounded-full bg-navy text-white" aria-label="Aumentar">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sabores */}
        {hasFlavors && (
          <fieldset>
            <legend className="label flex w-full items-center justify-between">
              <span>Sabores</span>
              <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold text-navy">
                {flavors.length} de {maxFlavors} {maxFlavors === 1 ? "sabor" : "sabores"}
              </span>
            </legend>
            <p className="hint mb-2">
              {(() => {
                const perTray = portion?.max_flavors ?? product.max_flavors;
                const tray = portion?.label ? ` de ${portion.label}` : "";
                if (maxFlavors === 1) return `Escolha 1 sabor para a bandeja${tray}.`;
                if (qty > 1) return `Escolha até ${maxFlavors} sabores (${perTray} por bandeja${tray}).`;
                return `Escolha até ${maxFlavors} sabores. A quantidade é dividida entre eles.`;
              })()}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.flavors.map((f) => {
                const active = flavors.includes(f.name);
                const blocked = f.sold_out || (!active && flavors.length >= maxFlavors && maxFlavors > 1);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFlavor(f.name)}
                    disabled={f.sold_out}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? "border-navy bg-navy text-white"
                        : f.sold_out
                          ? "cursor-not-allowed border-dashed border-navy/20 text-muted line-through"
                          : blocked
                            ? "border-navy/10 bg-white text-navy/40"
                            : "border-navy/15 bg-white text-navy hover:border-navy/40"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" aria-hidden />}
                    {f.name}
                    {f.sold_out && <span className="ml-1 text-[0.65rem] font-bold uppercase no-underline">esgotado</span>}
                  </button>
                );
              })}
            </div>
            {tried && errors.flavors && <p className="error-text">{errors.flavors}</p>}
          </fieldset>
        )}

        <div>
          <label htmlFor="obs-produto" className="label">Observação (opcional)</label>
          <textarea id="obs-produto" className="field min-h-20" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: metade de cada sabor" />
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-navy/10 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div>
          <p className="text-xs text-muted">Total</p>
          <motion.p key={unit * qty} initial={{ scale: 0.9, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="font-title text-2xl text-navy">
            {money(unit * qty)}
          </motion.p>
        </div>
        <PillButton onClick={submit} disabled={closed || !product.available} size="lg">
          {closed ? "Loja fechada hoje" : "Adicionar à sacola"}
        </PillButton>
      </div>
    </div>
  );
}
