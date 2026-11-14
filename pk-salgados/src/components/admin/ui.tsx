"use client";
// Peças reaproveitadas no painel: avisos, interruptor, cabeçalho de página, botões e janela.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Avisos (toast)
// ---------------------------------------------------------------------------
type Toast = { id: number; text: string; kind: "ok" | "erro" };
const ToastCtx = createContext<(text: string, kind?: Toast["kind"]) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-xl ${t.kind === "ok" ? "bg-navy text-white" : "bg-red-600 text-white"}`}>
              {t.kind === "ok" ? <CheckCircle2 className="h-4 w-4 text-gold" /> : <AlertCircle className="h-4 w-4" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ---------------------------------------------------------------------------
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-title text-3xl text-navy sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Btn({
  variant = "navy",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "navy" | "gold" | "ghost" | "danger" | "outline" }) {
  const v = {
    navy: "bg-navy text-white hover:bg-navy-700 shadow-pill",
    gold: "bg-gold text-navy hover:bg-gold-600",
    ghost: "text-navy hover:bg-cream",
    outline: "border-2 border-navy/20 text-navy hover:border-navy bg-white",
    danger: "text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-50 ${v} ${className}`}
    />
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-white p-3.5 shadow-card">
      <span>
        <span className="block text-sm font-semibold text-navy">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-gold" : "bg-navy/20"}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-4 shadow-card sm:p-5 ${className}`}>{children}</div>;
}

/** Janela simples do painel (abre de baixo no celular). */
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = o;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div className="absolute inset-0 bg-navy/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-cream-50 shadow-2xl sm:rounded-[2rem] ${wide ? "sm:max-w-3xl" : "sm:max-w-xl"}`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-3.5">
          <h2 className="font-title text-xl text-navy">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </motion.div>
    </div>
  );
}

/** Lista editável de textos (ex.: tamanhos de bolo). */
export function TagListEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1.5 text-sm text-navy">
            {v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remover ${v}`} className="rounded-full p-0.5 hover:bg-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="field" value={draft} placeholder={placeholder ?? "Adicionar…"} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Btn variant="outline" onClick={add}>Adicionar</Btn>
      </div>
    </div>
  );
}

export const toNumber = (v: string) => {
  const t = v.trim();
  if (t === "") return null;
  // Formato brasileiro: "1.234,50" → 1234.5 ; "8,50" → 8.5 ; "8.50" ou "8" continuam valendo.
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : null;
};

/** Campo de valor em R$ que aceita vírgula enquanto a pessoa digita (ex.: "8,50"). */
export function MoneyInput({
  value,
  onChange,
  className = "field",
  ...rest
}: { value: number | null; onChange: (v: number | null) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const show = (v: number | null) => (v == null ? "" : Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ","));
  const [text, setText] = useState(show(value));
  // Se o valor mudar por fora (ex.: carregou do banco), atualiza o texto.
  useEffect(() => {
    if (toNumber(text) !== value) setText(show(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      {...rest}
      className={className}
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.,]/g, "");
        setText(t);
        onChange(toNumber(t));
      }}
    />
  );
}
