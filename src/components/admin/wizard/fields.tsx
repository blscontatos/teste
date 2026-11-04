"use client";
import { useEffect, useState } from "react";

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="field-label flex items-baseline justify-between gap-2">
      <span>{children}</span>
      {hint && <span className="font-normal text-stone">{hint}</span>}
    </span>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  className = "",
  ...rest
}: { label: string; value: string; onChange: (v: string) => void; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className={`block ${className}`}>
      <Label hint={hint}>{label}</Label>
      <input {...rest} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Campo monetário/numérico com formatação brasileira; vazio = não aplicável. */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  integer = false,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  integer?: boolean;
  hint?: string;
}) {
  const [text, setText] = useState(value == null ? "" : fmt.format(value));
  useEffect(() => {
    const parsed = parse(text);
    if (parsed !== value) setText(value == null ? "" : fmt.format(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  function parse(t: string) {
    const clean = t.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
    if (!clean) return null;
    const n = Number(clean);
    return Number.isFinite(n) ? (integer ? Math.round(n) : n) : null;
  }
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <span className="relative block">
        {prefix && <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-stone">{prefix}</span>}
        <input
          className={`field ${prefix ? "pl-11" : ""} ${suffix ? "pr-12" : ""}`}
          inputMode={integer ? "numeric" : "decimal"}
          value={text}
          placeholder="—"
          onChange={(e) => {
            const raw = e.target.value.replace(integer ? /[^\d]/g : /[^\d.,]/g, "");
            setText(raw);
            onChange(parse(raw));
          }}
          onBlur={() => setText(value == null ? "" : fmt.format(value))}
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-stone">{suffix}</span>}
      </span>
    </label>
  );
}

export function Counter({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-white px-2">
        <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-lg hover:bg-sand" onClick={() => onChange(value == null || value <= 0 ? null : value - 1)} aria-label={`Diminuir ${label}`}>
          −
        </button>
        <span className="min-w-8 text-center font-semibold" aria-live="polite">
          {value ?? "—"}
        </span>
        <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-lg hover:bg-sand" onClick={() => onChange(Math.min(50, (value ?? -1) + 1))} aria-label={`Aumentar ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}
