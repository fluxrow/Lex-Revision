/**
 * RAG Query Cache — Sprint 4
 *
 * Cache de respostas LLM por hash do input normalizado. TTL 7 dias.
 * Reduz custo Anthropic ~25-40% em queries similares ou repetidas.
 *
 * Estrutura (tabela `rag_query_cache` criada na migration 20260618120000):
 *   - cache_key: PK, sha256(routeNamespace::normalized_input)
 *   - query_text: input original (até 5k chars, pra debug)
 *   - retrieval_template_ids: IDs dos templates que o RAG trouxe
 *   - llm_response: jsonb com a resposta completa que vamos reservir
 *   - tokens_input / tokens_output: pra medir economia real
 *   - expires_at: now() + 7 days
 *
 * Como usar nas rotas:
 *   const cacheKey = buildCacheKey("generate", payload.prompt);
 *   const cached = await lookupCache(cacheKey);
 *   if (cached.hit) return NextResponse.json({ ...cached.response, provider: "anthropic_rag_cached", cache: cached.meta });
 *   // ... roda RAG + Claude ...
 *   void saveCache({ cacheKey, queryText, llmResponse, llmModel, tokensInput, tokensOutput, retrievalTemplateIds });
 *   return NextResponse.json(...);
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export type CacheMeta = {
  hit: boolean;
  cache_key: string;
  cached_at?: string;
  expires_at?: string;
};

export type CacheLookupResult =
  | { hit: false; cacheKey: string }
  | { hit: true; cacheKey: string; response: any; meta: CacheMeta };

function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Constrói cache key prefixado pela rota para evitar colisão entre
 * generate/review/clauses (mesmo input, prompts diferentes).
 */
export function buildCacheKey(routeNamespace: string, input: string): string {
  const normalized = `${routeNamespace}::${normalizeInput(input)}`;
  return createHash("sha256").update(normalized).digest("hex");
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Procura resposta cacheada não expirada. Retorna { hit: false } em qualquer
 * cenário de erro (failsafe — nunca quebra o fluxo principal).
 */
export async function lookupCache(cacheKey: string): Promise<CacheLookupResult> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("rag_query_cache")
      .select("llm_response, created_at, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return { hit: false, cacheKey };

    return {
      hit: true,
      cacheKey,
      response: data.llm_response,
      meta: {
        hit: true,
        cache_key: cacheKey,
        cached_at: data.created_at,
        expires_at: data.expires_at,
      },
    };
  } catch {
    return { hit: false, cacheKey };
  }
}

/**
 * Salva resposta no cache. Fire-and-forget (não bloqueia request).
 * Use com `void saveCache(...).catch(...)`.
 */
export async function saveCache(opts: {
  cacheKey: string;
  queryText: string;
  retrievalTemplateIds?: string[];
  llmResponse: any;
  llmModel: string;
  tokensInput?: number;
  tokensOutput?: number;
}): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from("rag_query_cache").upsert(
      {
        cache_key: opts.cacheKey,
        query_text: opts.queryText.slice(0, 5000),
        retrieval_template_ids: opts.retrievalTemplateIds ?? [],
        llm_response: opts.llmResponse,
        llm_model: opts.llmModel,
        tokens_input: opts.tokensInput ?? null,
        tokens_output: opts.tokensOutput ?? null,
      },
      { onConflict: "cache_key" }
    );
  } catch (err) {
    console.warn("RAG cache save failed:", (err as Error).message);
  }
}
