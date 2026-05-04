import { extractTextContent, parseJsonFromText } from "@/lib/ai/json";
import { getAnthropicClient } from "@/lib/ai/client";
import {
  analyzeContractDocument,
  buildKnowledgeBaseContext,
  buildReviewFallback,
} from "@/lib/legal/analysis";
import { NextResponse } from "next/server";
import { z } from "zod";

const reviewSchema = z.object({
  documentContent: z.string().min(30),
  contractTypeHint: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = reviewSchema.parse(await request.json());
    const analysis = analyzeContractDocument(
      payload.documentContent,
      payload.contractTypeHint
    );
    const fallback = buildReviewFallback(analysis);
    const anthropic = getAnthropicClient();

    if (!anthropic) {
      return NextResponse.json({
        status: "reviewed",
        provider: "heuristic",
        analysis,
        review: fallback,
        content: JSON.stringify(fallback, null, 2),
      });
    }

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1600,
      system: [
        "Voce e um revisor juridico do Lex Revision especializado em contratos brasileiros.",
        "Analise risco contratual de forma estruturada, auditavel e objetiva.",
        "Nunca invente jurisprudencia. Cite base legal apenas quando ela for realmente util ao risco apontado.",
        "Responda somente JSON valido no formato:",
        '{"executiveSummary":"...","overallRisk":"low|medium|high","findings":[{"title":"...","risk":"low|medium|high","trecho":"...","motivo":"...","sugestao":"...","legalBasis":"opcional"}],"nextActions":["..."]}',
        buildKnowledgeBaseContext(analysis),
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

    return NextResponse.json({
      status: "reviewed",
      provider: "anthropic",
      analysis,
      review: parsed ?? fallback,
      content: rawContent,
    });
  } catch (error: any) {
    console.error("AI Review Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to review text" },
      { status: 500 }
    );
  }
}
