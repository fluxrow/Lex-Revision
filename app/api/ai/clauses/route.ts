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
import { NextResponse } from "next/server";
import { z } from "zod";

const clausesSchema = z.object({
  documentContent: z.string().min(30),
  contractTypeHint: z.string().optional(),
});

/**
 * Constrói a query para retrieval RAG a partir do contrato + hint.
 * Para clauses, prioriza tipo de contrato + primeiros 500 chars para
 * trazer templates similares que ajudam a identificar cláusulas-padrão.
 */
function buildRagQuery(documentContent: string, contractLabel?: string, hint?: string): string {
  const parts = [hint, contractLabel, documentContent.slice(0, 500)].filter(Boolean);
  return parts.join(" — ");
}

export async function POST(request: Request) {
  try {
    const payload = clausesSchema.parse(await request.json());
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
        ...fallback,
        content: JSON.stringify(fallback, null, 2),
      });
    }

    const ragContext = buildRagGenerationContext(rag?.matches ?? []);

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
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

    return NextResponse.json({
      status: "claused",
      provider: rag?.matches.length ? "anthropic_rag" : "anthropic",
      analysis,
      rag,
      clauseCoverage: parsed?.clauseCoverage ?? fallback.clauseCoverage,
      suggestedClauses: parsed?.suggestedClauses ?? fallback.suggestedClauses,
      content: rawContent,
    });
  } catch (error: any) {
    console.error("AI Clauses Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze clauses" },
      { status: 500 }
    );
  }
}
