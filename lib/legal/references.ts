import type { ContractType } from "@/lib/legal/knowledge-base";

export type LegalReferenceEntry = {
  id: string;
  title: string;
  category: string;
  summary: string;
  practicalUse: string;
  legalBasis: string;
  sourceLabel: string;
  keywords: string[];
  relatedContractTypes: ContractType[];
  relatedClauseIds: string[];
};

const REFERENCE_LIBRARY: LegalReferenceEntry[] = [
  {
    id: "cc-113-interpretacao",
    title: "Interpretação conforme boa-fé e usos do negócio",
    category: "Interpretação contratual",
    summary: "A interpretação do contrato deve considerar boa-fé e usos do lugar de sua celebração.",
    practicalUse: "Útil quando a redação está ambígua, incompleta ou abre margem para interpretação contraditória entre as partes.",
    legalBasis: "Código Civil, art. 113",
    sourceLabel: "Código Civil",
    keywords: ["interpretacao", "boa fe", "ambiguidade", "redacao", "duvida", "uso", "negocio"],
    relatedContractTypes: ["general", "service_agreement", "nda", "lease", "employment"],
    relatedClauseIds: ["scope", "term", "liability"],
  },
  {
    id: "cc-421-421a-liberdade",
    title: "Função social e liberdade contratual",
    category: "Equilíbrio contratual",
    summary: "A liberdade contratual existe dentro da função social do contrato e da alocação legítima de riscos.",
    practicalUse: "Ajuda a revisar cláusulas muito assimétricas, obrigações excessivas ou distribuição de risco desequilibrada.",
    legalBasis: "Código Civil, arts. 421 e 421-A",
    sourceLabel: "Código Civil",
    keywords: ["funcao social", "liberdade contratual", "equilibrio", "risco", "assimetria", "abuso"],
    relatedContractTypes: ["general", "service_agreement", "lease", "employment"],
    relatedClauseIds: ["liability", "penalties", "fees"],
  },
  {
    id: "cc-422-boa-fe",
    title: "Boa-fé objetiva na formação e execução",
    category: "Execução contratual",
    summary: "As partes devem observar probidade e boa-fé antes, durante e depois da execução do contrato.",
    practicalUse: "Serve de âncora para revisar cooperação, deveres laterais, transparência e comportamento contraditório.",
    legalBasis: "Código Civil, art. 422",
    sourceLabel: "Código Civil",
    keywords: ["boa fe objetiva", "cooperacao", "probidade", "execucao", "dever lateral", "transparencia"],
    relatedContractTypes: ["general", "service_agreement", "nda", "lease", "employment"],
    relatedClauseIds: ["scope", "confidentiality", "data_protection", "termination"],
  },
  {
    id: "cc-413-clausula-penal",
    title: "Redução equitativa da cláusula penal",
    category: "Multa e penalidades",
    summary: "A cláusula penal pode ser reduzida judicialmente se for manifestamente excessiva ou se a obrigação tiver sido cumprida em parte.",
    practicalUse: "Importante quando houver multa elevada, desproporcional ou sem base clara de cálculo.",
    legalBasis: "Código Civil, art. 413",
    sourceLabel: "Código Civil",
    keywords: ["multa", "clausula penal", "penalidade", "excessiva", "proporcionalidade", "413"],
    relatedContractTypes: ["general", "service_agreement", "nda", "lease", "employment"],
    relatedClauseIds: ["penalties", "termination"],
  },
  {
    id: "cc-317-478-revisao",
    title: "Revisão por onerosidade ou desequilíbrio econômico",
    category: "Preço e reajuste",
    summary: "O contrato pode ser revisto ou adaptado quando a prestação se torna excessivamente onerosa ou o valor perde equilíbrio econômico.",
    practicalUse: "Útil para contratos longos sem regra de reajuste, ou com variação econômica relevante sem cláusula de correção.",
    legalBasis: "Código Civil, arts. 317, 478 a 480",
    sourceLabel: "Código Civil",
    keywords: ["reajuste", "equilibrio economico", "onerosidade", "revisao", "correcao monetaria", "preco"],
    relatedContractTypes: ["general", "service_agreement", "lease"],
    relatedClauseIds: ["fees", "adjustment"],
  },
  {
    id: "cc-473-resilicao",
    title: "Resilição e denúncia nos contratos por prazo indeterminado",
    category: "Rescisão",
    summary: "Contratos com execução continuada ou por prazo indeterminado exigem disciplina clara de saída e aviso prévio.",
    practicalUse: "Ajuda a revisar contratos sem cláusula de encerramento, aviso prévio ou efeitos financeiros da rescisão.",
    legalBasis: "Código Civil, art. 473",
    sourceLabel: "Código Civil",
    keywords: ["rescisao", "resilicao", "aviso previo", "prazo indeterminado", "encerramento", "saida"],
    relatedContractTypes: ["general", "service_agreement", "lease", "employment"],
    relatedClauseIds: ["termination", "term"],
  },
  {
    id: "cpc-63-foro",
    title: "Eleição de foro e seus limites",
    category: "Foro e solução de conflitos",
    summary: "A cláusula de eleição de foro deve ser redigida de modo claro e compatível com a natureza da relação contratual.",
    practicalUse: "Ajuda a revisar foro distante, duplo ou potencialmente abusivo, principalmente em relações assimétricas.",
    legalBasis: "Código de Processo Civil, art. 63",
    sourceLabel: "CPC",
    keywords: ["foro", "eleicao de foro", "competencia", "cpc 63", "jurisdicao", "conflito"],
    relatedContractTypes: ["general", "service_agreement", "nda", "lease", "employment"],
    relatedClauseIds: ["forum"],
  },
  {
    id: "lgpd-6-principios",
    title: "Princípios da LGPD",
    category: "Proteção de dados",
    summary: "Tratamento de dados pessoais exige finalidade, necessidade, transparência e segurança compatíveis com a LGPD.",
    practicalUse: "Serve como base quando o contrato usa dados pessoais, mas não define papel das partes, finalidade ou governança mínima.",
    legalBasis: "LGPD, art. 6º",
    sourceLabel: "Lei Geral de Proteção de Dados",
    keywords: ["lgpd", "dados pessoais", "finalidade", "necessidade", "transparencia", "principios"],
    relatedContractTypes: ["general", "service_agreement", "nda", "lease", "employment"],
    relatedClauseIds: ["data_protection"],
  },
  {
    id: "lgpd-46-seguranca",
    title: "Segurança e medidas técnicas na LGPD",
    category: "Proteção de dados",
    summary: "Controladores e operadores devem adotar medidas técnicas e administrativas aptas a proteger dados pessoais.",
    practicalUse: "Útil quando o contrato trata dados, mas não prevê segurança, incidente, cooperação ou resposta a vazamentos.",
    legalBasis: "LGPD, art. 46",
    sourceLabel: "Lei Geral de Proteção de Dados",
    keywords: ["seguranca", "incidente", "vazamento", "medidas tecnicas", "operador", "controlador", "lgpd 46"],
    relatedContractTypes: ["general", "service_agreement", "nda", "employment"],
    relatedClauseIds: ["data_protection", "confidentiality"],
  },
  {
    id: "clt-468-alteracao-lesiva",
    title: "Vedação à alteração contratual lesiva no trabalho",
    category: "Relações de trabalho",
    summary: "A alteração contratual não pode causar prejuízo direto ou indireto ao empregado sem respaldo legal.",
    practicalUse: "Ajuda a revisar contratos de trabalho com jornada, função, salário ou mobilidade mal definidos.",
    legalBasis: "CLT, art. 468",
    sourceLabel: "CLT",
    keywords: ["clt", "alteracao lesiva", "empregado", "salario", "jornada", "funcao"],
    relatedContractTypes: ["employment"],
    relatedClauseIds: ["scope", "fees", "term"],
  },
];

