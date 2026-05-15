import { extractTextContent, parseJsonFromText } from "@/lib/ai/json";
import { getAnthropicClient } from "@/lib/ai/client";
import { NextResponse } from "next/server";

import {
  buildLegalReferenceContext,
  searchLegalReferences,
  type LegalReferenceContext,
} from "@/lib/legal/references";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const contractType = searchParams.get("contractType");
    const clauseIds = searchParams
      .get("clauseIds")
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) || [];

    const results = searchLegalReferences({
      query,
      contractType,
      clauseIds,
    });

    const fallbackContext = buildLegalReferenceContext({
      query,
      contractType,
      clauseIds,
      results,
    });
    const anthropic = getAnthropicClient();
    let context: LegalReferenceContext = fallbackContext;

    if (anthropic && results.length > 0) {
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 900,
        system: [
          "Voce trabalha no Lex Revision e deve sintetizar apoio juridico contextual usando apenas referencias curadas ja fornecidas.",
          "Nunca invente jurisprudencia, precedentes ou base legal nova.",
          "Nao cite nada fora da lista de referencias recebida.",
          "Responda somente JSON valido no formato:",
          '{"summary":"...","recommendedActions":["..."],"caution":"..."}',
        ].join("\n\n"),
        messages: [
          {
            role: "user",
            content: [
              `BUSCA: ${query || "sem termo explicito"}`,
              `TIPO CONTRATUAL: ${contractType || "general"}`,
              `CLAUSULAS EM FOCO: ${clauseIds.join(", ") || "nenhuma"}`,
              "",
              "REFERENCIAS CURADAS:",
              ...results.map(
                (entry, index) =>
                  `${index + 1}. ${entry.title} | ${entry.legalBasis} | ${entry.summary} | Uso pratico: ${entry.practicalUse}`
              ),
            ].join("\n"),
          },
        ],
      });

      const parsed = parseJsonFromText<LegalReferenceContext>(extractTextContent(msg.content));
      if (
        parsed &&
        typeof parsed.summary === "string" &&
        Array.isArray(parsed.recommendedActions) &&
        typeof parsed.caution === "string"
      ) {
        context = {
          summary: parsed.summary,
          recommendedActions: parsed.recommendedActions.map((item) => String(item)).slice(0, 3),
          caution: parsed.caution,
        };
      }
    }

    return NextResponse.json({
      ok: true,
      mode: anthropic ? "knowledge_base_plus_ai" : "knowledge_base",
      note: "Pesquisa beta baseada na base jurídica curada do Lex. Não representa jurisprudência live nem substitui validação humana.",
      query,
      context,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Nao foi possivel consultar referencias juridicas." },
      { status: 500 }
    );
  }
}
