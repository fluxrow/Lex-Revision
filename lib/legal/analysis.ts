import {
  CLAUSE_BY_ID,
  CLAUSE_LIBRARY,
  ContractType,
  RiskLevel,
  getContractProfile,
} from "@/lib/legal/knowledge-base";

export interface ClauseCoverageItem {
  id: string;
  title: string;
  status: "present" | "missing_required" | "missing_recommended";
  importance: "required" | "recommended";
  riskIfMissing: RiskLevel;
  guidance: string;
  sampleText: string;
}

export interface ContractAnalysis {
  contractType: ContractType;
  contractLabel: string;
  summary: string;
  wordCount: number;
  sectionCount: number;
  presentClauses: ClauseCoverageItem[];
  missingRequiredClauses: ClauseCoverageItem[];
  missingRecommendedClauses: ClauseCoverageItem[];
  suspiciousFindings: Array<{
    title: string;
    risk: RiskLevel;
    trecho: string;
    motivo: string;
    sugestao: string;
    legalBasis?: string;
  }>;
}

export function analyzeContractDocument(
  documentContent: string,
  contractTypeHint?: string
): ContractAnalysis {
  const normalized = normalizeSearch(documentContent);
  const contractType = detectContractType(normalized, contractTypeHint);
  const profile = getContractProfile(contractType);
  const presentClauseIds = new Set(
    CLAUSE_LIBRARY.filter((clause) =>
      clause.keywords.some((keyword) => normalized.includes(keyword))
    ).map((clause) => clause.id)
  );

  const presentClauses = Array.from(presentClauseIds)
    .map((id) => toCoverageItem(id, "present"))
    .filter(Boolean) as ClauseCoverageItem[];

  const missingRequiredClauses = profile.requiredClauseIds
    .filter((id) => !presentClauseIds.has(id))
    .map((id) => toCoverageItem(id, "missing_required"))
    .filter(Boolean) as ClauseCoverageItem[];

  const missingRecommendedClauses = profile.recommendedClauseIds
    .filter((id) => !presentClauseIds.has(id))
    .map((id) => toCoverageItem(id, "missing_recommended"))
    .filter(Boolean) as ClauseCoverageItem[];

  return {
    contractType,
    contractLabel: profile.label,
    summary: profile.description,
    wordCount: documentContent.trim().split(/\s+/).filter(Boolean).length,
    sectionCount: countSections(documentContent),
    presentClauses,
    missingRequiredClauses,
    missingRecommendedClauses,
    suspiciousFindings: detectSuspiciousPatterns(documentContent, normalized),
  };
}

export function buildKnowledgeBaseContext(analysis: ContractAnalysis): string {
  const present = analysis.presentClauses.map((item) => item.title).join(", ") || "nenhuma clausula claramente detectada";
  const missingRequired =
    analysis.missingRequiredClauses.map((item) => item.title).join(", ") || "nenhuma";
  const missingRecommended =
    analysis.missingRecommendedClauses.map((item) => item.title).join(", ") || "nenhuma";

  return [
    `Tipo inferido do contrato: ${analysis.contractLabel} (${analysis.contractType}).`,
    `Resumo do tipo: ${analysis.summary}`,
    `Clausulas detectadas: ${present}.`,
    `Clausulas obrigatorias ausentes: ${missingRequired}.`,
    `Clausulas recomendadas ausentes: ${missingRecommended}.`,
    "Ao revisar, priorize riscos de escopo, vigencia, pagamento, rescisao, foro, confidencialidade, LGPD e equilibrio contratual.",
    "Nunca invente jurisprudencia. Cite base legal apenas quando realmente contribuir para o motivo do risco.",
  ].join("\n");
}

export function buildReviewFallback(analysis: ContractAnalysis) {
  const findings = [
    ...analysis.missingRequiredClauses.map((clause) => ({
      title: `${clause.title} ausente`,
      risk: clause.riskIfMissing,
      trecho: "Clausula nao localizada na analise heuristica.",
      motivo: clause.guidance,
      sugestao: clause.sampleText,
      legalBasis: undefined,
    })),
    ...analysis.suspiciousFindings,
  ];

  const overallRisk = deriveOverallRisk(
    analysis.missingRequiredClauses.length,
    analysis.suspiciousFindings
  );

  return {
    executiveSummary: `Analise heuristica do Lex identificou ${analysis.missingRequiredClauses.length} clausulas obrigatorias ausentes e ${analysis.suspiciousFindings.length} pontos adicionais de atencao.`,
    overallRisk,
    findings,
    nextActions: [
      ...(analysis.missingRequiredClauses.length > 0
        ? ["Completar as clausulas obrigatorias antes de enviar para assinatura."]
        : []),
      ...(analysis.missingRecommendedClauses.length > 0
        ? ["Avaliar inclusao das clausulas recomendadas para reduzir ambiguidade e risco operacional."]
        : []),
      ...(analysis.suspiciousFindings.length > 0
        ? ["Revisar manualmente os trechos sinalizados pela heuristica antes da validacao final."]
        : []),
    ],
  };
}

