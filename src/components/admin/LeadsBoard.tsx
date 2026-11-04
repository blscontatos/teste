"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Copy, LoaderCircle, Mail, Trash2, X } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUS_LABEL } from "@/lib/constants";
import { formatArea, formatBRL, formatDateTime, phoneToWhatsapp, whatsappLink } from "@/lib/format";
import { deleteLead, updateLead } from "@/app/admin/actions";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useToast } from "./Toast";

const STATUS_STYLE: Record<LeadStatus, string> = {
  novo: "bg-gold/20 text-gold-deep",
  em_atendimento: "bg-sky-50 text-sky-800",
  concluido: "bg-emerald-50 text-emerald-800",
};

export function LeadsBoard({ leads, openId }: { leads: Lead[]; openId: string | null }) {
  const [selected, setSelected] = useState<string | null>(openId);
  useEffect(() => setSelected(openId), [openId]);
  const current = leads.find((l) => l.id === selected) ?? null;

  if (!leads.length)
    return <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white p-12 text-center text-sm text-ink/60">Nenhum contato encontrado neste filtro.</div>;

  return (
    <>
      {/* Tabela (desktop) */}
      <div className="mt-6 hidden overflow-hidden rounded-[24px] border border-line bg-white lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/60 text-xs tracking-wide text-stone uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Nome</th>
              <th className="px-5 py-3 font-semibold">Contato</th>
              <th className="px-5 py-3 font-semibold">Idade</th>
              <th className="px-5 py-3 font-semibold">Interesse</th>
              <th className="px-5 py-3 font-semibold">Bairro</th>
              <th className="px-5 py-3 font-semibold">Recebido em</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leads.map((l) => (
              <tr key={l.id} onClick={() => setSelected(l.id)} className="cursor-pointer transition hover:bg-sand/40" data-testid="lead-row">
                <td className="px-5 py-4">
                  <p className="font-semibold">{l.full_name}</p>
                  {l.message && <p className="line-clamp-1 max-w-[240px] text-xs text-stone">{l.message}</p>}
                </td>
                <td className="px-5 py-4">
                  <p>{l.phone}</p>
                  <p className="text-xs text-stone">{l.email}</p>
                </td>
                <td className="px-5 py-4">{l.age ?? "—"}</td>
                <td className="px-5 py-4">
                  <KindChip kind={l.kind} />
                </td>
                <td className="px-5 py-4">{l.neighborhood ?? "—"}</td>
                <td className="px-5 py-4 whitespace-nowrap">{formatDateTime(l.created_at)}</td>
                <td className="px-5 py-4">
                  <span className={`chip ${STATUS_STYLE[l.status]}`}>{LEAD_STATUS_LABEL[l.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <ul className="mt-6 space-y-3 lg:hidden">
        {leads.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => setSelected(l.id)} className="w-full rounded-[20px] border border-line bg-white p-4 text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{l.full_name}</p>
                <span className={`chip ${STATUS_STYLE[l.status]}`}>{LEAD_STATUS_LABEL[l.status]}</span>
              </div>
              <p className="mt-1 text-sm text-ink/60">{l.phone}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-stone">
                <KindChip kind={l.kind} /> {l.neighborhood ?? ""} · {formatDateTime(l.created_at)}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {current && <LeadDrawer lead={current} onClose={() => setSelected(null)} />}
    </>
  );
}

function KindChip({ kind }: { kind: Lead["kind"] }) {
  return <span className={`chip ${kind === "comprar" ? "bg-ink text-white" : "bg-gold text-ink"}`}>{kind === "comprar" ? "Comprar" : "Vender"}</span>;
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [notes, setNotes] = useState(lead.internal_notes ?? "");
  const [pending, start] = useTransition();
  useEffect(() => setNotes(lead.internal_notes ?? ""), [lead.id, lead.internal_notes]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const wa = whatsappLink(phoneToWhatsapp(lead.phone), `Olá, ${lead.full_name.split(" ")[0]}! Aqui é da Luiz Vieira Negócios Imobiliários. Recebemos sua solicitação pelo site.`);

  const save = (patch: Parameters<typeof updateLead>[1], msg: string) =>
    start(async () => {
      const r = await updateLead(lead.id, patch);
      if (r.ok) {
        toast("ok", msg);
        router.refresh();
      } else toast("error", r.error);
    });

  const info: [string, React.ReactNode][] = [
    ["Interesse", lead.kind === "comprar" ? "Comprar imóvel" : "Vender imóvel"],
    ["E-mail", lead.email],
    ["Telefone", lead.phone],
    ["Idade", lead.age],
    [lead.kind === "comprar" ? "Bairro de interesse" : "Bairro do imóvel", lead.neighborhood],
    ["Tipo de imóvel", lead.property_type],
    ["Faixa de preço", lead.price_range],
    ["Quartos", lead.bedrooms],
    ["Valor desejado", lead.desired_value != null ? formatBRL(lead.desired_value) : null],
    ["Metragem aproximada", lead.approx_area != null ? formatArea(lead.approx_area) : null],
    ["Recebido em", formatDateTime(lead.created_at)],
    ["Consentimento LGPD", `Sim — ${formatDateTime(lead.consent_at)}`],
    ["Origem", lead.source === "pagina-imovel" ? "Página de imóvel" : "Formulário do site"],
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Contato de ${lead.full_name}`}>
      <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg animate-fade-in flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white p-6">
          <div>
            <KindChip kind={lead.kind} />
            <h2 className="mt-2 font-display text-3xl">{lead.full_name}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn col-span-2 bg-[#25D366] text-white hover:bg-[#1fb658] sm:col-span-1">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
            <button
              type="button"
              className="btn-outline"
              onClick={async () => {
                await navigator.clipboard.writeText(lead.phone);
                toast("ok", "Telefone copiado.");
              }}
            >
              <Copy className="h-4 w-4" /> Copiar
            </button>
            <a href={`mailto:${lead.email}`} className="btn-outline">
              <Mail className="h-4 w-4" /> E-mail
            </a>
          </div>

          <div>
            <p className="field-label">Status do atendimento</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={pending}
                  onClick={() => s !== lead.status && save({ status: s }, `Status: ${LEAD_STATUS_LABEL[s]}.`)}
                  className={`min-h-11 rounded-xl border px-2 text-xs font-semibold transition ${lead.status === s ? "border-ink bg-ink text-white" : "border-line hover:border-gold/60"}`}
                >
                  {LEAD_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {lead.properties && (
            <div className="rounded-2xl bg-sand/70 p-4 text-sm">
              Imóvel de interesse:{" "}
              <Link href={`/imoveis/${lead.properties.slug}`} target="_blank" className="font-semibold text-gold-deep underline">
                {lead.properties.code} — {lead.properties.title}
              </Link>
            </div>
          )}

          <dl className="divide-y divide-line rounded-2xl border border-line">
            {info
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-stone">{k}</dt>
                  <dd className="text-right font-medium break-all">{v}</dd>
                </div>
              ))}
          </dl>

          {lead.message && (
            <div>
              <p className="field-label">Mensagem</p>
              <p className="rounded-2xl bg-sand/50 p-4 text-sm leading-relaxed whitespace-pre-line">{lead.message}</p>
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="notes">
              Observações internas
            </label>
            <textarea id="notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} placeholder="Visível apenas para a equipe. Ex.: ligar na sexta à tarde." />
            <button type="button" className="btn-dark btn-sm mt-3" disabled={pending || notes === (lead.internal_notes ?? "")} onClick={() => save({ internal_notes: notes }, "Observações salvas.")}>
              {pending && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Salvar observações
            </button>
          </div>

          <button
            type="button"
            className="btn-ghost btn-sm text-red-700 hover:bg-red-50"
            disabled={pending}
            onClick={() =>
              confirm(`Excluir definitivamente o contato de ${lead.full_name}?`) &&
              start(async () => {
                const r = await deleteLead(lead.id);
                if (r.ok) {
                  toast("ok", "Contato excluído.");
                  onClose();
                  router.refresh();
                } else toast("error", r.error);
              })
            }
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir contato
          </button>
        </div>
      </aside>
    </div>
  );
}
