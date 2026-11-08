-- =============================================================================
-- PK Salgados e Doces — estrutura do banco de dados
-- Tabelas, permissões (RLS), funções de pedido, tempo real e armazenamento.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.category_section as enum ('salgado', 'doce');
create type public.product_kind as enum ('comum', 'frito', 'bolo_festa');
create type public.order_status as enum ('novo', 'em_preparo', 'pronto', 'entregue', 'cancelado');
create type public.order_channel as enum ('site', 'whatsapp');
create type public.fulfillment_type as enum ('retirada', 'entrega');
create type public.payment_method as enum ('pix', 'dinheiro', 'cartao');
create type public.fry_option as enum ('congelado', 'frito');

-- Numeração única de pedidos (pedidos comuns e encomendas de bolo).
create sequence public.order_number_seq start 1001;

-- -----------------------------------------------------------------------------
-- Donas (quem pode entrar no painel)
-- -----------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Retorna true se quem está logado é uma das donas.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- Configurações da loja (uma única linha, id = 1)
-- -----------------------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  whatsapp text not null default '',            -- só dígitos, com 55 + DDD
  phone_secondary text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  address text not null default '',
  maps_url text not null default '',
  opening_hours text not null default '',
  delivery_fee numeric(10,2) not null default 0,
  delivery_area text not null default '',
  delivery_enabled boolean not null default true,
  min_cake_notice_days int not null default 3 check (min_cake_notice_days >= 0),
  min_order_notice_hours int not null default 24 check (min_order_notice_hours >= 0),
  cake_sizes text[] not null default '{}',
  cake_doughs text[] not null default '{}',
  cake_fillings text[] not null default '{}',
  store_closed boolean not null default false,
  store_closed_message text not null default 'Hoje não estamos aceitando pedidos. Voltamos em breve!',
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Textos e imagens do site, por seção.
-- "data" = publicado (o que o cliente vê). "draft" = rascunho para prévia.
-- -----------------------------------------------------------------------------
create table public.site_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  draft jsonb,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Cardápio
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  section public.category_section not null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text not null default '',
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index categories_section_idx on public.categories (section, sort_order);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  kind public.product_kind not null default 'comum',
  name text not null,
  slug text not null unique,
  description text not null default '',
  images text[] not null default '{}',
  price numeric(10,2),                       -- preço de referência ("a partir de")
  max_flavors int not null default 1 check (max_flavors >= 1),  -- por porção
  available boolean not null default true,   -- false = indisponível (aparece, mas não vende)
  visible boolean not null default true,     -- false = oculto do site
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id, sort_order);

create table public.product_portions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,                       -- ex.: "20 unidades"
  units int,                                 -- ex.: 20
  price numeric(10,2),                       -- produtos comuns
  price_frozen numeric(10,2),                -- salgados fritos: congelado
  price_fried numeric(10,2),                 -- salgados fritos: frito
  max_flavors int check (max_flavors >= 1),  -- limite de sabores desta porção (vazio = usa o do produto)
  sort_order int not null default 0
);
create index product_portions_product_idx on public.product_portions (product_id, sort_order);

create table public.product_flavors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sold_out boolean not null default false,
  sort_order int not null default 0
);
create index product_flavors_product_idx on public.product_flavors (product_id, sort_order);

-- -----------------------------------------------------------------------------
-- Promoções e combos
-- -----------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  images text[] not null default '{}',
  badge text not null default '',             -- "Mais pedido", "Promoção", "Combo"...
  old_price numeric(10,2),
  price numeric(10,2) not null check (price >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.promotion_items (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  description text not null,                  -- ex.: "50 salgados fritos"
  quantity int not null default 1,
  sort_order int not null default 0
);

-- -----------------------------------------------------------------------------
-- Depoimentos
-- -----------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  stars int not null default 5 check (stars between 1 and 5),
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Pedidos (sacola) e encomendas de bolo
-- -----------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('public.order_number_seq'),
  channel public.order_channel not null default 'site',
  status public.order_status not null default 'novo',
  customer_name text not null,
  phone text not null,
  address text not null default '',
  fulfillment public.fulfillment_type not null,
  payment public.payment_method not null,
  desired_at timestamptz,
  notes text not null default '',
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  fingerprint text,                           -- hash do IP (anti-spam), nunca o IP em si
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  promotion_id uuid references public.promotions (id) on delete set null,
  name text not null,
  portion_label text not null default '',
  fry_option public.fry_option,
  flavors text[] not null default '{}',
  quantity int not null check (quantity between 1 and 99),
  unit_price numeric(10,2) not null,
  total numeric(10,2) not null,
  notes text not null default ''
);
create index order_items_order_idx on public.order_items (order_id);