export function buildClauseSuggestionsFallback(analysis: ContractAnalysis) {
  const suggestions = [
    ...analysis.missingRequiredClauses,
    ...analysis.missingRecommendedClauses,
  ]
    .slice(0, 5)
    .map((clause) => ({
      id: clause.id,
      title: clause.title,
      priority: clause.riskIfMissing,
      motivo: clause.guidance,
      text: clause.sampleText,
    }));

  return {
    clauseCoverage: [
      ...analysis.presentClauses,
      ...analysis.missingRequiredClauses,
      ...analysis.missingRecommendedClauses,
    ],
    suggestedClauses: suggestions,
  };
}

function detectContractType(
  normalizedDocument: string,
  contractTypeHint?: string
): ContractType {
  const normalizedHint = normalizeSearch(contractTypeHint ?? "");
  const hinted = getHintedContractType(normalizedHint);
  if (hinted) {
    return hinted;
  }

  let bestType: ContractType = "general";
  let bestScore = 0;

  for (const profileType of ["service_agreement", "nda", "lease", "employment"] as const) {
    const profile = getContractProfile(profileType);
    const score = profile.indicators.reduce((acc, indicator) => {
      return acc + (normalizedDocument.includes(indicator) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestType = profile.type;
    }
  }

  return bestType;
}

function getHintedContractType(hint: string): ContractType | null {
  if (!hint) {
    return null;
  }

  const hintMap: Array<[ContractType, string[]]> = [
    ["service_agreement", ["servico", "consultoria", "honorario"]],
    ["nda", ["nda", "confidencialidade", "nao divulgacao"]],
    ["lease", ["locacao", "aluguel", "imovel"]],
    ["employment", ["trabalho", "emprego", "clt"]],
  ];

  for (const [type, terms] of hintMap) {
    if (terms.some((term) => hint.includes(term))) {
      return type;
    }
  }

  return null;
}

function toCoverageItem(
  clauseId: string,
  status: ClauseCoverageItem["status"]
): ClauseCoverageItem | null {
  const clause = CLAUSE_BY_ID.get(clauseId);
  if (!clause) {
    return null;
  }

  return {
    id: clause.id,
    title: clause.title,
    status,
    importance: clause.importance,
    riskIfMissing: clause.riskIfMissing,
    guidance: clause.guidance,
    sampleText: clause.sampleText,
  };
}

function detectSuspiciousPatterns(documentContent: string, normalized: string) {
  const findings: ContractAnalysis["suspiciousFindings"] = [];

  const multaMatch = documentContent.match(/(\d{1,3})\s?%/);
  if (multaMatch) {
    const multaPercent = Number(multaMatch[1]);
    if (multaPercent > 10) {
      findings.push({
        title: "Multa potencialmente excessiva",
        risk: "high",
        trecho: multaMatch[0],
        motivo:
          "Foi identificado percentual de multa acima de 10%. Isso merece revisao juridica para evitar desproporcao ou questionamento de abusividade.",
        sugestao:
          "Reavalie o percentual, a base de calculo e a proporcionalidade da clausula penal ao risco efetivo do negocio.",
        legalBasis: "Art. 413 do Codigo Civil",
      });
    }
  }

  if (normalized.includes("prazo indeterminado") && !normalized.includes("aviso previo")) {
    findings.push({
      title: "Prazo indeterminado sem regra clara de saida",
      risk: "medium",
      trecho: "prazo indeterminado",
      motivo:
        "Contratos por prazo indeterminado sem regra clara de encerramento podem aumentar disputa sobre transicao e efeitos da rescisao.",
      sugestao:
        "Inclua aviso previo, prazo para cura e efeitos financeiros do encerramento.",
    });
  }

  return findings;
}

function deriveOverallRisk(
  missingRequiredCount: number,
  suspiciousFindings: ContractAnalysis["suspiciousFindings"]
): RiskLevel {
  if (
    missingRequiredCount >= 3 ||
    suspiciousFindings.some((finding) => finding.risk === "high")
  ) {
    return "high";
  }

  if (missingRequiredCount > 0 || suspiciousFindings.length > 0) {
    return "medium";
  }

  return "low";
}

function countSections(documentContent: string): number {
  const matches = documentContent.match(
    /(cl[aá]usula\s+\d+|^\d+[\.\)]\s+.+$)/gim
  );
  return matches?.length ?? 0;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
