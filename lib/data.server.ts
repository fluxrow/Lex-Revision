import { MOCK_CLIENTS, MOCK_CONTRACTS, MOCK_TEMPLATES } from "@/lib/data";
import {
  analyzeContractDocument,
  buildClauseSuggestionsFallback,
  buildReviewFallback,
} from "@/lib/legal/analysis";
import type { StructuredContractPayload } from "@/lib/contracts/ingestion";
import { createClient } from "@/lib/supabase/server";

export type ClientSummary = {
  id: string;
  name: string;
  type: string;
  doc: string;
  email: string;
  contracts: number;
  since: string;
};

export type SignatureSummary = {
  id: string;
  contractId: string | null;
  contract: string;
  provider: string;
  status: string;
  progress: number;
  total: number;
  signers: Array<{
    name: string;
    email: string;
    status: string;
    when: string | null;
  }>;
};

export type ContractDetail = {
  id: string;
  name: string;
  status: string;
  contractType: string;
  source: string;
  value: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  signedAt: string | null;
  expiresAt: string | null;
  body: string;
  variableValues: Record<string, string>;
  sections: StructuredContractPayload["sections"];
  parties: string[];
  dates: string[];
  amounts: string[];
  documentMetrics: StructuredContractPayload["documentMetrics"];
  client: {
    id: string | null;
    name: string;
    email: string;
    document: string;
    type: string;
  } | null;
  template: {
    id: string;
    name: string;
    category: string;
  } | null;
  analysis: {
    provider: string;
    summary: string;
    overallRisk: "low" | "medium" | "high";
    createdAt: string | null;
    findings: Array<{
      title: string;
      risk: string;
      trecho?: string;
      motivo?: string;
      sugestao?: string;
      legalBasis?: string;
    }>;
    nextActions: string[];
    suggestedClauses: Array<{
      id: string;
      title: string;
      priority: string;
      motivo: string;
      text: string;
    }>;
    clauseCoverage: Array<{
      id: string;
      title: string;
      status: string;
      importance: string;
      riskIfMissing: string;
    }>;
  } | null;
  signatureRequests: Array<{
    id: string;
    provider: string;
    status: string;
    sentAt: string | null;
    completedAt: string | null;
    signers: Array<{
      id: string;
      name: string;
      email: string;
      document: string | null;
      status: string;
      signedAt: string | null;
      viewedAt: string | null;
      signatureUrl: string | null;
      position: number;
    }>;
  }>;
  isFallback: boolean;
};

export async function getContracts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contracts")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_CONTRACTS;
    }

    return data.map((contract: any) => ({
      id: contract.id,
      name: contract.name,
      client: contract.clients?.name || "Rascunho interno",
      value: (contract.value_cents || 0) / 100,
      status:
        contract.status === "draft"
          ? "rascunho"
          : contract.status === "pending_review"
            ? "em_analise"
            : contract.status === "pending_signature"
              ? "aguardando"
          : contract.status === "signed"
            ? "assinado"
            : "rascunho",
      updated: contract.updated_at.split("T")[0],
      type: contract.contract_type || "Geral",
    }));
  } catch {
    return MOCK_CONTRACTS;
  }
}

export async function getTemplates() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_TEMPLATES;
    }

    return data.map((template: any) => ({
      id: template.id,
      name: template.name,
      cat: template.category || "Geral",
      uses: template.uses_count || 0,
      updated: template.updated_at.split("T")[0],
      vars: template.variables ? template.variables.length : 0,
      accent: "#8FA3F5",
    }));
  } catch {
    return MOCK_TEMPLATES;
  }
}

export async function getTemplateById(templateId?: string | null) {
  if (!templateId) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle();

    if (error || !data) {
      const fallback = MOCK_TEMPLATES.find((template) => template.id === templateId);
      return fallback
        ? {
            id: fallback.id,
            name: fallback.name,
            cat: fallback.cat,
            uses: fallback.uses,
            updated: fallback.updated,
            vars: fallback.vars,
            accent: fallback.accent,
            variableDefinitions: [],
          }
        : null;
    }

    return {
      id: data.id,
      name: data.name,
      cat: data.category || "Geral",
      uses: data.uses_count || 0,
      updated: data.updated_at.split("T")[0],
      vars: data.variables ? data.variables.length : 0,
      accent: "#8FA3F5",
      variableDefinitions: Array.isArray(data.variables) ? data.variables : [],
    };
  } catch {
    const fallback = MOCK_TEMPLATES.find((template) => template.id === templateId);
    return fallback
      ? {
          id: fallback.id,
          name: fallback.name,
          cat: fallback.cat,
          uses: fallback.uses,
          updated: fallback.updated,
          vars: fallback.vars,
          accent: fallback.accent,
          variableDefinitions: [],
        }
      : null;
  }
}