create table public.cake_orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('public.order_number_seq'),
  status public.order_status not null default 'novo',
  product_id uuid references public.products (id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  desired_at timestamptz not null,
  size text not null default '',
  dough text not null default '',
  filling text not null default '',
  theme_notes text not null default '',
  has_inspiration boolean not null default false,
  inspiration_path text,                      -- caminho no bucket inspiration-photos
  fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cake_orders_created_idx on public.cake_orders (created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger trg_cake_orders_touch before update on public.cake_orders
  for each row execute function public.touch_updated_at();
create trigger trg_settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger trg_site_content_touch before update on public.site_content
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Row Level Security
-- Público: só LÊ o conteúdo visível. Pedidos entram apenas pelas funções
-- create_order / create_cake_order (que recalculam preços no servidor).
-- Donas logadas: leem e editam tudo.
-- =============================================================================
alter table public.admin_users enable row level security;
alter table public.settings enable row level security;
alter table public.site_content enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_portions enable row level security;
alter table public.product_flavors enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cake_orders enable row level security;

-- admin_users: cada dona vê o próprio registro (para o painel saber quem é dona).
create policy "admin_users: ler o proprio" on public.admin_users
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Leitura pública
create policy "settings: leitura publica" on public.settings for select using (true);
create policy "site_content: leitura publica" on public.site_content for select using (true);
create policy "categories: leitura publica" on public.categories for select
  using (visible or public.is_admin());
create policy "products: leitura publica" on public.products for select
  using (visible or public.is_admin());
create policy "portions: leitura publica" on public.product_portions for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.visible or public.is_admin())));
create policy "flavors: leitura publica" on public.product_flavors for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.visible or public.is_admin())));
create policy "promotions: leitura publica" on public.promotions for select
  using (
    public.is_admin() or (
      active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
    )
  );
create policy "promotion_items: leitura publica" on public.promotion_items for select
  using (exists (select 1 from public.promotions p where p.id = promotion_id));
create policy "testimonials: leitura publica" on public.testimonials for select
  using (visible or public.is_admin());

