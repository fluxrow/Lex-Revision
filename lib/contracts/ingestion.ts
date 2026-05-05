import {
  analyzeContractDocument,
  buildClauseSuggestionsFallback,
  buildReviewFallback,
} from "@/lib/legal/analysis";

export type StructuredContractPayload = {
  contractType: string;
  sections: Array<{
    title: string;
    text: string;
  }>;
  parties: string[];
  dates: string[];
  amounts: string[];
  variables: Record<string, string>;
  detectedClauseIds: string[];
};

export type ContractAnalysisVersionPayload = {
  provider: string;
  summary: string;
  overallRisk: "low" | "medium" | "high";
  analysisPayload: Record<string, unknown>;
};

export function buildContractIntelligence(params: {
  body: string;
  contractTypeHint?: string | null;
  variableValues?: Record<string, string>;
}) {
  const analysis = analyzeContractDocument(
    params.body,
    params.contractTypeHint || undefined
  );
  const review = buildReviewFallback(analysis);
  const clauseSuggestions = buildClauseSuggestionsFallback(analysis);

  const structuredPayload: StructuredContractPayload = {
    contractType: analysis.contractType,
    sections: extractSections(params.body),
    parties: extractParties(params.body, params.variableValues),
    dates: extractDates(params.body, params.variableValues),
    amounts: extractAmounts(params.body, params.variableValues),
    variables: params.variableValues || {},
    detectedClauseIds: analysis.presentClauses.map((clause) => clause.id),
  };

  const analysisVersion: ContractAnalysisVersionPayload = {
    provider: "lex_structured_fallback",
    summary: review.executiveSummary,
    overallRisk: review.overallRisk,
    analysisPayload: {
      analysis,
      review,
      clauseSuggestions,
    },
  };

  return {
    structuredPayload,
    analysisVersion,
  };
}

function extractSections(body: string) {
  const matches = Array.from(
    body.matchAll(
      /(Clausula\s+\d+\s*[-–—]\s*[^\n]+|Cláusula\s+\d+\s*[-–—]\s*[^\n]+|^\d+[\.\)]\s+[^\n]+)$/gim
    )
  );

  if (matches.length === 0) {
    return [
      {
        title: "Corpo do contrato",
        text: body.trim(),
      },
    ];
  }

  const sections: StructuredContractPayload["sections"] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const title = current[0].trim();
    const start = current.index ?? 0;
    const end = next?.index ?? body.length;
    const text = body.slice(start, end).trim();

    sections.push({
      title,
      text,
    });
  }

  return sections;
}

function extractParties(body: string, variableValues?: Record<string, string>) {
  const parties = new Set<string>();

  for (const [key, value] of Object.entries(variableValues || {})) {
    if (/(cliente|contratante|contratada|locador|locatario|empregador|empregado|parte)/i.test(key) && value.trim()) {
      parties.add(value.trim());
    }
  }

  const bodyMatches = body.match(
    /\b([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-zÁÉÍÓÚÂÊÎÔÛÃÕÇà-ú'&.\-]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-zÁÉÍÓÚÂÊÎÔÛÃÕÇà-ú'&.\-]+){0,4})\b/g
  );

  for (const match of bodyMatches || []) {
    if (match.length > 4 && match.length < 80) {
      parties.add(match.trim());
    }
  }

  return Array.from(parties).slice(0, 8);
}

function extractDates(body: string, variableValues?: Record<string, string>) {
  const dates = new Set<string>();

  for (const value of Object.values(variableValues || {})) {
    if (/\b\d{2}\/\d{2}\/\d{4}\b/.test(value) || /\b\d{4}-\d{2}-\d{2}\b/.test(value)) {
      dates.add(value.trim());
    }
  }

  const bodyMatches = body.match(/\b\d{2}\/\d{2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g);
  for (const match of bodyMatches || []) {
    dates.add(match);
  }

  return Array.from(dates);
}

function extractAmounts(body: string, variableValues?: Record<string, string>) {
  const amounts = new Set<string>();

  for (const value of Object.values(variableValues || {})) {
    if (/R\$\s?\d/.test(value) || /^\d[\d\.,]+$/.test(value)) {
      amounts.add(value.trim());
    }
  }

  const bodyMatches = body.match(/R\$\s?\d[\d\.\,]*/g);
  for (const match of bodyMatches || []) {
    amounts.add(match);
  }

  return Array.from(amounts);
}
