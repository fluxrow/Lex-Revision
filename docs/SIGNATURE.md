# Lex Revision — Assinatura Digital

## Provider recomendado: **Clicksign**

Por quê:
- **API brasileira**, em pt-BR, com docs em pt-BR
- Aceita ICP-Brasil + assinatura eletrônica simples
- Webhook nativo
- Integração simples (REST)
- Plano API a partir de R$ 0,90/assinatura → margem boa pro Lex Revision

Alternativas:
- **D4Sign** (similar)
- **DocuSign** (mais caro, mais "enterprise")
- **ZapSign** (mais barato, menos features)

## Setup

```bash
# 1. Criar conta em clicksign.com
# 2. Pegar API token em Configurações → Integrações
# 3. Adicionar no .env
CLICKSIGN_API_TOKEN=...
CLICKSIGN_WEBHOOK_SECRET=...
```

## Fluxo

```
[Usuário clica "Enviar para assinatura"]
            │
            ▼
   ┌─────────────────────┐
   │ POST /documents     │ ← upload do PDF gerado
   │ (Clicksign API)     │   retorna document.key
   └─────────────────────┘
            │
            ▼
   ┌─────────────────────┐
   │ POST /lists         │ ← cria lista de signatários
   └─────────────────────┘
            │
            ▼
   ┌─────────────────────┐
   │ POST /notifications │ ← envia e-mails para cada signatário
   └─────────────────────┘
            │
            ▼
   [Signatário assina via link]
            │
            ▼
   ┌─────────────────────┐
   │ Webhook → Lex Rev   │ ← evento auto_close
   │ /api/clicksign/...  │   atualiza signers + signature_requests
   └─────────────────────┘
            │
            ▼
   [Baixa PDF assinado e salva no bucket `signed`]
```

## Implementação (`lib/clicksign.ts`)

```ts
const BASE = 'https://app.clicksign.com/api/v1'

export async function createSignatureRequest(args: {
  pdfBuffer: Buffer,
  filename: string,
  signers: { name: string, email: string, document?: string }[],
}) {
  // 1. Upload do documento
  const doc = await fetch(`${BASE}/documents?access_token=${token}`, {
    method: 'POST',
    body: formData({ 'document[archive][original]': args.pdfBuffer, 'document[path]': args.filename })
  }).then(r => r.json())

  // 2. Criar signatários
  for (const s of args.signers) {
    await fetch(`${BASE}/signers?access_token=${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signer: { name: s.name, email: s.email, documentation: s.document, auths: ['email'] } })
    })
  }

  // 3. Adicionar à lista
  // 4. Notificar
  return doc.document.key
}
```

## Webhook handler (`app/api/clicksign/webhook/route.ts`)

```ts
export async function POST(req: Request) {
  const sig = req.headers.get('x-clicksign-signature')
  const body = await req.text()

  // Validar HMAC
  const expected = createHmac('sha256', process.env.CLICKSIGN_WEBHOOK_SECRET!).update(body).digest('hex')
  if (sig !== expected) return new Response('invalid', { status: 401 })

  const event = JSON.parse(body)

  switch (event.event.name) {
    case 'sign':           // signatário assinou
      await updateSigner(event.document.key, event.signer.email, 'signed')
      break
    case 'auto_close':     // todos assinaram → fim
      await downloadAndStore(event.document.key)
      await markContractSigned(event.document.key)
      break
    case 'refusal':
      await updateSigner(event.document.key, event.signer.email, 'refused')
      break
  }

  return new Response('ok')
}
```

## Estado no DB

A tabela `signers` tem `signature_url`, `viewed_at`, `signed_at`. O webhook escreve esses campos.

A UI em `/assinaturas` lê e renderiza a timeline (já desenhada no protótipo).

## Custos

| Volume | Preço/assinatura | Custo plano Professional (100 contratos) |
|--------|------------------|------------------------------------------|
| Pay-as-you-go | R$ 1,90 | R$ 190/mês de custo |
| Plano 500 | R$ 0,90 | R$ 90/mês |

→ Embuta no preço do plano (Starter: 20 assinaturas grátis incluídas; extras R$ 1,90).
