"use client";
import { Store } from "lucide-react";
import { useShop } from "@/components/order/ShopProvider";

/** Aviso de "loja fechada" (ligado pelo painel em Configurações). */
export function ClosedBanner() {
  const { data, preview } = useShop();
  return (
    <>
      {preview && (
        <div className="fixed inset-x-0 bottom-0 z-[70] bg-gold px-4 py-2 text-center text-sm font-semibold text-navy">
          Prévia — é assim que o site vai ficar. Volte ao painel e clique em “Publicar” para valer.
        </div>
      )}
      {data.settings.store_closed && (
        <div role="status" className="fixed inset-x-0 top-[68px] z-30 bg-navy px-4 py-2.5 text-center text-sm font-medium text-white shadow sm:top-[76px]">
          <Store className="mr-2 inline h-4 w-4 text-gold" aria-hidden />
          {data.settings.store_closed_message}
        </div>
      )}
    </>
  );
}