export async function getClientsOverview(): Promise<ClientSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("id, type, name, document, email, created_at, contracts(id)")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((client: any) => ({
      id: client.id,
      name: client.name,
      type: client.type || "PF",
      doc: client.document || "—",
      email: client.email || "—",
      contracts: Array.isArray(client.contracts) ? client.contracts.length : 0,
      since: client.created_at ? client.created_at.substring(0, 7) : "—",
    }));
  } catch {
    return [];
  }
}

export async function getSignatureOverview(): Promise<SignatureSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("signature_requests")
      .select(
        "id, provider, status, sent_at, completed_at, contract:contracts(id, name), signers(name, email, status, signed_at, viewed_at, position)"
      )
      .order("sent_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((request: any) => {
      const signers = Array.isArray(request.signers)
        ? [...request.signers].sort((a, b) => (a.position || 0) - (b.position || 0))
        : [];
      const progress = signers.filter((signer) => signer.status === "signed").length;

      return {
        id: request.id,
        contractId: request.contract?.id || null,
        contract: request.contract?.name || "Contrato sem nome",
        provider: request.provider || "clicksign",
        status: request.status || "sent",
        progress,
        total: signers.length,
        signers: signers.map((signer) => ({
          name: signer.name,
          email: signer.email,
          status: signer.status,
          when: signer.signed_at || signer.viewed_at || null,
        })),
      };
    });
  } catch {
    return [];
  }
}

export async function getContractDetail(contractId: string): Promise<ContractDetail | null> {
  try {
    const supabase = await createClient();
    const { data: contract, error } = await supabase
      .from("contracts")
      .select(
        `
          id,
          name,
          status,
          contract_type,
          source,
          value_cents,
          currency,
          variable_values,
          body_md,
          body_html,
          structured_payload,
          created_at,
          updated_at,
          signed_at,
          expires_at,
          clients(id, name, email, document, type),
          contract_templates(id, name, category),
          signature_requests(
            id,
            provider,
            status,
            sent_at,
            completed_at,
            signers(
              id,
              name,
              email,
              document,
              status,
              signed_at,
              viewed_at,
              signature_url,
              position
            )
          )
        `
      )
      .eq("id", contractId)
      .maybeSingle();

    if (error || !contract) {
      return buildMockContractDetail(contractId);
    }

    const { data: analysisVersion } = await supabase
      .from("contract_analysis_versions")
      .select("provider, summary, overall_risk, analysis_payload, created_at")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return mapContractDetail(contract, analysisVersion);
  } catch {
    return buildMockContractDetail(contractId);
  }
}

