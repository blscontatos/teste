// =============================================================================
// Conteúdo inicial do site (baseado no folder da PK Salgados).
// É a MESMA fonte usada para gerar o supabase/seed.sql (npm run seed:gerar)
// e também o que o site mostra enquanto o Supabase ainda não está configurado.
// Depois de publicado, tudo é editado pelo painel /admin.
// =============================================================================
import type {
  Category,
  Flavor,
  Portion,
  Product,
  Promotion,
  PromotionItem,
  Settings,
  SiteContent,
  Testimonial,
} from "./types.ts";

/** Gera UUIDs fixos e legíveis para o conteúdo inicial. */
const id = (group: number, n: number) =>
  `00000000-0000-4000-8000-${String(group).padStart(4, "0")}${String(n).padStart(8, "0")}`;

export const defaultSettings: Settings = {
  whatsapp: "5521982712575",
  phone_secondary: "(21) 3066-1028",
  instagram: "pksalgados",
  facebook: "pksalgados",
  address: "R. Brício Filho, 16 - Guadalupe, Rio de Janeiro - RJ, 21660-290",
  maps_url: "https://www.google.com/maps/search/?api=1&query=R.+Br%C3%ADcio+Filho,+16+-+Guadalupe,+Rio+de+Janeiro+-+RJ",
  opening_hours: "Segunda a Sábado, das 9h às 18h",
  delivery_fee: 0,
  delivery_area: "Consulte a taxa e a área de entrega pelo WhatsApp.",
  delivery_enabled: true,
  min_cake_notice_days: 3,
  min_order_notice_hours: 24,
  cake_sizes: ["Até 15 pessoas", "Até 25 pessoas", "Até 40 pessoas", "Até 60 pessoas", "Mais de 60 pessoas"],
  cake_doughs: ["Massa branca (baunilha)", "Massa de chocolate", "Massa mesclada"],
  cake_fillings: ["Brigadeiro", "Beijinho", "Doce de leite", "Ninho com morango", "Abacaxi com coco", "Prestígio"],
  store_closed: false,
  store_closed_message: "Hoje não estamos aceitando pedidos. Voltamos em breve!",
  cake_photo_mode: "whatsapp",
  weekly_hours: {
    "0": null,
    "1": { open: "09:00", close: "18:00" },
    "2": { open: "09:00", close: "18:00" },
    "3": { open: "09:00", close: "18:00" },
    "4": { open: "09:00", close: "18:00" },
    "5": { open: "09:00", close: "18:00" },
    "6": { open: "09:00", close: "18:00" },
  },
  special_hours: [],
};

