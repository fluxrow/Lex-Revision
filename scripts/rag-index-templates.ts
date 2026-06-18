/**
 * RAG Sprint 2 — Indexação de templates de contrato
 *
 * Lê templates de `contract_templates` (8 globais do seed + customs) e popula
 * `rag_templates` com:
 *   - embedding (Voyage AI voyage-3-lite, 1024 dim)
 *   - content_summary (gerado por Claude Sonnet 4.6)
 *   - tags inferidas
 *
 * Pré-requisitos:
 *   - Migration 20260618120000_rag_pgvector_setup.sql aplicada
 *   - VOYAGE_API_KEY no .env.local
 *   - ANTHROPIC_API_KEY no .env.local (ou herdar do shell)
 *   - SUPABASE_SERVICE_ROLE_KEY no .env.local (bypass RLS pra escrever)
 *
 * Como rodar:
 *   bun run scripts/rag-index-templates.ts        # indexa apenas globais
 *   bun run scripts/rag-index-templates.ts --all  # indexa globais + custom orgs
 *
 * Custo estimado:
 *   - 8 templates globais × ~2000 tokens cada = ~16k tokens
 *   - Voyage embedding: free (dentro de 200M tokens)
 *   - Claude summary: ~16k input + ~3k output = ~$0.0935 (~R$ 0,50)
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "node:fs";

// ──────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3"; // 1024 dim, Portuguese-optimized
const CLAUDE_MODEL = "claude-sonnet-4-6";
const EMBEDDING_BATCH_SIZE = 8; // Voyage permite até 128 por call

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const indexAll = process.argv.includes("--all");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no env.");
  process.exit(1);
}
if (!VOYAGE_API_KEY) {
  console.error(
    "❌ VOYAGE_API_KEY ausente. Crie conta em https://www.voyageai.com (200M tokens free)."
  );
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────
// Clients
// ──────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ──────────────────────────────────────────────────────────────────────────
// Voyage AI embedding
// ──────────────────────────────────────────────────────────────────────────

async function embed(inputs: string[]): Promise<number[][]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: inputs,
      model: VOYAGE_MODEL,
      input_type: "document",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.data.map((d: any) => d.embedding);
}

// ──────────────────────────────────────────────────────────────────────────
// Claude summary + tag extraction
// ──────────────────────────────────────────────────────────────────────────

async function summarizeTemplate(name: string, category: string, content: string) {
  const prompt = `Você é um especialista em contratos jurídicos brasileiros.

Analise o template abaixo e retorne APENAS um JSON com:
{
  "summary": "resumo em 2-3 frases focando: tipo de contrato, partes envolvidas, principais cláusulas",
  "tags": ["array", "de", "5-8", "tags", "específicas", "para", "recuperação", "semântica"]
}

Não inclua texto antes ou depois do JSON.

Template: ${name}
Categoria: ${category}

Conteúdo:
${content.slice(0, 4000)}`;

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`  ⚠️  Não consegui extrair JSON do summary para "${name}"`);
    return { summary: text.slice(0, 300), tags: [] as string[] };
  }
  return JSON.parse(jsonMatch[0]) as { summary: string; tags: string[] };
}

// ──────────────────────────────────────────────────────────────────────────
// Resolver conteúdo do template (storage ou inline)
// ──────────────────────────────────────────────────────────────────────────

async function resolveContent(template: any): Promise<string> {
  if (template.content) return template.content as string;
  if (template.storage_path) {
    const { data, error } = await supabase.storage
      .from("templates")
      .download(template.storage_path);
    if (error) {
      console.warn(`  ⚠️  Storage error para ${template.name}: ${error.message}`);
      return template.description || template.name;
    }
    return await data.text();
  }
  return template.description || template.name;
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 RAG indexação — Sprint 2\n");

  // 1) Buscar templates a indexar
  const query = supabase
    .from("contract_templates")
    .select("id, organization_id, name, category, description, storage_path, variables, is_global")
    .order("created_at", { ascending: true });

  if (!indexAll) {
    query.eq("is_global", true);
  }

  const { data: templates, error } = await query;
  if (error) {
    console.error("❌ Erro ao buscar templates:", error.message);
    process.exit(1);
  }
  if (!templates?.length) {
    console.log("Nenhum template encontrado.");
    return;
  }

  console.log(`📦 ${templates.length} templates para processar.\n`);

  // 2) Para cada template: resolver conteúdo + summary + embedding + insert
  const summary = {
    total: templates.length,
    indexed: 0,
    skipped: 0,
    failed: 0,
    tokensEstimate: 0,
  };

  for (const t of templates) {
    try {
      console.log(`📄 ${t.name} (${t.category})`);

      // Já indexado?
      const { data: existing } = await supabase
        .from("rag_templates")
        .select("id")
        .eq("source_template_id", t.id)
        .maybeSingle();

      if (existing) {
        console.log("  ↪︎ já indexado, skip");
        summary.skipped++;
        continue;
      }

      const content = await resolveContent(t);
      summary.tokensEstimate += Math.ceil(content.length / 4); // rough

      console.log("  🧠 gerando summary + tags (Claude)...");
      const { summary: contentSummary, tags } = await summarizeTemplate(
        t.name,
        t.category,
        content
      );

      console.log("  🔢 gerando embedding (Voyage)...");
      const [embedding] = await embed([contentSummary || content.slice(0, 2000)]);

      const { error: insertErr } = await supabase.from("rag_templates").insert({
        organization_id: t.organization_id,
        source_template_id: t.id,
        name: t.name,
        category: t.category,
        content,
        content_summary: contentSummary,
        variables: t.variables || [],
        tags,
        embedding,
        embedding_model: VOYAGE_MODEL,
        embedded_at: new Date().toISOString(),
      });

      if (insertErr) throw insertErr;
      console.log(`  ✅ indexado (${tags.length} tags, summary: ${contentSummary.length} chars)\n`);
      summary.indexed++;
    } catch (err: any) {
      console.error(`  ❌ falhou: ${err.message}\n`);
      summary.failed++;
    }
  }

  // 3) Relatório final
  console.log("─".repeat(60));
  console.log("📊 Relatório final");
  console.log("─".repeat(60));
  console.log(`Total processado:    ${summary.total}`);
  console.log(`Indexados (novos):   ${summary.indexed}`);
  console.log(`Skipped (existentes):${summary.skipped}`);
  console.log(`Falhas:              ${summary.failed}`);
  console.log(`Tokens estimados:    ~${summary.tokensEstimate.toLocaleString()}`);
  console.log(
    `Custo aproximado:    ~R$ ${((summary.tokensEstimate * 0.000003) * 5.5).toFixed(2)} (Claude summary)`
  );
  console.log(`                     R$ 0,00 (Voyage embedding — free tier)`);
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
