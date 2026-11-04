"use client";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheck, Home, KeyRound, LoaderCircle } from "lucide-react";
import { submitLead, type LeadFormState } from "@/app/actions/leads";
import { NEIGHBORHOODS, PRICE_RANGES, PROPERTY_TYPES } from "@/lib/constants";

type Kind = "comprar" | "vender";

export function LeadForms({ initial = null, lockKind = false }: { initial?: Kind | null; lockKind?: boolean }) {
  const [kind, setKind] = useState<Kind | null>(initial);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => {
      if (window.location.hash === "#quero-vender") setKind("vender");
      if (window.location.hash === "#quero-comprar") setKind("comprar");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function choose(k: Kind) {
    setKind(k);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-8">
      {!lockKind && (
        <div className="grid gap-4 md:grid-cols-2" role="tablist" aria-label="Como podemos ajudar">
          <Choice
            active={kind === "comprar"}
            onClick={() => choose("comprar")}
            icon={<KeyRound className="h-6 w-6" strokeWidth={1.4} />}
            title="Quero comprar"
            text="Conte o que você procura e receba uma seleção de imóveis alinhada ao seu momento."
          />
          <Choice
            active={kind === "vender"}
            onClick={() => choose("vender")}
            icon={<Home className="h-6 w-6" strokeWidth={1.4} />}
            title="Quero vender meu imóvel"
            text="Apresente seu imóvel a compradores qualificados com estratégia, discrição e boa avaliação."
          />
        </div>
      )}
      <div ref={formRef} className="scroll-mt-28">
        {kind && <LeadForm key={kind} kind={kind} />}
      </div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[28px] border p-7 text-left transition-all duration-700 ease-(--ease-luxe) sm:p-8 ${
        active
          ? "border-ink bg-ink text-white shadow-[0_30px_60px_-30px_rgba(13,13,12,0.6)]"
          : "border-line bg-white hover:-translate-y-1 hover:border-gold/50"
      }`}
    >
      <span
        className={`mb-6 grid h-14 w-14 place-items-center rounded-2xl transition-colors duration-500 ${
          active ? "bg-gold text-ink" : "bg-sand text-gold-deep group-hover:bg-gold-pale"
        }`}
      >
        {icon}
      </span>
      <span className="block font-display text-3xl font-medium">{title}</span>
      <span className={`mt-3 block max-w-md text-sm leading-relaxed ${active ? "text-white/70" : "text-ink/60"}`}>{text}</span>
      <span className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${active ? "text-gold-light" : "text-gold-deep"}`}>
        {active ? "Formulário aberto abaixo" : "Selecionar"}
        <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      </span>
    </button>
  );
}

