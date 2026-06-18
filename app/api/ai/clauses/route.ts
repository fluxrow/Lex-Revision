import { extractTextContent, parseJsonFromText } from "@/lib/ai/json";
import { getAnthropicClient } from "@/lib/ai/client";
import {
  analyzeContractDocument,
  buildClauseSuggestionsFallback,
  buildKnowledgeBaseContext,
} from "@/lib/legal/analysis";
import {
  buildRagGenerationContext,
  retrieveRagTemplates,
  type RagRetrievalResult,
} from "@/lib/rag/templates";
import {
  buildRagClausesContext,
  retrieveRagClauses,
  type RagClauseRetrievalResult,
} from "@/lib/rag/clauses";
import { buildCacheKey, lookupCache, saveCache } from "@/lib/rag/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const clausesSchema = z.object({
  documentContent: z.string().min(30),
  contractTypeHint: z.string().optional(),
});

const MODEL = "claude-sonnet-4-6";
const ROUTE_NS = "clauses";

function buildRagQuery(documentContent: string, contractLabel?: string, hint?: string): string {
  const parts = [hint, contractLabel, documentContent.slice(0, 500)].filter(Boolean);
  return parts.join(" — ");
}

function buildClausesCacheInput(documentContent: string, hint?: string): string {
  return `hint=${hint ?? ""}::doc=${documentContent}`;
}

/**
 * Determina a tag de provider mais específica possível, considerando os dois
 * tipos de retrieval (template estrutural + cláusulas granulares).
 */
function deriveProviderTag(
  ragTemplates: RagRetrievalResult | null,
  ragClauses: RagClauseRetrievalResult | null
): string {
  const hasClauses = (ragClauses?.matches.length ?? 0) > 0;
  const hasTemplates = (ragTemplates?.matches.length ?? 0) > 0;
  if (hasClauses) return "anthropic_rag_clauses";
  if (hasTemplates) return "anthropic_rag";
  return "anthropic";
}

export async function POST(request: Request) {
  try {
    const payload = clausesSchema.parse(await request.json());

    // 1) Cache lookup
    const cacheKey = buildCacheKey(
      ROUTE_NS,
      buildClausesCacheInput(payload.documentContent, payload.contractTypeHint)
    );
    const cached = await lookupCache(cacheKey);
    if (cached.hit) {
      return NextResponse.json({
        ...cached.response,
        provider: "anthropic_rag_cached",
        cache: cached.meta,
      });
    }

    const analysis = analyzeContractDocument(
      payload.documentContent,
      payload.contractTypeHint
    );
    const fallback = buildClauseSuggestionsFallback(analysis);
    const anthropic = getAnthropicClient();

    // 2) Dois retrievals em paralelo: templates (contexto estrutural) +
    //    cláusulas (granular para detecção de faltantes)
    let ragTemplates: RagRetrievalResult | null = null;
    let ragClauses: RagClauseRetrievalResult | null = null;

    const ragQuery = buildRagQuery(
      payload.documentContent,
      analysis.contractLabel,
      payload.contractTypeHint
    );

    const [tmplResult, clauseResult] = await Promise.allSettled([
      retrieveRagTemplates({ query: ragQuery, k: 2, threshold: 0.38 }),
      retrieveRagClauses({ query: ragQuery, k: 8, threshold: 0.32 }),
    ]);

    if (tmplResult.status === "fulfilled") ragTemplates = tmplResult.value;
    else console.warn("RAG templates skipped (clauses):", tmplResult.reason?.message);

    if (clauseResult.status === "fulfilled") ragClauses = clauseResult.value;
    else console.warn("RAG clauses skipped:", clauseResult.reason?.message);

    if (!anthropic) {
      return NextResponse.json({
        status: "claused",
        provider: "heuristic",
        analysis,
        rag: ragTemplates,
        ragClauses,
        cache: { hit: false, cache_key: cacheKey },
        ...fallback,
        content: JSON.stringify(fallback, null, 2),
      });
    }

    const templateContext = buildRagGenerationContext(ragTemplates?.matches ?? []);
    const clausesContext = buildRagClausesContext(ragClauses?.matches ?? []);

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: [
        "Voce trabalha dentro do Lex Revision e precisa mapear clausulas importantes com base em uma taxonomia juridica.",
        "Use o contexto RAG abaixo para identificar quais clausulas costumam aparecer em contratos do mesmo tipo, qual e a base legal de cada uma e o risco de ausencia. Nunca copie textos literalmente.",
        "Quando uma clausula da biblioteca aparecer no contexto e nao estiver presente no contrato analisado, marque-a como missing com a importance correspondente (required para risco alto, recommended para medio/baixo).",
        "Responda somente JSON valido no formato:",
        '{"clauseCoverage":[{"id":"...","title":"...","status":"present|missing_required|missing_recommended","importance":"required|recommended","riskIfMissing":"low|medium|high","guidance":"...","sampleText":"..."}],"suggestedClauses":[{"id":"...","title":"...","priority":"low|medium|high","motivo":"...","text":"..."}]}',
        buildKnowledgeBaseContext(analysis),
        templateContext ||
          "Nenhum template estrutural similar foi recuperado.",
        clausesContext ||
          "Nenhuma clausula granular foi recuperada — use apenas a taxonomia juridica padrao.",
      ].join("\n\n"),
      messages: [
        {
          role: "user",
          content: `Mapeie as clausulas do contrato abaixo e sugira redacoes para o que estiver faltando.\n\nCONTRATO:\n${payload.documentContent}`,
        },
      ],
    });

    const rawContent = extractTextContent(msg.content);
    const parsed = parseJsonFromText<typeof fallback>(rawContent);

    const responseBody = {
      status: "claused" as const,
      analysis,
      rag: ragTemplates,
      ragClauses,
      clauseCoverage: parsed?.clauseCoverage ?? fallback.clauseCoverage,
      suggestedClauses: parsed?.suggestedClauses ?? fallback.suggestedClauses,
      content: rawContent,
    };

    // await garante cache em 100% (fire-and-forget é cortado pelo Vercel serverless)
    await saveCache({
      cacheKey,
      queryText: buildClausesCacheInput(payload.documentContent, payload.contractTypeHint),
      retrievalTemplateIds: [
        ...(ragTemplates?.matches.map((m) => m.id) ?? []),
        ...(ragClauses?.matches.map((m) => m.id) ?? []),
      ],
      llmResponse: responseBody,
      llmModel: MODEL,
      tokensInput: msg.usage?.input_tokens,
      tokensOutput: msg.usage?.output_tokens,
    });

    return NextResponse.json({
      ...responseBody,
      provider: deriveProviderTag(ragTemplates, ragClauses),
      cache: { hit: false, cache_key: cacheKey },
    });
  } catch (error: any) {
    console.error("AI Clauses Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze clauses" },
      { status: 500 }
    );
  }
}
