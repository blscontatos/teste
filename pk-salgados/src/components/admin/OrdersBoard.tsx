"use client";
// Pedidos em tempo real: lista, filtros, aviso sonoro + notificação, detalhes e status.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellRing, Cake, Download, Globe, Phone, Printer, RefreshCw, ZoomIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Btn, Modal, PageHeader, useToast } from "./ui";
import {
  formatDateTime, fryLabels, fulfillmentLabels, maskPhone, money, paymentLabels, statusLabels,
} from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { CakeOrder, Order, OrderStatus } from "@/lib/types";

type Row =
  | { kind: "pedido"; data: Order }
  | { kind: "bolo"; data: CakeOrder };

const STATUS: OrderStatus[] = ["novo", "em_preparo", "pronto", "entregue", "cancelado"];
const statusColor: Record<OrderStatus, string> = {
  novo: "bg-gold text-navy",
  em_preparo: "bg-blue-100 text-blue-800",
  pronto: "bg-emerald-100 text-emerald-800",
  entregue: "bg-navy/10 text-navy",
  cancelado: "bg-red-100 text-red-700",
};

/** Toca um "plim-plim" sem precisar de arquivo de áudio. */
function chime(ctx: AudioContext) {
  [880, 1320].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const t = ctx.currentTime + i * 0.22;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.55);
  });
}

