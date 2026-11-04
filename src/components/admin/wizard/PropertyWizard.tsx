"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Cloud, CloudOff, Crown, Eye, LoaderCircle, Plus, Save, Send, X } from "lucide-react";
import type { BusinessType, Property, PropertyImage, PropertyType } from "@/lib/types";
import { BUSINESS_LABEL, NEIGHBORHOODS, PROPERTY_TYPES, STATUS_LABEL, typeLabel } from "@/lib/constants";
import { formatArea, formatBRL, priceLine } from "@/lib/format";
import { saveProperty, setFeaturedProperty, setPropertyStatus, type PropertyInput } from "@/app/admin/actions";
import { Counter, Label, NumberField, TextField } from "./fields";
import { PhotosStep } from "./PhotosStep";
import { useToast } from "../Toast";

const STEPS = [
  { n: 1, title: "Informações básicas", short: "Básico" },
  { n: 2, title: "Valores e medidas", short: "Valores" },
  { n: 3, title: "Fotos e vídeos", short: "Fotos" },
  { n: 4, title: "Descrição", short: "Descrição" },
  { n: 5, title: "Revisar e publicar", short: "Revisar" },
];

type Form = {
  business: BusinessType;
  type: PropertyType;
  title: string;
  code: string;
  neighborhood: string;
  address: string;
  show_address: boolean;
  city: string;
  state: string;
  sale_price: number | null;
  rent_price: number | null;
  condo_fee: number | null;
  iptu: number | null;
  total_area: number | null;
  built_area: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  description: string;
  features: string[];
  condo_features: string[];
  video_url: string;
};

function toForm(p: Property | null): Form {
  return {
    business: p?.business ?? "venda",
    type: p?.type ?? "apartamento",
    title: p?.title === "Novo imóvel" ? "" : p?.title ?? "",
    code: p?.code ?? "",
    neighborhood: p?.neighborhood ?? "",
    address: p?.address ?? "",
    show_address: p?.show_address ?? false,
    city: p?.city ?? "Rio de Janeiro",
    state: p?.state ?? "RJ",
    sale_price: p?.sale_price != null ? Number(p.sale_price) : null,
    rent_price: p?.rent_price != null ? Number(p.rent_price) : null,
    condo_fee: p?.condo_fee != null ? Number(p.condo_fee) : null,
    iptu: p?.iptu != null ? Number(p.iptu) : null,
    total_area: p?.total_area != null ? Number(p.total_area) : null,
    built_area: p?.built_area != null ? Number(p.built_area) : null,
    bedrooms: p?.bedrooms ?? null,
    suites: p?.suites ?? null,
    bathrooms: p?.bathrooms ?? null,
    parking_spots: p?.parking_spots ?? null,
    description: p?.description ?? "",
    features: p?.features ?? [],
    condo_features: p?.condo_features ?? [],
    video_url: p?.video_url ?? "",
  };
}