export const defaultContent: SiteContent = {
  marca: {
    name: "PK Salgados e Doces",
    logo_url: "/brand/logo-pk-modelo.png",
    logo_white_url: "/brand/logo-pk-modelo-white.png",
  },
  hero: {
    badge: "Feito para momentos especiais",
    title_line1: "Pequenos no tamanho.",
    title_line2: "Gigantes no sabor.",
    subtitle: "Salgados e doces feitos com muito amor, para tornar seu momento ainda mais especial.",
    cta_label: "Faça seu pedido",
    image_main: "/images/hero-original.webp",
    image_main_alt: "Bolo de chocolate com morangos e uma coxinha dourada",
    image_secondary: "",
    image_secondary_alt: "",
  },
  salgados: {
    eyebrow: "Cardápio",
    title: "Nossos Salgados",
    subtitle: "Assados, fritos, congelados ou prontos para servir. Escolha a porção e os sabores.",
  },
  doces: {
    eyebrow: "Cardápio",
    title: "Nossos Doces",
    subtitle: "Docinhos de festa e bolos feitos sob encomenda para o seu momento especial.",
  },
  promocoes: {
    eyebrow: "Aproveite",
    title: "Promoções e Combos",
    subtitle: "Combinações pensadas para a sua festa, com preço especial.",
  },
  depoimentos: {
    eyebrow: "Quem prova, aprova",
    title: "Depoimentos de Clientes",
    subtitle: "O carinho de quem já fez a festa com a gente.",
  },
  quem_somos: {
    eyebrow: "Nossa história",
    title: "Quem Somos",
    text:
      "A PK Salgados e Doces nasceu na cozinha de casa, do amor por receber bem e por ver a mesa da festa cheia.\n\nCada salgado é enrolado à mão e cada docinho é feito com ingredientes selecionados, do jeitinho que a gente serve para a nossa própria família. Atendemos aniversários, chás, eventos da empresa e aquele lanche de fim de semana.",
    cta_label: "Faça seu pedido",
    image_url: "/images/quem-somos.webp",
    image_alt: "Vitrine com salgados e doces da PK",
  },
  rodape: {
    description: "Salgados, doces e bolos para todos os momentos especiais.",
    copyright: "PK Salgados e Doces. Todos os direitos reservados.",
  },
};

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------
type CatSeed = Omit<Category, "id" | "sort_order" | "visible"> & { key: string };
const catSeeds: CatSeed[] = [
  { key: "assados", section: "salgado", name: "Assados", slug: "assados", description: "Mini hambúrguer, mini hot dog, joelhinhos e esfihas.", image_url: "/images/cat-assados.webp" },
  { key: "mini-pizzas", section: "salgado", name: "Mini Pizzas", slug: "mini-pizzas", description: "Muçarela, presunto e calabresa.", image_url: "/images/cat-mini-pizzas.webp" },
  { key: "mini-quiches", section: "salgado", name: "Mini Quiches", slug: "mini-quiches", description: "Doces e salgadas, do alho-poró ao chocolate.", image_url: "/images/cat-quiches.webp" },
  { key: "folhados", section: "salgado", name: "Folhados", slug: "folhados", description: "Massa folhada crocante com recheios caprichados.", image_url: "/images/cat-folhados.webp" },
  { key: "croissants", section: "salgado", name: "Croissants", slug: "croissants", description: "Mini croissants recheados.", image_url: "/images/cat-croissants.webp" },
  { key: "pastel-forno", section: "salgado", name: "Pastel de Forno", slug: "pastel-de-forno", description: "Frango, carne, camarão, bacalhau e mais.", image_url: "/images/cat-pastel-forno.webp" },
  { key: "fritos", section: "salgado", name: "Salgados Fritos", slug: "salgados-fritos", description: "Coxinha, bolinha de queijo, risoles, quibe… congelados ou fritos.", image_url: "/images/cat-fritos.webp" },
  { key: "pastel-frito", section: "salgado", name: "Pastéis Fritos", slug: "pasteis-fritos", description: "Queijo ou carne, congelados ou fritos.", image_url: "/images/cat-pastel-frito.webp" },
  { key: "especiais", section: "salgado", name: "Salgados Especiais", slug: "salgados-especiais", description: "Bolinho de bacalhau, bolinho de feijoada e empanado de camarão.", image_url: "/images/cat-especiais.webp" },
  { key: "docinhos", section: "doce", name: "Docinhos", slug: "docinhos", description: "Brigadeiro, cajuzinho, beijinho e moranguinho.", image_url: "/images/cat-docinhos.webp" },
  { key: "brigadeiro", section: "doce", name: "Brigadeiro", slug: "brigadeiro", description: "O clássico que não pode faltar.", image_url: "/images/cat-brigadeiro.webp" },
  { key: "bolos-festa", section: "doce", name: "Bolos de Festa", slug: "bolos-de-festa", description: "Sob encomenda, do seu jeito.", image_url: "/images/cat-bolos-festa.webp" },
  { key: "bolos-caseiros", section: "doce", name: "Bolos Caseiros", slug: "bolos-caseiros", description: "Consulte os sabores do dia.", image_url: "/images/cat-bolos-caseiros.webp" },
  { key: "tortas", section: "doce", name: "Tortas", slug: "tortas", description: "Consulte os sabores disponíveis.", image_url: "/images/cat-tortas.webp" },
  { key: "torta-cook", section: "doce", name: "Torta Cook", slug: "torta-cook", description: "Massa de cookie com recheio cremoso.", image_url: "/images/cat-torta-cook.webp" },
];

export const defaultCategories: Category[] = catSeeds.map(({ key: _key, ...c }, i) => ({
  ...c,
  id: id(1, i + 1),
  visible: true,
  sort_order: i,
}));
const catId = (key: string) => defaultCategories[catSeeds.findIndex((c) => c.key === key)].id;

// ---------------------------------------------------------------------------
// Produtos (valores do folder)
// ---------------------------------------------------------------------------
interface ProdSeed {
  cat: string;
  kind?: Product["kind"];
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number | null;
  max_flavors: number;
  featured?: boolean;
  portions: { label: string; units?: number; price?: number; frozen?: number; fried?: number; max?: number }[];
  flavors: string[];
}

