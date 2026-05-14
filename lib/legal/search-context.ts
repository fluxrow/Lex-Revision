export function normalizeContractTypeForSearch(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

  if (normalized.includes("servic")) {
    return "service_agreement";
  }
  if (normalized.includes("confidencial") || normalized.includes("nda")) {
    return "nda";
  }
  if (normalized.includes("loca")) {
    return "lease";
  }
  if (normalized.includes("trabalh") || normalized.includes("empreg") || normalized.includes("clt")) {
    return "employment";
  }

  return "general";
}

export function buildSuggestedLegalQueries({
  contractType,
  clauseGaps,
  findings,
}: {
  contractType: string;
  clauseGaps: string[];
  findings: string[];
}) {
  const suggestions = new Set<string>();

  if (contractType) {
    suggestions.add(`${contractType} boa-fé objetiva`);
  }

  if (clauseGaps[0]) {
    suggestions.add(`${clauseGaps[0]} contrato`);
  }

  if (findings[0]) {
    suggestions.add(findings[0]);
  }

  if (contractType) {
    suggestions.add(`${contractType} rescisão e penalidades`);
  }

  return Array.from(suggestions).filter(Boolean).slice(0, 4);
}
