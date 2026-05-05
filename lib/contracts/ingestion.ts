import {
  analyzeContractDocument,
  buildClauseSuggestionsFallback,
  buildReviewFallback,
} from "@/lib/legal/analysis";
import { extractWithDocling } from "@/lib/contracts/docling";

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
  ingestionProvider?: string;
  documentMetrics?: {
    tablesCount: number;
    picturesCount: number;
    fileName?: string;
    fileFormat?: string;
  };
};

export type ContractAnalysisVersionPayload = {
  provider: string;
  summary: string;
  overallRisk: "low" | "medium" | "high";
  analysisPayload: Record<string, unknown>;
};

export async function buildContractIntelligence(params: {
  body: string;
  contractTypeHint?: string | null;
  variableValues?: Record<string, string>;
  fileName?: string | null;
  mimeType?: string | null;
  fileContentBase64?: string | null;
}) {
  const doclingExtraction = await extractWithDocling({
    body: params.body,
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileContentBase64: params.fileContentBase64,
  });
  const sourceBody = doclingExtraction?.text.trim() || params.body;
  const analysis = analyzeContractDocument(sourceBody, params.contractTypeHint || undefined);
  const review = buildReviewFallback(analysis);
  const clauseSuggestions = buildClauseSuggestionsFallback(analysis);

  const structuredPayload: StructuredContractPayload = {
    contractType: analysis.contractType,
    sections:
      doclingExtraction?.sections.length && doclingExtraction.sections.some((section) => section.text.trim())
        ? doclingExtraction.sections
        : extractSections(sourceBody),
    parties: extractParties(sourceBody, params.variableValues),
    dates: extractDates(sourceBody, params.variableValues),
    amounts: extractAmounts(sourceBody, params.variableValues),
    variables: params.variableValues || {},
    detectedClauseIds: analysis.presentClauses.map((clause) => clause.id),
    ingestionProvider: doclingExtraction?.provider || "lex_structured_fallback",
    documentMetrics: doclingExtraction
      ? {
          tablesCount: doclingExtraction.tablesCount,
          picturesCount: doclingExtraction.picturesCount,
          fileName: doclingExtraction.fileName,
          fileFormat: doclingExtraction.fileFormat,
        }
      : undefined,
  };

  const analysisVersion: ContractAnalysisVersionPayload = {
    provider: doclingExtraction ? `${doclingExtraction.provider}+lex_analysis` : "lex_structured_fallback",
    summary: review.executiveSummary,
    overallRisk: review.overallRisk,
    analysisPayload: {
      analysis,
      review,
      clauseSuggestions,
      extraction: doclingExtraction
        ? {
            provider: doclingExtraction.provider,
            sectionsCount: doclingExtraction.sections.length,
            tablesCount: doclingExtraction.tablesCount,
            picturesCount: doclingExtraction.picturesCount,
            fileName: doclingExtraction.fileName,
            fileFormat: doclingExtraction.fileFormat,
          }
        : null,
    },
  };

  return {
    structuredPayload,
    analysisVersion,
    extraction: doclingExtraction,
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
