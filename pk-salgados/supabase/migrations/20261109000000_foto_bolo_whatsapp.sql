-- =============================================================================
-- Foto do bolo: o cliente pode enviar a foto direto no WhatsApp (sem passar pelo site).
-- settings.cake_photo_mode:
--   'whatsapp' (padrão) → a foto fica só no celular do cliente; o site não aceita upload.
--   'link'              → a foto vai para o Storage e segue como link (comportamento antigo).
-- =============================================================================

alter table public.settings
  add column cake_photo_mode text not null default 'whatsapp'
  check (cake_photo_mode in ('whatsapp', 'link'));

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
  -- Modo "whatsapp": a foto não passa pelo site (o cliente envia no WhatsApp); ignora qualquer caminho.
  if s.cake_photo_mode = 'whatsapp' then
    v_path := null;
  end if;
  if s.cake_photo_mode = 'link' and v_has and (v_path is null or v_path !~ '^pedidos/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
    raise exception 'Envie a foto do modelo de inspiração.' using errcode = 'P0001';
  end if;
  if s.cake_photo_mode = 'link' and v_has and not exists (select 1 from storage.objects where bucket_id = 'inspiration-photos' and name = v_path) then
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

revoke all on function public.create_cake_order(jsonb, text) from public;
grant execute on function public.create_cake_order(jsonb, text) to anon, authenticated;

-- Upload de fotos de inspiração só é aceito no modo 'link'.
drop policy if exists "inspiracao: cliente envia" on storage.objects;
create policy "inspiracao: cliente envia" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'inspiration-photos'
    and name ~ '^pedidos/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (select 1 from public.settings where id = 1 and cake_photo_mode = 'link')
  );
