"use client";
// Estado da loja no navegador: sacola (guardada no aparelho), janelas abertas e avisos.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem, Category, Product, Promotion, SiteData } from "@/lib/types";

type Panel =
  | { type: "none" }
  | { type: "category"; category: Category }
  | { type: "product"; product: Product; fromCategory?: Category }
  | { type: "cake"; product: Product }
  | { type: "cart" };

interface ShopState {
  data: SiteData;
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "key">) => void;
  updateItem: (key: string, patch: Partial<CartItem>) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  addPromotion: (p: Promotion) => void;
  panel: Panel;
  openCategory: (c: Category) => void;
  openProduct: (p: Product, fromCategory?: Category) => void;
  openCart: () => void;
  close: () => void;
  toast: string | null;
  bump: number; // muda a cada item adicionado (anima o ícone da sacola)
  preview: boolean;
}

const ShopContext = createContext<ShopState | null>(null);
const STORAGE_KEY = "pk-sacola-v1";

export function ShopProvider({ data, preview = false, children }: { data: SiteData; preview?: boolean; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [toast, setToast] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const loaded = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Carrega a sacola salva no aparelho (se houver).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      /* navegação privada: segue sem salvar */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignora */
    }
  }, [items]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "key">) => {
      setItems((prev) => [...prev, { ...item, key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]);
      setBump((b) => b + 1);
      showToast("Adicionado à sacola");
    },
    [showToast],
  );

  const addPromotion = useCallback(
    (p: Promotion) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.promotion_id === p.id);
        if (existing) return prev.map((i) => (i === existing ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i));
        return [
          ...prev,
          {
            key: `promo-${p.id}`,
            promotion_id: p.id,
            name: p.title,
            image: p.images[0],
            flavors: [],
            quantity: 1,
            unit_price: p.price,
            notes: "",
          },
        ];
      });
      setBump((b) => b + 1);
      showToast("Adicionado à sacola");
    },
    [showToast],
  );

  const value = useMemo<ShopState>(
    () => ({
      data,
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
      addItem,
      addPromotion,
      updateItem: (key, patch) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i))),
      removeItem: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
      panel,
      openCategory: (category) => {
        const prods = data.products.filter((p) => p.category_id === category.id);
        if (prods.length === 1) {
          const p = prods[0];
          setPanel(p.kind === "bolo_festa" ? { type: "cake", product: p } : { type: "product", product: p });
        } else setPanel({ type: "category", category });
      },
      openProduct: (product, fromCategory) =>
        setPanel(product.kind === "bolo_festa" ? { type: "cake", product } : { type: "product", product, fromCategory }),
      openCart: () => {
        setToast(null);
        setPanel({ type: "cart" });
      },
      close: () => setPanel({ type: "none" }),
      toast,
      bump,
      preview,
    }),
    [data, items, addItem, addPromotion, panel, toast, bump, preview],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop precisa estar dentro de <ShopProvider>");
  return ctx;
}
