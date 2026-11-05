-- =============================================================================
-- Luiz Vieira Negócios Imobiliários — schema inicial
-- Tabelas, funções de permissão, RLS e storage.
-- =============================================================================

create extension if not exists "pg_trgm" with schema extensions;
create extension if not exists "unaccent" with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'corretor');
create type public.property_status as enum ('draft', 'published', 'archived');
create type public.business_type as enum ('venda', 'aluguel', 'ambos');
create type public.property_type as enum (
  'casa', 'casa_condominio', 'apartamento', 'cobertura',
  'terreno', 'sala_comercial', 'loja', 'outros'
);
create type public.lead_kind as enum ('comprar', 'vender');
create type public.lead_status as enum ('novo', 'em_atendimento', 'concluido');

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users). O papel NUNCA é definido pelo próprio usuário.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role public.app_role,                 -- null = sem acesso ao painel
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cria o perfil automaticamente. O papel só vem de raw_app_meta_data, que
-- apenas a service role (servidor) consegue definir.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  begin
    v_role := (new.raw_app_meta_data ->> 'role')::public.app_role;
  exception when others then
    v_role := null;
  end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funções de permissão (security definer para evitar recursão de RLS)
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'corretor'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

-- Impede que um usuário altere o próprio papel/ativação (somente admin)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Somente administradores podem alterar papéis de acesso.';
  end if;
  if new.id = auth.uid() and (new.role is distinct from old.role or new.active is distinct from old.active) then
    raise exception 'Você não pode alterar o seu próprio nível de acesso.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- Imóveis
-- -----------------------------------------------------------------------------
create sequence public.property_code_seq start 1001;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('LV' || nextval('public.property_code_seq')::text),
  slug text not null unique,
  status public.property_status not null default 'draft',
  business public.business_type not null default 'venda',
  type public.property_type not null default 'apartamento',
  title text not null default 'Novo imóvel',
  neighborhood text,
  address text,
  show_address boolean not null default false,
  -- Endereço exibido publicamente: somente quando o corretor permite
  public_address text generated always as (case when show_address then address end) stored,
  city text not null default 'Rio de Janeiro',
  state text not null default 'RJ',
  sale_price numeric(14, 2) check (sale_price is null or sale_price >= 0),
  rent_price numeric(14, 2) check (rent_price is null or rent_price >= 0),
  condo_fee numeric(12, 2) check (condo_fee is null or condo_fee >= 0),
  iptu numeric(12, 2) check (iptu is null or iptu >= 0),
  total_area numeric(10, 2) check (total_area is null or total_area >= 0),
  built_area numeric(10, 2) check (built_area is null or built_area >= 0),
  bedrooms smallint check (bedrooms is null or bedrooms between 0 and 50),
  suites smallint check (suites is null or suites between 0 and 50),
  bathrooms smallint check (bathrooms is null or bathrooms between 0 and 50),
  parking_spots smallint check (parking_spots is null or parking_spots between 0 and 50),
  description text,
  features text[] not null default '{}',
  condo_features text[] not null default '{}',
  video_url text,
  wizard_step smallint not null default 1,
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_status_idx on public.properties (status);
create index properties_neighborhood_idx on public.properties (neighborhood);
create index properties_published_at_idx on public.properties (published_at desc);
create index properties_title_trgm_idx on public.properties using gin (title extensions.gin_trgm_ops);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,
  url text not null,
  width integer,
  height integer,
  alt text,
  position integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index property_images_property_idx on public.property_images (property_id, position);
create unique index property_images_one_cover on public.property_images (property_id) where is_cover;

-- Catálogo de características (opções selecionáveis no cadastro)
create table public.features_catalog (
  id serial primary key,
  label text not null unique,
  scope text not null default 'imovel' check (scope in ('imovel', 'condominio')),
  position integer not null default 0
);

insert into public.features_catalog (label, scope, position) values
  ('Varanda', 'imovel', 1),
  ('Varanda gourmet', 'imovel', 2),
  ('Churrasqueira', 'imovel', 3),
  ('Ar-condicionado', 'imovel', 4),
  ('Mobiliado', 'imovel', 5),
  ('Vista para o mar', 'imovel', 6),
  ('Jardim', 'imovel', 7),
  ('Piscina', 'condominio', 1),
  ('Academia', 'condominio', 2),
  ('Elevador', 'condominio', 3),
  ('Portaria 24 horas', 'condominio', 4),
  ('Segurança', 'condominio', 5),
  ('Área de lazer', 'condominio', 6),
  ('Playground', 'condominio', 7);

