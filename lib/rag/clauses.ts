/**
 * RAG Sprint 6 — Helper de retrieval granular por cláusula
 *
 * Espelha o pattern de lib/rag/templates.ts mas trabalha em granularidade
 * de cláusula individual (rag_clauses + função rag_match_clauses).
 *
 * Uso típico: /api/ai/clauses chama AMBOS — templates pro contexto estrutural
 * e cláusulas pra identificação granular de itens faltantes.
 */

import { createClient } from "@supabase/supabase-js";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";
const DEFAULT_THRESHOLD = 0.32;
const DEFAULT_MATCH_COUNT = 8;

export type RagClauseMatch = {
  id: string;
  clause_type: string;
  title: string;
  content: string;
  legal_basis: string | null;
  risk_level: "low" | "medium" | "high" | null;
  similarity: number;
};

export type RagClauseRetrievalResult = {
  matches: RagClauseMatch[];
  stats: {
    embedding_ms: number;
    retrieval_ms: number;
    total_ms: number;
    results_count: number;
    threshold: number;
    model: string;
  };
};

type RetrieveOptions = {
  query: string;
  k?: number;
  clauseType?: string | null;
  threshold?: number;
};

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

export async function retrieveRagClauses({
  query,
  k = DEFAULT_MATCH_COUNT,
  clauseType = null,
  threshold = DEFAULT_THRESHOLD,
}: RetrieveOptions): Promise<RagClauseRetrievalResult> {
  const start = Date.now();
  const queryEmbedding = await embedQuery(query);
  const embedTime = Date.now() - start;

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const retrievalStart = Date.now();
  const { data, error } = await supabase.rpc("rag_match_clauses", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: k,
    filter_clause_type: clauseType ?? null,
  });
  const retrievalTime = Date.now() - retrievalStart;

  if (error) {
    throw new Error(error.message);
  }

  const matches = (data ?? []) as RagClauseMatch[];

  return {
    matches,
    stats: {
      embedding_ms: embedTime,
      retrieval_ms: retrievalTime,
      total_ms: Date.now() - start,
      results_count: matches.length,
      threshold,
      model: VOYAGE_MODEL,
    },
  };
}

/**
 * Constrói trecho de contexto pro system prompt focado em cláusulas.
 * Inclui base legal quando disponível pra Claude poder citar com precisão.
 */
export function buildRagClausesContext(matches: RagClauseMatch[]): string {
  if (!matches.length) return "";

  const snippets = matches.map((m, i) => {
    const lines = [
      `Cláusula ${i + 1}: ${m.title} [tipo: ${m.clause_type}]`,
      `Risco se ausente: ${m.risk_level ?? "n/d"}`,
      m.legal_basis ? `Base legal: ${m.legal_basis}` : null,
      `Similaridade: ${m.similarity.toFixed(3)}`,
      `Texto modelo: ${m.content}`,
    ].filter(Boolean);
    return lines.join("\n");
  });

  return [
    "Biblioteca de cláusulas-padrão BR recuperada via RAG (Lex Revision).",
    "Use esta biblioteca para:",
    "- Identificar com precisão quais cláusulas costumam aparecer em contratos similares",
    "- Marcar como 'missing_required' (importance: required) cláusulas com risco alto ausentes do contrato",
    "- Marcar como 'missing_recommended' (importance: recommended) cláusulas com risco médio/baixo ausentes",
    "- Citar a base legal quando ela for útil ao usuário",
    "Nunca copie o texto modelo literalmente — use como referência estrutural.",
    "",
    snippets.join("\n\n"),
  ].join("\n");
}
