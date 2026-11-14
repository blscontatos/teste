// Tipos compartilhados entre o site, o painel e o banco de dados.

export type CategorySection = "salgado" | "doce";
export type ProductKind = "comum" | "frito" | "bolo_festa";
export type OrderStatus = "novo" | "em_preparo" | "pronto" | "entregue" | "cancelado";
export type OrderChannel = "site" | "whatsapp";
export type Fulfillment = "retirada" | "entrega" | "consumo_local";
export type PaymentMethod = "pix" | "dinheiro" | "cartao";
export type FryOption = "congelado" | "frito";
export type CakePhotoMode = "whatsapp" | "link";

export interface Settings {
  whatsapp: string;
  phone_secondary: string;
  instagram: string;
  facebook: string;
  address: string;
  maps_url: string;
  opening_hours: string;
  delivery_fee: number;
  delivery_area: string;
  delivery_enabled: boolean;
  min_cake_notice_days: number;
  min_order_notice_hours: number;
  cake_sizes: string[];
  cake_doughs: string[];
  cake_fillings: string[];
  store_closed: boolean;
  store_closed_message: string;
  /** 'whatsapp' = cliente envia a foto do bolo no WhatsApp; 'link' = foto guardada no site e enviada como link */
  cake_photo_mode: CakePhotoMode;
  /** false = sem o botão "Enviar pedido pelo site" (só WhatsApp) */
  order_via_site: boolean;
  /** aceita pedido para comer na loja (sem data/horário) */
  dine_in_enabled: boolean;
  /** Semana geral: chave = dia da semana (0 = domingo … 6 = sábado); null = fechado */
  weekly_hours: WeeklyHours;
  /** Datas especiais (abrir num domingo, feriado, horário diferente) */
  special_hours: SpecialDay[];
}

export type DayHours = { open: string; close: string } | null;
export type WeeklyHours = Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", DayHours>;
export interface SpecialDay {
  date: string; // AAAA-MM-DD
  closed: boolean;
  open?: string;
  close?: string;
  note?: string;
}

export interface Category {
  id: string;
  section: CategorySection;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  visible: boolean;
  sort_order: number;
}

export interface Portion {
  id: string;
  product_id: string;
  label: string;
  units: number | null;
  price: number | null;
  price_frozen: number | null;
  price_fried: number | null;
  max_flavors: number | null;
  sort_order: number;
}

export interface Flavor {
  id: string;
  product_id: string;
  name: string;
  sold_out: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  kind: ProductKind;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number | null;
  max_flavors: number;
  available: boolean;
  visible: boolean;
  featured: boolean;
  sort_order: number;
  portions: Portion[];
  flavors: Flavor[];
}

export interface PromotionItem {
  id: string;
  promotion_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  sort_order: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  images: string[];
  badge: string;
  old_price: number | null;
  price: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  sort_order: number;
  items: PromotionItem[];
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  stars: number;
  visible: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Textos e imagens do site (tabela site_content)
// ---------------------------------------------------------------------------
export interface SiteContent {
  marca: { name: string; logo_url: string; logo_white_url: string };
  hero: {
    badge: string;
    title_line1: string;
    title_line2: string;
    subtitle: string;
    cta_label: string;
    image_main: string;
    image_main_alt: string;
    image_secondary: string;
    image_secondary_alt: string;
  };
  salgados: { eyebrow: string; title: string; subtitle: string };
  doces: { eyebrow: string; title: string; subtitle: string };
  promocoes: { eyebrow: string; title: string; subtitle: string };
  depoimentos: { eyebrow: string; title: string; subtitle: string };
  quem_somos: {
    eyebrow: string;
    title: string;
    text: string;
    cta_label: string;
    image_url: string;
    image_alt: string;
  };
  rodape: { description: string; copyright: string };
}

export type ContentKey = keyof SiteContent;

export interface SiteData {
  content: SiteContent;
  settings: Settings;
  categories: Category[];
  products: Product[];
  promotions: Promotion[];
  testimonials: Testimonial[];
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  promotion_id: string | null;
  name: string;
  portion_label: string;
  fry_option: FryOption | null;
  flavors: string[];
  quantity: number;
  unit_price: number;
  total: number;
  notes: string;
}

export interface Order {
  id: string;
  number: number;
  channel: OrderChannel;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  address: string;
  fulfillment: Fulfillment;
  payment: PaymentMethod;
  desired_at: string | null;
  notes: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface CakeOrder {
  id: string;
  number: number;
  status: OrderStatus;
  product_id: string | null;
  customer_name: string;
  phone: string;
  address: string;
  desired_at: string;
  size: string;
  dough: string;
  filling: string;
  theme_notes: string;
  has_inspiration: boolean;
  inspiration_path: string | null;
  created_at: string;
}

/** Item guardado na sacola do navegador. Os preços aqui são só para exibir;
 *  o banco recalcula tudo ao finalizar o pedido. */
export interface CartItem {
  key: string;
  product_id?: string;
  promotion_id?: string;
  portion_id?: string;
  name: string;
  image?: string;
  portion_label?: string;
  fry_option?: FryOption;
  flavors: string[];
  quantity: number;
  unit_price: number;
  notes: string;
}
