import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, fryLabels, fulfillmentLabels, maskPhone, money, paymentLabels, statusLabels } from "@/lib/format";
import type { CakeOrder, Order } from "@/lib/types";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

// Versão para imprimir (impressora comum ou térmica de 80 mm).
export default async function Imprimir({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  await requireAdmin();
  const { tipo, id } = await params;
  const sb = await createClient();
  const isCake = tipo === "bolo";
  const { data } = isCake
    ? await sb.from("cake_orders").select("*").eq("id", id).maybeSingle()
    : await sb.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Order & CakeOrder;
  const photo = isCake && o.inspiration_path ? sb.storage.from("inspiration-photos").getPublicUrl(o.inspiration_path).data.publicUrl : "";

  return (
    <main className="mx-auto max-w-[80mm] bg-white p-4 font-mono text-[12px] leading-snug text-black">
      <PrintButton />
      <h1 className="text-center text-base font-bold">PK Salgados e Doces</h1>
      <p className="text-center">{isCake ? "ENCOMENDA DE BOLO" : "PEDIDO"} nº {o.number}</p>
      <p className="text-center">Status: {statusLabels[o.status]}</p>
      <hr className="my-2 border-dashed border-black" />
      <p><b>Cliente:</b> {o.customer_name}</p>
      <p><b>Tel.:</b> {maskPhone(o.phone)}</p>
      <p><b>Endereço:</b> {o.address || "—"}</p>
      <p><b>Para:</b> {formatDateTime(o.desired_at)}</p>
      {!isCake && (
        <>
          <p><b>{fulfillmentLabels[o.fulfillment]}</b> · {paymentLabels[o.payment]}</p>
          <hr className="my-2 border-dashed border-black" />
          {(o.order_items ?? []).map((i) => (
            <div key={i.id} className="mb-1.5">
              <p className="flex justify-between"><b>{i.quantity}x {i.name}</b><span>{money(i.total)}</span></p>
              <p>{[i.portion_label, i.fry_option ? fryLabels[i.fry_option] : ""].filter(Boolean).join(" · ")}</p>
              {i.flavors.length > 0 && <p>Sabores: {i.flavors.join(", ")}</p>}
              {i.notes && <p>Obs.: {i.notes}</p>}
            </div>
          ))}
          <hr className="my-2 border-dashed border-black" />
          <p className="flex justify-between"><span>Subtotal</span><span>{money(o.subtotal)}</span></p>
          {Number(o.delivery_fee) > 0 && <p className="flex justify-between"><span>Entrega</span><span>{money(o.delivery_fee)}</span></p>}
          <p className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{money(o.total)}</span></p>
          {o.notes && <p className="mt-2"><b>Obs.:</b> {o.notes}</p>}
        </>
      )}
      {isCake && (
        <>
          <hr className="my-2 border-dashed border-black" />
          <p><b>Tamanho:</b> {o.size || "—"}</p>
          <p><b>Massa:</b> {o.dough || "—"}</p>
          <p><b>Recheio:</b> {o.filling || "—"}</p>
          <p><b>Tema/obs.:</b> {o.theme_notes || "—"}</p>
          <p><b>Inspiração:</b> {o.has_inspiration ? (photo ? "Sim (foto abaixo)" : "Sim (foto já apagada)") : "Não"}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo && <img src={photo} alt="Foto de inspiração" className="mt-2 w-full" />}
        </>
      )}
      <hr className="my-2 border-dashed border-black" />
      <p className="text-center">Recebido em {formatDateTime(o.created_at)}</p>
    </main>
  );
}