const prodSeeds: ProdSeed[] = [
  {
    cat: "assados", name: "Salgados Assados", slug: "salgados-assados", featured: true,
    description: "Bandeja com 20 unidades de salgados assados. Monte com os sabores que preferir.",
    image: "/images/cat-assados.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Mini hambúrguer", "Mini hot dog", "Joelhinho de queijo com presunto", "Joelhinho de frango", "Joelho de calabresa", "Esfiha de queijo", "Esfiha de carne", "Esfiha de frango"],
  },
  {
    cat: "mini-pizzas", name: "Mini Pizza", slug: "mini-pizza",
    description: "Bandeja com 20 mini pizzas assadas.",
    image: "/images/cat-mini-pizzas.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Muçarela", "Presunto", "Calabresa"],
  },
  {
    cat: "mini-quiches", name: "Mini Quiche", slug: "mini-quiche",
    description: "Bandeja com 20 mini quiches, salgadas e doces.",
    image: "/images/cat-quiches.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Queijo", "Alho-poró", "Bacalhau", "Camarão", "Carne seca", "Espinafre com queijo", "Cebola", "Queijo com goiabada", "Chocolate"],
  },
  {
    cat: "folhados", name: "Folhados", slug: "folhados",
    description: "Bandeja com 20 folhados de massa crocante.",
    image: "/images/cat-folhados.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Queijo com presunto", "Bacalhau", "Camarão", "Frango", "Ameixa com bacon"],
  },
  {
    cat: "croissants", name: "Croissant", slug: "croissant",
    description: "Bandeja com 20 mini croissants recheados.",
    image: "/images/cat-croissants.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Queijo com presunto", "Frango", "Peito de peru", "Queijo"],
  },
  {
    cat: "pastel-forno", name: "Pastel de Forno", slug: "pastel-de-forno",
    description: "Bandeja com 20 pastéis de forno.",
    image: "/images/cat-pastel-forno.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Frango", "Carne", "Camarão", "Bacalhau", "Ameixa com bacon"],
  },
  {
    cat: "fritos", kind: "frito", name: "Salgados Fritos 18g", slug: "salgados-fritos-18g", featured: true,
    description: "Salgadinhos de festa de 18g. Leve congelados para fritar em casa ou já fritinhos.",
    image: "/images/cat-fritos.webp", price: 21, max_flavors: 1,
    portions: [
      { label: "50 unidades", units: 50, frozen: 21, fried: 32, max: 2 },
      { label: "100 unidades", units: 100, frozen: 42, fried: 57, max: 5 },
    ],
    flavors: ["Coxinha", "Bolinha de queijo", "Queijo com presunto", "Queijo com alho", "Risole de carne", "Calabresa", "Quibe", "Quibe recheado", "Risole de camarão", "Coxinha de costela", "Enroladinho de salsicha", "Feijoada", "Aipim com carne", "Aipim com queijo", "Aipim com calabresa", "Coxinha de aipim"],
  },
  {
    cat: "pastel-frito", kind: "frito", name: "Pastel Frito", slug: "pastel-frito",
    description: "Pacote com 20 pastéis. Congelados para fritar em casa ou já fritos.",
    image: "/images/cat-pastel-frito.webp", price: 14, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, frozen: 14, fried: 17 }],
    flavors: ["Queijo", "Carne"],
  },
  {
    cat: "especiais", kind: "frito", name: "Salgados Especiais", slug: "salgados-especiais",
    description: "Pacote de um sabor. A quantidade de unidades varia conforme o salgado.",
    image: "/images/cat-especiais.webp", price: 40, max_flavors: 1,
    portions: [{ label: "1 pacote", frozen: 40, fried: 50 }],
    flavors: ["Bolinho de bacalhau (40 a 43 un.)", "Bolinho de feijoada (40 a 45 un.)", "Empanado de camarão (20 a 22 un.)"],
  },
  {
    cat: "docinhos", name: "Bandeja de Docinhos", slug: "bandeja-de-docinhos", featured: true,
    description: "Bandeja com 20 docinhos de festa.",
    image: "/images/cat-docinhos.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Brigadeiro", "Cajuzinho", "Beijinho", "Moranguinho"],
  },
  {
    cat: "brigadeiro", name: "Brigadeiro", slug: "brigadeiro",
    description: "Bandeja com 20 brigadeiros tradicionais.",
    image: "/images/cat-brigadeiro.webp", price: 21, max_flavors: 1,
    portions: [{ label: "20 unidades", units: 20, price: 21 }],
    flavors: ["Brigadeiro tradicional"],
  },
  {
    cat: "bolos-festa", kind: "bolo_festa", name: "Bolo de Festa", slug: "bolo-de-festa",
    description: "Bolo personalizado para aniversários, chás e comemorações. Conte pra gente o tema e, se tiver, envie uma foto de inspiração.",
    image: "/images/cat-bolos-festa.webp", price: null, max_flavors: 1,
    portions: [], flavors: [],
  },
];

