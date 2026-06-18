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
      console.warn("RAG retrieval skipped (clauses):", ragError.message);
    }

    if (!anthropic) {
      return NextResponse.json({
        status: "claused",
        provider: "heuristic",
        analysis,
        rag,
        cache: { hit: false, cache_key: cacheKey },
        ...fallback,
        content: JSON.stringify(fallback, null, 2),
      });
    }

    const ragContext = buildRagGenerationContext(rag?.matches ?? []);

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: [
        "Voce trabalha dentro do Lex Revision e precisa mapear clausulas importantes com base em uma taxonomia juridica.",
        "Use o contexto RAG (templates similares da biblioteca Lex Revision) APENAS para identificar quais clausulas costumam aparecer em contratos do mesmo tipo — nunca copie literalmente.",
        "Responda somente JSON valido no formato:",
        '{"clauseCoverage":[{"id":"...","title":"...","status":"present|missing_required|missing_recommended","importance":"required|recommended","riskIfMissing":"low|medium|high","guidance":"...","sampleText":"..."}],"suggestedClauses":[{"id":"...","title":"...","priority":"low|medium|high","motivo":"...","text":"..."}]}',
        buildKnowledgeBaseContext(analysis),
        ragContext || "Nenhum contexto RAG forte foi recuperado para este contrato. Use apenas a taxonomia juridica padrao.",
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
      rag,
      clauseCoverage: parsed?.clauseCoverage ?? fallback.clauseCoverage,
      suggestedClauses: parsed?.suggestedClauses ?? fallback.suggestedClauses,
      content: rawContent,
    };

    void saveCache({
      cacheKey,
      queryText: buildClausesCacheInput(payload.documentContent, payload.contractTypeHint),
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
    console.error("AI Clauses Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze clauses" },
      { status: 500 }
    );
  }
}
