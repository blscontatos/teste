"use client";
// Textos e imagens do site. Tudo é salvo como RASCUNHO; "Ver como fica" abre a prévia
// e "Publicar" coloca no ar.
import { useEffect, useMemo, useState } from "react";
import { Eye, Send, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidateSite } from "@/app/admin/actions";
import { defaultContent } from "@/lib/defaults";
import type { ContentKey, SiteContent } from "@/lib/types";
import { Btn, Card, PageHeader, useToast } from "./ui";
import { ImageUpload } from "./ImageUpload";

type Field = { key: string; label: string; type?: "text" | "textarea" | "image"; aspect?: number; hint?: string };
const SECTIONS: { key: ContentKey; title: string; fields: Field[] }[] = [
  {
    key: "marca",
    title: "Marca e logo",
    fields: [
      { key: "name", label: "Nome da loja" },
      { key: "logo_url", label: "Logo (fundo claro)", type: "image", aspect: 410 / 240, hint: "De preferência PNG sem fundo." },
      { key: "logo_white_url", label: "Logo para fundo azul (rodapé)", type: "image", aspect: 410 / 240 },
    ],
  },
  {
    key: "hero",
    title: "Topo do site (destaque)",
    fields: [
      { key: "badge", label: "Selo" },
      { key: "title_line1", label: "Título — linha 1" },
      { key: "title_line2", label: "Título — linha 2 (dourada)" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "cta_label", label: "Texto do botão" },
      { key: "image_main", label: "Imagem principal (bolo)", type: "image", aspect: 3 / 4 },
      { key: "image_main_alt", label: "Descrição da imagem principal (acessibilidade)" },
      { key: "image_secondary", label: "Imagem redonda (coxinha)", type: "image", aspect: 1 },
      { key: "image_secondary_alt", label: "Descrição da imagem redonda" },
    ],
  },
  { key: "salgados", title: "Seção “Nossos Salgados”", fields: [{ key: "eyebrow", label: "Texto pequeno acima" }, { key: "title", label: "Título" }, { key: "subtitle", label: "Subtítulo", type: "textarea" }] },
  { key: "doces", title: "Seção “Nossos Doces”", fields: [{ key: "eyebrow", label: "Texto pequeno acima" }, { key: "title", label: "Título" }, { key: "subtitle", label: "Subtítulo", type: "textarea" }] },
  { key: "promocoes", title: "Seção “Promoções e Combos”", fields: [{ key: "eyebrow", label: "Texto pequeno acima" }, { key: "title", label: "Título" }, { key: "subtitle", label: "Subtítulo", type: "textarea" }] },
  { key: "depoimentos", title: "Seção “Depoimentos”", fields: [{ key: "eyebrow", label: "Texto pequeno acima" }, { key: "title", label: "Título" }, { key: "subtitle", label: "Subtítulo", type: "textarea" }] },
  {
    key: "quem_somos",
    title: "Quem Somos",
    fields: [
      { key: "eyebrow", label: "Texto pequeno acima" },
      { key: "title", label: "Título" },
      { key: "text", label: "Texto", type: "textarea", hint: "Deixe uma linha em branco para começar um novo parágrafo." },
      { key: "cta_label", label: "Texto do botão" },
      { key: "image_url", label: "Foto das donas", type: "image", aspect: 1, hint: "Use PNG sem fundo para ficar recortada sobre o círculo azul (como no layout)." },
      { key: "image_alt", label: "Descrição da foto (acessibilidade)" },
    ],
  },
  { key: "rodape", title: "Rodapé", fields: [{ key: "description", label: "Frase da marca", type: "textarea" }, { key: "copyright", label: "Direitos autorais" }] },
];

type Rows = Record<string, { data: Record<string, string>; draft: Record<string, string> | null }>;

