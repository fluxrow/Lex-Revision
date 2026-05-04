# Lex Revision — AI Integration

A IA do Lex Revision tem **4 capacidades** alinhadas ao que foi prometido no marketing:

1. **Sugerir cláusulas** ausentes (confidencialidade, foro, reajuste, multa)
2. **Revisar contrato** apontando riscos jurídicos
3. **Gerar contrato** a partir de prompt em linguagem natural
4. **Traduzir juridiquês** para linguagem simples (para o cliente final entender)

## Provider

**Claude Sonnet 4.5** via API da Anthropic.

Por quê: melhor para texto longo em português, melhor seguir formato estruturado, e o usuário não vai pagar custos absurdos por tokens (vs GPT-4).

```bash
pnpm add @anthropic-ai/sdk
```

```ts
// lib/ai/client.ts
import Anthropic from '@anthropic-ai/sdk'
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
```

## System prompt (compartilhado)

```
Você é um assistente jurídico especializado em direito brasileiro,
trabalhando dentro do Lex Revision — uma plataforma de automação de contratos
para escritórios de advocacia.

Princípios:
- Sempre escreva em português do Brasil formal-jurídico.
- Cite a base legal (CC, CLT, CDC) quando relevante.
- Nunca invente jurisprudência ou números de lei.
- Se o usuário pedir algo fora do escopo (ex: parecer judicial), recuse educadamente.
- Foco: contratos cíveis, comerciais, trabalhistas, locação.
```

## Endpoint 1 — Sugerir cláusulas

`POST /api/ai/clauses`

```ts
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 2000,
  system: SYSTEM_PROMPT,
  messages: [{
    role: 'user',
    content: `Analise este contrato e sugira até 3 cláusulas importantes que estão faltando.
    Retorne JSON: [{titulo, texto, motivo, prioridade: 'alta'|'media'|'baixa'}]

    CONTRATO:
    ${contractBody}`
  }]
})
```

## Endpoint 2 — Gerar contrato do zero

`POST /api/ai/generate`

```ts
// Tool calling para forçar formato estruturado
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 4000,
  system: SYSTEM_PROMPT,
  tools: [{
    name: 'create_contract',
    description: 'Cria um contrato estruturado',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        parties: { type: 'array', items: { type: 'string' } },
        clauses: { type: 'array', items: {
          type: 'object',
          properties: { number: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }
        }},
        variables: { type: 'array', items: { type: 'string' } }
      }
    }
  }],
  messages: [{ role: 'user', content: prompt }]
})
```

## Endpoint 3 — Revisar / apontar riscos

`POST /api/ai/review`

Retorna lista de pontos de atenção:
```json
[
  { "trecho": "Cláusula 5ª — multa de 50% do contrato",
    "risco": "alto",
    "motivo": "Multa superior a 10% pode ser considerada abusiva (art. 413 CC).",
    "sugestao": "Reduza para até 10% ou justifique tecnicamente." }
]
```

## Endpoint 4 — Traduzir juridiquês

`POST /api/ai/translate`

Pega trecho com termos técnicos e devolve versão em linguagem simples para o cliente final entender. Útil quando o cliente recebe o contrato e tem dúvidas.

## Custos estimados

| Operação | Tokens médios | Custo (USD) |
|----------|---------------|-------------|
| Sugerir cláusulas | 3k in / 1k out | ~$0.03 |
| Gerar contrato | 1k in / 4k out | ~$0.07 |
| Revisar | 4k in / 2k out | ~$0.05 |
| Traduzir | 500 in / 500 out | ~$0.01 |

→ Plano Starter (20 contratos) = ~R$ 5/mês de IA → **margem altíssima**.

## Rate limiting

```ts
// Por organização, por dia
starter:       100 chamadas IA/dia
professional:  500 chamadas IA/dia
firm:          ilimitado
```

Implementar em `usage_metrics` e checar antes de cada chamada.
