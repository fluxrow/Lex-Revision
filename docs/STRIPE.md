# Guia de Integração Stripe

Este documento detalha como configurar a infraestrutura de pagamentos (Stripe) para a plataforma Lex Revision.

## 1. Modo de Teste
Certifique-se de que a chave "Modo de teste" no canto superior direito do [Stripe Dashboard](https://dashboard.stripe.com) está **ativada**.

## 2. Chaves de API
1. Acesse `Desenvolvedores > Chaves de API`.
2. Copie as chaves para o arquivo `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_PRICE_STARTER=price_...`
   - `STRIPE_PRICE_PROFESSIONAL=price_...`
   - `STRIPE_PRICE_FIRM=price_...`

## 3. Catálogo de Produtos
1. Acesse `Produtos > Adicionar produto`.
2. Crie dois planos para o Lex Revision:
   - **Plano Starter**: Sugestão de valor `R$ 97,00/mês`.
   - **Plano Pro**: Sugestão de valor `R$ 297,00/mês`.
3. Ao salvar o produto, a tabela de preços irá gerar uma ID (ex: `price_1PXXX...`).
4. Salve essas IDs nas variáveis:
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_PROFESSIONAL`
   - `STRIPE_PRICE_FIRM`

## 4. Webhooks
Os Webhooks são responsáveis por avisar o nosso sistema quando um cliente pagar a fatura.
1. Vá em `Desenvolvedores > Webhooks > Adicionar endpoint`.
2. Para **desenvolvimento local**, use a CLI do Stripe:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   A CLI fornecerá um `whsec_...` (Webhook Secret).
3. Para **produção** (Vercel):
   - Adicione o endpoint `https://lex-revision.vercel.app/api/stripe/webhook`.
   - Selecione os eventos:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
   - Copie o segredo de assinatura gerado pelo Stripe Dashboard.
4. Cole o segredo na variável `STRIPE_WEBHOOK_SECRET` do seu `.env.local` e no painel da Vercel.

## 5. Fluxo da Aplicação
Fluxo comercial principal:

1. Usuário entra na LP
2. Escolhe um plano na seção de preços
3. A LP chama `/api/stripe/create-session`
4. Stripe Checkout processa o pagamento
5. Em sucesso, o usuário volta para `/signup?checkout=success`
6. Só depois disso ele ativa o acesso e entra na plataforma

O `/login` fica para clientes já ativos.