export function ContentEditor() {
  const sb = useMemo(() => createClient(), []);
  const toast = useToast();
  const [rows, setRows] = useState<Rows | null>(null);
  const [form, setForm] = useState<SiteContent>(defaultContent);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("site_content").select("key, data, draft").then(({ data }) => {
      const r: Rows = {};
      const merged = structuredClone(defaultContent) as unknown as Record<string, Record<string, string>>;
      for (const row of data ?? []) {
        r[row.key] = { data: row.data, draft: row.draft };
        if (merged[row.key]) Object.assign(merged[row.key], row.draft ?? row.data);
      }
      setRows(r);
      setForm(merged as unknown as SiteContent);
    });
  }, [sb]);

  const hasUnpublished = rows && Object.values(rows).some((r) => r.draft && JSON.stringify(r.draft) !== JSON.stringify(r.data));

  const setField = (section: ContentKey, key: string, value: string) => {
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
    setDirty(true);
  };

  const saveDraft = async () => {
    setBusy(true);
    const payload = SECTIONS.map((s) => ({ key: s.key, data: rows?.[s.key]?.data ?? form[s.key], draft: form[s.key] }));
    const { error } = await sb.from("site_content").upsert(payload);
    setBusy(false);
    if (error) {
      toast("Não foi possível salvar.", "erro");
      return false;
    }
    setRows(Object.fromEntries(payload.map((p) => [p.key, { data: p.data as Record<string, string>, draft: p.draft as unknown as Record<string, string> }])));
    setDirty(false);
    return true;
  };

  const preview = async () => {
    const w = window.open("", "_blank");
    if (dirty && !(await saveDraft())) return w?.close();
    if (w) w.location.href = "/previa";
  };

  const publish = async () => {
    if (!confirm("Publicar as alterações? Elas vão aparecer para todos no site.")) return;
    setBusy(true);
    const payload = SECTIONS.map((s) => ({ key: s.key, data: form[s.key], draft: null }));
    const { error } = await sb.from("site_content").upsert(payload);
    setBusy(false);
    if (error) return toast("Não foi possível publicar.", "erro");
    setRows(Object.fromEntries(payload.map((p) => [p.key, { data: p.data as unknown as Record<string, string>, draft: null }])));
    setDirty(false);
    await revalidateSite();
    toast("Publicado! O site já está atualizado.");
  };

  if (!rows) return <p className="py-10 text-center text-muted">Carregando…</p>;

  return (
    <div className="pb-28">
      <PageHeader title="Textos e imagens" subtitle="Edite, clique em “Ver como fica” e depois em “Publicar”." />
      {(hasUnpublished || dirty) && (
        <p className="mb-4 rounded-2xl bg-gold-100 px-4 py-3 text-sm font-medium text-navy">
          {dirty ? "Você tem alterações não salvas." : "Há alterações salvas como rascunho que ainda não foram publicadas."}
        </p>
      )}
      <div className="space-y-5">
        {SECTIONS.map((s) => (
          <Card key={s.key}>
            <h2 className="mb-4 font-title text-xl text-navy">{s.title}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {s.fields.map((f) => {
                const value = (form[s.key] as Record<string, string>)[f.key] ?? "";
                const id = `${s.key}-${f.key}`;
                if (f.type === "image")
                  return (
                    <div key={f.key} className="md:col-span-2">
                      <ImageUpload label={f.label} folder={`site/${s.key}`} aspect={f.aspect} value={value} onChange={(url) => setField(s.key, f.key, url)} />
                      {f.hint && <p className="hint">{f.hint}</p>}
                    </div>
                  );
                return (
                  <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                    <label className="label" htmlFor={id}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea id={id} className="field min-h-24" value={value} onChange={(e) => setField(s.key, f.key, e.target.value)} />
                    ) : (
                      <input id={id} className="field" value={value} onChange={(e) => setField(s.key, f.key, e.target.value)} />
                    )}
                    {f.hint && <p className="hint">{f.hint}</p>}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-end gap-2">
          <Btn variant="ghost" onClick={saveDraft} disabled={busy || !dirty}><Save className="h-4 w-4" /> Salvar rascunho</Btn>
          <Btn variant="outline" onClick={preview} disabled={busy}><Eye className="h-4 w-4" /> Ver como fica</Btn>
          <Btn variant="gold" onClick={publish} disabled={busy}><Send className="h-4 w-4" /> Publicar</Btn>
        </div>
      </div>
    </div>
  );
}
