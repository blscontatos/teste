-- Gerado automaticamente por scripts/gerar-seed.mts — não edite à mão.
-- Conteúdo inicial do site (folder da PK Salgados).

insert into public.settings (id, whatsapp, phone_secondary, instagram, facebook, address, maps_url, opening_hours, delivery_fee, delivery_area, delivery_enabled, min_cake_notice_days, min_order_notice_hours, cake_sizes, cake_doughs, cake_fillings, store_closed, store_closed_message, cake_photo_mode, order_via_site, dine_in_enabled, weekly_hours, special_hours) values
  (1, '5521982712575', '(21) 3066-1028', 'pksalgados', 'pksalgados', 'R. Brício Filho, 16 - Guadalupe, Rio de Janeiro - RJ, 21660-290', 'https://www.google.com/maps/search/?api=1&query=R.+Br%C3%ADcio+Filho,+16+-+Guadalupe,+Rio+de+Janeiro+-+RJ', 'Segunda a Sábado, das 9h às 18h', 0, 'Consulte a taxa e a área de entrega pelo WhatsApp.', true, 3, 24, array['Até 15 pessoas', 'Até 25 pessoas', 'Até 40 pessoas', 'Até 60 pessoas', 'Mais de 60 pessoas']::text[], array['Massa branca (baunilha)', 'Massa de chocolate', 'Massa mesclada']::text[], array['Brigadeiro', 'Beijinho', 'Doce de leite', 'Ninho com morango', 'Abacaxi com coco', 'Prestígio']::text[], false, 'Hoje não estamos aceitando pedidos. Voltamos em breve!', 'whatsapp', true, true, '{"0":null,"1":{"open":"09:00","close":"18:00"},"2":{"open":"09:00","close":"18:00"},"3":{"open":"09:00","close":"18:00"},"4":{"open":"09:00","close":"18:00"},"5":{"open":"09:00","close":"18:00"},"6":{"open":"09:00","close":"18:00"}}'::jsonb, '[]'::jsonb)
on conflict do nothing;

insert into public.site_content (key, data) values
  ('marca', '{"name":"PK Salgados e Doces","logo_url":"/brand/logo-pk-modelo.png","logo_white_url":"/brand/logo-pk-modelo-white.png"}'::jsonb),
  ('hero', '{"badge":"Feito para momentos especiais","title_line1":"Pequenos no tamanho.","title_line2":"Gigantes no sabor.","subtitle":"Salgados e doces feitos com muito amor, para tornar seu momento ainda mais especial.","cta_label":"Faça seu pedido","image_main":"/images/hero-original.webp","image_main_alt":"Bolo de chocolate com morangos e uma coxinha dourada","image_secondary":"","image_secondary_alt":""}'::jsonb),
  ('salgados', '{"eyebrow":"Cardápio","title":"Nossos Salgados","subtitle":"Assados, fritos, congelados ou prontos para servir. Escolha a porção e os sabores."}'::jsonb),
  ('doces', '{"eyebrow":"Cardápio","title":"Nossos Doces","subtitle":"Docinhos de festa e bolos feitos sob encomenda para o seu momento especial."}'::jsonb),
  ('promocoes', '{"eyebrow":"Aproveite","title":"Promoções e Combos","subtitle":"Combinações pensadas para a sua festa, com preço especial."}'::jsonb),
  ('depoimentos', '{"eyebrow":"Quem prova, aprova","title":"Depoimentos de Clientes","subtitle":"O carinho de quem já fez a festa com a gente."}'::jsonb),
  ('quem_somos', '{"eyebrow":"Nossa história","title":"Quem Somos","text":"A PK Salgados e Doces nasceu na cozinha de casa, do amor por receber bem e por ver a mesa da festa cheia.\n\nCada salgado é enrolado à mão e cada docinho é feito com ingredientes selecionados, do jeitinho que a gente serve para a nossa própria família. Atendemos aniversários, chás, eventos da empresa e aquele lanche de fim de semana.","cta_label":"Faça seu pedido","image_url":"/images/quem-somos.webp","image_alt":"Vitrine com salgados e doces da PK"}'::jsonb),
  ('rodape', '{"description":"Salgados, doces e bolos para todos os momentos especiais.","copyright":"PK Salgados e Doces. Todos os direitos reservados."}'::jsonb)
on conflict do nothing;

