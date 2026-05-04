import { extractTextContent, parseJsonFromText } from "@/lib/ai/json";
import { getAnthropicClient } from "@/lib/ai/client";
import {
  analyzeContractDocument,
  buildClauseSuggestionsFallback,
  buildKnowledgeBaseContext,
} from "@/lib/legal/analysis";
import { NextResponse } from "next/server";
import { z } from "zod";

const clausesSchema = z.object({
  documentContent: z.string().min(30),
  contractTypeHint: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = clausesSchema.parse(await request.json());
    const analysis = analyzeContractDocument(
      payload.documentContent,
      payload.contractTypeHint
    );
    const fallback = buildClauseSuggestionsFallback(analysis);
    const anthropic = getAnthropicClient();

    if (!anthropic) {
      return NextResponse.json({
        status: "claused",
        provider: "heuristic",
        analysis,
        ...fallback,
        content: JSON.stringify(fallback, null, 2),
      });
    }

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1600,
      system: [
        "Voce trabalha dentro do Lex Revision e precisa mapear clausulas importantes com base em uma taxonomia juridica.",
        "Responda somente JSON valido no formato:",
        '{"clauseCoverage":[{"id":"...","title":"...","status":"present|missing_required|missing_recommended","importance":"required|recommended","riskIfMissing":"low|medium|high","guidance":"...","sampleText":"..."}],"suggestedClauses":[{"id":"...","title":"...","priority":"low|medium|high","motivo":"...","text":"..."}]}',
        buildKnowledgeBaseContext(analysis),
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
      provider: "anthropic",
      analysis,
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
