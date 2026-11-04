"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { NEIGHBORHOODS, PRICE_RANGES, PROPERTY_TYPES, RENT_RANGES } from "@/lib/constants";

const KEYS = ["q", "negocio", "bairro", "tipo", "preco", "quartos", "vagas", "ordem"] as const;

export function PropertyFilters({
  neighborhoods = [],
  basePath = "/imoveis",
  anchor = "",
  showOrder = true,
}: {
  neighborhoods?: string[];
  basePath?: string;
  anchor?: string;
  showOrder?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ""])),
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setValues(Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ""])));
  }, [params]);

  const allNeighborhoods = [...new Set([...neighborhoods, ...NEIGHBORHOODS])];
  const priceOptions = values.negocio === "alugar" ? RENT_RANGES : PRICE_RANGES;

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams();
    KEYS.forEach((k) => next[k] && sp.set(k, next[k]));
    const qs = sp.toString();
    start(() => router.push(`${basePath}${qs ? `?${qs}` : ""}${anchor}`, { scroll: basePath !== "/imoveis" ? false : true }));
  }

  function set(k: string, v: string) {
    const next = { ...values, [k]: v };
    if (k === "negocio") next.preco = "";
    setValues(next);
    if (k !== "q") apply(next);
  }

  const activeCount = KEYS.filter((k) => k !== "q" && k !== "ordem" && values[k]).length;

  return (
    <div className="space-y-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          apply(values);
        }}
        className="flex flex-col gap-3 rounded-[26px] border border-line bg-white p-3 shadow-[0_20px_50px_-35px_rgba(13,13,12,0.35)] sm:flex-row sm:items-center"
      >
        <div className="flex rounded-full bg-sand p-1" role="radiogroup" aria-label="Finalidade">
          {[
            ["", "Todos"],
            ["comprar", "Comprar"],
            ["alugar", "Alugar"],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={values.negocio === v}
              onClick={() => set("negocio", v)}
              className={`min-h-10 flex-1 rounded-full px-4 text-sm font-semibold transition-all duration-300 sm:flex-none ${
                values.negocio === v ? "bg-ink text-white shadow" : "text-ink/60 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <span className="sr-only">Buscar por código, título ou bairro</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone" />
          <input
            value={values.q}
            onChange={(e) => setValues({ ...values, q: e.target.value })}
            placeholder="Buscar por código, título ou bairro"
            className="h-12 w-full rounded-full bg-transparent pr-4 pl-11 text-[15px] outline-none placeholder:text-stone"
            maxLength={80}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="btn-outline flex-1 sm:flex-none"
            aria-expanded={open}
            aria-controls="filtros-avancados"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros{activeCount ? ` (${activeCount})` : ""}
          </button>
          <button type="submit" className="btn-gold flex-1 sm:flex-none" disabled={pending}>
            <Search className="h-4 w-4" /> {pending ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>

      <div
        id="filtros-avancados"
        className={`grid transition-all duration-500 ease-(--ease-luxe) ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-3 rounded-[26px] border border-line bg-sand/60 p-4 sm:grid-cols-2 lg:grid-cols-6">
            <Select label="Bairro" value={values.bairro} onChange={(v) => set("bairro", v)}>
              <option value="">Todos os bairros</option>
              {allNeighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Select label="Tipo de imóvel" value={values.tipo} onChange={(v) => set("tipo", v)}>
              <option value="">Todos os tipos</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Select label={values.negocio === "alugar" ? "Aluguel mensal" : "Faixa de preço"} value={values.preco} onChange={(v) => set("preco", v)}>
              <option value="">Qualquer valor</option>
              {priceOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Select label="Quartos" value={values.quartos} onChange={(v) => set("quartos", v)}>
              <option value="">Qualquer</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+ quartos
                </option>
              ))}
            </Select>
            <Select label="Vagas" value={values.vagas} onChange={(v) => set("vagas", v)}>
              <option value="">Qualquer</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}+ vagas
                </option>
              ))}
            </Select>
            {showOrder ? (
              <Select label="Ordenar por" value={values.ordem} onChange={(v) => set("ordem", v)}>
                <option value="">Mais recentes</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
                <option value="maior-area">Maior área</option>
              </Select>
            ) : (
              <div />
            )}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                const cleared = Object.fromEntries(KEYS.map((k) => [k, ""]));
                setValues(cleared);
                apply(cleared);
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-deep hover:text-ink"
            >
              <X className="h-4 w-4" /> Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}