function mapContractDetail(contract: any, analysisVersion: any): ContractDetail {
  const structured = coerceStructuredPayload(contract.structured_payload, contract.body_md || contract.body_html || "");
  const analysisPayload = isRecord(analysisVersion?.analysis_payload) ? analysisVersion.analysis_payload : {};
  const review = isRecord(analysisPayload.review) ? analysisPayload.review : {};
  const clauseSuggestions = isRecord(analysisPayload.clauseSuggestions)
    ? analysisPayload.clauseSuggestions
    : {};
  const signatureRequests = Array.isArray(contract.signature_requests)
    ? [...contract.signature_requests]
        .sort((left, right) => {
          const leftDate = left.sent_at ? new Date(left.sent_at).getTime() : 0;
          const rightDate = right.sent_at ? new Date(right.sent_at).getTime() : 0;
          return rightDate - leftDate;
        })
        .map((request: any) => ({
          id: request.id,
          provider: request.provider || "clicksign",
          status: request.status || "sent",
          sentAt: request.sent_at || null,
          completedAt: request.completed_at || null,
          signers: Array.isArray(request.signers)
            ? [...request.signers]
                .sort((left, right) => (left.position || 0) - (right.position || 0))
                .map((signer: any) => ({
                  id: signer.id,
                  name: signer.name,
                  email: signer.email,
                  document: signer.document || null,
                  status: signer.status,
                  signedAt: signer.signed_at || null,
                  viewedAt: signer.viewed_at || null,
                  signatureUrl: signer.signature_url || null,
                  position: signer.position || 0,
                }))
            : [],
        }))
    : [];

  return {
    id: contract.id,
    name: contract.name,
    status: mapContractStatus(contract.status),
    contractType: contract.contract_type || structured.contractType || "Geral",
    source: contract.source || "unknown",
    value: (contract.value_cents || 0) / 100,
    currency: contract.currency || "BRL",
    createdAt: contract.created_at,
    updatedAt: contract.updated_at,
    signedAt: contract.signed_at || null,
    expiresAt: contract.expires_at || null,
    body: contract.body_md || contract.body_html || joinSections(structured.sections),
    variableValues: isRecord(contract.variable_values)
      ? Object.fromEntries(
          Object.entries(contract.variable_values).map(([key, value]) => [key, String(value ?? "")])
        )
      : {},
    sections: structured.sections,
    parties: structured.parties,
    dates: structured.dates,
    amounts: structured.amounts,
    documentMetrics: structured.documentMetrics,
    client: contract.clients
      ? {
          id: contract.clients.id || null,
          name: contract.clients.name || "Cliente vinculado",
          email: contract.clients.email || "—",
          document: contract.clients.document || "—",
          type: contract.clients.type || "—",
        }
      : null,
    template: contract.contract_templates
      ? {
          id: contract.contract_templates.id,
          name: contract.contract_templates.name,
          category: contract.contract_templates.category || "Geral",
        }
      : null,
    analysis: analysisVersion
      ? {
          provider: analysisVersion.provider || "lex_analysis",
          summary: analysisVersion.summary || "Sem resumo disponível.",
          overallRisk: normalizeRisk(review.overallRisk || analysisVersion.overall_risk),
          createdAt: analysisVersion.created_at || null,
          findings: Array.isArray(review.findings)
            ? review.findings.map((finding: any) => ({
                title: String(finding?.title || "Ponto de atenção"),
                risk: String(finding?.risk || "medium"),
                trecho: finding?.trecho ? String(finding.trecho) : undefined,
                motivo: finding?.motivo ? String(finding.motivo) : undefined,
                sugestao: finding?.sugestao ? String(finding.sugestao) : undefined,
                legalBasis: finding?.legalBasis ? String(finding.legalBasis) : undefined,
              }))
            : [],
          nextActions: Array.isArray(review.nextActions)
            ? review.nextActions.map((action: any) => String(action))
            : [],
          suggestedClauses: Array.isArray(clauseSuggestions.suggestedClauses)
            ? clauseSuggestions.suggestedClauses.map((clause: any) => ({
                id: String(clause?.id || ""),
                title: String(clause?.title || "Cláusula sugerida"),
                priority: String(clause?.priority || "medium"),
                motivo: String(clause?.motivo || ""),
                text: String(clause?.text || ""),
              }))
            : [],
          clauseCoverage: Array.isArray(clauseSuggestions.clauseCoverage)
            ? clauseSuggestions.clauseCoverage.map((clause: any) => ({
                id: String(clause?.id || ""),
                title: String(clause?.title || "Cláusula"),
                status: String(clause?.status || "present"),
                importance: String(clause?.importance || "recommended"),
                riskIfMissing: String(clause?.riskIfMissing || "medium"),
              }))
            : [],
        }
      : null,
    signatureRequests,
    isFallback: false,
  };
}