-- Escrita somente das donas
do $$
declare t text;
begin
  foreach t in array array[
    'settings','site_content','categories','products','product_portions','product_flavors',
    'promotions','promotion_items','testimonials'
  ] loop
    execute format('create policy "%1$s: donas inserem" on public.%1$I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "%1$s: donas editam" on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "%1$s: donas excluem" on public.%1$I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Pedidos: somente as donas veem, alteram e excluem.
create policy "orders: donas leem" on public.orders for select to authenticated using (public.is_admin());
create policy "orders: donas editam" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orders: donas excluem" on public.orders for delete to authenticated using (public.is_admin());
create policy "order_items: donas leem" on public.order_items for select to authenticated using (public.is_admin());
create policy "order_items: donas excluem" on public.order_items for delete to authenticated using (public.is_admin());
create policy "cake_orders: donas leem" on public.cake_orders for select to authenticated using (public.is_admin());
create policy "cake_orders: donas editam" on public.cake_orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cake_orders: donas excluem" on public.cake_orders for delete to authenticated using (public.is_admin());

-- =============================================================================
-- Funções públicas de pedido
-- Rodam com privilégio do dono do banco (security definer), validam tudo e
-- RECALCULAM os preços a partir do cardápio — o navegador não define valores.
-- =============================================================================

-- Anti-spam: limita pedidos pelo mesmo telefone (5 em 30 min) e pela mesma origem
-- (20 em 30 min — folgado, porque operadoras de celular compartilham o mesmo IP).
create or replace function public._check_rate_limit(p_phone text, p_fingerprint text)
returns void language plpgsql security definer set search_path = public as $$
declare by_phone int; by_origin int;
begin
  select count(*) into by_phone from (
    select 1 from public.orders where phone = p_phone and created_at > now() - interval '30 minutes'
    union all
    select 1 from public.cake_orders where phone = p_phone and created_at > now() - interval '30 minutes'
  ) x;
  select count(*) into by_origin from (
    select 1 from public.orders where p_fingerprint is not null and fingerprint = p_fingerprint and created_at > now() - interval '30 minutes'
    union all
    select 1 from public.cake_orders where p_fingerprint is not null and fingerprint = p_fingerprint and created_at > now() - interval '30 minutes'
  ) y;
  if by_phone >= 5 or by_origin >= 20 then
    raise exception 'Muitos pedidos em pouco tempo. Aguarde alguns minutos ou fale com a gente no WhatsApp.'
      using errcode = 'P0001';
  end if;
end;
$$;

-- Cria um pedido da sacola. Retorna { id, number, total }.
-- p_order: { channel, customer_name, phone, address, fulfillment, payment, desired_at, notes,
--            items: [ { product_id?, promotion_id?, portion_id?, fry_option?, flavors[], quantity, notes } ] }
create or replace function public.create_order(p_order jsonb, p_fingerprint text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.settings;
  v_order_id uuid;
  v_number int;
  v_item jsonb;
  v_product public.products;
  v_portion public.product_portions;
  v_promo public.promotions;
  v_flavors text[];
  v_qty int;
  v_unit numeric(10,2);
  v_fry public.fry_option;
  v_name text;
  v_label text;
  v_subtotal numeric(10,2) := 0;
  v_fee numeric(10,2) := 0;
  v_phone text := regexp_replace(coalesce(p_order->>'phone', ''), '\D', '', 'g');
  v_fulfillment public.fulfillment_type;
  v_desired timestamptz;
  v_invalid text;
begin
  select * into s from public.settings where id = 1;
  if s.store_closed then
    raise exception '%', s.store_closed_message using errcode = 'P0001';
  end if;

  -- Dados do cliente
  if length(trim(coalesce(p_order->>'customer_name', ''))) < 3 then
    raise exception 'Informe seu nome completo.' using errcode = 'P0001';
  end if;
  if length(v_phone) not in (10, 11) then
    raise exception 'Telefone inválido.' using errcode = 'P0001';
  end if;
  v_fulfillment := (p_order->>'fulfillment')::public.fulfillment_type;
  if v_fulfillment = 'entrega' then
    if not s.delivery_enabled then
      raise exception 'No momento não estamos fazendo entregas. Escolha retirada.' using errcode = 'P0001';
    end if;
    if length(trim(coalesce(p_order->>'address', ''))) < 8 then
      raise exception 'Informe o endereço completo para entrega.' using errcode = 'P0001';
    end if;
    v_fee := s.delivery_fee;
  end if;
  v_desired := nullif(p_order->>'desired_at', '')::timestamptz;
  if v_desired is null then
    raise exception 'Informe a data e o horário desejados.' using errcode = 'P0001';
  end if;
  if v_desired < now() + make_interval(hours => s.min_order_notice_hours) - interval '5 minutes' then
    raise exception 'Escolha uma data com pelo menos % horas de antecedência.', s.min_order_notice_hours using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_order->'items') <> 'array' or jsonb_array_length(p_order->'items') = 0 then
    raise exception 'Sua sacola está vazia.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_order->'items') > 40 then
    raise exception 'Pedido com itens demais.' using errcode = 'P0001';
  end if;

  perform public._check_rate_limit(v_phone, p_fingerprint);

  insert into public.orders (channel, customer_name, phone, address, fulfillment, payment,
                             desired_at, notes, fingerprint)
  values (
    coalesce((p_order->>'channel')::public.order_channel, 'site'),
    left(trim(p_order->>'customer_name'), 120),
    v_phone,
    left(trim(coalesce(p_order->>'address', '')), 300),
    v_fulfillment,
    (p_order->>'payment')::public.payment_method,
    v_desired,
    left(trim(coalesce(p_order->>'notes', '')), 1000),
    p_fingerprint
  )
  returning id, number into v_order_id, v_number;

  for v_item in select * from jsonb_array_elements(p_order->'items') loop
    v_qty := coalesce((v_item->>'quantity')::int, 1);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'Quantidade inválida.' using errcode = 'P0001';
    end if;
    v_fry := null; v_label := ''; v_flavors := '{}';

    if v_item ? 'promotion_id' and nullif(v_item->>'promotion_id', '') is not null then
      -- Item de promoção/combo
      select * into v_promo from public.promotions
        where id = (v_item->>'promotion_id')::uuid and active
          and (starts_at is null or starts_at <= now())
          and (ends_at is null or ends_at > now());
      if not found then
        raise exception 'Uma das promoções da sua sacola não está mais disponível.' using errcode = 'P0001';
      end if;
      v_name := v_promo.title;
      v_unit := v_promo.price;
      insert into public.order_items (order_id, promotion_id, name, quantity, unit_price, total, notes)
      values (v_order_id, v_promo.id, v_name, v_qty, v_unit, v_unit * v_qty,
              left(coalesce(v_item->>'notes', ''), 500));
    else
      -- Item do cardápio
      select * into v_product from public.products
        where id = (v_item->>'product_id')::uuid and visible and available;
      if not found then
        raise exception 'Um dos produtos da sua sacola não está mais disponível.' using errcode = 'P0001';
      end if;
      if v_product.kind = 'bolo_festa' then
        raise exception 'Bolo de festa é feito por encomenda.' using errcode = 'P0001';
      end if;

      select * into v_portion from public.product_portions
        where id = (v_item->>'portion_id')::uuid and product_id = v_product.id;
      if not found then
        raise exception 'Escolha a porção de "%".', v_product.name using errcode = 'P0001';
      end if;
      v_label := v_portion.label;

      if v_product.kind = 'frito' then
        v_fry := (v_item->>'fry_option')::public.fry_option;
        if v_fry is null then
          raise exception 'Escolha congelado ou frito para "%".', v_product.name using errcode = 'P0001';
        end if;
        v_unit := case when v_fry = 'frito' then v_portion.price_fried else v_portion.price_frozen end;
      else
        v_unit := v_portion.price;
      end if;
      if v_unit is null then
        raise exception 'Preço não cadastrado para "%".', v_product.name using errcode = 'P0001';
      end if;

      -- Sabores: precisam existir, não estar esgotados e respeitar o limite.
      select coalesce(array_agg(distinct f), '{}') into v_flavors
        from jsonb_array_elements_text(coalesce(v_item->'flavors', '[]'::jsonb)) f;
      if cardinality(v_flavors) = 0 and exists (select 1 from public.product_flavors where product_id = v_product.id) then
        raise exception 'Escolha pelo menos um sabor de "%".', v_product.name using errcode = 'P0001';
      end if;
      if cardinality(v_flavors) > coalesce(v_portion.max_flavors, v_product.max_flavors) * v_qty then
        raise exception 'Muitos sabores escolhidos em "%".', v_product.name using errcode = 'P0001';
      end if;
      select f into v_invalid from unnest(v_flavors) f
        where not exists (select 1 from public.product_flavors pf
                          where pf.product_id = v_product.id and pf.name = f and not pf.sold_out)
        limit 1;
      if v_invalid is not null then
        raise exception 'O sabor "%" não está disponível.', v_invalid using errcode = 'P0001';
      end if;

      insert into public.order_items (order_id, product_id, name, portion_label, fry_option, flavors,
                                      quantity, unit_price, total, notes)
      values (v_order_id, v_product.id, v_product.name, v_label, v_fry, v_flavors,
              v_qty, v_unit, v_unit * v_qty, left(coalesce(v_item->>'notes', ''), 500));
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  update public.orders
     set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
   where id = v_order_id;

  return jsonb_build_object('id', v_order_id, 'number', v_number, 'total', v_subtotal + v_fee,
                            'subtotal', v_subtotal, 'delivery_fee', v_fee);
end;
$$;

-- Cria uma encomenda de bolo de festa. Retorna { id, number }.
create or replace function public.create_cake_order(p_order jsonb, p_fingerprint text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.settings;
  v_phone text := regexp_replace(coalesce(p_order->>'phone', ''), '\D', '', 'g');
  v_desired timestamptz := nullif(p_order->>'desired_at', '')::timestamptz;
  v_has boolean := coalesce((p_order->>'has_inspiration')::boolean, false);
  v_path text := nullif(p_order->>'inspiration_path', '');
  v_id uuid;
  v_number int;
begin
  select * into s from public.settings where id = 1;
  if s.store_closed then
    raise exception '%', s.store_closed_message using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_order->>'customer_name', ''))) < 3 then
    raise exception 'Informe seu nome completo.' using errcode = 'P0001';
  end if;
  if length(v_phone) not in (10, 11) then
    raise exception 'Telefone inválido.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_order->>'address', ''))) < 8 then
    raise exception 'Informe o endereço completo.' using errcode = 'P0001';
  end if;
  if v_desired is null then
    raise exception 'Informe a data e o horário desejados.' using errcode = 'P0001';
  end if;
  if v_desired::date < (now() at time zone 'America/Sao_Paulo')::date + s.min_cake_notice_days then
    raise exception 'Bolos de festa precisam de pelo menos % dias de antecedência.', s.min_cake_notice_days
      using errcode = 'P0001';
  end if;
  if v_has and (v_path is null or v_path !~ '^pedidos/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
    raise exception 'Envie a foto do modelo de inspiração.' using errcode = 'P0001';
  end if;
  if v_has and not exists (select 1 from storage.objects where bucket_id = 'inspiration-photos' and name = v_path) then
    raise exception 'A foto de inspiração não foi encontrada. Tente enviar novamente.' using errcode = 'P0001';
  end if;

  perform public._check_rate_limit(v_phone, p_fingerprint);

  insert into public.cake_orders (product_id, customer_name, phone, address, desired_at, size, dough,
                                  filling, theme_notes, has_inspiration, inspiration_path, fingerprint)
  values (
    nullif(p_order->>'product_id', '')::uuid,
    left(trim(p_order->>'customer_name'), 120),
    v_phone,
    left(trim(p_order->>'address'), 300),
    v_desired,
    left(coalesce(p_order->>'size', ''), 120),
    left(coalesce(p_order->>'dough', ''), 120),
    left(coalesce(p_order->>'filling', ''), 120),
    left(trim(coalesce(p_order->>'theme_notes', '')), 1500),
    v_has,
    case when v_has then v_path end,
    p_fingerprint
  )
  returning id, number into v_id, v_number;

  return jsonb_build_object('id', v_id, 'number', v_number);
end;
$$;

-- Permissões das funções
revoke all on function public._check_rate_limit(text, text) from public, anon, authenticated;
revoke all on function public.create_order(jsonb, text) from public;
revoke all on function public.create_cake_order(jsonb, text) from public;
grant execute on function public.create_order(jsonb, text) to anon, authenticated;
grant execute on function public.create_cake_order(jsonb, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- =============================================================================
-- Tempo real: o painel recebe pedidos novos na hora.
-- =============================================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.cake_orders;

-- =============================================================================
-- Armazenamento de imagens
--  site-images: fotos do site (público para ver; só donas enviam/apagam)
--  inspiration-photos: fotos de inspiração dos bolos. O cliente só ENVIA
--  (sem listar, trocar ou apagar). O nome do arquivo é aleatório (UUID),
--  então o link só é conhecido pela loja.
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-images', 'site-images', true, 8 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']),
  ('inspiration-photos', 'inspiration-photos', true, 10 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "site-images: donas enviam" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images' and public.is_admin());
create policy "site-images: donas editam" on storage.objects for update to authenticated
  using (bucket_id = 'site-images' and public.is_admin());
create policy "site-images: donas apagam" on storage.objects for delete to authenticated
  using (bucket_id = 'site-images' and public.is_admin());
create policy "site-images: donas listam" on storage.objects for select to authenticated
  using (bucket_id = 'site-images' and public.is_admin());

create policy "inspiracao: cliente envia" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'inspiration-photos'
    and name ~ '^pedidos/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  );
create policy "inspiracao: donas veem" on storage.objects for select to authenticated
  using (bucket_id = 'inspiration-photos' and public.is_admin());
create policy "inspiracao: donas apagam" on storage.objects for delete to authenticated
  using (bucket_id = 'inspiration-photos' and public.is_admin());