export function PropertyWizard({
  property,
  catalog,
  initialStep,
  isFeatured = false,
}: {
  property: Property | null;
  catalog: { label: string; scope: string }[];
  initialStep?: number;
  isFeatured?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [id, setId] = useState<string | null>(property?.id ?? null);
  const [status, setStatus] = useState(property?.status ?? "draft");
  const [slug, setSlug] = useState(property?.slug ?? "");
  const [featured, setFeatured] = useState(isFeatured);
  const [form, setForm] = useState<Form>(() => toForm(property));
  const [images, setImages] = useState<PropertyImage[]>(property?.property_images ?? []);
  const [maxStep, setMaxStep] = useState(property?.wizard_step ?? 1);
  const [step, setStep] = useState(() => Math.min(5, Math.max(1, initialStep ?? (property ? property.wizard_step ?? 1 : 1))));
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishing, startPublish] = useTransition();
  const lastSaved = useRef(JSON.stringify(toForm(property)));
  const saving = useRef<Promise<string | null> | null>(null);
  const idRef = useRef<string | null>(property?.id ?? null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const payload = useCallback(
    (f: Form, wizardStep: number): PropertyInput => ({
      ...f,
      title: f.title.trim() || "Novo imóvel",
      code: f.code.trim() || undefined,
      neighborhood: f.neighborhood || null,
      address: f.address || null,
      description: f.description || null,
      video_url: f.video_url.trim() || null,
      wizard_step: wizardStep,
    }),
    [],
  );

  /** Salva no banco (cria o rascunho na primeira vez). Retorna o id. */
  const persist = useCallback(
    async (f: Form, wizardStep: number, quiet = true): Promise<string | null> => {
      if (saving.current) await saving.current;
      const run = (async () => {
        setSaveState("saving");
        const currentId = idRef.current;
        const r = await saveProperty(currentId, payload(f, wizardStep));
        if (!r.ok) {
          setSaveState("error");
          if (!quiet) toast("error", r.error);
          if (r.error.includes("código")) setErrors((e) => ({ ...e, code: r.error }));
          return null;
        }
        lastSaved.current = JSON.stringify(f);
        setSaveState("saved");
        if (r.data) {
          setSlug(r.data.slug);
          if (!f.code) setForm((cur) => (cur.code ? cur : { ...cur, code: r.data!.code }));
          if (!currentId) {
            // O rascunho passa a existir no banco e aparece em Imóveis → Rascunhos.
            // (A URL não é alterada aqui para não remontar o formulário durante a digitação.)
            idRef.current = r.data.id;
            setId(r.data.id);
          }
        }
        return r.data?.id ?? currentId;
      })();
      saving.current = run;
      const result = await run;
      saving.current = null;
      return result;
    },
    [payload, toast],
  );

  // Autosave (rascunho preservado mesmo se o usuário sair no meio do cadastro)
  useEffect(() => {
    const serialized = JSON.stringify(form);
    if (serialized === lastSaved.current) return;
    if (!id && !form.title.trim()) return;
    setSaveState("dirty");
    const t = setTimeout(() => persist(form, Math.max(step, maxStep)), 1500);
    return () => clearTimeout(t);
  }, [form, id, persist, step, maxStep]);

  // Aviso ao sair com alterações não salvas
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(form) !== lastSaved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form]);

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim()) e.title = "Informe o título do anúncio.";
      if (!form.neighborhood.trim()) e.neighborhood = "Informe o bairro.";
      if (form.code && !/^[A-Za-z0-9-]+$/.test(form.code)) e.code = "Use apenas letras, números e hífen.";
      if (!form.city.trim()) e.city = "Informe a cidade.";
      if (form.state.trim().length !== 2) e.state = "Use a sigla (ex.: RJ).";
    }
    if (s === 2) {
      if (form.business !== "aluguel" && form.sale_price == null && form.business === "venda") e.sale_price = "Informe o preço de venda (ou deixe sob consulta mudando depois).";
    }
    if (s === 4 && form.video_url && !/^https?:\/\//.test(form.video_url)) e.video_url = "O link deve começar com https://";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function goTo(target: number) {
    if (target > step && !validate(step)) {
      if (step !== 2) return; // na etapa 2 o preço é recomendado, não obrigatório
      if (!confirm("O preço de venda está vazio. O imóvel aparecerá como “Valor sob consulta”. Continuar?")) return;
      setErrors({});
    }
    const nextMax = Math.max(maxStep, target);
    const savedId = await persist(form, nextMax, false);
    if (!savedId) return;
    setMaxStep(nextMax);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish(action: "draft" | "publish" | "publish-feature" | "feature") {
    startPublish(async () => {
      const savedId = await persist(form, 5, false);
      if (!savedId) return;
      if (action === "draft") {
        if (status !== "draft") {
          const r = await setPropertyStatus(savedId, "draft");
          if (!r.ok) return toast("error", r.error);
          setStatus("draft");
        }
        toast("ok", "Rascunho salvo.");
        router.push("/admin/imoveis?aba=draft");
        return;
      }
      if (action === "feature") {
        const r = await setFeaturedProperty(savedId);
        if (!r.ok) return toast("error", r.error);
        setFeatured(true);
        toast("ok", "Imóvel definido como destaque da página inicial.");
        router.refresh();
        return;
      }
      if (!images.length && !confirm("Este imóvel ainda não tem fotos. Publicar mesmo assim?")) return;
      const r = await setPropertyStatus(savedId, "published", action === "publish-feature");
      if (!r.ok) return toast("error", r.error);
      setStatus("published");
      if (action === "publish-feature") setFeatured(true);
      toast("ok", action === "publish-feature" ? "Imóvel publicado e definido como destaque!" : "Imóvel publicado no site!");
      router.push("/admin/imoveis?aba=published");
    });
  }

  const SaveBadge = () => (
    <span className="inline-flex items-center gap-1.5 text-xs text-stone" aria-live="polite" data-testid="save-state">
      {saveState === "saving" && (
        <>
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Salvando…
        </>
      )}
      {saveState === "saved" && (
        <>
          <Cloud className="h-3.5 w-3.5 text-emerald-600" /> Rascunho salvo
        </>
      )}
      {saveState === "dirty" && (
        <>
          <Cloud className="h-3.5 w-3.5" /> Alterações pendentes
        </>
      )}
      {saveState === "error" && (
        <>
          <CloudOff className="h-3.5 w-3.5 text-red-600" /> Não salvo
        </>
      )}
    </span>
  );

  return (
    <div className="pb-28">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/imoveis" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Voltar para imóveis
        </Link>
        <div className="flex items-center gap-3">
          <SaveBadge />
          {id && <span className="chip bg-white text-ink/70">{STATUS_LABEL[status]}</span>}
          {featured && (
            <span className="chip bg-gold text-ink">
              <Crown className="h-3 w-3" /> Destaque
            </span>
          )}
        </div>
      </div>

      <h1 className="font-display text-4xl font-medium">{property ? "Editar imóvel" : "Cadastrar imóvel"}</h1>
      <p className="mt-1 text-sm text-ink/60">
        Etapa {step} de 5 — {STEPS[step - 1].title}. Tudo é salvo automaticamente como rascunho.
      </p>

      {/* Stepper */}
      <ol className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Etapas do cadastro">
        {STEPS.map((s) => {
          const reachable = s.n <= maxStep || s.n === step + 1;
          const done = s.n < step || (s.n <= maxStep && s.n !== step);
          return (
            <li key={s.n} className="min-w-[132px] flex-1">
              <button
                type="button"
                onClick={() => reachable && s.n !== step && goTo(s.n)}
                disabled={!reachable}
                aria-current={s.n === step ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  s.n === step ? "border-ink bg-ink text-white" : reachable ? "border-line bg-white hover:border-gold/60" : "border-line bg-white/60 opacity-60"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    s.n === step ? "bg-gold text-ink" : done ? "bg-emerald-100 text-emerald-800" : "bg-sand text-ink/60"
                  }`}
                >
                  {done && s.n !== step ? <Check className="h-4 w-4" /> : s.n}
                </span>
                <span className="text-sm font-semibold">
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{s.short}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="mt-6 rounded-[28px] border border-line bg-white p-5 sm:p-8">
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <Label>O imóvel será vendido, alugado ou ambos?</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["venda", "aluguel", "ambos"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => set("business", b)}
                    aria-pressed={form.business === b}
                    className={`min-h-14 rounded-2xl border px-4 text-sm font-semibold transition ${
                      form.business === b ? "border-ink bg-ink text-white" : "border-line hover:border-gold/60"
                    }`}
                  >
                    {b === "venda" ? "Venda" : b === "aluguel" ? "Aluguel" : "Venda e aluguel"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Tipo de imóvel</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("type", t.value)}
                    aria-pressed={form.type === t.value}
                    className={`min-h-12 rounded-2xl border px-3 text-sm font-medium transition ${
                      form.type === t.value ? "border-gold bg-gold-pale/60 text-ink ring-1 ring-gold" : "border-line hover:border-gold/60"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
              <div>
                <TextField label="Título do anúncio *" value={form.title} onChange={(v) => set("title", v)} maxLength={160} placeholder="Ex.: Cobertura duplex com vista para o mar" />
                {errors.title && <p className="mt-1 text-xs text-red-700">{errors.title}</p>}
              </div>
              <div>
                <TextField label="Código do imóvel" hint="automático se vazio" value={form.code} onChange={(v) => set("code", v.toUpperCase())} maxLength={30} placeholder="LV1001" />
                {errors.code && <p className="mt-1 text-xs text-red-700">{errors.code}</p>}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <Label>Bairro *</Label>
                <input className="field" list="bairros" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Ex.: Recreio dos Bandeirantes" />
                <datalist id="bairros">
                  {NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                {errors.neighborhood && <p className="mt-1 text-xs text-red-700">{errors.neighborhood}</p>}
              </label>
              <TextField label="Endereço" value={form.address} onChange={(v) => set("address", v)} maxLength={250} placeholder="Rua, número, condomínio" />
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <div>
                  <TextField label="Cidade *" value={form.city} onChange={(v) => set("city", v)} />
                  {errors.city && <p className="mt-1 text-xs text-red-700">{errors.city}</p>}
                </div>
                <div>
                  <TextField label="Estado *" value={form.state} onChange={(v) => set("state", v.toUpperCase().slice(0, 2))} maxLength={2} />
                  {errors.state && <p className="mt-1 text-xs text-red-700">{errors.state}</p>}
                </div>
              </div>
              <label className="flex items-start gap-3 self-end rounded-2xl bg-sand/70 p-4 text-sm">
                <input type="checkbox" checked={form.show_address} onChange={(e) => set("show_address", e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#b8955a]" />
                <span>
                  <strong>Exibir endereço no site</strong>
                  <span className="block text-ink/60">Desmarcado: o site mostra apenas bairro e cidade (localização aproximada).</span>
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <p className="rounded-2xl bg-sand/70 px-4 py-3 text-sm text-ink/70">Deixe em branco os campos que não se aplicam a este imóvel.</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {form.business !== "aluguel" && (
                <div>
                  <NumberField label="Preço de venda" prefix="R$" value={form.sale_price} onChange={(v) => set("sale_price", v)} />
                  {errors.sale_price && <p className="mt-1 text-xs text-amber-700">{errors.sale_price}</p>}
                </div>
              )}
              {form.business !== "venda" && <NumberField label="Valor do aluguel" prefix="R$" suffix="/mês" value={form.rent_price} onChange={(v) => set("rent_price", v)} />}
              <NumberField label="Condomínio" prefix="R$" suffix="/mês" value={form.condo_fee} onChange={(v) => set("condo_fee", v)} />
              <NumberField label="IPTU" prefix="R$" suffix="/ano" value={form.iptu} onChange={(v) => set("iptu", v)} />
              <NumberField label="Área total" suffix="m²" value={form.total_area} onChange={(v) => set("total_area", v)} />
              <NumberField label="Área construída" suffix="m²" value={form.built_area} onChange={(v) => set("built_area", v)} />
            </div>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              <Counter label="Quartos" value={form.bedrooms} onChange={(v) => set("bedrooms", v)} />
              <Counter label="Suítes" value={form.suites} onChange={(v) => set("suites", v)} />
              <Counter label="Banheiros" value={form.bathrooms} onChange={(v) => set("bathrooms", v)} />
              <Counter label="Vagas de garagem" value={form.parking_spots} onChange={(v) => set("parking_spots", v)} />
            </div>
          </div>
        )}

        {step === 3 && id && (
          <div className="space-y-8">
            <PhotosStep propertyId={id} images={images} setImages={setImages} />
            <div className="max-w-xl">
              <TextField label="Vídeo do imóvel (link do YouTube, Vimeo ou outro)" value={form.video_url} onChange={(v) => set("video_url", v)} placeholder="https://www.youtube.com/watch?v=…" type="url" />
              {errors.video_url && <p className="mt-1 text-xs text-red-700">{errors.video_url}</p>}
            </div>
            {images.length > 0 && <GalleryPreview images={images} title={form.title} />}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10">
            <label className="block">
              <Label hint={`${form.description.length}/10000`}>Descrição completa</Label>
              <textarea
                className="field min-h-64"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={10000}
                placeholder="Descreva os ambientes, acabamentos, posição solar, vista, diferenciais do condomínio e da região…"
              />
            </label>
            <FeaturePicker
              title="Características do imóvel"
              options={catalog.filter((c) => c.scope === "imovel").map((c) => c.label)}
              value={form.features}
              onChange={(v) => set("features", v)}
            />
            <FeaturePicker
              title="Características do condomínio"
              options={catalog.filter((c) => c.scope === "condominio").map((c) => c.label)}
              value={form.condo_features}
              onChange={(v) => set("condo_features", v)}
            />
          </div>
        )}

        {step === 5 && <Review form={form} images={images} onEdit={(s) => goTo(s)} />}
      </section>

      {/* Barra de navegação fixa */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-[264px]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-8">
          <button type="button" className="btn-ghost" disabled={step === 1} onClick={() => goTo(step - 1)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          {step < 5 ? (
            <button type="button" className="btn-dark" onClick={() => goTo(step + 1)} disabled={saveState === "saving"} data-testid="wizard-next">
              Próxima etapa <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              {status === "published" && slug && (
                <Link href={`/imoveis/${slug}`} target="_blank" className="btn-ghost">
                  <Eye className="h-4 w-4" /> Ver no site
                </Link>
              )}
              <button type="button" className="btn-outline" disabled={publishing} onClick={() => finish("draft")} data-testid="wizard-save-draft">
                <Save className="h-4 w-4" /> {status === "draft" ? "Salvar como rascunho" : "Voltar para rascunho"}
              </button>
              {status === "published" ? (
                <>
                  <button type="button" className="btn-dark" disabled={publishing} onClick={() => finish("publish")} data-testid="wizard-publish">
                    {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />} Salvar alterações
                  </button>
                  {!featured && (
                    <button type="button" className="btn-gold" disabled={publishing} onClick={() => finish("feature")}>
                      <Crown className="h-4 w-4" /> Definir como destaque
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button type="button" className="btn-dark" disabled={publishing} onClick={() => finish("publish")} data-testid="wizard-publish">
                    {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar imóvel
                  </button>
                  <button type="button" className="btn-gold" disabled={publishing} onClick={() => finish("publish-feature")} data-testid="wizard-publish-feature">
                    <Crown className="h-4 w-4" /> Publicar e destacar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturePicker({ title, options, value, onChange }: { title: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const all = useMemo(() => [...new Set([...options, ...value])], [options, value]);
  const toggle = (f: string) => onChange(value.includes(f) ? value.filter((x) => x !== f) : [...value, f]);
  const add = () => {
    const v = custom.trim().slice(0, 80);
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setCustom("");
  };
  return (
    <div>
      <h3 className="font-display text-2xl">{title}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {all.map((f) => {
          const on = value.includes(f);
          const isCustom = !options.includes(f);
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggle(f)}
              aria-pressed={on}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition ${
                on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-gold/60"
              }`}
            >
              {on ? <Check className="h-3.5 w-3.5 text-gold-light" /> : <Plus className="h-3.5 w-3.5 text-stone" />}
              {f}
              {isCustom && on && <X className="h-3.5 w-3.5 opacity-60" aria-label="remover" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex max-w-md gap-2">
        <input
          className="field min-h-11"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Adicionar outra característica"
          maxLength={80}
        />
        <button type="button" onClick={add} className="btn-outline min-h-11 shrink-0">
          Adicionar
        </button>
      </div>
    </div>
  );
}

function GalleryPreview({ images, title }: { images: PropertyImage[]; title: string }) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const cover = sorted.find((i) => i.is_cover) ?? sorted[0];
  const rest = sorted.filter((i) => i.id !== cover.id).slice(0, 4);
  return (
    <div>
      <h3 className="mb-3 font-display text-2xl">Prévia da galeria</h3>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand">
          <Image src={cover.url} alt={title} fill sizes="600px" className="object-cover" />
        </div>
        <div className="hidden grid-cols-2 gap-2 sm:grid">
          {rest.map((i) => (
            <div key={i.id} className="relative overflow-hidden rounded-xl bg-sand">
              <Image src={i.url} alt="" fill sizes="150px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Review({ form, images, onEdit }: { form: Form; images: PropertyImage[]; onEdit: (step: number) => void }) {
  const price = priceLine(form);
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const cover = sorted.find((i) => i.is_cover) ?? sorted[0];
  const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="border-t border-line pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="text-sm font-semibold text-gold-deep hover:text-ink">
          Editar
        </button>
      </div>
      {children}
    </div>
  );
  const row = (k: string, v: React.ReactNode) =>
    v ? (
      <div className="flex justify-between gap-4 py-1.5 text-sm">
        <dt className="text-stone">{k}</dt>
        <dd className="text-right font-medium">{v}</dd>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/60">Confira como o anúncio será apresentado. Você pode voltar e editar qualquer etapa.</p>
      <div className="overflow-hidden rounded-[24px] border border-line">
        <div className="relative aspect-[16/8] bg-sand">
          {cover ? <Image src={cover.url} alt="" fill sizes="900px" className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-stone">Sem fotos — adicione na etapa 3</div>}
          <span className="chip absolute top-4 left-4 bg-ink text-white">{BUSINESS_LABEL[form.business]}</span>
          <span className="chip absolute top-4 right-4 bg-white/90 text-ink">{images.length} fotos</span>
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold tracking-wider text-gold-deep uppercase">
            {typeLabel(form.type)} · {form.neighborhood || "Bairro não informado"} {form.code && `· Cód. ${form.code}`}
          </p>
          <p className="mt-2 font-display text-3xl">{form.title || "Sem título"}</p>
          <p className="mt-2 font-display text-2xl font-semibold">{price.main}</p>
          {price.sale && price.rent && <p className="text-sm text-stone">ou {price.rent}</p>}
        </div>
      </div>

      <Section title="Informações básicas" step={1}>
        <dl>
          {row("Finalidade", BUSINESS_LABEL[form.business])}
          {row("Tipo", typeLabel(form.type))}
          {row("Endereço", [form.address, form.neighborhood, `${form.city} — ${form.state}`].filter(Boolean).join(", "))}
          {row("Endereço visível no site", form.show_address ? "Sim" : "Não (apenas bairro)")}
        </dl>
      </Section>
      <Section title="Valores e medidas" step={2}>
        <dl className="grid gap-x-10 sm:grid-cols-2">
          {row("Venda", form.sale_price != null && formatBRL(form.sale_price))}
          {row("Aluguel", form.rent_price != null && `${formatBRL(form.rent_price)}/mês`)}
          {row("Condomínio", form.condo_fee != null && formatBRL(form.condo_fee))}
          {row("IPTU", form.iptu != null && formatBRL(form.iptu))}
          {row("Área total", form.total_area != null && formatArea(form.total_area))}
          {row("Área construída", form.built_area != null && formatArea(form.built_area))}
          {row("Quartos", form.bedrooms != null && String(form.bedrooms))}
          {row("Suítes", form.suites != null && String(form.suites))}
          {row("Banheiros", form.bathrooms != null && String(form.bathrooms))}
          {row("Vagas", form.parking_spots != null && String(form.parking_spots))}
        </dl>
      </Section>
      <Section title="Fotos e vídeo" step={3}>
        {sorted.length ? (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {sorted.map((i) => (
              <div key={i.id} className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl ${i.is_cover ? "ring-2 ring-gold" : ""}`}>
                <Image src={i.url} alt="" fill sizes="112px" className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-amber-700">Nenhuma foto enviada.</p>
        )}
        {form.video_url && <p className="mt-3 truncate text-sm text-ink/60">Vídeo: {form.video_url}</p>}
      </Section>
      <Section title="Descrição e características" step={4}>
        <p className="text-sm leading-relaxed whitespace-pre-line text-ink/75">{form.description || <span className="text-amber-700">Sem descrição.</span>}</p>
        {[...form.features, ...form.condo_features].length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[...form.features, ...form.condo_features].map((f) => (
              <span key={f} className="chip bg-sand text-ink/70">
                {f}
              </span>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
