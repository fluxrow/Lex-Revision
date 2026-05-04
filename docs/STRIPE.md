# Lex Revision — Stripe Integration

## Planos

| Plano | Preço/mês | Limites | Stripe Product |
|-------|-----------|---------|----------------|
| Starter | R$ 97 | 20 contratos · IA básica · 1 usuário | `prod_lex_starter` |
| Professional | R$ 297 | 100 contratos · IA avançada · 5 usuários · assinatura digital | `prod_lex_professional` |
| Firm | R$ 697 | Ilimitado · API · usuários ilimitados · SSO + SLA | `prod_lex_firm` |

Trial: **14 dias grátis** em qualquer plano (sem cartão de crédito).

## Setup

```bash
# 1. Criar produtos
stripe products create --name "Lex Revision Starter" \
  --metadata plan=starter --metadata max_contracts=20
stripe products create --name "Lex Revision Professional" \
  --metadata plan=professional --metadata max_contracts=100
stripe products create --name "Lex Revision Firm" \
  --metadata plan=firm --metadata max_contracts=-1

# 2. Criar preços recorrentes (BRL)
stripe prices create --product prod_xxx --unit-amount 9700  --currency brl --recurring interval=month
stripe prices create --product prod_xxx --unit-amount 29700 --currency brl --recurring interval=month
stripe prices create --product prod_xxx --unit-amount 69700 --currency brl --recurring interval=month

# 3. Configurar webhook endpoint
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Em produção: https://lex-revision.com.br/api/stripe/webhook
```

## Eventos a tratar (`/api/stripe/webhook/route.ts`)

| Evento | Ação |
|--------|------|
| `customer.subscription.created` | criar `organizations.stripe_subscription_id`, set `plan` |
| `customer.subscription.updated` | atualizar `plan`, `trial_ends_at` |
| `customer.subscription.deleted` | downgrade para `trial` ou bloquear |
| `invoice.payment_succeeded` | criar row em `invoices` com status='paid' |
| `invoice.payment_failed` | enviar e-mail de falha + grace period 7d |
| `checkout.session.completed` | linkar `stripe_customer_id` ao escritório |

## Customer Portal

Permite o usuário gerenciar pagamento, ver faturas, cancelar — tudo hospedado pelo Stripe.

```ts
// app/api/stripe/portal/route.ts
const session = await stripe.billingPortal.sessions.create({
  customer: org.stripe_customer_id,
  return_url: `${origin}/faturamento`,
});
return Response.redirect(session.url);
```

Botão na tela `/faturamento` → `Gerenciar assinatura` → redireciona pro portal.

## Métricas / billing por uso (futuro)

Para o plano **Firm** com cobrança variável:
- `stripe.subscriptionItems.createUsageRecord()` no fim de cada `contracts.created`
- Métrica: `usage_metrics.metric = 'contracts_created'`
- Reportar mensalmente no fechamento do ciclo

## Checklist de produção

- [ ] Modo `live` (não `test`) configurado
- [ ] Webhook endpoint com `STRIPE_WEBHOOK_SECRET` validando assinatura
- [ ] Preços BRL com NF-e brasileira (Stripe Tax ou integração com Asaas/Iugu)
- [ ] PIX habilitado como método de pagamento (Stripe Brasil suporta)
- [ ] E-mails transacionais traduzidos para pt-BR
- [ ] Trial de 14 dias sem cobrança
- [ ] Upgrade/downgrade com prorrateamento
