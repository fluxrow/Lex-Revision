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
import { createClient } from "@supabase/supabase-js";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";

const schema = z.object({
  query: z.string().min(3).max(2000),
  k: z.number().int().min(1).max(20).default(5),
  category: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.65),
});

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY ausente — configurar no Vercel");
  }
  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text],
      model: VOYAGE_MODEL,
      input_type: "query",
    }),
  });
  if (!res.ok) {
    throw new Error(`Voyage embedding error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const start = Date.now();

    // 1) Embedding da query
    const queryEmbedding = await embedQuery(parsed.query);
    const embedTime = Date.now() - start;

    // 2) Retrieval via função SQL
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const retrievalStart = Date.now();
    const { data, error } = await supabase.rpc("rag_match_templates", {
      query_embedding: queryEmbedding,
      match_threshold: parsed.threshold,
      match_count: parsed.k,
      filter_category: parsed.category ?? null,
    });
    const retrievalTime = Date.now() - retrievalStart;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      query: parsed.query,
      matches: data,
      stats: {
        embedding_ms: embedTime,
        retrieval_ms: retrievalTime,
        total_ms: Date.now() - start,
        results_count: data?.length ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
