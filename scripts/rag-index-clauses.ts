/**
 * RAG Sprint 5 — Indexação de cláusulas-padrão BR
 *
 * Cura 20+ cláusulas-padrão brasileiras com curadoria jurídica e popula
 * `rag_clauses`. Granularidade menor que template — permite retrieval de
 * cláusula específica que está faltando no contrato analisado.
 *
 * Pré-requisitos:
 *   - Migration 20260618120000_rag_pgvector_setup.sql aplicada
 *   - VOYAGE_API_KEY no .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY no .env.local
 *
 * Como rodar:
 *   bun run scripts/rag-index-clauses.ts
 *
 * Output: gera arquivo SQL idempotente com embeddings em
 *   supabase/migrations/<timestamp>_rag_index_clauses.sql
 *
 * Estratégia: gerar arquivo SQL (Codex pattern) em vez de popular direto
 * via API. Vantagem: idempotente, versionado, transparente em PR review.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";

if (!process.env.VOYAGE_API_KEY) {
  console.error("❌ VOYAGE_API_KEY ausente. Cadastre payment method em https://dashboard.voyageai.com/billing");
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────
// Cláusulas curadas (BR — direito civil/comercial)
// ──────────────────────────────────────────────────────────────────────────

type Clause = {
  clause_type: string;
  title: string;
  content: string;
  applicable_to: string[];
  legal_basis: string | null;
  risk_level: "low" | "medium" | "high";
  tags: string[];
};

const CLAUSES: Clause[] = [
  {
    clause_type: "objeto",
    title: "Objeto contratual genérico",
    content: "Constitui objeto do presente contrato a prestação dos serviços/fornecimento de bens descritos no Anexo I, em conformidade com as especificações técnicas, prazos e condições estabelecidas neste instrumento.",
    applicable_to: ["service_agreement", "supply", "general"],
    legal_basis: "CC Art. 481, Art. 594",
    risk_level: "high",
    tags: ["objeto", "core", "essencial"],
  },
  {
    clause_type: "vigencia",
    title: "Vigência com prazo determinado",
    content: "O presente contrato vigorará pelo prazo de [N] meses, contados da data de sua assinatura, podendo ser renovado por períodos sucessivos mediante acordo expresso entre as partes, formalizado por aditivo contratual.",
    applicable_to: ["service_agreement", "lease", "general"],
    legal_basis: "CC Art. 421",
    risk_level: "medium",
    tags: ["vigência", "prazo", "renovação"],
  },
  {
    clause_type: "remuneracao",
    title: "Remuneração mensal com vencimento",
    content: "Pela execução dos serviços, a CONTRATANTE pagará à CONTRATADA o valor mensal de R$ [VALOR] ([VALOR_EXTENSO]), com vencimento todo dia [N] de cada mês, mediante apresentação de nota fiscal de serviços.",
    applicable_to: ["service_agreement"],
    legal_basis: "CC Art. 594, Lei 8.078/90",
    risk_level: "high",
    tags: ["remuneração", "pagamento", "valor"],
  },
  {
    clause_type: "reajuste",
    title: "Reajuste por índice",
    content: "Os valores estabelecidos neste contrato serão reajustados anualmente pela variação positiva do IPCA (Índice de Preços ao Consumidor Amplo) acumulada no período, ou por outro índice oficial que venha a substituí-lo.",
    applicable_to: ["service_agreement", "lease", "supply"],
    legal_basis: "Lei 10.192/01 Art. 2º",
    risk_level: "medium",
    tags: ["reajuste", "índice", "IPCA", "correção"],
  },
  {
    clause_type: "multa_atraso",
    title: "Multa por atraso de pagamento",
    content: "O atraso no pagamento de qualquer valor devido sujeitará a parte inadimplente à multa moratória de 2% sobre o valor em atraso, juros de mora de 1% ao mês, calculados pro rata die, e correção monetária pelo IPCA até a data do efetivo pagamento.",
    applicable_to: ["service_agreement", "lease", "supply", "general"],
    legal_basis: "CC Art. 406, CDC Art. 52 §1º",
    risk_level: "medium",
    tags: ["multa", "atraso", "mora", "juros"],
  },
  {
    clause_type: "rescisao",
    title: "Rescisão imotivada com aviso prévio",
    content: "Qualquer das partes poderá rescindir o presente contrato sem motivação, mediante aviso prévio por escrito de 30 (trinta) dias à outra parte, sem que tal rescisão implique qualquer indenização adicional, salvo o pagamento dos valores devidos até a data efetiva da rescisão.",
    applicable_to: ["service_agreement", "supply"],
    legal_basis: "CC Art. 473",
    risk_level: "high",
    tags: ["rescisão", "aviso prévio", "denúncia"],
  },
  {
    clause_type: "rescisao_motivada",
    title: "Rescisão por descumprimento",
    content: "O presente contrato poderá ser rescindido de pleno direito, independentemente de qualquer aviso ou notificação prévia, em caso de descumprimento de qualquer obrigação contratual pela outra parte, não sanado em até 15 (quinze) dias após notificação por escrito.",
    applicable_to: ["service_agreement", "lease", "supply", "general"],
    legal_basis: "CC Art. 474, Art. 475",
    risk_level: "high",
    tags: ["rescisão", "descumprimento", "inadimplemento"],
  },
  {
    clause_type: "confidencialidade",
    title: "Sigilo e confidencialidade",
    content: "As partes obrigam-se a manter em absoluto sigilo todas as informações confidenciais, comerciais, técnicas, operacionais ou financeiras a que tiverem acesso em razão do presente contrato, durante sua vigência e pelo prazo de 5 (cinco) anos após sua extinção, sob pena de responder por perdas e danos.",
    applicable_to: ["nda", "service_agreement", "supply", "employment"],
    legal_basis: "CC Art. 422, Lei 9.279/96 Art. 195",
    risk_level: "high",
    tags: ["confidencialidade", "sigilo", "NDA", "informações sensíveis"],
  },
  {
    clause_type: "lgpd",
    title: "Proteção de dados pessoais (LGPD)",
    content: "As partes comprometem-se a tratar quaisquer dados pessoais coletados, armazenados ou processados no âmbito deste contrato em estrita observância à Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD), adotando medidas técnicas e administrativas adequadas para proteger tais dados contra acessos não autorizados, vazamentos ou uso indevido.",
    applicable_to: ["service_agreement", "nda", "supply", "employment", "general"],
    legal_basis: "Lei 13.709/2018 (LGPD)",
    risk_level: "high",
    tags: ["LGPD", "dados pessoais", "privacidade", "compliance"],
  },
  {
    clause_type: "foro",
    title: "Foro de eleição",
    content: "Fica eleito o foro da Comarca de [CIDADE/UF], com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer dúvidas ou litígios decorrentes do presente contrato.",
    applicable_to: ["service_agreement", "lease", "supply", "nda", "general"],
    legal_basis: "CPC Art. 63",
    risk_level: "low",
    tags: ["foro", "eleição", "competência", "jurisdição"],
  },
  {
    clause_type: "forca_maior",
    title: "Força maior e caso fortuito",
    content: "Nenhuma das partes será responsabilizada por descumprimento de obrigação decorrente de força maior ou caso fortuito, conforme definido no art. 393 do Código Civil, devendo a parte afetada comunicar a ocorrência à outra parte no prazo máximo de 5 (cinco) dias úteis.",
    applicable_to: ["service_agreement", "lease", "supply", "general"],
    legal_basis: "CC Art. 393",
    risk_level: "medium",
    tags: ["força maior", "caso fortuito", "imprevisibilidade"],
  },
  {
    clause_type: "cessao",
    title: "Vedação à cessão de direitos",
    content: "É vedada a cessão ou transferência, total ou parcial, dos direitos e obrigações decorrentes do presente contrato a terceiros, sem o prévio e expresso consentimento por escrito da outra parte.",
    applicable_to: ["service_agreement", "supply", "lease", "general"],
    legal_basis: "CC Art. 286",
    risk_level: "medium",
    tags: ["cessão", "transferência", "terceiros"],
  },
  {
    clause_type: "garantia",
    title: "Garantia de qualidade dos serviços",
    content: "A CONTRATADA garante a qualidade técnica dos serviços prestados, comprometendo-se a refazer, sem ônus adicional, quaisquer entregas que apresentem defeito ou não atendam às especificações acordadas, no prazo de 30 (trinta) dias após a comunicação formal da CONTRATANTE.",
    applicable_to: ["service_agreement", "supply"],
    legal_basis: "CDC Art. 18, CC Art. 441",
    risk_level: "high",
    tags: ["garantia", "qualidade", "vícios", "reparação"],
  },
  {
    clause_type: "responsabilidade",
    title: "Limitação de responsabilidade",
    content: "A responsabilidade total de qualquer das partes por perdas e danos decorrentes do presente contrato, seja a que título for, ficará limitada ao valor total efetivamente pago no período de 12 (doze) meses anteriores ao evento que originou a responsabilidade, salvo nos casos de dolo, culpa grave, ou violação de obrigações de confidencialidade.",
    applicable_to: ["service_agreement", "supply", "general"],
    legal_basis: "CC Art. 393, Art. 944",
    risk_level: "high",
    tags: ["responsabilidade", "limitação", "perdas e danos", "indenização"],
  },
  {
    clause_type: "non_compete",
    title: "Não-concorrência",
    content: "Durante a vigência deste contrato e pelo prazo de 12 (doze) meses após sua extinção, a CONTRATADA obriga-se a não prestar serviços similares aos descritos neste instrumento a empresas concorrentes diretas da CONTRATANTE no território nacional, salvo prévia autorização por escrito.",
    applicable_to: ["service_agreement", "employment", "general"],
    legal_basis: "CF Art. 5º, II e XIII (limitação razoável)",
    risk_level: "high",
    tags: ["não-concorrência", "non-compete", "exclusividade"],
  },
  {
    clause_type: "comunicacoes",
    title: "Comunicações entre as partes",
    content: "Todas as comunicações entre as partes relativas ao presente contrato serão feitas por escrito, mediante carta registrada com aviso de recebimento, e-mail com confirmação de leitura, ou ferramenta de assinatura eletrônica, considerando-se efetivadas na data de seu recebimento pela parte destinatária.",
    applicable_to: ["service_agreement", "supply", "lease", "general"],
    legal_basis: "CC Art. 113",
    risk_level: "low",
    tags: ["comunicações", "notificação", "e-mail"],
  },
  {
    clause_type: "alteracao",
    title: "Alteração contratual",
    content: "Qualquer alteração, modificação ou aditamento ao presente contrato somente terá validade se realizado por escrito e assinado por ambas as partes ou seus representantes legais, mediante termo aditivo numerado sequencialmente.",
    applicable_to: ["service_agreement", "lease", "supply", "nda", "general"],
    legal_basis: "CC Art. 472",
    risk_level: "low",
    tags: ["alteração", "aditivo", "modificação"],
  },
  {
    clause_type: "assinatura_eletronica",
    title: "Validade de assinatura eletrônica",
    content: "As partes reconhecem expressamente a validade jurídica e a eficácia probatória deste contrato firmado por meio de assinatura eletrônica, nos termos do art. 10, §2º da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020, dispensando-se a assinatura física em papel.",
    applicable_to: ["service_agreement", "supply", "lease", "nda", "general"],
    legal_basis: "MP 2.200-2/2001 Art. 10, Lei 14.063/2020",
    risk_level: "low",
    tags: ["assinatura eletrônica", "ICP-Brasil", "validade jurídica"],
  },
  {
    clause_type: "garantia_locaticia",
    title: "Garantia locatícia (fiança)",
    content: "Como garantia das obrigações decorrentes do presente contrato de locação, o LOCATÁRIO apresenta como fiador(es) [NOME_FIADOR], que assume(m) responsabilidade solidária pelo cumprimento de todas as obrigações pecuniárias do LOCATÁRIO, na qualidade de devedor(es) solidário(s), nos termos do art. 37, II da Lei nº 8.245/91.",
    applicable_to: ["lease"],
    legal_basis: "Lei 8.245/91 Art. 37",
    risk_level: "high",
    tags: ["garantia locatícia", "fiança", "Lei do Inquilinato"],
  },
  {
    clause_type: "honorarios_exito",
    title: "Honorários advocatícios com cláusula de êxito",
    content: "Pela execução dos serviços advocatícios objeto deste contrato, o CLIENTE pagará ao CONTRATADO honorários fixos no valor de R$ [VALOR_FIXO], acrescidos de honorários de êxito correspondentes a [N]% sobre o proveito econômico efetivamente obtido na demanda, devidos somente em caso de êxito total ou parcial.",
    applicable_to: ["legal_services"],
    legal_basis: "Lei 8.906/94 Art. 22, EOAB Art. 36",
    risk_level: "high",
    tags: ["honorários", "advocacia", "êxito", "OAB"],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Voyage embedding
// ──────────────────────────────────────────────────────────────────────────

async function embed(inputs: string[]): Promise<number[][]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: inputs,
      model: VOYAGE_MODEL,
      input_type: "document",
    }),
  });
  if (!res.ok) throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data.map((d: any) => d.embedding);
}

// ──────────────────────────────────────────────────────────────────────────
// SQL escape helper
// ──────────────────────────────────────────────────────────────────────────

function sqlString(s: string | null): string {
  if (s === null) return "null";
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlArray(arr: string[]): string {
  return `array[${arr.map((s) => sqlString(s)).join(", ")}]::text[]`;
}

function sqlVector(v: number[]): string {
  return `'[${v.join(",")}]'::vector`;
}

// ──────────────────────────────────────────────────────────────────────────
// Main — gera migration SQL idempotente
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🚀 Indexando ${CLAUSES.length} cláusulas-padrão BR\n`);

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  const outFile = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    `${timestamp}_rag_index_clauses_br.sql`
  );

  let sql = "-- RAG Sprint 5 — indexação de cláusulas-padrão BR\n";
  sql += `-- Gerado em ${new Date().toISOString()} via scripts/rag-index-clauses.ts\n`;
  sql += `-- Modelo: ${VOYAGE_MODEL} (1024 dim)\n\n`;

  for (let i = 0; i < CLAUSES.length; i++) {
    const c = CLAUSES[i];
    console.log(`📄 ${i + 1}/${CLAUSES.length} — ${c.title}`);

    // Embedding sobre title + content (mais focado)
    const embedText = `${c.title}\n\n${c.content}`;
    const [embedding] = await embed([embedText]);

    if (embedding.length !== 1024) {
      console.error(`  ❌ embedding com dim errada: ${embedding.length}`);
      process.exit(1);
    }

    sql += `-- ${i + 1}. ${c.title}\n`;
    sql += `insert into public.rag_clauses (\n`;
    sql += `  organization_id, clause_type, title, content,\n`;
    sql += `  applicable_to, legal_basis, risk_level,\n`;
    sql += `  embedding, embedding_model, embedded_at\n`;
    sql += `)\n`;
    sql += `select\n`;
    sql += `  null,\n`;
    sql += `  ${sqlString(c.clause_type)},\n`;
    sql += `  ${sqlString(c.title)},\n`;
    sql += `  ${sqlString(c.content)},\n`;
    sql += `  ${sqlArray(c.applicable_to)},\n`;
    sql += `  ${sqlString(c.legal_basis)},\n`;
    sql += `  ${sqlString(c.risk_level)},\n`;
    sql += `  ${sqlVector(embedding)},\n`;
    sql += `  ${sqlString(VOYAGE_MODEL)},\n`;
    sql += `  now()\n`;
    sql += `where not exists (\n`;
    sql += `  select 1 from public.rag_clauses\n`;
    sql += `  where clause_type = ${sqlString(c.clause_type)}\n`;
    sql += `    and title = ${sqlString(c.title)}\n`;
    sql += `    and organization_id is null\n`;
    sql += `);\n\n`;
  }

  await fs.writeFile(outFile, sql, "utf8");
  console.log(`\n✅ Migration gerada: ${outFile}`);
  console.log(`   ${CLAUSES.length} cláusulas, ${(sql.length / 1024).toFixed(1)}KB`);
  console.log(`\nAplicar com:`);
  console.log(`   supabase db push`);
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
