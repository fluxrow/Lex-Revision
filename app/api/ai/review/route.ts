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
import { buildCacheKey, lookupCache, saveCache } from "@/lib/rag/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const reviewSchema = z.object({
  documentContent: z.string().min(30),
  contractTypeHint: z.string().optional(),
});

const MODEL = "claude-sonnet-4-6";
const ROUTE_NS = "review";

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
    let rag: RagRetrievalResult | null = null;

    try {
      const ragQuery = buildRagQuery(
        payload.documentContent,
        analysis.contractLabel,
        payload.contractTypeHint
      );
      rag = await retrieveRagTemplates({
        query: ragQuery,
        k: 3,
        threshold: 0.38,
      });
    } catch (ragError: any) {
      console.warn("RAG retrieval skipped (review):", ragError.message);
    }

    if (!anthropic) {
      return NextResponse.json({
        status: "reviewed",
        provider: "heuristic",
        analysis,
        rag,
        cache: { hit: false, cache_key: cacheKey },
        review: fallback,
        content: JSON.stringify(fallback, null, 2),
      });
    }

    const ragContext = buildRagGenerationContext(rag?.matches ?? []);

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: [
        "Voce e um revisor juridico do Lex Revision especializado em contratos brasileiros.",
        "Analise risco contratual de forma estruturada, auditavel e objetiva.",
        "Nunca invente jurisprudencia. Cite base legal apenas quando ela for realmente util ao risco apontado.",
        "Use o contexto RAG (templates similares) APENAS para comparar estrutura e identificar lacunas — nunca copie clausulas literalmente.",
        "Responda somente JSON valido no formato:",
        '{"executiveSummary":"...","overallRisk":"low|medium|high","findings":[{"title":"...","risk":"low|medium|high","trecho":"...","motivo":"...","sugestao":"...","legalBasis":"opcional"}],"nextActions":["..."]}',
        buildKnowledgeBaseContext(analysis),
        ragContext || "Nenhum contexto RAG forte foi recuperado para este contrato. Avalie apenas pelo conteudo.",
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
      rag,
      review: parsed ?? fallback,
      content: rawContent,
    };

    void saveCache({
      cacheKey,
      queryText: buildReviewCacheInput(payload.documentContent, payload.contractTypeHint),
      retrievalTemplateIds: rag?.matches.map((m) => m.id) ?? [],
      llmResponse: responseBody,
      llmModel: MODEL,
      tokensInput: msg.usage?.input_tokens,
      tokensOutput: msg.usage?.output_tokens,
    });

    return NextResponse.json({
      ...responseBody,
      provider: rag?.matches.length ? "anthropic_rag" : "anthropic",
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