function buildMockContractDetail(contractId: string): ContractDetail | null {
  const fallback = MOCK_CONTRACTS.find((contract) => contract.id === contractId);
  if (!fallback) {
    return null;
  }

  const client = MOCK_CLIENTS.find((item) => item.name === fallback.client);
  const body = [
    `CONTRATO DE ${fallback.type.toUpperCase()}`,
    "",
    `PARTES: ${fallback.client} e Silva & Associados.`,
    "",
    "1. Objeto",
    `Este instrumento regula a prestação relacionada a ${fallback.name.toLowerCase()}.`,
    "",
    "2. Vigência",
    "O contrato entra em vigor na data da assinatura e permanece válido até a conclusão do escopo acordado.",
    "",
    "3. Remuneração",
    fallback.value > 0
      ? `O valor ajustado para este contrato é de R$ ${fallback.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      : "Não há valor financeiro previsto neste instrumento.",
    "",
    "4. Rescisão",
    "As partes podem rescindir mediante aviso prévio escrito e quitação das obrigações vencidas.",
    "",
    "5. Foro",
    "Fica eleito o foro da comarca do contratante para dirimir controvérsias.",
  ].join("\n");
  const analysis = analyzeContractDocument(body, fallback.type);
  const review = buildReviewFallback(analysis);
  const clauseSuggestions = buildClauseSuggestionsFallback(analysis);

  return {
    id: fallback.id,
    name: fallback.name,
    status: fallback.status,
    contractType: fallback.type,
    source: "mock_preview",
    value: fallback.value,
    currency: "BRL",
    createdAt: `${fallback.updated}T09:00:00.000Z`,
    updatedAt: `${fallback.updated}T09:00:00.000Z`,
    signedAt: fallback.status === "assinado" ? `${fallback.updated}T10:00:00.000Z` : null,
    expiresAt: null,
    body,
    variableValues: {},
    sections: [
      { title: "Objeto", text: `Este instrumento regula a prestação relacionada a ${fallback.name.toLowerCase()}.` },
      { title: "Vigência", text: "O contrato entra em vigor na data da assinatura e permanece válido até a conclusão do escopo acordado." },
      {
        title: "Remuneração",
        text:
          fallback.value > 0
            ? `O valor ajustado para este contrato é de R$ ${fallback.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
            : "Não há valor financeiro previsto neste instrumento.",
      },
      { title: "Rescisão", text: "As partes podem rescindir mediante aviso prévio escrito e quitação das obrigações vencidas." },
    ],
    parties: client ? [client.name, "Silva & Associados"] : [fallback.client, "Silva & Associados"],
    dates: [fallback.updated],
    amounts: fallback.value > 0 ? [fmtCurrencyValue(fallback.value)] : [],
    documentMetrics: {
      tablesCount: 0,
      picturesCount: 0,
      fileName: `${fallback.name}.md`,
      fileFormat: "markdown",
    },
    client: client
      ? {
          id: client.id,
          name: client.name,
          email: client.email,
          document: client.doc,
          type: client.type,
        }
      : {
          id: null,
          name: fallback.client,
          email: "—",
          document: "—",
          type: "—",
        },
    template: null,
    analysis: {
      provider: "lex_mock_preview",
      summary: review.executiveSummary,
      overallRisk: normalizeRisk(review.overallRisk),
      createdAt: `${fallback.updated}T09:05:00.000Z`,
      findings: review.findings.map((finding) => ({
        title: finding.title,
        risk: finding.risk,
        trecho: finding.trecho,
        motivo: finding.motivo,
        sugestao: finding.sugestao,
        legalBasis: finding.legalBasis,
      })),
      nextActions: review.nextActions,
      suggestedClauses: clauseSuggestions.suggestedClauses.map((clause) => ({
        id: clause.id,
        title: clause.title,
        priority: clause.priority,
        motivo: clause.motivo,
        text: clause.text,
      })),
      clauseCoverage: clauseSuggestions.clauseCoverage.map((clause) => ({
        id: clause.id,
        title: clause.title,
        status: clause.status,
        importance: clause.importance,
        riskIfMissing: clause.riskIfMissing,
      })),
    },
    signatureRequests: [],
    isFallback: true,
  };
}

function coerceStructuredPayload(value: unknown, fallbackBody: string): StructuredContractPayload {
  const payload = isRecord(value) ? value : {};
  const sections = Array.isArray(payload.sections)
    ? payload.sections
        .map((section) =>
          isRecord(section)
            ? {
                title: String(section.title || "Seção"),
                text: String(section.text || ""),
              }
            : null
        )
        .filter(Boolean) as StructuredContractPayload["sections"]
    : [];

  return {
    contractType: typeof payload.contractType === "string" ? payload.contractType : "general",
    sections: sections.length > 0 ? sections : [{ title: "Corpo do contrato", text: fallbackBody.trim() || "Sem conteúdo disponível." }],
    parties: Array.isArray(payload.parties) ? payload.parties.map((item) => String(item)) : [],
    dates: Array.isArray(payload.dates) ? payload.dates.map((item) => String(item)) : [],
    amounts: Array.isArray(payload.amounts) ? payload.amounts.map((item) => String(item)) : [],
    variables: isRecord(payload.variables)
      ? Object.fromEntries(Object.entries(payload.variables).map(([key, item]) => [key, String(item ?? "")]))
      : {},
    detectedClauseIds: Array.isArray(payload.detectedClauseIds)
      ? payload.detectedClauseIds.map((item) => String(item))
      : [],
    ingestionProvider: typeof payload.ingestionProvider === "string" ? payload.ingestionProvider : undefined,
    documentMetrics: isRecord(payload.documentMetrics)
      ? {
          tablesCount: Number(payload.documentMetrics.tablesCount || 0),
          picturesCount: Number(payload.documentMetrics.picturesCount || 0),
          fileName:
            typeof payload.documentMetrics.fileName === "string"
              ? payload.documentMetrics.fileName
              : undefined,
          fileFormat:
            typeof payload.documentMetrics.fileFormat === "string"
              ? payload.documentMetrics.fileFormat
              : undefined,
        }
      : undefined,
  };
}

function mapContractStatus(status: string) {
  if (status === "draft") {
    return "rascunho";
  }
  if (status === "pending_review") {
    return "em_analise";
  }
  if (status === "pending_signature") {
    return "aguardando";
  }
  if (status === "signed") {
    return "assinado";
  }

  return status || "rascunho";
}

function normalizeRisk(value: unknown): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "medium";
}

function joinSections(sections: StructuredContractPayload["sections"]) {
  return sections.map((section) => `${section.title}\n${section.text}`.trim()).join("\n\n");
}

function fmtCurrencyValue(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