insert into public.categories (section, name, slug, description, image_url, id, visible, sort_order) values
  ('salgado', 'Assados', 'assados', 'Mini hambúrguer, mini hot dog, joelhinhos e esfihas.', '/images/cat-assados.webp', '00000000-0000-4000-8000-000100000001', true, 0),
  ('salgado', 'Mini Pizzas', 'mini-pizzas', 'Muçarela, presunto e calabresa.', '/images/cat-mini-pizzas.webp', '00000000-0000-4000-8000-000100000002', true, 1),
  ('salgado', 'Mini Quiches', 'mini-quiches', 'Doces e salgadas, do alho-poró ao chocolate.', '/images/cat-quiches.webp', '00000000-0000-4000-8000-000100000003', true, 2),
  ('salgado', 'Folhados', 'folhados', 'Massa folhada crocante com recheios caprichados.', '/images/cat-folhados.webp', '00000000-0000-4000-8000-000100000004', true, 3),
  ('salgado', 'Croissants', 'croissants', 'Mini croissants recheados.', '/images/cat-croissants.webp', '00000000-0000-4000-8000-000100000005', true, 4),
  ('salgado', 'Pastel de Forno', 'pastel-de-forno', 'Frango, carne, camarão, bacalhau e mais.', '/images/cat-pastel-forno.webp', '00000000-0000-4000-8000-000100000006', true, 5),
  ('salgado', 'Salgados Fritos', 'salgados-fritos', 'Coxinha, bolinha de queijo, risoles, quibe… congelados ou fritos.', '/images/cat-fritos.webp', '00000000-0000-4000-8000-000100000007', true, 6),
  ('salgado', 'Mini Pastel Aperitivo', 'pasteis-fritos', 'Mini pastéis de queijo ou carne, congelados ou fritos.', '/images/cat-pastel-frito.webp', '00000000-0000-4000-8000-000100000008', true, 7),
  ('salgado', 'Pastel Frito', 'pastel-frito-de-feira', 'Pastel grande de feira, crocante e bem recheado.', '/images/cat-pastel-frito.webp', '00000000-0000-4000-8000-000100000009', true, 8),
  ('salgado', 'Salgados Especiais', 'salgados-especiais', 'Bolinho de bacalhau, bolinho de feijoada e empanado de camarão.', '/images/cat-especiais.webp', '00000000-0000-4000-8000-000100000010', true, 9),
  ('doce', 'Docinhos', 'docinhos', 'Brigadeiro, cajuzinho, beijinho e moranguinho.', '/images/cat-docinhos.webp', '00000000-0000-4000-8000-000100000011', true, 10),
  ('doce', 'Brigadeiro', 'brigadeiro', 'O clássico que não pode faltar.', '/images/cat-brigadeiro.webp', '00000000-0000-4000-8000-000100000012', true, 11),
  ('doce', 'Bolos de Festa', 'bolos-de-festa', 'Sob encomenda, do seu jeito.', '/images/cat-bolos-festa.webp', '00000000-0000-4000-8000-000100000013', true, 12),
  ('doce', 'Bolos Caseiros', 'bolos-caseiros', 'Consulte os sabores do dia.', '/images/cat-bolos-caseiros.webp', '00000000-0000-4000-8000-000100000014', true, 13),
  ('doce', 'Tortas', 'tortas', 'Consulte os sabores disponíveis.', '/images/cat-tortas.webp', '00000000-0000-4000-8000-000100000015', true, 14),
  ('doce', 'Torta Cook', 'torta-cook', 'Massa de cookie com recheio cremoso.', '/images/cat-torta-cook.webp', '00000000-0000-4000-8000-000100000016', true, 15)
on conflict do nothing;