-- Slug amigável: titulo-bairro-codigo
create or replace function public.slugify(v text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(v, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.properties_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.code := upper(trim(new.code));
  new.slug := public.slugify(concat_ws(' ', new.title, new.neighborhood, new.code));
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger properties_before_write
  before insert or update on public.properties
  for each row execute function public.properties_before_write();

-- -----------------------------------------------------------------------------
-- Depoimentos
-- -----------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  region text,
  content text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Leads (privados — nunca legíveis publicamente)
-- -----------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  kind public.lead_kind not null,
  status public.lead_status not null default 'novo',
  full_name text not null check (char_length(full_name) between 2 and 150),
  email text not null check (char_length(email) between 5 and 200),
  phone text not null check (char_length(phone) between 8 and 30),
  age smallint check (age is null or age between 16 and 120),
  neighborhood text check (neighborhood is null or char_length(neighborhood) <= 120),
  property_type text check (property_type is null or char_length(property_type) <= 60),
  price_range text check (price_range is null or char_length(price_range) <= 60),
  bedrooms text check (bedrooms is null or char_length(bedrooms) <= 20),
  desired_value numeric(14, 2) check (desired_value is null or desired_value >= 0),
  approx_area numeric(10, 2) check (approx_area is null or approx_area >= 0),
  message text check (message is null or char_length(message) <= 3000),
  property_id uuid references public.properties (id) on delete set null,
  consent boolean not null check (consent),
  consent_at timestamptz not null default now(),
  source text default 'site' check (source is null or char_length(source) <= 60),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);

-- -----------------------------------------------------------------------------
-- Configurações do site (linha única, id = 1)
-- O imóvel em destaque é uma coluna única => só existe UM destaque por vez.
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  featured_property_id uuid references public.properties (id) on delete set null,
  whatsapp_number text not null default '',
  whatsapp_message text not null default 'Olá! Acessei o site Luiz Vieira Negócios Imobiliários e gostaria de obter mais informações.',
  contact_email text not null default '',
  contact_phone text not null default '',
  creci text not null default '',
  address text not null default 'Recreio dos Bandeirantes · Barra da Tijuca · Angra dos Reis — RJ',
  instagram_url text not null default '',
  hero_title text not null default 'Encontramos o imóvel que combina com a sua próxima conquista.',
  hero_subtitle text not null default 'Uma curadoria exclusiva de imóveis na Barra da Tijuca, no Recreio dos Bandeirantes e em Angra dos Reis. Atendimento personalizado para quem busca mais do que um endereço.',
  hero_image_url text not null default '',
  about_title text not null default 'Mais do que intermediar negócios, acreditamos em entender pessoas.',
  about_text text not null default E'Mais do que intermediar negócios, acreditamos em entender pessoas, objetivos e momentos de vida.\n\nAtuamos com dedicação na seleção de imóveis na Barra da Tijuca, Recreio dos Bandeirantes, Angra dos Reis e regiões próximas, oferecendo um atendimento personalizado, transparente e direcionado às necessidades de cada cliente.\n\nNosso compromisso é transformar a busca por um imóvel em uma experiência segura, simples e satisfatória.',
  about_image_url text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.site_settings (id) values (1);

-- Somente admin altera contato/WhatsApp; corretor altera conteúdo e destaque.
create or replace function public.protect_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.whatsapp_number is distinct from old.whatsapp_number
       or new.whatsapp_message is distinct from old.whatsapp_message
       or new.contact_email is distinct from old.contact_email
       or new.contact_phone is distinct from old.contact_phone
       or new.creci is distinct from old.creci then
      raise exception 'Somente administradores podem alterar dados de contato e WhatsApp.';
    end if;
  end if;
  if new.featured_property_id is not null and new.featured_property_id is distinct from old.featured_property_id then
    if not exists (select 1 from public.properties p where p.id = new.featured_property_id and p.status = 'published') then
      raise exception 'Somente imóveis publicados podem ser definidos como destaque.';
    end if;
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create trigger site_settings_protect
  before update on public.site_settings
  for each row execute function public.protect_settings();

-- Se o imóvel em destaque deixar de estar publicado, remove o destaque.
create or replace function public.clear_featured_if_unpublished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'published' then
    update public.site_settings set featured_property_id = null where featured_property_id = new.id;
  end if;
  return new;
end;
$$;

create trigger properties_clear_featured
  after update of status on public.properties
  for each row execute function public.clear_featured_if_unpublished();

-- updated_at genérico
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.features_catalog enable row level security;
alter table public.testimonials enable row level security;
alter table public.leads enable row level security;
alter table public.site_settings enable row level security;

-- profiles
create policy "profiles: próprio perfil ou admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: atualizar próprio nome ou admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- properties
create policy "properties: público vê publicados" on public.properties
  for select to anon, authenticated using (status = 'published' or public.is_staff());
create policy "properties: equipe cria" on public.properties
  for insert to authenticated with check (public.is_staff());
create policy "properties: equipe edita" on public.properties
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "properties: admin exclui" on public.properties
  for delete to authenticated using (public.is_admin());

-- property_images
create policy "images: público vê de imóveis publicados" on public.property_images
  for select to anon, authenticated using (
    public.is_staff() or exists (
      select 1 from public.properties p where p.id = property_id and p.status = 'published'
    )
  );
create policy "images: equipe gerencia (insert)" on public.property_images
  for insert to authenticated with check (public.is_staff());
create policy "images: equipe gerencia (update)" on public.property_images
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "images: equipe gerencia (delete)" on public.property_images
  for delete to authenticated using (public.is_staff());

-- features_catalog
create policy "features: leitura" on public.features_catalog
  for select to anon, authenticated using (true);
create policy "features: admin gerencia" on public.features_catalog
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- testimonials
create policy "testimonials: público vê publicados" on public.testimonials
  for select to anon, authenticated using (published or public.is_staff());
create policy "testimonials: admin insere" on public.testimonials
  for insert to authenticated with check (public.is_admin());
create policy "testimonials: admin edita" on public.testimonials
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "testimonials: admin exclui" on public.testimonials
  for delete to authenticated using (public.is_admin());

-- leads: qualquer visitante pode ENVIAR, ninguém além da equipe pode LER.
create policy "leads: visitante envia" on public.leads
  for insert to anon, authenticated with check (
    consent and status = 'novo' and internal_notes is null
  );
create policy "leads: equipe lê" on public.leads
  for select to authenticated using (public.is_staff());
create policy "leads: equipe atualiza" on public.leads
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "leads: equipe exclui" on public.leads
  for delete to authenticated using (public.is_staff());

-- site_settings
create policy "settings: leitura pública" on public.site_settings
  for select to anon, authenticated using (true);
create policy "settings: equipe atualiza" on public.site_settings
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Privilégios de coluna: visitantes não leem colunas internas
revoke all on public.leads from anon;
grant insert (kind, full_name, email, phone, age, neighborhood, property_type, price_range,
  bedrooms, desired_value, approx_area, message, property_id, consent, source)
  on public.leads to anon;

revoke all on public.properties from anon;
grant select (id, code, slug, status, business, type, title, neighborhood, city, state,
  sale_price, rent_price, condo_fee, iptu, total_area, built_area, bedrooms, suites, bathrooms,
  parking_spots, description, features, condo_features, video_url, published_at, updated_at,
  show_address, public_address)
  on public.properties to anon;

-- -----------------------------------------------------------------------------
-- Storage: bucket público para leitura, escrita apenas pela equipe
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media', 'property-media', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "media: leitura pública" on storage.objects
  for select to anon, authenticated using (bucket_id = 'property-media');
create policy "media: equipe envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'property-media' and public.is_staff());
create policy "media: equipe atualiza" on storage.objects
  for update to authenticated using (bucket_id = 'property-media' and public.is_staff());
create policy "media: equipe exclui" on storage.objects
  for delete to authenticated using (bucket_id = 'property-media' and public.is_staff());
