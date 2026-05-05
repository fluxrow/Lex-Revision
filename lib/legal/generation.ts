import {
  CLAUSE_BY_ID,
  CONTRACT_PROFILES,
  ContractType,
  getContractProfile,
} from "@/lib/legal/knowledge-base";

export type GeneratedClause = {
  id: string;
  number: string;
  title: string;
  body: string;
};

export type GeneratedContractDraft = {
  title: string;
  contractType: ContractType;
  contractLabel: string;
  summary: string;
  variables: string[];
  clauses: GeneratedClause[];
  body: string;
};

export function buildGeneratedContractFallback(prompt: string): GeneratedContractDraft {
  const contractType = detectContractTypeFromPrompt(prompt);
  const profile = getContractProfile(contractType);
  const clauseIds = [
    ...profile.requiredClauseIds,
    ...profile.recommendedClauseIds.slice(0, 2),
  ];

  const clauses = clauseIds
    .map((clauseId, index) => {
      const clause = CLAUSE_BY_ID.get(clauseId);
      if (!clause) {
        return null;
      }

      return {
        id: clause.id,
        number: `${index + 1}`,
        title: clause.title,
        body: adaptClauseText(clause.id, clause.sampleText, prompt, profile.label),
      };
    })
    .filter(Boolean) as GeneratedClause[];

  const title = `Contrato de ${profile.label}`;
  const body = [
    `${title.toUpperCase()}`,
    "",
    `Considerando a solicitacao "${prompt.trim()}", este rascunho inicial organiza as clausulas essenciais para um contrato de ${profile.label.toLowerCase()}.`,
    "",
    ...clauses.flatMap((clause) => [
      `Clausula ${clause.number} - ${clause.title}`,
      clause.body,
      "",
    ]),
  ]
    .join("\n")
    .trim();

  return {
    title,
    contractType,
    contractLabel: profile.label,
    summary: profile.description,
    variables: getDefaultVariables(profile.type),
    clauses,
    body,
  };
}

function detectContractTypeFromPrompt(prompt: string): ContractType {
  const normalized = normalizeSearch(prompt);
  let bestType: ContractType = "general";
  let bestScore = 0;

  for (const profile of CONTRACT_PROFILES) {
    const score = profile.indicators.reduce((acc, indicator) => {
      return acc + (normalized.includes(indicator) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestType = profile.type;
      bestScore = score;
    }
  }

  return bestType;
}

function adaptClauseText(
  clauseId: string,
  sampleText: string,
  prompt: string,
  contractLabel: string
) {
  if (clauseId === "scope") {
    return `O objeto deste ${contractLabel.toLowerCase()} devera refletir a seguinte orientacao inicial: ${prompt.trim()}. ${sampleText}`;
  }

  if (clauseId === "fees") {
    return `${sampleText} Os valores, marcos de pagamento e tributos devem ser preenchidos conforme a proposta comercial ou combinacao entre as partes.`;
  }

  if (clauseId === "term") {
    return `${sampleText} Recomenda-se explicitar data de inicio, duracao e eventual renovacao em alinhamento com o contexto descrito no pedido.`;
  }

  return sampleText;
}

function getDefaultVariables(type: ContractType) {
  const base = ["CONTRATANTE", "CONTRATADA", "OBJETO", "PRAZO", "FORO"];

  if (type === "lease") {
    return [...base, "IMOVEL", "ALUGUEL", "INDICE_REAJUSTE"];
  }

  if (type === "employment") {
    return [...base, "CARGO", "SALARIO", "JORNADA"];
  }

  return [...base, "VALOR", "FORMA_PAGAMENTO"];
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