insert into public.products (id, category_id, kind, name, slug, description, images, price, max_flavors, available, visible, featured, sort_order) values
  ('00000000-0000-4000-8000-000200000001', '00000000-0000-4000-8000-000100000001', 'comum', 'Salgados Assados', 'salgados-assados', 'Bandeja com 20 unidades de salgados assados. Monte com os sabores que preferir.', array['/images/cat-assados.webp']::text[], 21, 1, true, true, true, 0),
  ('00000000-0000-4000-8000-000200000002', '00000000-0000-4000-8000-000100000002', 'comum', 'Mini Pizza', 'mini-pizza', 'Bandeja com 20 mini pizzas assadas.', array['/images/cat-mini-pizzas.webp']::text[], 21, 1, true, true, false, 1),
  ('00000000-0000-4000-8000-000200000003', '00000000-0000-4000-8000-000100000003', 'comum', 'Mini Quiche', 'mini-quiche', 'Bandeja com 20 mini quiches, salgadas e doces.', array['/images/cat-quiches.webp']::text[], 21, 1, true, true, false, 2),
  ('00000000-0000-4000-8000-000200000004', '00000000-0000-4000-8000-000100000004', 'comum', 'Folhados', 'folhados', 'Bandeja com 20 folhados de massa crocante.', array['/images/cat-folhados.webp']::text[], 21, 1, true, true, false, 3),
  ('00000000-0000-4000-8000-000200000005', '00000000-0000-4000-8000-000100000005', 'comum', 'Croissant', 'croissant', 'Bandeja com 20 mini croissants recheados.', array['/images/cat-croissants.webp']::text[], 21, 1, true, true, false, 4),
  ('00000000-0000-4000-8000-000200000006', '00000000-0000-4000-8000-000100000006', 'comum', 'Pastel de Forno', 'pastel-de-forno', 'Bandeja com 20 pastéis de forno.', array['/images/cat-pastel-forno.webp']::text[], 21, 1, true, true, false, 5),
  ('00000000-0000-4000-8000-000200000007', '00000000-0000-4000-8000-000100000007', 'frito', 'Salgados Fritos 18g', 'salgados-fritos-18g', 'Salgadinhos de festa de 18g. Leve congelados para fritar em casa ou já fritinhos.', array['/images/cat-fritos.webp']::text[], 21, 1, true, true, true, 6),
  ('00000000-0000-4000-8000-000200000008', '00000000-0000-4000-8000-000100000008', 'frito', 'Mini Pastel Aperitivo', 'pastel-frito', 'Pacote com 20 pastéis. Congelados para fritar em casa ou já fritos.', array['/images/cat-pastel-frito.webp']::text[], 14, 1, true, true, false, 7),
  ('00000000-0000-4000-8000-000200000009', '00000000-0000-4000-8000-000100000010', 'frito', 'Salgados Especiais', 'salgados-especiais', 'Pacote de um sabor. A quantidade de unidades varia conforme o salgado.', array['/images/cat-especiais.webp']::text[], 40, 1, true, true, false, 8),
  ('00000000-0000-4000-8000-000200000010', '00000000-0000-4000-8000-000100000011', 'comum', 'Bandeja de Docinhos', 'bandeja-de-docinhos', 'Bandeja com 20 docinhos de festa.', array['/images/cat-docinhos.webp']::text[], 21, 1, true, true, true, 9),
  ('00000000-0000-4000-8000-000200000011', '00000000-0000-4000-8000-000100000012', 'comum', 'Brigadeiro', 'brigadeiro', 'Bandeja com 20 brigadeiros tradicionais.', array['/images/cat-brigadeiro.webp']::text[], 21, 1, true, true, false, 10),
  ('00000000-0000-4000-8000-000200000012', '00000000-0000-4000-8000-000100000013', 'bolo_festa', 'Bolo de Festa', 'bolo-de-festa', 'Bolo personalizado para aniversários, chás e comemorações. Conte pra gente o tema e, se tiver, envie uma foto de inspiração.', array['/images/cat-bolos-festa.webp']::text[], null, 1, true, true, false, 11)
on conflict do nothing;

