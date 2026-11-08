"use client";
// Renderiza a janela aberta no momento (categoria, produto, bolo, sacola) e o aviso (toast).
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useShop } from "./ShopProvider";
import { Sheet } from "./Sheet";
import dynamic from "next/dynamic";
import { CategoryList, ProductDetail } from "./ProductPanel";

// Carregadas só quando abertas (deixa a página inicial mais leve no celular).
const CakeForm = dynamic(() => import("./CakeForm").then((m) => m.CakeForm), { ssr: false });
const CartPanel = dynamic(() => import("./CartPanel").then((m) => m.CartPanel), { ssr: false });

export function Overlays() {
  const { panel, close, openCategory, toast, count, openCart } = useShop();

  return (
    <>
      <AnimatePresence>
        {panel.type === "category" && (
          <Sheet key="cat" title={panel.category.name} onClose={close}>
            <CategoryList category={panel.category} />
          </Sheet>
        )}
        {panel.type === "product" && (
          <Sheet
            key={`p-${panel.product.id}`}
            title={panel.product.name}
            onClose={close}
            onBack={panel.fromCategory ? () => openCategory(panel.fromCategory!) : undefined}
          >
            <ProductDetail product={panel.product} />
          </Sheet>
        )}
        {panel.type === "cake" && (
          <Sheet key="cake" title="Encomenda de bolo" onClose={close}>
            <CakeForm product={panel.product} />
          </Sheet>
        )}
        {panel.type === "cart" && <CartPanel key="cart" />}
      </AnimatePresence>

      {/* Aviso "Adicionado à sacola" */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:bottom-8" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-navy py-2.5 pl-4 pr-2.5 text-sm font-semibold text-white shadow-2xl"
            >
              <CheckCircle2 className="h-5 w-5 text-gold" aria-hidden />
              {toast}
              <button type="button" onClick={openCart} className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
                Ver sacola
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botão flutuante da sacola no celular */}
      <AnimatePresence>
        {count > 0 && panel.type === "none" && (
          <motion.button
            type="button"
            onClick={openCart}
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-full bg-navy px-5 py-3.5 text-white shadow-2xl sm:hidden"
          >
            <span className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-5 w-5 text-gold" aria-hidden /> Ver sacola
            </span>
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-sm font-bold text-navy">{count}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
