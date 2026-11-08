"use client";
// Quadro "Armazenamento de fotos": mostra o espaço usado e apaga fotos que não servem mais.
import { useCallback, useEffect, useState } from "react";
import { ImageOff, Trash2 } from "lucide-react";
import { cleanUnusedSiteImages, deleteOldCakePhotos, getStorageUsage } from "@/app/admin/actions";
import { Btn, Card, useToast } from "./ui";

const LIMIT = 1024 ** 3; // 1 GB do plano gratuito do Supabase
const mb = (b: number) => `${(b / 1024 ** 2).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;

export function StorageCard() {
  const toast = useToast();
  const [u, setU] = useState<Awaited<ReturnType<typeof getStorageUsage>> | null>(null);
  const [days, setDays] = useState(90);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getStorageUsage().then(setU).catch(() => toast("Não foi possível ler o armazenamento.", "erro"));
  }, [toast]);
  useEffect(load, [load]);

  const total = u ? u.siteBytes + u.cakeBytes : 0;
  const pct = Math.min(100, (total / LIMIT) * 100);

  const cleanSite = async () => {
    if (!confirm("Apagar as fotos do site que não estão em nenhum produto, categoria, promoção ou texto?")) return;
    setBusy(true);
    try {
      const r = await cleanUnusedSiteImages();
      toast(r.count ? `${r.count} foto(s) apagada(s), ${mb(r.bytes)} liberados` : "Nenhuma foto sem uso");
    } catch {
      toast("Não foi possível apagar.", "erro");
    }
    setBusy(false);
    load();
  };

  const cleanCakes = async () => {
    if (!confirm(`Apagar as fotos de inspiração de encomendas com entrega há mais de ${days} dias? Os pedidos continuam salvos, só a foto é apagada.`)) return;
    setBusy(true);
    const r = await deleteOldCakePhotos(days);
    setBusy(false);
    if (!r.ok) return toast(r.error, "erro");
    toast(r.count ? `${r.count} foto(s) de bolo apagada(s)` : "Nenhuma foto antiga para apagar");
    load();
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold text-navy">Armazenamento de fotos</h2>
        <p className="text-xs text-muted">
          Fotos trocadas ou removidas no painel são apagadas sozinhas depois de 24 horas. Aqui você pode liberar espaço na hora.
        </p>
      </div>
      {!u ? (
        <p className="text-sm text-muted">Calculando…</p>
      ) : (
        <>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-navy">{mb(total)} usados</span>
              <span className="text-muted">de 1 GB (plano gratuito)</span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-cream" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : "bg-gold"}`} style={{ width: `${Math.max(pct, 1)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Fotos do site: {u.siteCount} ({mb(u.siteBytes)}) · Fotos de bolos: {u.cakeCount} ({mb(u.cakeBytes)})
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream-50 p-3">
            <p className="text-sm text-navy">
              <ImageOff className="mr-1 inline h-4 w-4 text-gold" aria-hidden />
              {u.unusedCount ? `${u.unusedCount} foto(s) do site sem uso (${mb(u.unusedBytes)})` : "Nenhuma foto do site sem uso"}
            </p>
            <Btn variant="outline" onClick={cleanSite} disabled={busy || !u.unusedCount}>
              <Trash2 className="h-4 w-4" /> Apagar fotos sem uso
            </Btn>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream-50 p-3">
            <label className="flex items-center gap-2 text-sm text-navy">
              Fotos de bolos com entrega há mais de
              <select className="field w-24 py-1.5" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Dias">
                {[30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              dias
            </label>
            <Btn variant="outline" onClick={cleanCakes} disabled={busy || !u.cakeCount}>
              <Trash2 className="h-4 w-4" /> Apagar
            </Btn>
          </div>
        </>
      )}
    </Card>
  );
}