insert into public.product_portions (id, product_id, label, units, price, price_frozen, price_fried, max_flavors, sort_order) values
  ('00000000-0000-4000-8000-000300000101', '00000000-0000-4000-8000-000200000001', '20 unidades', 20, 21, null, null, 1, 0),
  ('00000000-0000-4000-8000-000300000201', '00000000-0000-4000-8000-000200000002', '20 unidades', 20, 21, null, null, 1, 0),
  ('00000000-0000-4000-8000-000300000301', '00000000-0000-4000-8000-000200000003', '20 unidades', 20, 21, null, null, 1, 0),
  ('00000000-0000-4000-8000-000300000401', '00000000-0000-4000-8000-000200000004', '20 unidades', 20, 21, null, null, 1, 0),
  ('00000000-0000-4000-8000-000300000501', '00000000-0000-4000-8000-000200000005', '20 unidades', 20, 21, null, null, 1, 0),
  ('00000000-0000-4000-8000-000300000601', '00000000-0000-4000-8000-000200000006', '20 unidades', 20, 21, null, null, 1, 0),
  ('00000000-0000-4000-8000-000300000701', '00000000-0000-4000-8000-000200000007', '50 unidades', 50, null, 21, 32, 2, 0),
  ('00000000-0000-4000-8000-000300000702', '00000000-0000-4000-8000-000200000007', '100 unidades', 100, null, 42, 57, 5, 1),
  ('00000000-0000-4000-8000-000300000801', '00000000-0000-4000-8000-000200000008', '20 unidades', 20, null, 14, 17, 1, 0),
  ('00000000-0000-4000-8000-000300000901', '00000000-0000-4000-8000-000200000009', '1 pacote', null, null, 40, 50, null, 0),
  ('00000000-0000-4000-8000-000300001001', '00000000-0000-4000-8000-000200000010', '20 unidades', 20, 21, null, null, 1, 0),
  ('00000000-0000-4000-8000-000300001101', '00000000-0000-4000-8000-000200000011', '20 unidades', 20, 21, null, null, 1, 0)
on conflict do nothing;

