# 🔥 Fogo no Butico

Rede social de paquera com vibe — MVP em **Next.js 14 + Supabase**.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (tema dark + rosa fogo)
- Supabase (Auth, Postgres, Storage, RLS)
- lucide-react

## Estrutura

```
app/                  rotas (App Router)
  login/ signup/      auth
  onboarding/         primeiro perfil
  postar/             criar post ou story
  buscar/             busca por nome/cidade/intenção
  ranking/            "Mais Quente da Semana"
  perfil/[username]/  perfil público
  page.tsx            feed + fogueira
components/           Sidebar, BottomNav, PostCard, Fogueira, StoryViewer, RankingPanel, etc.
lib/
  supabase/           clients (browser, server, middleware)
  feed.ts             query do feed
  utils.ts            helpers visuais (gradientes, timeAgo, compressImage)
types/database.ts     tipos das tabelas/views
supabase/
  schema.sql          schema + RLS + views + buckets
  seed.ts             popula com 8 perfis fake
middleware.ts         refresh de sessão + guards
```

## Setup local

### 1. Criar o projeto no Supabase

1. Cria um projeto novo em https://supabase.com.
2. **SQL Editor** → cole o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e roda.
   Isso cria tabelas, enums, view do ranking, trigger de auto-profile e policies RLS, e os buckets `media` + `avatars`.
3. Em **Authentication → Providers → Email**, deixa _Confirm email_ desligado (pra teste local ficar fácil). Ou ajusta conforme preferir.

### 2. Variáveis de ambiente

Copia o arquivo de exemplo e preenche:

```bash
cp .env.local.example .env.local
```

Pega no painel do Supabase (**Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # só pro seed; nunca expor no front
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

### 4. Popular com dados de teste (opcional)

```bash
npm run seed
```

Cria 8 perfis (senha `fogo1234`), posts, reações, stories e comentários. Logins:

```
re@fogo.test  bru@fogo.test  lara@fogo.test  teo@fogo.test
manu@fogo.test  dao@fogo.test  ju@fogo.test  rafa@fogo.test
```

## Modelo de dados

| Tabela      | Resumo                                                              |
|-------------|---------------------------------------------------------------------|
| `profiles`  | 1×1 com `auth.users`. username, bio, idade, cidade, looking_for.    |
| `posts`     | mídia + caption do dono.                                            |
| `reactions` | UNIQUE(post_id, user_id). Hoje só `type = 'fire'`.                  |
| `comments`  | body curto (1–500 chars).                                           |
| `stories`   | `expires_at = created_at + 24h`. View `active_stories` filtra ativos. |

**Views:**
- `post_stats` — contadores de 🔥 e comentários por post.
- `weekly_ranking` — perfis ordenados por 🔥 dos últimos 7 dias (`rank() over`).
- `active_stories` — stories cuja `expires_at > now()`.

**RLS:** todas as tabelas têm read-public no que cabe, write só do dono. Storage segue o mesmo padrão por `uid/` no prefixo do path.

## Features do MVP

- ✅ Auth email/senha + onboarding
- ✅ Feed cronológico com Fogueira (stories 24h)
- ✅ Botão 🔥 com optimistic UI
- ✅ Comentários (modal)
- ✅ Criar post / story com upload + compressão de imagem
- ✅ Perfil com stats e grid
- ✅ Busca por username/nome/cidade + filtro por intenção
- ✅ Ranking semanal (pódio + lista)
- ✅ Estados de loading / empty / error em todas as telas
- ✅ Mobile-first com bottom nav, sidebar no desktop

## Fora do MVP (fase 2)

- Match ("DEU FOGO!") + chat privado (Realtime)
- Premium / boost
- Moderação (denúncia, bloqueio, verificado)
- Geo / distância nos filtros

## Deploy no Vercel

### 1. Subir o código pro GitHub

```bash
# crie um repo vazio em https://github.com/new (não inicialize com README/license)
git remote add origin git@github.com:SEU_USUARIO/fogo-no-butico.git
git branch -M main
git push -u origin main
```

### 2. Importar no Vercel

1. Vai em https://vercel.com/new
2. **Import Git Repository** → escolhe o repo recém-criado
3. **Framework Preset** detecta Next.js sozinho
4. Em **Environment Variables**, adiciona:
   - `NEXT_PUBLIC_SUPABASE_URL` → valor do seu `.env.local`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → valor do seu `.env.local`
5. **Deploy**

### 3. Configurar Supabase pra aceitar o domínio do Vercel

Depois do primeiro deploy, copie a URL pública (`https://fogo-no-butico.vercel.app` ou similar) e:

1. No painel do Supabase → **Authentication → URL Configuration**
2. **Site URL** → `https://SEU-DOMINIO.vercel.app`
3. **Redirect URLs** → adiciona `https://SEU-DOMINIO.vercel.app/**`
4. Salva

Sem isso o magic link / fluxo de signup pode quebrar em prod.

### 4. Auto-deploy a cada push

Já tá ligado por padrão. `git push` na branch `main` redeploya automaticamente.

## Notas

- A trigger `handle_new_user` cria um `profile` automático no signup com username placeholder (derivado do email). O onboarding sobrescreve.
- Stories expiram via filtro `expires_at > now()` na view `active_stories` — sem precisar de cron.
- Compressão de imagem é feita no cliente antes do upload pro Storage (`lib/utils.ts → compressImage`).
- Service role key **só** é usada no script de seed local; não vaza pro front.
