import { extractTextContent, parseJsonFromText } from "@/lib/ai/json";
import { getAnthropicClient } from "@/lib/ai/client";
import {
  analyzeContractDocument,
  buildKnowledgeBaseContext,
  buildReviewFallback,
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

const reviewSchema = z.object({
  documentContent: z.string().min(30),
  contractTypeHint: z.string().optional(),
});

const MODEL = "claude-sonnet-4-6";
// v2: post Sprint 7 (RAG granular + templates). Mudar namespace força refresh
// do cache, garantindo que respostas servidas tenham o novo ragClauses field.
const ROUTE_NS = "review_v2";

/**
 * Constrói a query para retrieval RAG a partir do contrato + hint.
 * Mistura tipo de contrato (se conhecido) + primeiros 600 chars do documento
 * para o embedding semântico capturar a "intenção" do contrato.
 */
function buildRagQuery(documentContent: string, contractLabel?: string, hint?: string): string {
  const parts = [hint, contractLabel, documentContent.slice(0, 600)].filter(Boolean);
  return parts.join(" — ");
}

/**
 * Cache key inclui hint + documentContent — duas revisões do mesmo contrato
 * com hints diferentes devem ser cacheadas separadamente.
 */
function buildReviewCacheInput(documentContent: string, hint?: string): string {
  return `hint=${hint ?? ""}::doc=${documentContent}`;
}

export async function POST(request: Request) {
  try {
    const payload = reviewSchema.parse(await request.json());

    // 1) Cache lookup
    const cacheKey = buildCacheKey(
      ROUTE_NS,
      buildReviewCacheInput(payload.documentContent, payload.contractTypeHint)
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
    const fallback = buildReviewFallback(analysis);
    const anthropic = getAnthropicClient();

    // Dois retrievals em paralelo: templates (estrutural) + cláusulas (granular)
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
    else console.warn("RAG templates skipped (review):", tmplResult.reason?.message);

    if (clauseResult.status === "fulfilled") ragClauses = clauseResult.value;
    else console.warn("RAG clauses skipped (review):", clauseResult.reason?.message);

    if (!anthropic) {
      return NextResponse.json({
        status: "reviewed",
        provider: "heuristic",
        analysis,
        rag: ragTemplates,
        ragClauses,
        cache: { hit: false, cache_key: cacheKey },
        review: fallback,
        content: JSON.stringify(fallback, null, 2),
      });
    }

    const templateContext = buildRagGenerationContext(ragTemplates?.matches ?? []);
    const clausesContext = buildRagClausesContext(ragClauses?.matches ?? []);

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: [
        "Voce e um revisor juridico do Lex Revision especializado em contratos brasileiros.",
        "Analise risco contratual de forma estruturada, auditavel e objetiva.",
        "Nunca invente jurisprudencia. Cite base legal apenas quando ela for realmente util ao risco apontado.",
        "Use o contexto RAG (templates estruturais + clausulas granulares da biblioteca BR) para:",
        "- Identificar com precisao quais riscos sao tipicos do tipo de contrato",
        "- Apontar lacunas concretas usando metadata clause_type e risk_level",
        "- Marcar risco final 'high' quando uma clausula granular de risk=high estiver ausente",
        "- Nunca copiar texto literalmente",
        "Responda somente JSON valido no formato:",
        '{"executiveSummary":"...","overallRisk":"low|medium|high","findings":[{"title":"...","risk":"low|medium|high","trecho":"...","motivo":"...","sugestao":"...","legalBasis":"opcional"}],"nextActions":["..."]}',
        buildKnowledgeBaseContext(analysis),
        templateContext || "Nenhum template estrutural similar foi recuperado.",
        clausesContext || "Nenhuma clausula granular foi recuperada.",
      ].join("\n\n"),
      messages: [
        {
          role: "user",
          content: `Revise o contrato abaixo.\n\nCONTRATO:\n${payload.documentContent}`,
        },
      ],
    });

    const rawContent = extractTextContent(msg.content);
    const parsed = parseJsonFromText<typeof fallback>(rawContent);

    const responseBody = {
      status: "reviewed" as const,
      analysis,
      rag: ragTemplates,
      ragClauses,
      review: parsed ?? fallback,
      content: rawContent,
    };

    // await garante cache em 100% (fire-and-forget é cortado pelo Vercel serverless)
    await saveCache({
      cacheKey,
      queryText: buildReviewCacheInput(payload.documentContent, payload.contractTypeHint),
      retrievalTemplateIds: [
        ...(ragTemplates?.matches.map((m) => m.id) ?? []),
        ...(ragClauses?.matches.map((m) => m.id) ?? []),
      ],
      llmResponse: responseBody,
      llmModel: MODEL,
      tokensInput: msg.usage?.input_tokens,
      tokensOutput: msg.usage?.output_tokens,
    });

    const hasClauses = (ragClauses?.matches.length ?? 0) > 0;
    const hasTemplates = (ragTemplates?.matches.length ?? 0) > 0;
    const providerTag = hasClauses
      ? "anthropic_rag_clauses"
      : hasTemplates
      ? "anthropic_rag"
      : "anthropic";

    return NextResponse.json({
      ...responseBody,
      provider: providerTag,
      cache: { hit: false, cache_key: cacheKey },
    });
  } catch (error: any) {
    console.error("AI Review Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to review text" },
      { status: 500 }
    );
  }
}