insert into public.product_flavors (id, product_id, name, sold_out, sort_order) values
  ('00000000-0000-4000-8000-000400000101', '00000000-0000-4000-8000-000200000001', 'Mini hambúrguer', false, 0),
  ('00000000-0000-4000-8000-000400000102', '00000000-0000-4000-8000-000200000001', 'Mini hot dog', false, 1),
  ('00000000-0000-4000-8000-000400000103', '00000000-0000-4000-8000-000200000001', 'Joelhinho de queijo com presunto', false, 2),
  ('00000000-0000-4000-8000-000400000104', '00000000-0000-4000-8000-000200000001', 'Joelhinho de frango', false, 3),
  ('00000000-0000-4000-8000-000400000105', '00000000-0000-4000-8000-000200000001', 'Joelho de calabresa', false, 4),
  ('00000000-0000-4000-8000-000400000106', '00000000-0000-4000-8000-000200000001', 'Esfiha de queijo', false, 5),
  ('00000000-0000-4000-8000-000400000107', '00000000-0000-4000-8000-000200000001', 'Esfiha de carne', false, 6),
  ('00000000-0000-4000-8000-000400000108', '00000000-0000-4000-8000-000200000001', 'Esfiha de frango', false, 7),
  ('00000000-0000-4000-8000-000400000201', '00000000-0000-4000-8000-000200000002', 'Muçarela', false, 0),
  ('00000000-0000-4000-8000-000400000202', '00000000-0000-4000-8000-000200000002', 'Presunto', false, 1),
  ('00000000-0000-4000-8000-000400000203', '00000000-0000-4000-8000-000200000002', 'Calabresa', false, 2),
  ('00000000-0000-4000-8000-000400000301', '00000000-0000-4000-8000-000200000003', 'Queijo', false, 0),
  ('00000000-0000-4000-8000-000400000302', '00000000-0000-4000-8000-000200000003', 'Alho-poró', false, 1),
  ('00000000-0000-4000-8000-000400000303', '00000000-0000-4000-8000-000200000003', 'Bacalhau', false, 2),
  ('00000000-0000-4000-8000-000400000304', '00000000-0000-4000-8000-000200000003', 'Camarão', false, 3),
  ('00000000-0000-4000-8000-000400000305', '00000000-0000-4000-8000-000200000003', 'Carne seca', false, 4),
  ('00000000-0000-4000-8000-000400000306', '00000000-0000-4000-8000-000200000003', 'Espinafre com queijo', false, 5),
  ('00000000-0000-4000-8000-000400000307', '00000000-0000-4000-8000-000200000003', 'Cebola', false, 6),
  ('00000000-0000-4000-8000-000400000308', '00000000-0000-4000-8000-000200000003', 'Queijo com goiabada', false, 7),
  ('00000000-0000-4000-8000-000400000309', '00000000-0000-4000-8000-000200000003', 'Chocolate', false, 8),
  ('00000000-0000-4000-8000-000400000401', '00000000-0000-4000-8000-000200000004', 'Queijo com presunto', false, 0),
  ('00000000-0000-4000-8000-000400000402', '00000000-0000-4000-8000-000200000004', 'Bacalhau', false, 1),
  ('00000000-0000-4000-8000-000400000403', '00000000-0000-4000-8000-000200000004', 'Camarão', false, 2),
  ('00000000-0000-4000-8000-000400000404', '00000000-0000-4000-8000-000200000004', 'Frango', false, 3),
  ('00000000-0000-4000-8000-000400000405', '00000000-0000-4000-8000-000200000004', 'Ameixa com bacon', false, 4),
  ('00000000-0000-4000-8000-000400000501', '00000000-0000-4000-8000-000200000005', 'Queijo com presunto', false, 0),
  ('00000000-0000-4000-8000-000400000502', '00000000-0000-4000-8000-000200000005', 'Frango', false, 1),
  ('00000000-0000-4000-8000-000400000503', '00000000-0000-4000-8000-000200000005', 'Peito de peru', false, 2),
  ('00000000-0000-4000-8000-000400000504', '00000000-0000-4000-8000-000200000005', 'Queijo', false, 3),
  ('00000000-0000-4000-8000-000400000601', '00000000-0000-4000-8000-000200000006', 'Frango', false, 0),
  ('00000000-0000-4000-8000-000400000602', '00000000-0000-4000-8000-000200000006', 'Carne', false, 1),
  ('00000000-0000-4000-8000-000400000603', '00000000-0000-4000-8000-000200000006', 'Camarão', false, 2),
  ('00000000-0000-4000-8000-000400000604', '00000000-0000-4000-8000-000200000006', 'Bacalhau', false, 3),
  ('00000000-0000-4000-8000-000400000605', '00000000-0000-4000-8000-000200000006', 'Ameixa com bacon', false, 4),
  ('00000000-0000-4000-8000-000400000701', '00000000-0000-4000-8000-000200000007', 'Coxinha', false, 0),
  ('00000000-0000-4000-8000-000400000702', '00000000-0000-4000-8000-000200000007', 'Bolinha de queijo', false, 1),
  ('00000000-0000-4000-8000-000400000703', '00000000-0000-4000-8000-000200000007', 'Queijo com presunto', false, 2),
  ('00000000-0000-4000-8000-000400000704', '00000000-0000-4000-8000-000200000007', 'Queijo com alho', false, 3),
  ('00000000-0000-4000-8000-000400000705', '00000000-0000-4000-8000-000200000007', 'Risole de carne', false, 4),
  ('00000000-0000-4000-8000-000400000706', '00000000-0000-4000-8000-000200000007', 'Calabresa', false, 5),
  ('00000000-0000-4000-8000-000400000707', '00000000-0000-4000-8000-000200000007', 'Quibe', false, 6),
  ('00000000-0000-4000-8000-000400000708', '00000000-0000-4000-8000-000200000007', 'Quibe recheado', false, 7),
  ('00000000-0000-4000-8000-000400000709', '00000000-0000-4000-8000-000200000007', 'Risole de camarão', false, 8),
  ('00000000-0000-4000-8000-000400000710', '00000000-0000-4000-8000-000200000007', 'Coxinha de costela', false, 9),
  ('00000000-0000-4000-8000-000400000711', '00000000-0000-4000-8000-000200000007', 'Enroladinho de salsicha', false, 10),
  ('00000000-0000-4000-8000-000400000712', '00000000-0000-4000-8000-000200000007', 'Feijoada', false, 11),
  ('00000000-0000-4000-8000-000400000713', '00000000-0000-4000-8000-000200000007', 'Aipim com carne', false, 12),
  ('00000000-0000-4000-8000-000400000714', '00000000-0000-4000-8000-000200000007', 'Aipim com queijo', false, 13),
  ('00000000-0000-4000-8000-000400000715', '00000000-0000-4000-8000-000200000007', 'Aipim com calabresa', false, 14),
  ('00000000-0000-4000-8000-000400000716', '00000000-0000-4000-8000-000200000007', 'Coxinha de aipim', false, 15),
  ('00000000-0000-4000-8000-000400000801', '00000000-0000-4000-8000-000200000008', 'Queijo', false, 0),
  ('00000000-0000-4000-8000-000400000802', '00000000-0000-4000-8000-000200000008', 'Carne', false, 1),
  ('00000000-0000-4000-8000-000400000901', '00000000-0000-4000-8000-000200000009', 'Bolinho de bacalhau (40 a 43 un.)', false, 0),
  ('00000000-0000-4000-8000-000400000902', '00000000-0000-4000-8000-000200000009', 'Bolinho de feijoada (40 a 45 un.)', false, 1),
  ('00000000-0000-4000-8000-000400000903', '00000000-0000-4000-8000-000200000009', 'Empanado de camarão (20 a 22 un.)', false, 2),
  ('00000000-0000-4000-8000-000400001001', '00000000-0000-4000-8000-000200000010', 'Brigadeiro', false, 0),
  ('00000000-0000-4000-8000-000400001002', '00000000-0000-4000-8000-000200000010', 'Cajuzinho', false, 1),
  ('00000000-0000-4000-8000-000400001003', '00000000-0000-4000-8000-000200000010', 'Beijinho', false, 2),
  ('00000000-0000-4000-8000-000400001004', '00000000-0000-4000-8000-000200000010', 'Moranguinho', false, 3),
  ('00000000-0000-4000-8000-000400001101', '00000000-0000-4000-8000-000200000011', 'Brigadeiro tradicional', false, 0)
