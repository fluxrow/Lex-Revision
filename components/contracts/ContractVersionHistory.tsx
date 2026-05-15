import Icon from "@/components/ui/Icon";
import type { ContractDetail } from "@/lib/data.server";

export default function ContractVersionHistory({
  versions,
}: {
  versions: ContractDetail["versions"];
}) {
  return (
    <div className="card" id="versions">
      <div className="card-title">Histórico de versões</div>
      <div className="card-sub">
        Cada revisão salva preserva o texto, o resumo da mudança e um diff compacto em relação à versão anterior.
      </div>

      {versions.length === 0 ? (
        <div className="muted" style={{ marginTop: 14 }}>
          Nenhuma versão persistida ainda.
        </div>
      ) : (
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
