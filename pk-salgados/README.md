# PK Salgados e Doces — site + painel administrativo

Site de pedidos da **PK Salgados e Doces** com painel para as donas editarem tudo sem mexer em código.

- **Site público** (`/`): cabeçalho fixo com sacola, destaque, carrosséis de Salgados e Doces, Promoções e Combos, Depoimentos, Quem Somos e rodapé.
- **Pedidos**: sacola, escolha de porção, sabores (com limite), congelado ou frito, envio **pelo site** (cai direto no painel) ou **pelo WhatsApp** (abre o WhatsApp da loja com o pedido pronto; o pedido também fica salvo no painel).
- **Bolo de festa**: formulário de encomenda com foto de inspiração (JPG, PNG ou HEIC até 10 MB, comprimida no celular). Dois modos, escolhidos em *Configurações → Bolos de festa*:
  - **Cliente envia pelo WhatsApp** (padrão): a foto **não vai para o site**. Depois de enviar o formulário, o WhatsApp da PK abre com os dados e um segundo botão, “Enviar a foto do modelo”, abre a tela de compartilhar do celular com a foto. O cliente escolhe a conversa da PK e envia. No computador, ele baixa a foto e anexa pelo clipe.
  - **Guardar no site e mandar link**: a foto vai para o armazenamento, aparece no painel e segue como link na mensagem.
- **Horários**: o cliente só escolhe dia e horário em que a loja está aberta (segunda a sábado, 9h às 18h; domingo fechado). Na aba **Horários** do painel dá para mudar a semana inteira ou criar datas especiais (abrir um domingo, ficar até mais tarde, fechar num feriado). O banco também recusa pedidos fora do horário.
- **Sabores por bandeja**: 1 sabor a cada 20 unidades (bandeja de 20 = 1 sabor; 50 fritos = 2; 100 fritos = 5). Com 2 bandejas, 1 sabor para cada. Ajustável por porção em *Produtos*.
- **Painel** (`/admin`): pedidos em tempo real com som e notificação, produtos, sabores, porções, promoções, textos e imagens (com prévia antes de publicar), depoimentos e configurações (inclusive “loja fechada”).

Tecnologias: Next.js 15 (App Router) + TypeScript, Tailwind CSS 4, Framer Motion, Supabase (banco, login, fotos, tempo real) e hospedagem na Vercel.

---

## Passo a passo para colocar no ar (para leigos)

Leva uns 30 minutos. Você vai precisar de: uma conta no **GitHub** (onde o código já está), uma no **Supabase** e uma na **Vercel**. As três têm plano gratuito.

### 1. Criar o banco de dados no Supabase

1. Acesse **supabase.com** e clique em **Start your project**. Entre com sua conta do GitHub.
2. Clique em **New project**.
   - **Name:** `pk-salgados`
   - **Database Password:** clique em *Generate a password* e **guarde essa senha** em lugar seguro.
   - **Region:** *South America (São Paulo)*.
   - Clique em **Create new project** e espere uns 2 minutos.
3. No menu da esquerda, abra **SQL Editor** → **New query**.
4. Abra o arquivo [`supabase/migrations/20261108000000_init.sql`](supabase/migrations/20261108000000_init.sql) aqui no GitHub, copie **todo** o conteúdo, cole no editor e clique em **Run**. Deve aparecer “Success”.
5. Faça o mesmo, **nesta ordem**, com [`supabase/migrations/20261109000000_foto_bolo_whatsapp.sql`](supabase/migrations/20261109000000_foto_bolo_whatsapp.sql), [`supabase/migrations/20261110000000_horarios_e_sabores.sql`](supabase/migrations/20261110000000_horarios_e_sabores.sql) e depois com [`supabase/seed.sql`](supabase/seed.sql) (é o cardápio do folder, as categorias, 3 combos de exemplo e os textos iniciais).
6. Vá em **Authentication → Sign In / Providers** e **desligue** “Allow new users to sign up” (assim só as donas têm acesso).
7. Vá em **Authentication → URL Configuration**:
   - **Site URL:** o endereço do site (por enquanto, o da Vercel, que você vai ganhar no passo 3, ex.: `https://pk-salgados.vercel.app`).
   - Em **Redirect URLs**, adicione: `https://SEU-ENDERECO/auth/callback`.
8. Vá em **Project Settings → API Keys** e anote:
   - **Project URL** (algo como `https://abcd.supabase.co`)
   - **Publishable key** (`sb_publishable_...`) — é a chave pública
   - **Secret key** (`sb_secret_...`) — é secreta, **nunca** compartilhe

### 2. Criar o acesso das donas

**Jeito mais simples (pelo próprio Supabase):**

1. Em **Authentication → Users**, clique em **Add user → Create new user**.
2. Digite o e-mail e uma senha da dona e marque **Auto Confirm User**. Repita para cada dona.
3. Volte ao **SQL Editor** e rode (trocando os e-mails):

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users
   where email in ('dona1@email.com', 'dona2@email.com');
   ```

Pronto: essas pessoas já podem entrar em `/admin`. Para tirar o acesso de alguém: `delete from public.admin_users where email = 'email@x.com';`

> Quem sabe usar o terminal também pode rodar `npm run admin:criar -- email@x.com "SenhaForte123"`, com a *Secret key* no arquivo `.env.local`.

### 3. Publicar o site na Vercel

1. Acesse **vercel.com** e entre com o GitHub.
2. Clique em **Add New… → Project** e escolha o repositório deste projeto → **Import**.
3. Em **Root Directory**, clique em *Edit* e escolha a pasta **`pk-salgados`**.
4. Abra **Environment Variables** e cadastre:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key |
   | `NEXT_PUBLIC_SITE_URL` | endereço do site, sem barra no final (ex.: `https://pk-salgados.vercel.app`) |

   (A *Secret key* **não** vai na Vercel.)