export function LeadForm({
  kind,
  propertyId,
  compact = false,
  defaultMessage = "",
}: {
  kind: Kind;
  propertyId?: string;
  compact?: boolean;
  defaultMessage?: string;
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, null);
  const err = state?.errors ?? {};
  const isBuy = kind === "comprar";

  if (state?.ok) {
    return (
      <div role="status" className="animate-fade-up rounded-[28px] border border-gold/30 bg-gold-pale/40 p-8 text-center sm:p-12">
        <CircleCheck className="mx-auto h-14 w-14 text-gold-deep" strokeWidth={1.3} />
        <h3 className="mt-5 font-display text-3xl font-medium">Solicitação enviada</h3>
        <p className="mx-auto mt-3 max-w-md text-ink/70">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        // Envio manual: evita que o React limpe os campos se houver erro de validação
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      noValidate
      className={`animate-fade-up rounded-[28px] border border-line bg-white ${compact ? "p-5 sm:p-6" : "p-6 sm:p-10"}`}
    >
      <input type="hidden" name="kind" value={kind} />
      {propertyId && <input type="hidden" name="property_id" value={propertyId} />}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {!compact && (
        <div className="mb-8">
          <p className="eyebrow">{isBuy ? "Quero comprar" : "Quero vender"}</p>
          <h3 className="mt-3 font-display text-3xl font-medium sm:text-4xl">
            {isBuy ? "Conte-nos sobre o imóvel ideal" : "Conte-nos sobre o seu imóvel"}
          </h3>
        </div>
      )}

      <div className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
        <Field label="Nome completo" name="full_name" error={err.full_name} required autoComplete="name" className={compact ? "" : "sm:col-span-2"} />
        <Field label="E-mail" name="email" type="email" error={err.email} required autoComplete="email" inputMode="email" />
        <Field label="Telefone / WhatsApp" name="phone" type="tel" error={err.phone} required autoComplete="tel" inputMode="tel" placeholder="(21) 99999-9999" />
        {!compact && (
          <>
            <Field label="Idade" name="age" type="number" error={err.age} min={16} max={120} inputMode="numeric" />
            <SelectField label={isBuy ? "Bairro de interesse" : "Bairro do imóvel"} name="neighborhood" error={err.neighborhood}>
              <option value="">Selecione</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n}>{n}</option>
              ))}
              <option>Outro</option>
            </SelectField>
            <SelectField label={isBuy ? "Tipo de imóvel desejado" : "Tipo de imóvel"} name="property_type" error={err.property_type}>
              <option value="">Selecione</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value}>{t.label}</option>
              ))}
            </SelectField>
            {isBuy ? (
              <>
                <SelectField label="Faixa de preço" name="price_range" error={err.price_range}>
                  <option value="">Selecione</option>
                  {PRICE_RANGES.map((r) => (
                    <option key={r.value}>{r.label}</option>
                  ))}
                </SelectField>
                <SelectField label="Quantidade de quartos" name="bedrooms" error={err.bedrooms}>
                  <option value="">Selecione</option>
                  {["1", "2", "3", "4", "5+"].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === "1" ? "quarto" : "quartos"}
                    </option>
                  ))}
                </SelectField>
              </>
            ) : (
              <>
                <Field label="Valor aproximado desejado (R$)" name="desired_value" error={err.desired_value} inputMode="numeric" placeholder="Ex.: 1.500.000" />
                <Field label="Metragem aproximada (m²)" name="approx_area" error={err.approx_area} inputMode="decimal" placeholder="Ex.: 120" />
              </>
            )}
          </>
        )}
        <label className={`block ${compact ? "" : "sm:col-span-2"}`}>
          <span className="field-label">Mensagem adicional</span>
          <textarea
            name="message"
            className="field"
            maxLength={3000}
            defaultValue={defaultMessage}
            placeholder={isBuy ? "Conte detalhes que são importantes para você." : "Diferenciais, estado de conservação, prazo desejado…"}
          />
        </label>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink/70">
        <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#b8955a]" aria-invalid={!!err.consent} />
        <span>
          Autorizo a Luiz Vieira Negócios Imobiliários a utilizar meus dados para entrar em contato sobre esta solicitação, conforme a{" "}
          <Link href="/politica-de-privacidade" target="_blank" className="font-semibold text-gold-deep underline underline-offset-2">
            Política de Privacidade
          </Link>{" "}
          e a LGPD (Lei nº 13.709/2018).
        </span>
      </label>
      {err.consent && <p className="mt-2 text-sm text-red-700">{err.consent}</p>}

      {state && !state.ok && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-gold mt-7 w-full sm:w-auto">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Enviando…" : "Enviar solicitação"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">
        {label}
        {props.required && <span className="text-gold-deep"> *</span>}
      </span>
      <input {...props} className={`field ${error ? "border-red-400" : ""}`} aria-invalid={!!error} />
      {error && <span className="mt-1.5 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select {...props} className="field" defaultValue="">
        {children}
      </select>
      {error && <span className="mt-1.5 block text-xs text-red-700">{error}</span>}
    </label>
  );
}
