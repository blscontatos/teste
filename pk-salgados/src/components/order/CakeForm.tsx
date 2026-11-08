"use client";
// Encomenda de bolo de festa: formulário → salva no banco (+ foto no Storage)
// → abre o WhatsApp da loja com a mensagem pronta → tela de confirmação.
import Image from "next/image";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { useShop } from "./ShopProvider";
import { PillButton } from "@/components/ui/PillButton";
import { submitCakeOrder } from "@/app/actions/orders";
import { hasSupabase } from "@/lib/env";
import { isValidPhone, localInputToIso, maskPhone, minDateLocal } from "@/lib/format";
import { cakeMessage, waLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/heic", "image/heif"];

/** Converte HEIC (iPhone) para JPEG e comprime a foto antes de enviar. */
async function prepareImage(file: File): Promise<File> {
  let f: File | Blob = file;
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
    f = Array.isArray(out) ? out[0] : out;
  }
  const imageCompression = (await import("browser-image-compression")).default;
  const asFile = f instanceof File ? f : new File([f], "inspiracao.jpg", { type: "image/jpeg" });
  return imageCompression(asFile, { maxSizeMB: 1.2, maxWidthOrHeight: 2000, useWebWorker: true, fileType: "image/jpeg" });
}

export function CakeForm({ product }: { product: Product }) {
  const { data, close } = useShop();
  const s = data.settings;
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", date: "", time: "",
    size: "", dough: "", filling: "", theme: "", website: "",
  });
  const [hasInspiration, setHasInspiration] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [photoError, setPhotoError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ number: number; wa: string } | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const minDate = minDateLocal(s.min_cake_notice_days);

  const errors = {
    name: form.name.trim().length < 3 ? "Informe seu nome completo." : "",
    phone: !isValidPhone(form.phone) ? "Informe um telefone válido com DDD." : "",
    address: form.address.trim().length < 8 ? "Informe o endereço completo." : "",
    date: !form.date ? "Escolha a data." : form.date < minDate ? `Escolha uma data a partir de ${minDate.split("-").reverse().join("/")}.` : "",
    time: !form.time ? "Escolha o horário." : "",
    inspiration: hasInspiration === null ? "Responda se você tem um modelo de inspiração." : "",
    photo: hasInspiration && !photo ? "Envie a foto do modelo de inspiração." : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  const onFile = async (file?: File) => {
    setPhotoError("");
    if (!file) return;
    const okType = ACCEPT.includes(file.type) || /\.(jpe?g|png|heic|heif)$/i.test(file.name);
    if (!okType) return setPhotoError("Envie uma foto em JPG, PNG ou HEIC.");
    if (file.size > MAX_BYTES) return setPhotoError("A foto precisa ter no máximo 10 MB.");
    setProcessing(true);
    try {
      const ready = await prepareImage(file);
      setPhoto(ready);
      setPreview(URL.createObjectURL(ready));
    } catch {
      setPhotoError("Não conseguimos abrir essa foto. Tente outra imagem (JPG ou PNG).");
    } finally {
      setProcessing(false);
    }
  };

  const submit = async () => {
    setTried(true);
    setError("");
    if (!valid) return;
    if (!hasSupabase) return setError("O site ainda está em modo de demonstração (banco de dados não configurado).");
    const win = window.open("", "_blank");
    setSending(true);
    try {
      let path: string | undefined;
      let photoUrl: string | undefined;
      if (hasInspiration && photo) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        path = `pedidos/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from("inspiration-photos").upload(path, photo, { contentType: "image/jpeg", upsert: false });
        if (up.error) throw new Error("Não foi possível enviar a foto. Verifique sua internet e tente de novo.");
        photoUrl = supabase.storage.from("inspiration-photos").getPublicUrl(path).data.publicUrl;
      }
      const desired = localInputToIso(`${form.date}T${form.time}`);
      const res = await submitCakeOrder({
        product_id: product.id,
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        desired_at: desired,
        size: form.size,
        dough: form.dough,
        filling: form.filling,
        theme_notes: form.theme,
        has_inspiration: !!hasInspiration,
        inspiration_path: path,
        website: form.website,
      });
      if (!res.ok) throw new Error(res.error);
      const wa = waLink(
        s.whatsapp,
        cakeMessage({
          number: res.number,
          name: form.name,
          phone: form.phone,
          address: form.address,
          desired_at: desired,
          size: form.size,
          dough: form.dough,
          filling: form.filling,
          theme_notes: form.theme,
          has_inspiration: !!hasInspiration,
          photo_url: photoUrl,
        }),
      );
      if (win) win.location.href = wa;
      setDone({ number: res.number, wa });
    } catch (e) {
      win?.close();
      setError(e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 15 }}>
          <CheckCircle2 className="h-20 w-20 text-gold" />
        </motion.span>
        <p className="mt-4 font-title text-3xl text-navy">Encomenda recebida!</p>
        <p className="mt-3 rounded-2xl bg-white px-6 py-3 font-title text-3xl text-navy shadow-card">nº {done.number}</p>
        <p className="mt-4 max-w-xs text-sm text-muted">
          Abrimos o WhatsApp com todos os detalhes. Toque em enviar para combinarmos valores e confirmar a sua encomenda.
        </p>
        <PillButton className="mt-6" href={done.wa} whatsapp>Abrir WhatsApp novamente</PillButton>
        <button type="button" onClick={close} className="mt-4 text-sm font-semibold text-navy underline">Voltar ao site</button>
      </div>
    );
  }

  const Select = ({ id, label, k, options }: { id: string; label: string; k: "size" | "dough" | "filling"; options: string[] }) =>
    options.length ? (
      <div>
        <label className="label" htmlFor={id}>{label}</label>
        <select id={id} className="field" value={form[k]} onChange={(e) => set(k, e.target.value)}>
          <option value="">Escolha…</option>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
    ) : null;

  return (
    <div>
      {product.images[0] && (
        <div className="relative aspect-[16/8] w-full bg-cream">
          <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
        </div>
      )}
      <form className="space-y-4 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <div>
          <h3 className="font-title text-3xl text-navy">{product.name}</h3>
          <p className="mt-1 text-sm text-muted">{product.description}</p>
          <p className="mt-2 rounded-2xl bg-gold-100 px-4 py-2.5 text-sm text-navy">
            Encomendas com no mínimo <strong>{s.min_cake_notice_days} dias</strong> de antecedência. O valor é combinado pelo WhatsApp.
          </p>
        </div>

        <input type="text" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

        <div>
          <label className="label" htmlFor="b-nome">Nome completo *</label>
          <input id="b-nome" className="field" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={tried && !!errors.name} />
          {tried && errors.name && <p className="error-text">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="b-tel">Telefone / WhatsApp *</label>
          <input id="b-tel" className="field" inputMode="tel" autoComplete="tel-national" placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} aria-invalid={tried && !!errors.phone} />
          {tried && errors.phone && <p className="error-text">{errors.phone}</p>}
        </div>
        <div>
          <label className="label" htmlFor="b-end">Endereço completo *</label>
          <textarea id="b-end" className="field min-h-20" autoComplete="street-address" placeholder="Rua, número, complemento, bairro" value={form.address} onChange={(e) => set("address", e.target.value)} aria-invalid={tried && !!errors.address} />
          {tried && errors.address && <p className="error-text">{errors.address}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="b-data">Data *</label>
            <input id="b-data" type="date" className="field" min={minDate} value={form.date} onChange={(e) => set("date", e.target.value)} aria-invalid={tried && !!errors.date} />
            {tried && errors.date && <p className="error-text">{errors.date}</p>}
          </div>
          <div>
            <label className="label" htmlFor="b-hora">Horário *</label>
            <input id="b-hora" type="time" className="field" value={form.time} onChange={(e) => set("time", e.target.value)} aria-invalid={tried && !!errors.time} />
            {tried && errors.time && <p className="error-text">{errors.time}</p>}
          </div>
        </div>
        <p className="hint -mt-2">Retirada ou entrega · {s.opening_hours}</p>

        {Select({ id: "b-tam", label: "Tamanho / quantidade de pessoas", k: "size", options: s.cake_sizes })}
        <div className="grid gap-4 sm:grid-cols-2">
          {Select({ id: "b-massa", label: "Sabor da massa", k: "dough", options: s.cake_doughs })}
          {Select({ id: "b-recheio", label: "Sabor do recheio", k: "filling", options: s.cake_fillings })}
        </div>
        <div>
          <label className="label" htmlFor="b-tema">Tema / observações</label>
          <textarea id="b-tema" className="field min-h-24" maxLength={1500} placeholder="Ex.: tema Frozen, nome da aniversariante, cores…" value={form.theme} onChange={(e) => set("theme", e.target.value)} />
        </div>

        <fieldset>
          <legend className="label">Você tem algum modelo de inspiração? *</legend>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((v) => (
              <button key={String(v)} type="button" onClick={() => setHasInspiration(v)} aria-pressed={hasInspiration === v} className={`rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition ${hasInspiration === v ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy"}`}>
                {v ? "Sim" : "Não"}
              </button>
            ))}
          </div>
          {tried && errors.inspiration && <p className="error-text">{errors.inspiration}</p>}
        </fieldset>

        {hasInspiration && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <p className="label">Foto do modelo *</p>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" className="sr-only" id="b-foto" onChange={(e) => onFile(e.target.files?.[0])} />
            {preview ? (
              <div className="relative overflow-hidden rounded-3xl border-2 border-gold bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
                <img src={preview} alt="Prévia da foto de inspiração" className="max-h-72 w-full object-contain" />
                <button type="button" onClick={() => { setPhoto(null); setPreview(""); if (fileInput.current) fileInput.current.value = ""; }} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-navy text-white" aria-label="Remover foto">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label htmlFor="b-foto" className={`flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-4 py-8 text-center transition hover:bg-white ${tried && errors.photo ? "border-red-400" : "border-navy/25"}`}>
                {processing ? <Loader2 className="h-8 w-8 animate-spin text-gold" /> : <ImagePlus className="h-8 w-8 text-gold" />}
                <span className="font-semibold text-navy">{processing ? "Preparando a foto…" : "Toque para escolher a foto"}</span>
                <span className="text-xs text-muted">JPG, PNG ou HEIC · até 10 MB</span>
              </label>
            )}
            {photoError && <p className="error-text">{photoError}</p>}
            {tried && errors.photo && !photoError && <p className="error-text">{errors.photo}</p>}
          </motion.div>
        )}

        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <PillButton type="submit" className="w-full" size="lg" whatsapp disabled={sending || processing || s.store_closed}>
          {s.store_closed ? "Loja fechada hoje" : sending ? "Enviando…" : "Enviar encomenda pelo WhatsApp"}
        </PillButton>
        <p className="text-center text-[0.7rem] text-muted">Seus dados e a foto são usados só para esta encomenda.</p>
      </form>
    </div>
  );
}
