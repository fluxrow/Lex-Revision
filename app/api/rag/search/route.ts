/**
 * RAG Sprint 2 — Endpoint de teste do retrieval
 *
 * POST /api/rag/search
 * Body: { query: string, k?: number, category?: string }
 *
 * Retorna top-K templates similares à query, com score de similaridade.
 * Não consome o resultado em nenhuma rota de IA ainda — só pra validar
 * que retrieval funciona. Sprint 3 plugará isso em /api/ai/generate e /api/ai/review.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieveRagTemplates } from "@/lib/rag/templates";

const schema = z.object({
  query: z.string().min(3).max(2000),
  k: z.number().int().min(1).max(20).default(5),
  category: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.65),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const retrieval = await retrieveRagTemplates({
      query: parsed.query,
      k: parsed.k,
      category: parsed.category,
      threshold: parsed.threshold,
    });

    return NextResponse.json({
      query: parsed.query,
      matches: retrieval.matches,
      stats: retrieval.stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