on conflict do nothing;

insert into public.promotions (title, description, images, badge, old_price, price, ends_at, id, active, starts_at, sort_order) values
  ('Combo Festa Completa', '100 salgados fritos de 18g (já fritos) + 1 bandeja com 20 docinhos.', array['/images/promo-fritos.webp']::text[], 'Mais pedido', 78, 72, null, '00000000-0000-4000-8000-000500000001', true, null, 1),
  ('Kit Assados', '2 bandejas de salgados assados + 1 bandeja de mini pizzas. 60 unidades no total.', array['/images/cat-assados.webp']::text[], 'Combo', 63, 58, null, '00000000-0000-4000-8000-000500000002', true, null, 2),
  ('Docinhos em Dobro', '2 bandejas com 20 docinhos cada. Brigadeiro, beijinho, cajuzinho e moranguinho.', array['/images/promo-docinhos.webp']::text[], 'Promoção', 42, 38, null, '00000000-0000-4000-8000-000500000003', true, null, 3)
on conflict do nothing;

insert into public.promotion_items (id, promotion_id, product_id, description, quantity, sort_order) values
  ('00000000-0000-4000-8000-000600000101', '00000000-0000-4000-8000-000500000001', null, '100 salgados fritos 18g (fritos)', 1, 0),
  ('00000000-0000-4000-8000-000600000102', '00000000-0000-4000-8000-000500000001', null, 'Bandeja com 20 docinhos', 1, 1),
  ('00000000-0000-4000-8000-000600000201', '00000000-0000-4000-8000-000500000002', null, '2 bandejas de salgados assados (40 un.)', 1, 0),
  ('00000000-0000-4000-8000-000600000202', '00000000-0000-4000-8000-000500000002', null, '1 bandeja de mini pizzas (20 un.)', 1, 1),
  ('00000000-0000-4000-8000-000600000301', '00000000-0000-4000-8000-000500000003', null, '2 bandejas de docinhos (40 un.)', 1, 0)
on conflict do nothing;

insert into public.testimonials (name, text, stars, id, visible, sort_order) values
  ('Juliana M.', 'Os salgados chegaram quentinhos e sequinhos. Todo mundo na festa perguntou de onde eram!', 5, '00000000-0000-4000-8000-000700000001', true, 0),
  ('Ricardo S.', 'Encomendei o bolo de aniversário da minha filha e ficou igualzinho à foto que mandei. Delicioso!', 5, '00000000-0000-4000-8000-000700000002', true, 1),
  ('Patrícia A.', 'Compro os congelados toda semana. Praticidade e sabor de salgado feito em casa.', 5, '00000000-0000-4000-8000-000700000003', true, 2),
  ('Fernanda L.', 'Atendimento atencioso pelo WhatsApp e pontualidade na entrega. Recomendo demais.', 5, '00000000-0000-4000-8000-000700000004', true, 3),
  ('Camila R.', 'Fiz o pedido pelo site em poucos minutos. Os docinhos estavam lindos e muito saborosos!', 5, '00000000-0000-4000-8000-000700000005', true, 4),
  ('Marcos T.', 'Pedi os salgados congelados para o aniversário do meu filho. Fritei na hora e ficaram perfeitos.', 5, '00000000-0000-4000-8000-000700000006', true, 5)
on conflict do nothing;