export function OrdersBoard() {
  const toast = useToast();
  const sb = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus | "todos">("novo");
  const [type, setType] = useState<"todos" | "site" | "whatsapp" | "bolo">("todos");
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<Row | null>(null);
  const [alerts, setAlerts] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const start = new Date(`${from}T00:00:00-03:00`).toISOString();
    const end = to ? new Date(`${to}T23:59:59-03:00`).toISOString() : null;
    let q1 = sb.from("orders").select("*, order_items(*)").gte("created_at", start).order("created_at", { ascending: false }).limit(300);
    let q2 = sb.from("cake_orders").select("*").gte("created_at", start).order("created_at", { ascending: false }).limit(300);
    if (end) {
      q1 = q1.lte("created_at", end);
      q2 = q2.lte("created_at", end);
    }
    const [o, c] = await Promise.all([q1, q2]);
    if (o.error || c.error) toast("Não foi possível carregar os pedidos.", "erro");
    const list: Row[] = [
      ...((o.data ?? []) as Order[]).map((d) => ({ kind: "pedido" as const, data: d })),
      ...((c.data ?? []) as CakeOrder[]).map((d) => ({ kind: "bolo" as const, data: d })),
    ].sort((a, b) => b.data.created_at.localeCompare(a.data.created_at));
    setRows(list);
    setLoading(false);
  }, [sb, from, to, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Tempo real: chegou pedido novo → som, notificação e destaque.
  useEffect(() => {
    const onNew = (label: string, id: string, number: number) => {
      if (audio.current) chime(audio.current);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(`Novo ${label} nº ${number}`, { body: "Toque para ver no painel.", icon: "/icon.png" });
      }
      toast(`Chegou ${label} nº ${number}!`);
      setFresh((s) => new Set(s).add(id));
      load();
    };
    // O tempo real precisa do login da dona (senão as regras de acesso bloqueiam os avisos).
    let channel: ReturnType<typeof sb.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      if (data.session) await sb.realtime.setAuth(data.session.access_token);
      channel = sb
        .channel("pedidos-novos")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => onNew("pedido", p.new.id, p.new.number))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "cake_orders" }, (p) => onNew("encomenda de bolo", p.new.id, p.new.number))
        .subscribe((st) => setLive(st === "SUBSCRIBED"));
    })();
    // Segurança extra: recarrega a cada 60s caso a conexão em tempo real caia.
    const poll = setInterval(load, 60_000);
    return () => {
      clearInterval(poll);
      cancelled = true;
      if (channel) sb.removeChannel(channel);
    };
  }, [sb, load, toast]);

  // Mostra no título da aba quantos pedidos novos há.
  const newCount = rows.filter((r) => r.data.status === "novo").length;
  useEffect(() => {
    document.title = newCount ? `(${newCount}) Pedidos — PK` : "Pedidos — PK";
  }, [newCount]);

  const enableAlerts = async () => {
    audio.current ??= new AudioContext();
    await audio.current.resume();
    chime(audio.current);
    if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission();
    setAlerts(true);
    toast("Avisos ligados! Deixe esta tela aberta.");
  };

  const filtered = rows.filter((r) => {
    if (status !== "todos" && r.data.status !== status) return false;
    if (type === "bolo") return r.kind === "bolo";
    if (type === "site" || type === "whatsapp") return r.kind === "pedido" && r.data.channel === type;
    return true;
  });

  const changeStatus = async (row: Row, s: OrderStatus) => {
    const table = row.kind === "pedido" ? "orders" : "cake_orders";
    const { error } = await sb.from(table).update({ status: s }).eq("id", row.data.id);
    if (error) return toast("Não foi possível mudar o status.", "erro");
    const update = (r: Row): Row => (r.data.id === row.data.id ? ({ ...r, data: { ...r.data, status: s } } as Row) : r);
    setRows((list) => list.map(update));
    setOpen((o) => (o ? update(o) : o));
    toast(`Status: ${statusLabels[s]}`);
  };

  return (
    <div>
      <PageHeader title="Pedidos" subtitle="Os pedidos novos aparecem aqui na hora.">
        <span data-realtime={live ? "on" : "off"} className={`inline-flex items-center gap-1.5 self-center rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-emerald-100 text-emerald-800" : "bg-navy/10 text-muted"}`}>
          <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-navy/30"}`} /> {live ? "Ao vivo" : "Conectando…"}
        </span>
        <Btn variant={alerts ? "gold" : "navy"} onClick={enableAlerts}>
          {alerts ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {alerts ? "Avisos ligados" : "Ligar som e avisos"}
        </Btn>
        <Btn variant="outline" onClick={load} aria-label="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Btn>
      </PageHeader>

      {/* Filtros */}
      <div className="no-print -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {(["todos", ...STATUS] as const).map((s) => {
          const n = s === "todos" ? rows.length : rows.filter((r) => r.data.status === s).length;
          return (
            <button key={s} type="button" onClick={() => setStatus(s)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${status === s ? "bg-navy text-white" : "bg-white text-navy shadow-card"}`}>
              {s === "todos" ? "Todos" : statusLabels[s]} <span className="opacity-60">({n})</span>
            </button>
          );
        })}
      </div>
      <div className="no-print mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select className="field" value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Tipo de pedido">
          <option value="todos">Todos os tipos</option>
          <option value="site">Pedidos pelo site</option>
          <option value="whatsapp">Pedidos pelo WhatsApp</option>
          <option value="bolo">Encomendas de bolo</option>
        </select>
        <label className="sr-only" htmlFor="f-de">De</label>
        <input id="f-de" type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
        <label className="sr-only" htmlFor="f-ate">Até</label>
        <input id="f-ate" type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Até" />
        <Btn variant="ghost" onClick={() => { setTo(""); setFrom(new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)); }}>Últimos 30 dias</Btn>
      </div>

      {loading && !rows.length ? (
        <p className="py-10 text-center text-muted">Carregando…</p>
      ) : !filtered.length ? (
        <div className="rounded-3xl bg-white py-14 text-center shadow-card">
          <p className="font-title text-2xl text-navy">Nenhum pedido aqui</p>
          <p className="mt-1 text-sm text-muted">Mude os filtros acima para ver outros pedidos.</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {filtered.map((r) => {
              const d = r.data;
              const isNew = fresh.has(d.id);
              return (
                <motion.li key={d.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <button type="button" onClick={() => { setOpen(r); setFresh((s) => { const n = new Set(s); n.delete(d.id); return n; }); }} className={`w-full rounded-3xl bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover ${isNew ? "ring-4 ring-gold" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          {r.kind === "bolo" ? <><Cake className="h-3.5 w-3.5" /> Encomenda de bolo</> : r.data.channel === "whatsapp" ? <><WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp</> : <><Globe className="h-3.5 w-3.5" /> Site</>}
                        </p>
                        <p className="mt-1 font-title text-2xl text-navy">nº {d.number}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor[d.status]}`}>{statusLabels[d.status]}</span>
                    </div>
                    <p className="mt-2 font-semibold text-ink">{d.customer_name}</p>
                    <p className="text-sm text-muted">
                      Para {formatDateTime(d.desired_at)}
                      {r.kind === "pedido" && ` · ${fulfillmentLabels[r.data.fulfillment]}`}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted">Recebido {formatDateTime(d.created_at)}</span>
                      {r.kind === "pedido" ? <span className="font-bold text-navy">{money(r.data.total)}</span> : r.data.has_inspiration && <span className="text-xs font-semibold text-gold-600">com foto</span>}
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>{open && <OrderDetail row={open} onClose={() => setOpen(null)} onStatus={changeStatus} />}</AnimatePresence>
    </div>
  );
}

function OrderDetail({ row, onClose, onStatus }: { row: Row; onClose: () => void; onStatus: (r: Row, s: OrderStatus) => void }) {
  const d = row.data;
  const [zoom, setZoom] = useState(false);
  const photo =
    row.kind === "bolo" && row.data.inspiration_path
      ? createClient().storage.from("inspiration-photos").getPublicUrl(row.data.inspiration_path).data.publicUrl
      : "";
  const phone = d.phone.replace(/\D/g, "");

  const download = async () => {
    const blob = await (await fetch(photo)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inspiracao-pedido-${d.number}.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal title={`${row.kind === "bolo" ? "Encomenda de bolo" : "Pedido"} nº ${d.number}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {STATUS.map((s) => (
            <button key={s} type="button" onClick={() => onStatus(row, s)} className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${d.status === s ? statusColor[s] + " ring-2 ring-navy" : "bg-white text-navy shadow-card"}`}>
              {statusLabels[s]}
            </button>
          ))}
        </div>

        <div className="grid gap-2 rounded-3xl bg-white p-4 text-sm shadow-card sm:grid-cols-2">
          <p><span className="text-muted">Cliente:</span> <strong>{d.customer_name}</strong></p>
          <p><span className="text-muted">Telefone:</span> <strong>{maskPhone(phone)}</strong></p>
          <p className="sm:col-span-2"><span className="text-muted">Endereço:</span> {d.address || "—"}</p>
          <p><span className="text-muted">Para:</span> <strong>{formatDateTime(d.desired_at)}</strong></p>
          <p><span className="text-muted">Recebido:</span> {formatDateTime(d.created_at)}</p>
          {row.kind === "pedido" && (
            <>
              <p><span className="text-muted">Entrega:</span> {fulfillmentLabels[row.data.fulfillment]}</p>
              <p><span className="text-muted">Pagamento:</span> {paymentLabels[row.data.payment]}</p>
              <p><span className="text-muted">Enviado por:</span> {row.data.channel === "whatsapp" ? "WhatsApp" : "Site"}</p>
            </>
          )}
        </div>

        {row.kind === "pedido" ? (
          <div className="rounded-3xl bg-white p-4 shadow-card">
            <ul className="divide-y divide-navy/10">
              {(row.data.order_items ?? []).map((i) => (
                <li key={i.id} className="py-2.5">
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold text-navy">{i.quantity}x {i.name}</p>
                    <p className="font-semibold">{money(i.total)}</p>
                  </div>
                  <p className="text-sm text-muted">{[i.portion_label, i.fry_option ? fryLabels[i.fry_option] : "", i.promotion_id ? "Promoção" : ""].filter(Boolean).join(" · ")}</p>
                  {i.flavors.length > 0 && <p className="text-sm">Sabores: {i.flavors.join(", ")}</p>}
                  {i.notes && <p className="text-sm italic text-muted">Obs.: {i.notes}</p>}
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 border-t border-navy/10 pt-3 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span>{money(row.data.subtotal)}</span></div>
              {row.data.delivery_fee > 0 && <div className="flex justify-between text-muted"><span>Entrega</span><span>{money(row.data.delivery_fee)}</span></div>}
              <div className="flex justify-between text-base font-bold text-navy"><span>Total</span><span>{money(row.data.total)}</span></div>
            </div>
            {row.data.notes && <p className="mt-3 rounded-2xl bg-cream px-3 py-2 text-sm"><strong>Observações:</strong> {row.data.notes}</p>}
          </div>
        ) : (
          <div className="space-y-3 rounded-3xl bg-white p-4 text-sm shadow-card">
            <p><span className="text-muted">Tamanho:</span> {row.data.size || "—"}</p>
            <p><span className="text-muted">Massa:</span> {row.data.dough || "—"} · <span className="text-muted">Recheio:</span> {row.data.filling || "—"}</p>
            <p><span className="text-muted">Tema/observações:</span> {row.data.theme_notes || "—"}</p>
            <p><span className="text-muted">Modelo de inspiração:</span> {row.data.has_inspiration ? "Sim" : "Não"}</p>
            {photo && (
              <div>
                <button type="button" onClick={() => setZoom(true)} className="group relative block overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element -- foto enviada pelo cliente */}
                  <img src={photo} alt="Foto de inspiração enviada pelo cliente" className="max-h-72 w-full object-contain bg-cream" />
                  <span className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-navy/80 text-white"><ZoomIn className="h-4 w-4" /></span>
                </button>
                <div className="mt-2 flex gap-2">
                  <Btn variant="outline" onClick={() => setZoom(true)}><ZoomIn className="h-4 w-4" /> Ampliar</Btn>
                  <Btn variant="outline" onClick={download}><Download className="h-4 w-4" /> Baixar foto</Btn>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <a href={waLink(`55${phone}`, `Olá, ${d.customer_name.split(" ")[0]}! Aqui é da PK Salgados e Doces, sobre o seu pedido nº ${d.number}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white">
            <WhatsAppIcon className="h-4 w-4" /> Chamar cliente no WhatsApp
          </a>
          <a href={`tel:+55${phone}`} className="inline-flex items-center gap-2 rounded-full border-2 border-navy/20 bg-white px-4 py-2.5 text-sm font-semibold text-navy"><Phone className="h-4 w-4" /> Ligar</a>
          <a href={`/admin/imprimir/${row.kind}/${d.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full border-2 border-navy/20 bg-white px-4 py-2.5 text-sm font-semibold text-navy"><Printer className="h-4 w-4" /> Imprimir</a>
        </div>
      </div>

      {zoom && photo && (
        <button type="button" className="fixed inset-0 z-[90] grid cursor-zoom-out place-items-center bg-black/90 p-4" onClick={() => setZoom(false)} aria-label="Fechar foto ampliada">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Foto de inspiração ampliada" className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </Modal>
  );
}
