# Luiz Vieira Negócios Imobiliários — site e painel administrativo

Site institucional + plataforma imobiliária com painel administrativo, autenticação e banco de dados reais.

- **Frontend/servidor:** Next.js 15 (App Router, Server Actions), React 19, Tailwind CSS 4
- **Banco, autenticação e fotos:** Supabase (Postgres + RLS, Auth, Storage)
- **Hospedagem recomendada:** Vercel (site) + Supabase Cloud (banco)

---

## O que está pronto

### Site público
| Página | Rota |
|---|---|
| Início (hero com imóvel em destaque, portfólio com filtros, sobre, depoimentos, "Como podemos ajudar") | `/` |
| Listagem com filtros (comprar/alugar, bairro, tipo, preço, quartos, vagas, ordenação), busca e paginação | `/imoveis` |
| Página do imóvel (galeria com ampliação, ficha, características, vídeo, WhatsApp com código, formulário, semelhantes) | `/imoveis/[slug]` |
| Vender seu imóvel | `/vender` |
| Sobre | `/sobre` |
| Contato | `/contato` |
| Política de Privacidade (LGPD) | `/politica-de-privacidade` |

O menu "Comprar" usa `/imoveis?negocio=comprar`. O botão flutuante do WhatsApp aparece em todas as páginas.

### Painel administrativo (`/admin`)
- **Login** com e-mail e senha, **recuperação de senha** por e-mail, **logout**, rotas protegidas (middleware + verificação no servidor + RLS).
- **Visão geral:** contadores, imóvel em destaque e contatos recentes.
- **Imóveis:** totais (total, publicados, rascunhos, arquivados), abas, busca e ações (editar, ver no site, publicar, despublicar, arquivar, excluir, definir/remover destaque).
- **Cadastro em 5 etapas:** informações básicas → valores e medidas → fotos e vídeo → descrição e características → revisar e publicar. Salva automaticamente como rascunho; quem sair no meio continua depois pela aba *Rascunhos*.
- **Fotos:** envio múltiplo (arrastar e soltar), otimização automática para WebP no navegador, foto principal, reordenação, exclusão e prévia da galeria. Ficam no Supabase Storage.
- **Interessados:** todos os formulários do site com filtros (comprar, vender, novos, em atendimento, concluídos), busca, ficha completa, WhatsApp, copiar telefone, status, observações internas e exclusão.
- **Depoimentos** (somente administrador): cadastrar, editar, publicar/ocultar e remover.
- **Configurações:** WhatsApp, mensagem padrão, telefone, e-mail, CRECI, Instagram, textos da página inicial, texto e foto da seção Sobre, nome e senha do próprio usuário.
- **Usuários** (somente administrador): criar acessos de administrador ou corretor, alterar permissão e desativar acessos.

### Níveis de acesso
| Ação | Administrador | Corretor |
|---|:-:|:-:|
| Cadastrar, editar, publicar, despublicar e arquivar imóveis | ✔ | ✔ |
| Escolher o imóvel em destaque | ✔ | ✔ |
| Ver e atender interessados | ✔ | ✔ |
| Editar textos e fotos do site | ✔ | ✔ |
| **Excluir** imóveis | ✔ | — |
| Gerenciar depoimentos | ✔ | — |
| Alterar WhatsApp, telefone, e-mail e CRECI | ✔ | — |
| Gerenciar usuários | ✔ | — |

As regras são aplicadas **no banco de dados** (RLS e triggers), não só na interface.

### Imóvel em destaque
Fica em uma única coluna (`site_settings.featured_property_id`), então **só existe um destaque por vez**. Ao definir um destaque no painel, a foto, o título, o bairro, o preço, a metragem, os quartos, as vagas e o link do hero mudam automaticamente. Se o imóvel em destaque for despublicado ou arquivado, o destaque é removido sozinho e a home volta para a composição institucional.

### Depoimentos
Enquanto não houver depoimentos reais publicados, o site mostra 3 **exemplos claramente identificados** ("Conteúdo de demonstração", selo "Exemplo"). Quando você publica o primeiro depoimento real, os exemplos somem.