export function searchLegalReferences({
  query,
  contractType,
  clauseIds = [],
  limit = 6,
}: {
  query: string;
  contractType?: string | null;
  clauseIds?: string[];
  limit?: number;
}) {
  const normalizedQuery = normalize(query);
  const queryTokens = normalizedQuery
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
  const normalizedClauses = new Set(clauseIds.map((item) => item.trim()).filter(Boolean));
  const normalizedContractType = normalizeContractType(contractType);

  const ranked = REFERENCE_LIBRARY.map((entry) => {
    let score = 0;

    if (!normalizedQuery) {
      score += 1;
    }

    if (normalizedContractType && entry.relatedContractTypes.includes(normalizedContractType)) {
      score += 3;
    }

    if (entry.relatedClauseIds.some((item) => normalizedClauses.has(item))) {
      score += 4;
    }

    const haystack = normalize(
      `${entry.title} ${entry.category} ${entry.summary} ${entry.practicalUse} ${entry.legalBasis} ${entry.keywords.join(" ")}`
    );

    if (normalizedQuery) {
      if (haystack.includes(normalizedQuery)) {
        score += 8;
      }

      const tokenMatches = queryTokens.filter((token) => haystack.includes(token)).length;
      score += tokenMatches * 2;

      for (const keyword of entry.keywords) {
        if (normalizedQuery.includes(normalize(keyword)) || normalize(keyword).includes(normalizedQuery)) {
          score += 4;
        }
      }
    }

    return { entry, score };
  })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.entry);

  return ranked;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function normalizeContractType(value?: string | null): ContractType | null {
  switch (value) {
    case "service_agreement":
    case "nda":
    case "lease":
    case "employment":
    case "general":
      return value;
    default:
      return null;
  }
}