5. Clique em **Deploy**. Em 2 a 3 minutos o site está no ar.
6. Volte ao passo 1.7 e confira se a **Site URL** e a **Redirect URL** estão com o endereço certo.

**Domínio próprio** (ex.: `pksalgados.com.br`): na Vercel, em *Settings → Domains*, adicione o domínio e siga as instruções. Depois atualize `NEXT_PUBLIC_SITE_URL` e as URLs do passo 1.7, e faça um novo deploy.

### 4. Primeiro uso do painel

1. Entre em `https://SEU-ENDERECO/admin` com o e-mail e a senha da dona.
2. Em **Configurações**, confira o WhatsApp, endereço, horário, taxa de entrega, antecedência e as opções de bolo.
3. Em **Textos e imagens**, troque a foto de “Quem Somos” pela **foto das donas** (de preferência em PNG sem fundo, para ficar recortada sobre o círculo azul), clique em **Ver como fica** e depois em **Publicar**.
4. Em **Depoimentos**, apague os depoimentos de exemplo e coloque depoimentos reais de clientes.
5. Em **Produtos**, troque as fotos de exemplo pelas fotos reais.
6. Na tela **Pedidos**, toque em **Ligar som e avisos** e deixe a tela aberta (no computador ou no celular) para ouvir quando chegar pedido.

---

## O que conferir antes de divulgar

Estes itens vieram como **exemplo** e precisam da confirmação de vocês:

- **Depoimentos**: os 4 que vêm no site são exemplos. Troque por depoimentos reais.
- **Combos/promoções**: os 3 combos (Combo Festa Completa R$ 72, Kit Assados R$ 58, Docinhos em Dobro R$ 38) foram montados com os preços do folder, mas os descontos são sugestões.
- **Limite de sabores**: 1 sabor a cada 20 unidades (pedido da loja). Ajuste em *Produtos* se alguma bandeja for diferente.
- **Bolos caseiros, Tortas e Torta Cook**: não estão no folder. Aparecem como “Consulte” (botão para o WhatsApp) até vocês cadastrarem produtos com preço.
- **Tamanhos, massas e recheios do bolo de festa**: são exemplos (em *Configurações*).
- **Antecedência**: 3 dias para bolo de festa e 24 horas para os demais pedidos, sempre dentro do horário de funcionamento (aba *Horários*).
- **Taxa de entrega**: está “a combinar” (R$ 0). Defina em *Configurações*.
- **Fotos**: são fotos gratuitas da internet (créditos em `public/images/CREDITOS.md`). O logo foi recortado do folder.

---

## Como funciona (resumo técnico)

```
src/
  app/(site)/          página inicial e privacidade (ficam em cache; atualizam a cada 1 min ou ao salvar no painel)
  app/previa/          "Ver como fica" (rascunho, só para as donas)
  app/admin/           login, recuperação de senha e o painel
  app/actions/         recebimento de pedidos (validação + anti-spam)
  components/site/     seções do site
  components/order/    sacola, produto, checkout e encomenda de bolo
  components/admin/    telas do painel
  lib/defaults.ts      conteúdo inicial (fonte do seed.sql)
supabase/
  migrations/          tabelas, regras de acesso (RLS), funções e armazenamento
  seed.sql             gerado por `npm run seed:gerar`
tests/e2e.mjs          teste de ponta a ponta (site + painel)
```

**Segurança e regras**

- **RLS**: o público só lê o conteúdo visível. Ninguém de fora lê pedidos nem altera o cardápio. Só quem está em `admin_users` edita e vê pedidos.
- Pedidos entram **somente** pelas funções `create_order` e `create_cake_order`, que **recalculam os preços** no banco (o navegador não define valores), conferem porções, sabores esgotados, limite de sabores, antecedência e se a loja está aberta.
- **Anti-spam**: campo-isca invisível, limite por conexão no servidor e no banco (5 pedidos por telefone / 20 por conexão a cada 30 min). O IP nunca é guardado, apenas um resumo irreversível.
- Fotos de inspiração: no modo padrão (WhatsApp) o site **recusa qualquer envio** de foto de bolo. No modo link, o cliente só pode **enviar** (não lista, não troca, não apaga). O nome do arquivo é aleatório, então só quem recebe o link vê a foto.
- **Fotos que não são mais usadas** (trocadas, removidas ou de produtos excluídos) são apagadas do armazenamento automaticamente depois de 24 horas. Em *Configurações → Armazenamento de fotos* dá para ver o espaço usado, apagar na hora as fotos sem uso e apagar fotos de bolos antigos. Cada encomenda de bolo também tem o botão **Apagar foto**.
- **Promoções vencidas** somem sozinhas: o banco só entrega promoções dentro do período, e a página se atualiza a cada minuto.
- **WhatsApp**: o link usa `api.whatsapp.com/send` (equivalente ao `wa.me`), porque o redirecionamento do `wa.me` estraga emojis como 🎂. O link só aceita texto. Por isso a foto vai pela tela de compartilhar do celular (modo padrão) ou como link (modo link).

**Desenvolvimento local**

```bash
npm install
npx supabase start            # precisa do Docker; aplica migrations + seed
cp .env.example .env.local    # preencha com as chaves que o comando acima mostrar
npm run admin:criar -- dona@pksalgados.com.br "SenhaTeste123"
npm run dev                   # http://localhost:3000
npm run test:e2e              # teste completo (com o site rodando)
```

Sem as variáveis do Supabase, o site abre em **modo demonstração** com o conteúdo inicial (pedidos e painel ficam desativados).

Comandos úteis: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run seed:gerar` (depois de editar `src/lib/defaults.ts`).
