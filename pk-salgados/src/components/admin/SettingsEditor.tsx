"use client";
// Configurações da loja: contatos, entrega, antecedência, opções de bolo e "loja fechada".
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { revalidateSite } from "@/app/admin/actions";
import { defaultSettings } from "@/lib/defaults";
import { maskPhone } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { Btn, Card, PageHeader, Switch, TagListEditor, toNumber, useToast } from "./ui";

export function SettingsEditor() {
  const sb = useMemo(() => createClient(), []);
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sb.from("settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setS({ ...defaultSettings, ...(data ?? {}) }));
  }, [sb]);

  if (!s) return <p className="py-10 text-center text-muted">Carregando…</p>;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });

  const save = async (patch?: Partial<Settings>) => {
    const next = { ...s, ...patch };
    const raw = next.whatsapp.replace(/\D/g, "");
    const digits = raw === "55" ? "" : raw;
    if (digits && (digits.length < 12 || digits.length > 13)) return toast("WhatsApp: informe com DDD, ex.: (21) 98271-2575.", "erro");
    setSaving(true);
    const { error } = await sb.from("settings").upsert({ id: 1, ...next, whatsapp: digits, instagram: next.instagram.replace(/^@/, "") });
    setSaving(false);
    if (error) return toast("Não foi possível salvar.", "erro");
    setS(next);
    await revalidateSite();
    toast("Configurações salvas!");
  };

  // O WhatsApp é guardado como 55 + DDD + número; na tela mostramos sem o 55.
  const waLocal = s.whatsapp.replace(/^55/, "");

  return (
    <div className="pb-24">
      <PageHeader title="Configurações" />

      <Card className={`mb-5 border-2 ${s.store_closed ? "border-red-300" : "border-transparent"}`}>
        <Switch
          label={s.store_closed ? "Loja FECHADA — não estamos aceitando pedidos" : "Loja aberta para pedidos"}
          hint="Ligue para mostrar um aviso no site e bloquear novos pedidos."
          checked={s.store_closed}
          onChange={(v) => save({ store_closed: v })}
        />
        <label className="label mt-3" htmlFor="cfg-msg">Mensagem do aviso</label>
        <input id="cfg-msg" className="field" value={s.store_closed_message} onChange={(e) => set("store_closed_message", e.target.value)} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-semibold text-navy">Contato</h2>
          <div>
            <label className="label" htmlFor="cfg-wa">WhatsApp da loja (recebe os pedidos)</label>
            <input id="cfg-wa" className="field" inputMode="tel" value={maskPhone(waLocal)} onChange={(e) => set("whatsapp", `55${e.target.value.replace(/\D/g, "").slice(0, 11)}`)} placeholder="(21) 98271-2575" />
          </div>
          <div>
            <label className="label" htmlFor="cfg-tel">Outro telefone</label>
            <input id="cfg-tel" className="field" value={s.phone_secondary} onChange={(e) => set("phone_secondary", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="cfg-ig">Instagram</label>
              <input id="cfg-ig" className="field" value={s.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="pksalgados" />
            </div>
            <div>
              <label className="label" htmlFor="cfg-fb">Facebook</label>
              <input id="cfg-fb" className="field" value={s.facebook} onChange={(e) => set("facebook", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="cfg-end">Endereço</label>
            <input id="cfg-end" className="field" value={s.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="cfg-maps">Link do Google Maps (opcional)</label>
            <input id="cfg-maps" className="field" value={s.maps_url} onChange={(e) => set("maps_url", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="cfg-hora">Horário de funcionamento</label>
            <input id="cfg-hora" className="field" value={s.opening_hours} onChange={(e) => set("opening_hours", e.target.value)} />
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-4">
            <h2 className="font-semibold text-navy">Entrega e prazos</h2>
            <Switch label="Fazemos entregas" checked={s.delivery_enabled} onChange={(v) => set("delivery_enabled", v)} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="cfg-taxa">Taxa de entrega (R$)</label>
                <input id="cfg-taxa" className="field" inputMode="decimal" value={s.delivery_fee} onChange={(e) => set("delivery_fee", toNumber(e.target.value) ?? 0)} />
                <p className="hint">0 = a combinar</p>
              </div>
              <div>
                <label className="label" htmlFor="cfg-ant">Antecedência pedidos (horas)</label>
                <input id="cfg-ant" className="field" inputMode="numeric" value={s.min_order_notice_hours} onChange={(e) => set("min_order_notice_hours", Number(e.target.value.replace(/\D/g, "")) || 0)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="cfg-area">Área de entrega (texto para o cliente)</label>
              <input id="cfg-area" className="field" value={s.delivery_area} onChange={(e) => set("delivery_area", e.target.value)} />
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold text-navy">Bolos de festa</h2>
            <div>
              <label className="label" htmlFor="cfg-bolo">Antecedência mínima (dias)</label>
              <input id="cfg-bolo" className="field w-32" inputMode="numeric" value={s.min_cake_notice_days} onChange={(e) => set("min_cake_notice_days", Number(e.target.value.replace(/\D/g, "")) || 0)} />
            </div>
            <div><p className="label">Tamanhos</p><TagListEditor value={s.cake_sizes} onChange={(v) => set("cake_sizes", v)} placeholder="Ex.: Até 30 pessoas" /></div>
            <div><p className="label">Massas</p><TagListEditor value={s.cake_doughs} onChange={(v) => set("cake_doughs", v)} placeholder="Ex.: Massa de cenoura" /></div>
            <div><p className="label">Recheios</p><TagListEditor value={s.cake_fillings} onChange={(v) => set("cake_fillings", v)} placeholder="Ex.: Nozes" /></div>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-navy/10 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end">
          <Btn onClick={() => save()} disabled={saving}>{saving ? "Salvando…" : "Salvar configurações"}</Btn>
        </div>
      </div>
    </div>
  );
}
