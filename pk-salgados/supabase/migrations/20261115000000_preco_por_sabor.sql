-- =============================================================================
-- Preço por sabor (ex.: pastel frito de feira: cada sabor tem um valor,
-- vendido por unidade).
-- =============================================================================

alter table public.products
  add column price_per_flavor boolean not null default false;

alter table public.product_flavors
  add column price numeric(10,2) check (price is null or price >= 0);

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

  -- "Só WhatsApp": o botão de pedido pelo site está desligado no painel.
  if coalesce(p_order->>'channel', 'site') = 'site' and not s.order_via_site then
    raise exception 'No momento os pedidos são feitos pelo WhatsApp.' using errcode = 'P0001';
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
  if v_fulfillment = 'consumo_local' then
    -- Comer na loja: o pedido é para agora (sem data/horário), com a loja aberta neste momento.
    if not s.dine_in_enabled then
      raise exception 'No momento não estamos aceitando pedidos para comer na loja.' using errcode = 'P0001';
    end if;
    v_desired := now();
    if not public.store_open_at(v_desired) then
      raise exception 'A loja está fechada agora. Escolha retirada ou entrega em outro horário.' using errcode = 'P0001';
    end if;
  else
    v_desired := nullif(p_order->>'desired_at', '')::timestamptz;
    if v_desired is null then
      raise exception 'Informe a data e o horário desejados.' using errcode = 'P0001';
    end if;
    if v_desired < now() + make_interval(hours => s.min_order_notice_hours) - interval '5 minutes' then
      raise exception 'Escolha uma data com pelo menos % horas de antecedência.', s.min_order_notice_hours using errcode = 'P0001';
    end if;
    if not public.store_open_at(v_desired) then
      raise exception 'Nesse dia e horário a loja está fechada. Escolha outro dia ou horário.' using errcode = 'P0001';
    end if;
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

      if v_product.price_per_flavor then
        -- Preço por sabor (ex.: pastel de feira): cada item da sacola é um sabor,
        -- vendido por unidade, e o preço vem do próprio sabor.
        select coalesce(array_agg(distinct f), '{}') into v_flavors
          from jsonb_array_elements_text(coalesce(v_item->'flavors', '[]'::jsonb)) f;
        if cardinality(v_flavors) <> 1 then
          raise exception 'Escolha o sabor de "%".', v_product.name using errcode = 'P0001';
        end if;
        v_unit := null;
        select pf.price into v_unit from public.product_flavors pf
          where pf.product_id = v_product.id and pf.name = v_flavors[1] and not pf.sold_out;
        if v_unit is null then
          raise exception 'O sabor "%" não está disponível.', v_flavors[1] using errcode = 'P0001';
        end if;
        insert into public.order_items (order_id, product_id, name, portion_label, fry_option, flavors,
                                        quantity, unit_price, total, notes)
        values (v_order_id, v_product.id, v_product.name || ' — ' || v_flavors[1], 'unidade', null, v_flavors,
                v_qty, v_unit, v_unit * v_qty, left(coalesce(v_item->>'notes', ''), 500));
      else
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

revoke all on function public.create_order(jsonb, text) from public;
grant execute on function public.create_order(jsonb, text) to anon, authenticated;
