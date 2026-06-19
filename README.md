# Lex Revision

> **Plataforma jurídica brasileira que junta IA, biblioteca de modelos e assinatura digital ICP-Brasil em um fluxo único.** Geração e revisão de contratos por IA, versionamento com diff, exportação `.docx`/`.pdf` e assinatura sem trocar de ferramenta.

[![Deploy](https://img.shields.io/badge/deploy-Vercel-black)](https://lex-revision.vercel.app)
[![Stack](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![DB](https://img.shields.io/badge/Supabase-Postgres%20%2B%20pgvector-3ECF8E)](https://supabase.com)
[![AI](https://img.shields.io/badge/Claude-Sonnet%204.6-D97757)](https://www.anthropic.com)

**Em produção:** https://lex-revision.vercel.app

---

## Posicionamento

| Concorrente | Forte em | Não tem |
|---|---|---|
| juridico.ai | geração de peças processuais (450k advogados) | **assinatura digital integrada** |
| **Lex Revision** | revisão profunda + assinatura ICP-Brasil + IA em PT-BR | base de usuários ainda em construção |

**Planos comerciais:** Starter R$ 97/mês · Professional R$ 297/mês · Firm R$ 697/mês.

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Node 24) |
| UI | React 19 + TypeScript 5 + Tailwind v4 |
| Auth | Supabase Auth SSR + trigger Postgres de signup |
| DB | Supabase Postgres + RLS + pgvector |
| Storage | Supabase Storage |
| IA | Anthropic Claude Sonnet 4.6 |
| RAG | Voyage AI `voyage-3` (1024 dim) + HNSW pgvector |
| Pagamento | Stripe (BRL + dynamic payment methods) |
| Assinatura | Beta interna + Clicksign (sandbox) |
| E-mails | Resend |
| Validação | Zod em 100% das rotas |
| Deploy | Vercel (team `fluxrow`) |

---

## Como rodar localmente

```bash
git clone https://github.com/fluxrow/Lex-Revision.git
cd Lex-Revision
npm install
cp .env.example .env.local
# preenche envs (ver seção abaixo)
npm run dev
# http://localhost:3000
```

### Envs principais

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# IA
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_RESTRICTED_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PROFESSIONAL=
STRIPE_PRICE_FIRM=

# Outros
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Migrations Supabase

```bash
supabase login
supabase link --project-ref pgcoyjanmuksvbxnvnhm
supabase db push
```

### Indexar templates e cláusulas no RAG

```bash
# Templates já indexados via migration 20260618163000
# Para indexar/re-indexar cláusulas BR curadas:
npx tsx scripts/rag-index-clauses.ts
supabase db push
```

---

## APIs disponíveis (20 endpoints)

| Categoria | Endpoints |
|---|---|
| Auth | login, signout, preview, redeem-voucher, activate |
| Contratos | CRUD + `export?format=docx\|pdf` |
| Clientes | GET/POST |
| IA | generate, review, clauses, translate (todos com RAG + cache) |
| Assinaturas | send, manual/respond, [id]/manage, clicksign/webhook |
| Stripe | create-session, customer-portal, webhook |
| Legal | jurisprudência |
| RAG | search |
| Account | profile, vouchers |

Todas com **validação Zod** e **fallback determinístico** quando IA/serviços externos indisponíveis.

---

## RAG (Retrieval-Augmented Generation)

7 sprints validados em produção:

| Sprint | Entrega |
|---|---|
| 1 | Schema pgvector + RPCs + RLS em 3 tabelas |
| 2 | 8 templates de contrato indexados (Voyage) |
| 3 | RAG plugado em `/api/ai/generate` |
| 3.5 | RAG em `/api/ai/review` e `/api/ai/clauses` |
| 4 | Query cache SHA-256 com TTL 7 dias |
| 4.5 | Fix `await saveCache` (fire-and-forget é cortado em serverless) |
| 5 | 20 cláusulas-padrão BR curadas com base legal |
| 6 | `rag_match_clauses` granular em `/api/ai/clauses` |
| 7 | `rag_match_clauses` granular em `/api/ai/review` + cache v2 |

### Resultados validados

| Métrica | Antes | Depois |
|---|---|---|
| Tokens/request (RAG sem cache) | ~5000 | ~1800 (**-64%**) |
| Latência cache hit | ~36s | ~470ms (**-98%**) |
| Cobertura cláusulas (contrato curto) | ~12 | 22 (**+83%**) |
| Custo Claude por contrato | $0.051 | $0.017 (**-66%**) |

### Provider tags

| Tag | Significado |
|---|---|
| `anthropic_rag_cached` | cache hit — zero tokens |
| `anthropic_rag_clauses` | RAG granular com cláusulas + risk_level |
| `anthropic_rag` | RAG só com templates |
| `anthropic` | Claude sem RAG (graceful) |
| `heuristic` / `fallback` | Claude indisponível |

**Build Kit canônico Fluxrow** disponível para replicar a stack em outros projetos (PrevLegal, AtlasPrev, Burati GT, etc.).

---

## Segurança

- ✅ RLS habilitada em todas as tabelas
- ✅ Service role só server-side; anon key no client
- ✅ Stripe webhook valida signature SHA-256
- ✅ Zod em 100% das rotas
- ✅ Zero chaves vazadas em todo o histórico de commits (auditado)
- ✅ Restricted Key (rk_*) preferida sobre Secret Key
- ✅ Fail-fast em produção quando credenciais críticas ausentes
- ✅ Trigger Postgres garante `organization + membership` no signup (sem usuário órfão)

---

## Roadmap resumido

### Concluído
App em produção · Supabase RLS multi-tenant · 20 APIs com Zod · Claude Sonnet 4.6 com RAG granular + cache · Stripe TEST E2E · Export `.docx`/`.pdf` · Versionamento com diff · DNS `lexrevision.com.br` · LP customer-facing.

### Próximas frentes
Smoke test rodada 2 autenticado · Stripe LIVE keys (decisão comercial) · WhatsApp via Meta Cloud + Embedded Signup · ZapSign (decisão) · OCR Claude Vision · Jurisprudência externa expandida · Banco de modelos 8 → 30+.

---

## Contribuindo

Repo gerenciado pela **[Fluxrow](https://fluxrow.com)**. Issues e PRs internos.

---

## Licença

Proprietary © 2026 Lex Revision® — an original by **Fluxrow**.
