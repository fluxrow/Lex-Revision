"use client";

import { useMemo, useState } from "react";

import Icon from "@/components/ui/Icon";
import { buildContractVersionDiff } from "@/lib/contracts/versions";
import type { ContractDetail } from "@/lib/data.server";

export default function ContractVersionHistory({
  versions,
}: {
  versions: ContractDetail["versions"];
}) {
  const chronological = useMemo(
    () => [...versions].sort((left, right) => left.versionNumber - right.versionNumber),
    [versions]
  );
  const defaultBase = chronological.length > 1 ? chronological[chronological.length - 2]?.id : chronological[0]?.id;
  const defaultCompare = chronological[chronological.length - 1]?.id;
  const [baseVersionId, setBaseVersionId] = useState(defaultBase || "");
  const [compareVersionId, setCompareVersionId] = useState(defaultCompare || "");

  const baseVersion = chronological.find((version) => version.id === baseVersionId) || chronological[0] || null;
  const compareVersion =
    chronological.find((version) => version.id === compareVersionId) ||
    chronological[chronological.length - 1] ||
    null;

  const selectedDiff =
    baseVersion && compareVersion
      ? buildContractVersionDiff(baseVersion.body, compareVersion.body)
      : null;

  return (
    <div className="card" id="versions">
      <div className="card-title">Histórico de versões</div>
      <div className="card-sub">
        Cada revisão salva preserva o texto, o autor, o resumo da mudança e um diff comparável entre versões.
      </div>

      {versions.length === 0 ? (
        <div className="muted" style={{ marginTop: 14 }}>
          Nenhuma versão persistida ainda.
        </div>
      ) : (
        <>
          {chronological.length >= 2 && baseVersion && compareVersion ? (
            <div
              style={{
                marginTop: 14,
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Comparar versões</div>
              <div className="grid grid-2" style={{ marginBottom: 12 }}>
                <label className="col" style={{ gap: 6 }}>
                  <span className="dim" style={{ fontSize: 12 }}>Versão base</span>
                  <select
                    className="input"
                    value={baseVersionId}
                    onChange={(event) => {
                      const nextBaseId = event.target.value;
                      setBaseVersionId(nextBaseId);
                      if (nextBaseId === compareVersionId) {
                        const fallbackCompare =
                          chronological.find((version) => version.id !== nextBaseId)?.id || nextBaseId;
                        setCompareVersionId(fallbackCompare);
                      }
                    }}
                  >
                    {chronological.map((version) => (
                      <option key={`base-${version.id}`} value={version.id}>
                        v{version.versionNumber} · {formatDateTime(version.createdAt)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="col" style={{ gap: 6 }}>
                  <span className="dim" style={{ fontSize: 12 }}>Comparar com</span>
                  <select
                    className="input"
                    value={compareVersionId}
                    onChange={(event) => {
                      const nextCompareId = event.target.value;
                      setCompareVersionId(nextCompareId);
                      if (nextCompareId === baseVersionId) {
                        const fallbackBase =
                          chronological.find((version) => version.id !== nextCompareId)?.id || nextCompareId;
                        setBaseVersionId(fallbackBase);
                      }
                    }}
                  >
                    {chronological.map((version) => (
                      <option key={`compare-${version.id}`} value={version.id}>
                        v{version.versionNumber} · {formatDateTime(version.createdAt)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedDiff ? (
                <>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <span className="chip">v{baseVersion.versionNumber} → v{compareVersion.versionNumber}</span>
                    <span className="chip chip-green">+{selectedDiff.addedLines}</span>
                    <span className="chip chip-red">-{selectedDiff.removedLines}</span>
                    <span className="chip">{selectedDiff.changedLines} alterações</span>
                  </div>

                  {selectedDiff.preview.length > 0 ? (
                    <div className="col" style={{ gap: 8 }}>
                      {selectedDiff.preview.map((entry, index) => (
                        <div
                          key={`selected-diff-${index}`}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            background:
                              entry.kind === "added"
                                ? "var(--green-soft)"
                                : "var(--red-soft)",
                            color: "var(--text)",
                          }}
                        >
                          <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                            <Icon name={entry.kind === "added" ? "plus" : "x"} size={12} />
                            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                              {entry.line || "Linha em branco"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted">Sem diferença textual entre as versões selecionadas.</div>
                  )}
                </>
              ) : null}
            </div>
          ) : null}

          <div className="col" style={{ gap: 12, marginTop: 14 }}>
            {versions.map((version) => (
              <div
                key={version.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <div className="row sp-between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span className="chip chip-green">v{version.versionNumber}</span>
                      <span className="chip">{version.contractType}</span>
                    </div>
                    <div style={{ fontWeight: 700 }}>{version.name}</div>
                    <div className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>
                      {formatDateTime(version.createdAt)}
                      {version.authorName ? ` · por ${version.authorName}` : ""}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span className="chip chip-green">+{version.diff.addedLines}</span>
                    <span className="chip chip-red">-{version.diff.removedLines}</span>
                    <span className="chip">{version.diff.changedLines} alterações</span>
                  </div>
                </div>

                <div className="muted" style={{ lineHeight: 1.6, marginBottom: 12 }}>
                  {version.changeSummary || "Revisão sem resumo manual."}
                </div>

                {version.diff.preview.length > 0 ? (
                  <div className="col" style={{ gap: 8 }}>
                    {version.diff.preview.map((entry, index) => (
                      <div
                        key={`${version.id}-diff-${index}`}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background:
                            entry.kind === "added"
                              ? "var(--green-soft)"
                              : "var(--red-soft)",
                          color: "var(--text)",
                        }}
                      >
                        <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                          <Icon name={entry.kind === "added" ? "plus" : "x"} size={12} />
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                            {entry.line || "Linha em branco"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="muted">Sem diff textual em relação à versão anterior.</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