---

## Colocando no ar (passo a passo)

### 1. Criar o projeto no Supabase
1. Crie uma conta em <https://supabase.com> e um novo projeto (região **São Paulo**, `sa-east-1`).
2. Em **Project Settings → API**, copie a `Project URL`, a chave `anon` e a chave `service_role`.

### 2. Criar as tabelas, as regras de segurança e o armazenamento de fotos
Use uma das opções:
- **CLI (recomendado):**
  ```bash
  npx supabase login
  npx supabase link --project-ref SEU_PROJECT_REF
  npx supabase db push
  ```
- **Painel:** abra **SQL Editor**, cole o conteúdo de `supabase/migrations/20261104000000_init.sql` e execute.

Isso cria as tabelas, as políticas RLS, os triggers e o bucket público `property-media` (leitura pública, escrita só da equipe).

### 3. Configurar a autenticação no Supabase
Em **Authentication**:
- **Sign In / Providers → Email:** mantenha o e-mail ativo e **desative "Allow new users to sign up"**. Assim ninguém cria conta sozinho.
- **URL Configuration:**
  - *Site URL:* `https://www.seudominio.com.br`
  - *Redirect URLs:* `https://www.seudominio.com.br/**`
- **SMTP (recomendado):** configure um provedor de e-mail (Resend, Brevo, SendGrid etc.) em **Project Settings → Authentication → SMTP**. O e-mail padrão do Supabase tem limite baixo de envios.
- Opcional: traduza o modelo **Reset Password** em *Email Templates*.

### 4. Variáveis de ambiente
Copie `.env.example` para `.env.local` (desenvolvimento) e cadastre as mesmas variáveis na Vercel (**Settings → Environment Variables**):

