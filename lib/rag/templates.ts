import { createClient } from "@supabase/supabase-js";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";
const DEFAULT_THRESHOLD = 0.38;
const DEFAULT_MATCH_COUNT = 3;

export type RagTemplateMatch = {
  id: string;
  name: string;
  category: string;
  content: string;
  content_summary: string | null;
  variables: unknown;
  similarity: number;
};

export type RagRetrievalResult = {
  matches: RagTemplateMatch[];
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
  category?: string | null;
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

export async function retrieveRagTemplates({
  query,
  k = DEFAULT_MATCH_COUNT,
  category = null,
  threshold = DEFAULT_THRESHOLD,
}: RetrieveOptions): Promise<RagRetrievalResult> {
  const start = Date.now();
  const queryEmbedding = await embedQuery(query);
  const embedTime = Date.now() - start;

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const retrievalStart = Date.now();
  const { data, error } = await supabase.rpc("rag_match_templates", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: k,
    filter_category: category ?? null,
  });
  const retrievalTime = Date.now() - retrievalStart;

  if (error) {
    throw new Error(error.message);
  }

  const matches = (data ?? []) as RagTemplateMatch[];

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

export function buildRagGenerationContext(matches: RagTemplateMatch[]) {
  if (!matches.length) {
    return "";
  }

  const snippets = matches.map((match, index) => {
    const summary = match.content_summary || match.content.slice(0, 800);
    return [
      `Template ${index + 1}: ${match.name}`,
      `Categoria: ${match.category}`,
      `Similaridade: ${match.similarity.toFixed(3)}`,
      `Resumo: ${summary}`,
    ].join("\n");
  });

  return [
    "Contexto RAG recuperado da biblioteca Lex Revision.",
    "Use como referencia estrutural e semantica, sem copiar campos que nao se encaixem no pedido.",
    "Se o contexto recuperado conflitar com o pedido do usuario, priorize o pedido e use o contexto apenas como inspiracao.",
    "",
    snippets.join("\n\n"),
  ].join("\n");
}
