"use client";
// Sacola + finalização do pedido (pelo site ou pelo WhatsApp) + confirmação.
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useShop } from "./ShopProvider";
import { Sheet } from "./Sheet";
import { PillButton } from "@/components/ui/PillButton";
import { submitOrder } from "@/app/actions/orders";
import {
  fryLabels, isValidPhone, localInputToIso, maskPhone, money,
} from "@/lib/format";
import { orderMessage, waLink } from "@/lib/whatsapp";
import type { Fulfillment, PaymentMethod } from "@/lib/types";
import { DateTimeFields } from "./DateTimeFields";
import { timeSlots } from "@/lib/hours";

type Step = "sacola" | "dados" | "pronto";

export function CartPanel() {
  const { items, subtotal, updateItem, removeItem, clear, close, data } = useShop();
  const s = data.settings;
  const [step, setStep] = useState<Step>("sacola");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    fulfillment: "retirada" as Fulfillment,
    payment: "pix" as PaymentMethod,
    date: "",
    time: "",
    notes: "",
    website: "",
  });
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState<null | "site" | "whatsapp">(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ number: number; total: number; channel: "site" | "whatsapp"; wa?: string } | null>(null);

  const fee = form.fulfillment === "entrega" ? Number(s.delivery_fee) : 0;
  const total = subtotal + fee;
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Só deixa diminuir se os sabores escolhidos ainda couberem no limite.
  const canDecrease = (i: (typeof items)[number]) => {
    if (i.quantity <= 1) return false;
    if (!i.product_id) return true;
    const prod = data.products.find((p) => p.id === i.product_id);
    const po = prod?.portions.find((x) => x.id === i.portion_id);
    const perUnit = po?.max_flavors ?? prod?.max_flavors ?? 1;
    return i.flavors.length <= perUnit * (i.quantity - 1);
  };

  const errors = {
    name: form.name.trim().length < 3 ? "Informe seu nome completo." : "",
    phone: !isValidPhone(form.phone) ? "Informe um telefone válido com DDD." : "",
    address: form.fulfillment === "entrega" && form.address.trim().length < 8 ? "Informe o endereço completo." : "",
    desired_at: !form.date || !form.time || !timeSlots(s, form.date, s.min_order_notice_hours).includes(form.time) ? "Escolha a data e o horário." : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  const send = async (channel: "site" | "whatsapp") => {
    setTried(true);
    setError("");
    if (!valid) return;
    // Abre a janela do WhatsApp já no clique (celulares bloqueiam janelas abertas depois).
    const win = channel === "whatsapp" ? window.open("", "_blank") : null;
    setSending(channel);
    const res = await submitOrder({
      channel,
      customer_name: form.name,
      phone: form.phone,
      address: form.address,
      fulfillment: form.fulfillment,
      payment: form.payment,
      desired_at: localInputToIso(`${form.date}T${form.time}`),
      notes: form.notes,
      website: form.website,
      items: items.map((i) => ({
        product_id: i.product_id,
        promotion_id: i.promotion_id,
        portion_id: i.portion_id,
        fry_option: i.fry_option,
        flavors: i.flavors,
        quantity: i.quantity,
        notes: i.notes,
      })),
    });
    setSending(null);
    if (!res.ok) {
      win?.close();
      setError(res.error);
      return;
    }
    let wa: string | undefined;
    if (channel === "whatsapp") {
      wa = waLink(
        s.whatsapp,
        orderMessage({
          number: res.number,
          name: form.name,
          phone: form.phone,
          address: form.address,
          fulfillment: form.fulfillment,
          payment: form.payment,
          desired_at: localInputToIso(`${form.date}T${form.time}`),
          notes: form.notes,
          items,
          subtotal: res.subtotal,
          delivery_fee: res.delivery_fee,
          total: res.total,
        }),
      );
      if (win) win.location.href = wa;
    }
    setDone({ number: res.number, total: res.total, channel, wa });
    clear();
    setStep("pronto");
  };

  const title = step === "sacola" ? "Sua sacola" : step === "dados" ? "Finalizar pedido" : "Pedido enviado!";

  const footer =
    step === "sacola" && items.length ? (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="font-title text-2xl text-navy">{money(subtotal)}</span>
        </div>
        <PillButton className="w-full" size="lg" arrow onClick={() => setStep("dados")} disabled={s.store_closed}>
          {s.store_closed ? "Loja fechada hoje" : "Continuar"}
        </PillButton>
      </div>
    ) : step === "dados" ? (
      <div className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {form.fulfillment === "entrega" && (
            <div className="flex justify-between text-muted"><span>Entrega</span><span>{fee ? money(fee) : "a combinar"}</span></div>
          )}
          <div className="flex justify-between font-semibold text-navy"><span>Total</span><span className="font-title text-xl">{money(total)}</span></div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <PillButton onClick={() => send("site")} disabled={!!sending} variant="outline">
            {sending === "site" ? "Enviando…" : "Enviar pedido pelo site"}
          </PillButton>
          <PillButton onClick={() => send("whatsapp")} disabled={!!sending || !s.whatsapp} whatsapp>
            {sending === "whatsapp" ? "Enviando…" : "Enviar pelo WhatsApp"}
          </PillButton>
        </div>
        <p className="text-center text-[0.7rem] text-muted">
          Seus dados são usados só para preparar e entregar este pedido.{" "}
          <Link href="/privacidade" className="underline" target="_blank">Privacidade</Link>
        </p>
      </div>
    ) : null;

  return (
    <Sheet onClose={close} title={title} side footer={footer} onBack={step === "dados" ? () => setStep("sacola") : undefined}>
      {step === "sacola" && (
        <div className="p-4 sm:p-5">
          {!items.length ? (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-cream text-navy"><ShoppingBag className="h-9 w-9" /></span>
              <p className="mt-4 font-title text-2xl text-navy">Sua sacola está vazia</p>
              <p className="mt-1 text-sm text-muted">Escolha seus salgados e doces preferidos.</p>
              <PillButton className="mt-6" href="#salgados" onClick={close} arrow>Ver cardápio</PillButton>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.li
                    key={i.key}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                    className="flex gap-3 rounded-3xl bg-white p-3 shadow-card"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream">
                      {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold leading-tight text-navy">{i.name}</p>
                        <button type="button" onClick={() => removeItem(i.key)} className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Remover ${i.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted">
                        {[i.portion_label, i.fry_option ? fryLabels[i.fry_option] : "", i.promotion_id ? "Promoção" : ""].filter(Boolean).join(" · ")}
                      </p>
                      {i.flavors.length > 0 && <p className="mt-0.5 text-xs text-ink">Sabores: {i.flavors.join(", ")}</p>}
                      {i.notes && <p className="mt-0.5 text-xs italic text-muted">“{i.notes}”</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-cream text-navy disabled:opacity-40" disabled={!canDecrease(i)} onClick={() => updateItem(i.key, { quantity: i.quantity - 1 })} aria-label="Diminuir quantidade">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold" aria-label={`Quantidade ${i.quantity}`}>{i.quantity}</span>
                          <button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-navy text-white" onClick={() => updateItem(i.key, { quantity: Math.min(99, i.quantity + 1) })} aria-label="Aumentar quantidade">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-semibold text-navy">{money(i.unit_price * i.quantity)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      )}

      {step === "dados" && (
        <form className="space-y-4 p-5" onSubmit={(e) => e.preventDefault()} noValidate>
          {/* Campo-isca: invisível para pessoas, robôs preenchem */}
          <input type="text" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
          <div>
            <label className="label" htmlFor="c-nome">Nome completo *</label>
            <input id="c-nome" className="field" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={tried && !!errors.name} />
            {tried && errors.name && <p className="error-text">{errors.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="c-tel">Telefone / WhatsApp *</label>
            <input id="c-tel" className="field" inputMode="tel" autoComplete="tel-national" placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} aria-invalid={tried && !!errors.phone} />
            {tried && errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>
          <fieldset>
            <legend className="label">Como prefere receber? *</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["retirada", "entrega"] as const).map((f) => (
                <button key={f} type="button" disabled={f === "entrega" && !s.delivery_enabled} onClick={() => set("fulfillment", f)} aria-pressed={form.fulfillment === f} className={`rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${form.fulfillment === f ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy"}`}>
                  {f === "retirada" ? "Retirar na loja" : "Entrega"}
                </button>
              ))}
            </div>
            {form.fulfillment === "entrega" && s.delivery_area && <p className="hint">{s.delivery_area}</p>}
            {form.fulfillment === "retirada" && s.address && <p className="hint">Retirada em: {s.address}</p>}
          </fieldset>
          {form.fulfillment === "entrega" && (
            <div>
              <label className="label" htmlFor="c-end">Endereço completo *</label>
              <textarea id="c-end" className="field min-h-20" autoComplete="street-address" placeholder="Rua, número, complemento, bairro" value={form.address} onChange={(e) => set("address", e.target.value)} aria-invalid={tried && !!errors.address} />
              {tried && errors.address && <p className="error-text">{errors.address}</p>}
            </div>
          )}
          <div>
            <DateTimeFields
              settings={s}
              idPrefix="c"
              date={form.date}
              time={form.time}
              onChange={(v) => setForm((f) => ({ ...f, ...v }))}
              minHoursAhead={s.min_order_notice_hours}
              showErrors={tried}
              dateLabel={form.fulfillment === "entrega" ? "Data da entrega *" : "Data da retirada *"}
            />
            <p className="hint">Pedidos com pelo menos {s.min_order_notice_hours}h de antecedência.</p>
          </div>
          <fieldset>
            <legend className="label">Forma de pagamento *</legend>
            <div className="grid grid-cols-3 gap-2">
              {([["pix", "Pix"], ["dinheiro", "Dinheiro"], ["cartao", "Cartão"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => set("payment", v)} aria-pressed={form.payment === v} className={`rounded-2xl border-2 px-2 py-2.5 text-sm font-semibold transition ${form.payment === v ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy"}`}>
                  {l}
                </button>
              ))}
            </div>
            <p className="hint">Pagamento na retirada/entrega.</p>
          </fieldset>
          <div>
            <label className="label" htmlFor="c-obs">Observações</label>
            <textarea id="c-obs" className="field min-h-20" maxLength={1000} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </form>
      )}

      {step === "pronto" && done && (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 15 }}>
            <CheckCircle2 className="h-20 w-20 text-gold" />
          </motion.span>
          <p className="mt-4 font-title text-3xl text-navy">Obrigada!</p>
          <p className="mt-2 text-muted">Recebemos seu pedido</p>
          <p className="mt-3 rounded-2xl bg-white px-6 py-3 font-title text-3xl text-navy shadow-card">nº {done.number}</p>
          <p className="mt-3 text-sm text-muted">Total: <strong className="text-navy">{money(done.total)}</strong></p>
          <p className="mt-4 max-w-xs text-sm text-muted">
            {done.channel === "whatsapp"
              ? "Abrimos o WhatsApp com o seu pedido. É só tocar em enviar!"
              : "Vamos confirmar pelo WhatsApp em breve. Guarde o número do pedido."}
          </p>
          {done.wa && (
            <PillButton className="mt-6" href={done.wa} whatsapp>
              Abrir WhatsApp novamente
            </PillButton>
          )}
          <button type="button" onClick={close} className="mt-4 text-sm font-semibold text-navy underline">
            Voltar ao site
          </button>
        </div>
      )}
    </Sheet>
  );
}
