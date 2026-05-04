# Lex Revision — Architecture

## Visão geral

```
┌────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Auth pages │  │ App (sidebar)│  │ Marketing site│   │
│  └────────────┘  └──────────────┘  └──────────────┘    │
└─────────┬────────────────┬────────────────┬────────────┘
          │                │                │
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Supabase Auth│  │ Next.js API  │  │ Vercel Edge  │
│   (JWT)      │  │   Routes     │  │   (CDN)      │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Postgres    │ │  Anthropic   │ │   Stripe     │
│  (Supabase)  │ │  Claude API  │ │   API        │
└──────────────┘ └──────────────┘ └──────────────┘
        │                                  │
        ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│   Storage    │                  │  Clicksign   │
│  (Supabase)  │                  │  (assinatura)│
└──────────────┘                  └──────────────┘
```

## Fluxos principais

### 1. Cadastro / login
1. Usuário cria conta → Supabase Auth → cria `auth.users`
2. Trigger pós-signup cria `organizations` (escritório) + `memberships` (owner)
3. Cria customer no Stripe → linka `stripe_customer_id`
4. Inicia trial de 14 dias

### 2. Criar contrato (fluxo principal — 3 entradas)
**A. Upload de modelo:**
1. Usuário faz upload .docx → bucket `templates/{org}/{uuid}.docx`
2. Edge Function `extract-variables` parseia e retorna `{{NOME}}, {{CPF}}, ...`
3. Salva em `contract_templates.variables` (JSONB)
4. Usuário preenche → preview HTML ao vivo (client-side)
5. IA sugere cláusulas faltantes
6. Salva como `contracts.draft` → renderiza PDF → bucket `contracts/`

**B. Geração com IA:**
1. Usuário digita prompt → `/api/ai/generate`
2. Claude retorna estrutura `{title, clauses[], variables[]}`
3. Usuário revisa e edita → mesmo fluxo de preenchimento
4. Salva como contrato

**C. Da biblioteca:**
1. Lista templates onde `is_global=true OR organization_id=current_org`
2. Usuário escolhe → mesmo fluxo do A (já tem variáveis)

### 3. Enviar para assinatura
1. Usuário escolhe signatários (do CRM ou novos)
2. `POST /api/signatures/send` → cria `signature_requests` + chama Clicksign
3. Clicksign envia e-mails
4. Cada signatário assina → webhook atualiza `signers.status`
5. Quando `total_signed = total_signers` → baixa PDF assinado → `signed` bucket → `contracts.signed_at`

### 4. Faturamento
1. Webhooks Stripe atualizam `organizations.plan`, `invoices`
2. Página `/faturamento` lê do DB (não do Stripe direto)
3. Botão "Gerenciar assinatura" → Stripe Customer Portal

## Decisões técnicas

| Decisão | Justificativa |
|---------|---------------|
| **Next.js App Router** | Server Components reduzem JS no client; ideal para SaaS |
| **Supabase** | Postgres + Auth + Storage + Edge em 1 só, ótimo BR pricing |
| **shadcn/ui** | Componentes copy-paste, total controle visual, casa com o protótipo |
| **Multi-tenant via RLS** | Mais simples que schema-per-tenant, escala bem até 10k orgs |
| **Edge Functions p/ parsing .docx** | Roda perto do Storage, sem precisar fazer download no client |
| **Claude p/ IA** | Melhor pt-BR, contexto longo, custo razoável |
| **Clicksign p/ assinatura** | Provider BR, ICP-Brasil, API simples |
| **Stripe BRL + PIX** | Único provider que faz tudo (recorrência + PIX + Tax) |

## Performance targets

- **First Load JS:** < 150 KB (gzip)
- **TTI (Time to Interactive):** < 2s em 4G
- **Render do preview ao vivo:** < 50ms por keystroke (debounce 100ms)
- **Geração de PDF:** < 3s para contrato de 5 páginas
- **Chamada IA (sugerir cláusulas):** < 5s p95

## Segurança

- ✅ RLS em todas as tabelas (ver `db/policies.sql`)
- ✅ Service role apenas em webhooks/Edge Functions, nunca no client
- ✅ Validação Zod em todos os endpoints
- ✅ Rate limiting via Upstash (10 req/s por IP em endpoints de IA)
- ✅ HMAC nos webhooks (Stripe + Clicksign)
- ✅ LGPD: campos de DPO em footer, consentimento explícito no signup
- ✅ Logs de auditoria (`activity_logs`) para todas as ações sensíveis

## Roadmap pós-MVP

- [ ] App mobile nativo (Expo) — prioridade média
- [ ] Integração WhatsApp (envio de contrato + assinatura via WhatsApp)
- [ ] OCR de contratos escaneados (Claude Vision)
- [ ] Marketplace de modelos premium (revenue share com advogados)
- [ ] API pública para escritórios grandes (plano Firm)
- [ ] Integração com sistemas jurídicos (Astrea, Projuris, ADVBOX)