export const defaultProducts: Product[] = prodSeeds.map((p, i) => {
  const pid = id(2, i + 1);
  const portions: Portion[] = p.portions.map((po, j) => ({
    id: id(3, (i + 1) * 100 + j + 1),
    product_id: pid,
    label: po.label,
    units: po.units ?? null,
    price: po.price ?? null,
    price_frozen: po.frozen ?? null,
    price_fried: po.fried ?? null,
    // Regra: 1 sabor a cada 20 unidades (20 un = 1, 50 un = 2, 100 un = 5)
    max_flavors: po.max ?? (po.units ? Math.max(1, Math.floor(po.units / 20)) : null),
    sort_order: j,
  }));
  const flavors: Flavor[] = p.flavors.map((name, j) => ({
    id: id(4, (i + 1) * 100 + j + 1),
    product_id: pid,
    name,
    sold_out: false,
    sort_order: j,
  }));
  return {
    id: pid,
    category_id: catId(p.cat),
    kind: p.kind ?? "comum",
    name: p.name,
    slug: p.slug,
    description: p.description,
    images: [p.image],
    price: p.price,
    max_flavors: p.max_flavors,
    available: true,
    visible: true,
    featured: p.featured ?? false,
    sort_order: i,
    portions,
    flavors,
  };
});

// ---------------------------------------------------------------------------
// Promoções de exemplo (preços calculados a partir do folder)
// ---------------------------------------------------------------------------
const promo = (
  n: number,
  data: Omit<Promotion, "id" | "items" | "sort_order" | "active" | "starts_at"> & { items: string[] },
): Promotion => {
  const pid = id(5, n);
  const items: PromotionItem[] = data.items.map((description, j) => ({
    id: id(6, n * 100 + j + 1),
    promotion_id: pid,
    product_id: null,
    description,
    quantity: 1,
    sort_order: j,
  }));
  return { ...data, id: pid, items, active: true, starts_at: null, sort_order: n };
};

export const defaultPromotions: Promotion[] = [
  promo(1, {
    title: "Combo Festa Completa",
    description: "100 salgados fritos de 18g (já fritos) + 1 bandeja com 20 docinhos.",
    images: ["/images/promo-fritos.webp"],
    badge: "Mais pedido",
    old_price: 78,
    price: 72,
    ends_at: null,
    items: ["100 salgados fritos 18g (fritos)", "Bandeja com 20 docinhos"],
  }),
  promo(2, {
    title: "Kit Assados",
    description: "2 bandejas de salgados assados + 1 bandeja de mini pizzas. 60 unidades no total.",
    images: ["/images/cat-assados.webp"],
    badge: "Combo",
    old_price: 63,
    price: 58,
    ends_at: null,
    items: ["2 bandejas de salgados assados (40 un.)", "1 bandeja de mini pizzas (20 un.)"],
  }),
  promo(3, {
    title: "Docinhos em Dobro",
    description: "2 bandejas com 20 docinhos cada. Brigadeiro, beijinho, cajuzinho e moranguinho.",
    images: ["/images/promo-docinhos.webp"],
    badge: "Promoção",
    old_price: 42,
    price: 38,
    ends_at: null,
    items: ["2 bandejas de docinhos (40 un.)"],
  }),
];

// ---------------------------------------------------------------------------
// Depoimentos de EXEMPLO — troque pelos depoimentos reais no painel.
// ---------------------------------------------------------------------------
export const defaultTestimonials: Testimonial[] = [
  { name: "Juliana M.", text: "Os salgados chegaram quentinhos e sequinhos. Todo mundo na festa perguntou de onde eram!", stars: 5 },
  { name: "Ricardo S.", text: "Encomendei o bolo de aniversário da minha filha e ficou igualzinho à foto que mandei. Delicioso!", stars: 5 },
  { name: "Patrícia A.", text: "Compro os congelados toda semana. Praticidade e sabor de salgado feito em casa.", stars: 5 },
  { name: "Fernanda L.", text: "Atendimento atencioso pelo WhatsApp e pontualidade na entrega. Recomendo demais.", stars: 5 },
  { name: "Camila R.", text: "Fiz o pedido pelo site em poucos minutos. Os docinhos estavam lindos e muito saborosos!", stars: 5 },
  { name: "Marcos T.", text: "Pedi os salgados congelados para o aniversário do meu filho. Fritei na hora e ficaram perfeitos.", stars: 5 },
].map((t, i) => ({ ...t, id: id(7, i + 1), visible: true, sort_order: i }));
