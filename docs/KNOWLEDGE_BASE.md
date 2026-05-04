# Lex Revision — Knowledge Base e Ingestao

## Objetivo

Fazer a analise contratual do Lex depender menos de texto solto e mais de uma base juridica auditavel.

## Arquitetura proposta

1. Upload do documento bruto (`.docx`, `.pdf`)
2. Pipeline de ingestao estrutural
3. Normalizacao do contrato em seções, clausulas, partes, datas, valores e metadados
4. Enriquecimento com a base juridica do Lex
5. Revisao por IA ancorada nessa base
6. UI mostra:
   - cobertura de clausulas
   - riscos
   - clausulas ausentes
   - sugestoes de redacao

## Papel do Docling

O Docling entra muito bem como etapa 2.

Ele deve ser usado para:

- extrair texto com hierarquia preservada
- manter tabelas e listas quando fizer sentido
- reduzir perda de estrutura em PDF
- entregar base melhor para chunking e classificacao de clausulas

## Fluxo alvo

```text
upload -> docling -> contrato estruturado -> knowledge base -> analise heuristica -> LLM -> UI
```

## O que ja foi preparado no codigo

- `lib/legal/knowledge-base.ts`
  Base inicial de tipos de contrato, catalogo de clausulas e guias de redacao.
- `lib/legal/analysis.ts`
  Analise heuristica local para detectar tipo contratual, cobertura de clausulas e pontos de risco.
- `app/api/ai/review/route.ts`
  Passa a poder revisar com fallback local mesmo sem Anthropic.
- `app/api/ai/clauses/route.ts`
  Passa a poder sugerir clausulas faltantes a partir da base do Lex.

## Proximos passos

1. Salvar o contrato estruturado no banco
2. Criar tabela para versoes de analise
3. Integrar Docling no pipeline de upload
4. Medir qualidade por tipo de contrato
5. Permitir playbooks por escritorio

## Modelo de dado sugerido

```json
{
  "contract_type": "service_agreement",
  "sections": [
    {
      "title": "Clausula 1 - Objeto",
      "text": "..."
    }
  ],
  "parties": [],
  "dates": [],
  "amounts": [],
  "detected_clause_ids": ["scope", "fees", "term"]
}
```
