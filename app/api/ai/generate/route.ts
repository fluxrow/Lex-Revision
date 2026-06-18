import { NextResponse } from "next/server";
import { z } from "zod";

import { getAnthropicClient } from "@/lib/ai/client";
import { extractTextContent, parseJsonFromText } from "@/lib/ai/json";
import {
  buildGeneratedContractFallback,
  type GeneratedContractDraft,
} from "@/lib/legal/generation";
import {
  buildRagGenerationContext,
  retrieveRagTemplates,
  type RagRetrievalResult,
} from "@/lib/rag/templates";

const generateSchema = z.object({
  prompt: z.string().trim().min(12),
});

export async function POST(request: Request) {
  try {
    const payload = generateSchema.parse(await request.json());
    const fallback = buildGeneratedContractFallback(payload.prompt);
    const anthropic = getAnthropicClient();
    let rag: RagRetrievalResult | null = null;

    try {
      rag = await retrieveRagTemplates({
        query: payload.prompt,
        k: 3,
        threshold: 0.38,
      });
    } catch (ragError: any) {
      console.warn("RAG retrieval skipped:", ragError.message);
    }

    if (!anthropic) {
      return NextResponse.json({
        status: "generated",
        provider: "fallback",
        rag,
        contract: fallback,
        content: fallback.body,
      });
    }

    const ragContext = buildRagGenerationContext(rag?.matches ?? []);

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2200,
      system: [
        "Voce trabalha dentro do Lex Revision, uma plataforma de automacao de contratos para escritorios no Brasil.",
        "Gere um rascunho contratual util, objetivo e juridicamente coerente em portugues do Brasil.",
        "Responda somente JSON valido neste formato:",
        '{"title":"...","contractType":"general|service_agreement|nda|lease|employment","contractLabel":"...","summary":"...","variables":["..."],"clauses":[{"id":"...","number":"1","title":"...","body":"..."}],"body":"..."}',
        "Nao invente jurisprudencia nem cite base legal sem necessidade.",
        ragContext || "Nenhum contexto RAG forte foi recuperado para este pedido. Gere normalmente.",
      ].join("\n\n"),
      messages: [
        {
          role: "user",
          content: `Gere um contrato inicial com base neste pedido:\n\n${payload.prompt}`,
        },
      ],
    });

    const rawContent = extractTextContent(msg.content);
    const parsed = parseJsonFromText<GeneratedContractDraft>(rawContent);

    return NextResponse.json({
      status: "generated",
      provider: rag?.matches.length ? "anthropic_rag" : "anthropic",
      rag,
      contract: parsed ?? fallback,
      content: parsed?.body ?? rawContent ?? fallback.body,
    });
  } catch (error: any) {
    console.error("AI Generate Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate text" },
      { status: 500 }
    );
  }
}
