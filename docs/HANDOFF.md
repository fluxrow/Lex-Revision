# Lex Revision — Handoff para Claude Code

> **Para você que está abrindo isto no Claude Code:** este pacote contém o
> design completo + blueprint técnico do Lex Revision.
> Sua missão é transformar isso em um app **real, operacional, em produção**.

## Pré-requisitos (acesso necessário)

Você precisa ter logado/autenticado nas seguintes contas — todas são da `fluxrow`:

- [ ] **GitHub** (`fluxrow`) — para criar `github.com/fluxrow/lex-revision`
- [ ] **Supabase** — projeto novo ou já criado
- [ ] **Stripe** — modo `live` para BR (BRL + PIX habilitado)
- [ ] **Anthropic** — API key com créditos
- [ ] **Clicksign** — API token de produção
- [ ] **Vercel** (recomendado para deploy) — ou Cloudflare Pages
- [ ] **Domínio** — `lex-revision.com.br` ou similar

## Checklist de implementação (na ordem)

### Fase 1 — Setup (1 dia)

- [ ] `gh repo create fluxrow/lex-revision --private --clone`
- [ ] `pnpm dlx create-next-app@latest . --ts --tailwind --app --src-dir=false`
- [ ] Copiar `db/`, `docs/`, e o protótipo `Lex Revision App.html` (como referência)
- [ ] Instalar deps: `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `@anthropic-ai/sdk`, `lucide-react`, `sonner`, `zod`, `react-hook-form`, `@hookform/resolvers`
- [ ] Configurar `shadcn/ui`: `pnpm dlx shadcn@latest init`
- [ ] Adicionar componentes shadcn que casam com o protótipo: button, input, dialog, sheet, dropdown-menu, table, tabs, toast, card, badge, avatar, separator, select, switch, progress, skeleton

### Fase 2 — Banco e auth (1 dia)

- [ ] Supabase: criar projeto → aplicar `db/schema.sql` + `db/policies.sql`
- [ ] Criar buckets: `templates`, `contracts`, `signed`, `logos`
- [ ] Configurar Auth: email/senha + Google OAuth
- [ ] Implementar `lib/supabase/{server,client,middleware}.ts`
- [ ] Trigger pós-signup (criar org + membership owner)
- [ ] Custom JWT claim com `organization_id`

### Fase 3 — App shell (1 dia)

Use o protótipo `Lex Revision App.html` como referência **pixel-perfect**.

- [ ] `app/layout.tsx` com tema dark/light (CSS vars de `app/styles.css`)
- [ ] `components/shell/Sidebar.tsx` (idêntico ao protótipo)
- [ ] `components/shell/Topbar.tsx`
- [ ] `components/shell/MobileNav.tsx`
- [ ] Middleware de proteção de rotas (`(app)/` requer auth)

### Fase 4 — Telas (3-5 dias)

Cada uma tem o desenho pronto no protótipo:

- [ ] `(auth)/login` + `(auth)/signup`
- [ ] `(app)/dashboard`
- [ ] `(app)/novo` + `/upload` + `/ia` + `/modelo`
- [ ] `(app)/historico`
- [ ] `(app)/modelos`
- [ ] `(app)/clientes`
- [ ] `(app)/assinaturas`
- [ ] `(app)/config`
- [ ] `(app)/faturamento`

### Fase 5 — Integrações (3 dias)

- [ ] **Parser .docx:** Edge Function `extract-variables` (ver `docs/SUPABASE.md`)
- [ ] **IA Claude:** 4 endpoints (`docs/AI.md`)
- [ ] **Stripe:** webhook + checkout + portal (`docs/STRIPE.md`)
- [ ] **Clicksign:** envio + webhook (`docs/SIGNATURE.md`)
- [ ] **Geração PDF:** usar `puppeteer-core` + `chromium-min` no Vercel, ou `react-pdf`

### Fase 6 — Polimento e go-live (2 dias)

- [ ] E-mails transacionais (Resend ou Supabase Auth) em pt-BR
- [ ] Onboarding guiado (criar 1º contrato no signup)
- [ ] Rate limiting (Upstash)
- [ ] Sentry para erros
- [ ] PostHog para analytics
- [ ] LGPD: termos, privacidade, DPO
- [ ] Deploy Vercel + DNS apontando pro domínio
- [ ] Modo Stripe `live` ativo
- [ ] Smoke tests no fluxo completo: signup → upload → preencher → IA → assinar → pagar

## Arquivos importantes neste pacote

```
fluxrow/lex-revision/
├── README.md                 ← visão geral
├── Lex Revision App.html     ← PROTÓTIPO VISUAL (use como design source-of-truth)
├── app/                      ← código JSX do protótipo (referência de componentes)
├── db/
│   ├── schema.sql            ← cole no SQL Editor do Supabase
│   └── policies.sql          ← cole depois de schema
└── docs/
    ├── ARCHITECTURE.md
    ├── SUPABASE.md
    ├── STRIPE.md
    ├── AI.md
    ├── SIGNATURE.md
    └── HANDOFF.md            ← este arquivo
```

## Como usar o protótipo como referência

Ao construir cada tela no Next.js:

1. Abra `Lex Revision App.html` no navegador
2. Navegue até a tela que você está construindo
3. Compare o resultado em Next.js — devem ser **visualmente idênticos**
4. Use as mesmas CSS vars (`--accent`, `--surface`, etc) — copie de `app/styles.css`
5. Use os mesmos espaçamentos, cores, tipografia, ícones

> **Princípio:** o protótipo HTML/JSX **é o design system**. Não reinvente.

## Estimativa de tempo total

- **MVP funcional (1 dev sênior):** ~12 dias úteis
- **MVP com Claude Code assistindo:** ~5-7 dias úteis
- **Beta privado:** + 1 semana de testes com 5 escritórios amigos
- **Lançamento público:** + 2 semanas (marketing, onboarding, suporte)

## Variáveis de ambiente (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx
STRIPE_PRICE_FIRM=price_xxx

# Anthropic
ANTHROPIC_API_KEY=

# Clicksign
CLICKSIGN_API_TOKEN=
CLICKSIGN_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://lex-revision.com.br
```

## Suporte

Quando travar em algo, volte aqui no estúdio de design e peça ajustes no protótipo.
Use o pacote como sua **fonte da verdade visual**.

Boa sorte. 🚀
