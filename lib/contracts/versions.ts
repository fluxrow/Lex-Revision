export type ContractVersionDiffOp =
  | { kind: "equal"; line: string }
  | { kind: "added"; line: string }
  | { kind: "removed"; line: string };

export type ContractVersionDiffSummary = {
  changedLines: number;
  addedLines: number;
  removedLines: number;
  preview: Array<
    | { kind: "added"; line: string }
    | { kind: "removed"; line: string }
  >;
};

export function buildContractVersionDiff(previousBody: string, nextBody: string): ContractVersionDiffSummary {
  const previous = normalizeBodyLines(previousBody);
  const next = normalizeBodyLines(nextBody);
  const ops = diffLines(previous, next);
  const preview = ops.filter((entry) => entry.kind !== "equal").slice(0, 10) as ContractVersionDiffSummary["preview"];
  const addedLines = ops.filter((entry) => entry.kind === "added").length;
  const removedLines = ops.filter((entry) => entry.kind === "removed").length;

  return {
    changedLines: addedLines + removedLines,
    addedLines,
    removedLines,
    preview,
  };
}

export function buildVersionChangeSummary(previousBody: string, nextBody: string, explicitSummary?: string | null) {
  const cleanedSummary = explicitSummary?.trim();
  if (cleanedSummary) {
    return cleanedSummary;
  }

  const diff = buildContractVersionDiff(previousBody, nextBody);
  if (diff.changedLines === 0) {
    return "Revisão sem alterações textuais relevantes.";
  }

  const parts: string[] = [];
  if (diff.addedLines > 0) {
    parts.push(`${diff.addedLines} linha(s) adicionada(s)`);
  }
  if (diff.removedLines > 0) {
    parts.push(`${diff.removedLines} linha(s) removida(s)`);
  }

  return `Revisão textual com ${parts.join(" e ")}.`;
}

function normalizeBodyLines(body: string) {
  return body
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, all) => !(line === "" && all[index - 1] === ""));
}

function diffLines(previous: string[], next: string[]): ContractVersionDiffOp[] {
  const rows = previous.length;
  const cols = next.length;
  const lcs: number[][] = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      if (previous[i] === next[j]) {
        lcs[i][j] = lcs[i + 1][j + 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
      }
    }
  }

  const ops: ContractVersionDiffOp[] = [];
  let i = 0;
  let j = 0;

  while (i < rows && j < cols) {
    if (previous[i] === next[j]) {
      ops.push({ kind: "equal", line: previous[i] });
      i += 1;
      j += 1;
      continue;
    }

    if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ kind: "removed", line: previous[i] });
      i += 1;
    } else {
      ops.push({ kind: "added", line: next[j] });
      j += 1;
    }
  }

  while (i < rows) {
    ops.push({ kind: "removed", line: previous[i] });
    i += 1;
  }

  while (j < cols) {
    ops.push({ kind: "added", line: next[j] });
    j += 1;
  }

  return ops;
}