| Variável | Onde obter | Pública? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | seu domínio, ex. `https://www.luizvieiraimoveis.com.br` | sim |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API → Project URL | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → `anon` | sim (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role` | **NÃO — somente servidor** |
| `NEXT_PUBLIC_WHATSAPP_FALLBACK` | número usado até ser configurado no painel (DDI+DDD+número) | sim |

> A `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o navegador. Ela é usada só no servidor para criar usuários e pelo script do primeiro administrador.

### 5. Criar o primeiro administrador (configuração inicial segura)
No seu computador, com o `.env.local` preenchido com as chaves de **produção**:
```bash
npm install
node --env-file=.env.local scripts/create-admin.mjs --email luiz@seudominio.com.br --name "Luiz Vieira"
```
A senha é pedida no terminal sem aparecer na tela (mínimo de 10 caracteres, com letras e números). Depois disso, os outros usuários são criados pelo painel em **Usuários**.

### 6. Publicar na Vercel
1. Importe este repositório em <https://vercel.com/new>.
2. Cadastre as variáveis do passo 4.
3. Faça o deploy e aponte seu domínio em **Settings → Domains**.

### 7. Primeiros passos no painel
1. Acesse `https://seudominio/admin/login`.
2. **Configurações:** preencha WhatsApp, telefone, e-mail, CRECI, Instagram e, se quiser, a foto da seção Sobre e a foto de capa padrão.
3. **Imóveis → + Cadastrar imóvel:** cadastre e publique. Use "Publicar e destacar" no imóvel da página inicial.
4. **Depoimentos:** cadastre apenas avaliações reais, com autorização dos clientes.
5. Envie o sitemap (`https://seudominio/sitemap.xml`) no Google Search Console.

---

## ⚠️ O que o proprietário precisa preencher antes de publicar
- [ ] Número do WhatsApp do corretor (painel → Configurações, ou `NEXT_PUBLIC_WHATSAPP_FALLBACK`)
- [ ] Telefone, e-mail de contato e **CRECI** (painel → Configurações)
- [ ] Domínio definitivo (`NEXT_PUBLIC_SITE_URL` e URLs no Supabase Auth)
- [ ] SMTP para os e-mails de recuperação de senha
- [ ] Fotografia da seção Sobre (opcional; sem ela, é exibida uma composição gráfica)
- [ ] Depoimentos reais (até lá, os exemplos aparecem identificados como demonstração)
- [ ] Revisão jurídica da Política de Privacidade (`src/app/(site)/politica-de-privacidade/page.tsx`)
- [ ] Logotipo oficial, se houver (hoje é um monograma "LV" em `src/components/site/Logo.tsx`)

---

## Desenvolvimento local
Requisitos: Node 20+ e Docker (para o Supabase local).
```bash
npm install
npx supabase start            # sobe Postgres, Auth, Storage e Mailpit locais
npx supabase db reset         # aplica a migração
cp .env.example .env.local    # preencha com as chaves exibidas pelo "supabase start"
node --env-file=.env.local scripts/create-admin.mjs --email admin@teste.com --name "Admin"
npm run dev                   # http://localhost:3000
```
Os e-mails locais (recuperação de senha) aparecem no Mailpit: <http://127.0.0.1:54324>.

### Testes automatizados
Com o app rodando (`npm run build && npm start`) e os usuários de teste criados:
```bash
node --env-file=.env.local scripts/create-admin.mjs --email admin@luizvieira.test --name "Admin" --password SenhaForte2026
node --env-file=.env.local scripts/create-admin.mjs --email corretor@luizvieira.test --name "Corretor" --password SenhaForte2026 --role corretor

node --env-file=.env.local tests/security.mjs     # 25 testes de RLS, storage e permissões
E2E_PHOTOS_DIR=/pasta/com/fotos node tests/e2e.mjs # 33 testes ponta a ponta no navegador (Playwright)
node tests/password-reset.cjs                      # recuperação de senha via Mailpit
```
Use estes usuários de teste **apenas no ambiente local**.

---

## Estrutura
```
src/
  app/
    (site)/            páginas públicas (home, imóveis, vender, sobre, contato, privacidade)
    admin/(auth)/      login, recuperar e redefinir senha
    admin/(panel)/     painel protegido (imóveis, interessados, depoimentos, configurações, usuários)
    admin/actions.ts   Server Actions do painel (sempre verificam permissão)
    actions/leads.ts   envio dos formulários públicos (validação, honeypot, limite por IP)
    auth/              callback de e-mail e logout
    sitemap.ts, robots.ts
  components/          site, home, imóvel, formulários e painel
  lib/                 dados, autenticação, formatação, tipos e clientes Supabase
  middleware.ts        protege /admin e renova a sessão
supabase/migrations/   schema, RLS, triggers e storage
scripts/create-admin.mjs  criação segura do primeiro administrador
tests/                 testes de segurança, ponta a ponta e de recuperação de senha
```

## Segurança, LGPD e SEO
- **RLS em todas as tabelas.** Visitantes só leem imóveis publicados, depoimentos publicados e configurações públicas. Contatos (leads) **nunca** são legíveis publicamente: visitantes só conseguem inserir, e apenas com consentimento.
- **Permissões de coluna:** o endereço exato só é exposto quando "Exibir endereço no site" está marcado.
- O papel do usuário não pode ser alterado pelo próprio usuário. Cadastro público desativado.
- Senhas são armazenadas com hash pelo Supabase Auth; a sessão fica em cookies renovados pelo middleware.
- Formulários com consentimento LGPD obrigatório (data e hora registradas), honeypot anti-robô e limite de envios.
- **SEO:** título e descrição por página e por imóvel, URLs amigáveis (`/imoveis/cobertura-duplex-recreio-dos-bandeirantes-lv1001`), canonical, Open Graph com a foto do imóvel, `sitemap.xml`, `robots.txt`, dados estruturados `RealEstateAgent`, `RealEstateListing` e `BreadcrumbList`, e imagens otimizadas (AVIF/WebP via `next/image`). As páginas públicas são estáticas com revalidação imediata a cada alteração no painel.
- **Acessibilidade e movimento:** animações com `IntersectionObserver` e CSS, respeitando `prefers-reduced-motion`.
