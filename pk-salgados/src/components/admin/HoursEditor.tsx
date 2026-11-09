"use client";
// Aba "Horários": semana geral + datas especiais (abrir num domingo, feriado, horário diferente).
// O site só deixa o cliente escolher dias e horários em que a loja está aberta.
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidateSite } from "@/app/admin/actions";
import { defaultSettings } from "@/lib/defaults";
import { WEEKDAYS, describeSpecial, describeWeekly, todayInBrazil, weekdayOf } from "@/lib/hours";
import type { SpecialDay, WeeklyHours } from "@/lib/types";
import { Btn, Card, PageHeader, useToast } from "./ui";

const ORDER = ["1", "2", "3", "4", "5", "6", "0"] as const; // segunda primeiro

export function HoursEditor() {
  const sb = useMemo(() => createClient(), []);
  const toast = useToast();
  const [weekly, setWeekly] = useState<WeeklyHours | null>(null);
  const [special, setSpecial] = useState<SpecialDay[]>([]);
  const [draft, setDraft] = useState<SpecialDay>({ date: "", closed: false, open: "09:00", close: "18:00", note: "" });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    sb.from("settings").select("weekly_hours, special_hours").eq("id", 1).maybeSingle().then(({ data }) => {
      setWeekly((data?.weekly_hours as WeeklyHours) ?? defaultSettings.weekly_hours);
      setSpecial((data?.special_hours as SpecialDay[]) ?? []);
    });
  }, [sb]);

  if (!weekly) return <p className="py-10 text-center text-muted">Carregando…</p>;

  const setDay = (day: keyof WeeklyHours, value: WeeklyHours[keyof WeeklyHours]) => {
    setWeekly({ ...weekly, [day]: value });
    setDirty(true);
  };

  const validWeekly = ORDER.every((d) => !weekly[d] || weekly[d]!.open < weekly[d]!.close);

  const save = async (nextSpecial = special) => {
    if (!validWeekly) return toast("O horário de fechar precisa ser depois do de abrir.", "erro");
    setSaving(true);
    const today = todayInBrazil();
    const cleaned = nextSpecial.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const { error } = await sb
      .from("settings")
      .update({ weekly_hours: weekly, special_hours: cleaned, opening_hours: describeWeekly(weekly) })
      .eq("id", 1);
    setSaving(false);
    if (error) return toast("Não foi possível salvar.", "erro");
    setSpecial(cleaned);
    setDirty(false);
    await revalidateSite();
    toast("Horários salvos! O site já está atualizado.");
  };

  const addSpecial = async () => {
    if (!draft.date) return toast("Escolha a data.", "erro");
    if (draft.date < todayInBrazil()) return toast("Escolha uma data de hoje em diante.", "erro");
    if (!draft.closed && (!draft.open || !draft.close || draft.open >= draft.close)) return toast("Confira o horário de abrir e fechar.", "erro");
    const item: SpecialDay = draft.closed
      ? { date: draft.date, closed: true, note: draft.note?.trim() || undefined }
      : { date: draft.date, closed: false, open: draft.open, close: draft.close, note: draft.note?.trim() || undefined };
    const next = [...special.filter((d) => d.date !== draft.date), item];
    setDraft({ ...draft, date: "", note: "" });
    await save(next);
  };

  const removeSpecial = async (date: string) => {
    if (!confirm("Remover esta data especial? O dia volta a seguir o horário da semana.")) return;
    await save(special.filter((d) => d.date !== date));
  };

  const regularFor = (date: string) => {
    const h = weekly[String(weekdayOf(date)) as keyof WeeklyHours];
    return h ? `normalmente ${h.open}–${h.close}` : "normalmente fechado";
  };

  return (
    <div className="pb-24">
      <PageHeader title="Horários" subtitle="O cliente só consegue escolher dias e horários em que a loja está aberta (retirada, entrega e encomendas de bolo)." />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Card className="space-y-3">
          <div>
            <h2 className="font-semibold text-navy">Horário da semana</h2>
            <p className="text-xs text-muted">Vale para todas as semanas, menos nas datas especiais.</p>
          </div>
          <ul className="space-y-2">
            {ORDER.map((d) => {
              const h = weekly[d];
              return (
                <li key={d} className={`flex flex-wrap items-center gap-3 rounded-2xl p-3 ${h ? "bg-cream-50" : "bg-navy/5"}`}>
                  <span className="w-20 font-semibold text-navy">{WEEKDAYS[Number(d)]}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!h}
                    aria-label={`${WEEKDAYS[Number(d)]}: ${h ? "aberto" : "fechado"}`}
                    onClick={() => setDay(d, h ? null : { open: "09:00", close: "18:00" })}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${h ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}
                  >
                    {h ? "Aberto" : "Fechado"}
                  </button>
                  {h && (
                    <span className="flex items-center gap-2 text-sm text-navy">
                      das
                      <input type="time" step={1800} className="field w-28 py-1.5" value={h.open} aria-label={`${WEEKDAYS[Number(d)]}: abre às`} onChange={(e) => setDay(d, { ...h, open: e.target.value })} />
                      às
                      <input type="time" step={1800} className="field w-28 py-1.5" value={h.close} aria-label={`${WEEKDAYS[Number(d)]}: fecha às`} onChange={(e) => setDay(d, { ...h, close: e.target.value })} />
                    </span>
                  )}
                  {h && h.open >= h.close && <span className="text-xs font-semibold text-red-700">fechar depois de abrir</span>}
                </li>
              );
            })}
          </ul>
          <Btn
            variant="ghost"
            onClick={() => {
              const base = weekly["1"] ?? { open: "09:00", close: "18:00" };
              const next = { ...weekly };
              ORDER.forEach((d) => { if (next[d]) next[d] = { ...base }; });
              setWeekly(next);
              setDirty(true);
            }}
          >
            Usar o horário de segunda em todos os dias abertos
          </Btn>
          <p className="rounded-2xl bg-gold-100 px-3 py-2 text-sm text-navy">
            No site aparece: <strong>{describeWeekly(weekly)}</strong>
          </p>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold text-navy">Datas especiais</h2>
            <p className="text-xs text-muted">Abrir num domingo, ficar até mais tarde, abrir mais cedo ou fechar num feriado.</p>
          </div>
          <div className="space-y-3 rounded-2xl bg-cream-50 p-3">
            <div>
              <label className="label" htmlFor="esp-data">Data</label>
              <input id="esp-data" type="date" className="field" min={todayInBrazil()} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              {draft.date && <p className="hint">{WEEKDAYS[weekdayOf(draft.date)]} — {regularFor(draft.date)}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map((closed) => (
                <button key={String(closed)} type="button" onClick={() => setDraft({ ...draft, closed })} aria-pressed={draft.closed === closed} className={`rounded-2xl border-2 px-3 py-2 text-sm font-semibold ${draft.closed === closed ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy"}`}>
                  {closed ? "Fechado" : "Aberto"}
                </button>
              ))}
            </div>
            {!draft.closed && (
              <div className="flex items-center gap-2 text-sm text-navy">
                das
                <input type="time" step={1800} className="field py-1.5" aria-label="Abre às" value={draft.open} onChange={(e) => setDraft({ ...draft, open: e.target.value })} />
                às
                <input type="time" step={1800} className="field py-1.5" aria-label="Fecha às" value={draft.close} onChange={(e) => setDraft({ ...draft, close: e.target.value })} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="esp-obs">Observação (opcional)</label>
              <input id="esp-obs" className="field" placeholder="Ex.: Véspera de Natal" value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </div>
            <Btn onClick={addSpecial} disabled={saving} className="w-full">
              <CalendarPlus className="h-4 w-4" /> Adicionar data especial
            </Btn>
          </div>

          {special.length ? (
            <ul className="space-y-2">
              {special.map((d) => (
                <li key={d.date} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-card">
                  <span className={`text-sm font-semibold ${d.closed ? "text-red-700" : "text-navy"}`}>{describeSpecial(d)}</span>
                  <button type="button" onClick={() => removeSpecial(d.date)} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50" aria-label={`Remover ${d.date}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nenhuma data especial. Todos os dias seguem o horário da semana.</p>
          )}
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3">
          {dirty && <span className="text-sm text-muted">Alterações não salvas</span>}
          <Btn onClick={() => save()} disabled={saving || !dirty}>{saving ? "Salvando…" : "Salvar horário da semana"}</Btn>
        </div>
      </div>
    </div>
  );
}
