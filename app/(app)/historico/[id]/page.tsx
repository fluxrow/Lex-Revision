import Link from "next/link";
import { notFound } from "next/navigation";

import ContractDetailActions from "@/components/contracts/ContractDetailActions";
import SendForSignatureCard from "@/components/signatures/SendForSignatureCard";
import Icon from "@/components/ui/Icon";
import { getClicksignRuntimeStatus } from "@/lib/clicksign";
import { fmtBRL, STATUS_LABELS } from "@/lib/data";
import { getContractDetail } from "@/lib/data.server";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContractDetail(id);
  const clicksignStatus = getClicksignRuntimeStatus();

  if (!contract) {
    notFound();
  }

  const riskLabel = RISK_LABELS[contract.analysis?.overallRisk || "medium"];
  const clauseGaps = contract.analysis?.clauseCoverage.filter((clause) => clause.status !== "present") || [];

  return (
    <>
      <div className="page-head">
        <div>
          <Link
            href="/historico"
            className="row muted"
            style={{ gap: 6, marginBottom: 10, fontSize: 12.5, textDecoration: "none" }}
          >
            <Icon name="chevron-left" size={14} />
            Voltar para histórico
          </Link>
          <h1>{contract.name}</h1>
          <div className="page-sub">
            {contract.client?.name || "Contrato interno"} · atualizado em {formatDateTime(contract.updatedAt)}
          </div>
        </div>
        <ContractDetailActions
          contractId={contract.id}
          contractName={contract.name}
          contractBody={contract.body}
          hasSignatureFlow={contract.signatureRequests.length > 0}
        />
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span className={`chip ${STATUS_LABELS[contract.status]?.chip || ""}`}>
          <span className="chip-dot" />
          {STATUS_LABELS[contract.status]?.label || contract.status}
        </span>
        <span className="chip">{contract.contractType}</span>
        <span className="chip">{contract.source === "mock_preview" ? "Prévia demo" : `Origem: ${beautifySource(contract.source)}`}</span>
        {contract.analysis ? <span className={`chip ${riskLabel.chip}`}>Risco {riskLabel.label}</span> : null}
        {contract.isFallback ? <span className="chip chip-amber">Sem dados remotos para este contrato</span> : null}
      </div>

      <div className="grid contract-detail-grid" style={{ alignItems: "start" }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="card" id="assinaturas">
            <div className="row sp-between" style={{ alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div className="card-title">Estrutura do contrato</div>
                <div className="card-sub">
                  {contract.sections.length} blocos · {contract.parties.length} partes detectadas
                </div>
              </div>
              <span className="chip">{fmtBRL(contract.value)}</span>
            </div>
            <div className="col" style={{ gap: 14 }}>
              {contract.sections.map((section, index) => (
                <section
                  key={`${contract.id}-section-${index}`}
                  style={{
                    padding: "14px 16px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>
                    {section.title || `Seção ${index + 1}`}
                  </div>
                  <div
                    className="muted"
                    style={{
                      fontSize: 13,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {section.text || "Sem conteúdo disponível."}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Variáveis e campos do documento</div>
            <div className="card-sub">
              Valores estruturados que o Lex reconheceu ao salvar este contrato.
            </div>
            {Object.keys(contract.variableValues).length === 0 ? (
              <div className="muted">Nenhuma variável persistida neste contrato.</div>
            ) : (
              <div className="grid grid-2">
                {Object.entries(contract.variableValues).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                    }}
                  >
                    <div className="dim" style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {key.replaceAll("_", " ")}
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 600 }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-title">Resumo operacional</div>
            <div className="card-sub">Contexto de cliente, template, vencimento e origem do documento.</div>
            <div className="col" style={{ gap: 12 }}>
              <MetaRow label="Cliente" value={contract.client?.name || "Rascunho interno"} />
              <MetaRow label="E-mail" value={contract.client?.email || "—"} />
              <MetaRow label="Documento" value={contract.client?.document || "—"} />
              <MetaRow label="Tipo" value={contract.client?.type || "—"} />
              <MetaRow label="Template" value={contract.template?.name || "Sem template vinculado"} />
              <MetaRow label="Categoria" value={contract.template?.category || "—"} />
              <MetaRow label="Criado em" value={formatDateTime(contract.createdAt)} />
              <MetaRow label="Assinado em" value={contract.signedAt ? formatDateTime(contract.signedAt) : "—"} />
              <MetaRow label="Expira em" value={contract.expiresAt ? formatDateTime(contract.expiresAt) : "—"} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Leitura jurídica do Lex</div>
            <div className="card-sub">
              Risco, lacunas e próximos passos calculados na análise mais recente.
            </div>
            {contract.analysis ? (
              <div className="col" style={{ gap: 14 }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                  }}
                >
                  <div className="row sp-between" style={{ alignItems: "center", marginBottom: 8 }}>
                    <span className={`chip ${riskLabel.chip}`}>Risco {riskLabel.label}</span>
                    <span className="dim" style={{ fontSize: 11.5 }}>
                      {contract.analysis.createdAt ? formatDateTime(contract.analysis.createdAt) : "Última análise"}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, lineHeight: 1.55 }}>{contract.analysis.summary}</div>
                </div>

                {contract.analysis.findings.length > 0 ? (
                  <div className="col" style={{ gap: 10 }}>
                    {contract.analysis.findings.slice(0, 4).map((finding, index) => (
                      <div
                        key={`${contract.id}-finding-${index}`}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background: "var(--surface-2)",
                        }}
                      >
                        <div className="row sp-between" style={{ alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ fontWeight: 700 }}>{finding.title}</div>
                          <span className={`chip ${RISK_LABELS[normalizeRiskKey(finding.risk)].chip}`}>
                            {RISK_LABELS[normalizeRiskKey(finding.risk)].label}
                          </span>
                        </div>
                        {finding.motivo ? (
                          <div className="muted" style={{ lineHeight: 1.55 }}>
                            {finding.motivo}
                          </div>
                        ) : null}
                        {finding.sugestao ? (
                          <div style={{ marginTop: 8, fontSize: 12.5 }}>
                            <span className="dim">Sugestão:</span> {finding.sugestao}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="muted">Nenhum alerta adicional foi persistido para este contrato.</div>
                )}

                <div>
                  <div className="field-label">Próximos passos</div>
                  {contract.analysis.nextActions.length === 0 ? (
                    <div className="muted">Sem próximos passos automáticos registrados.</div>
                  ) : (
                    <div className="col" style={{ gap: 8 }}>
                      {contract.analysis.nextActions.map((action, index) => (
                        <div key={`${contract.id}-next-${index}`} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                          <span className="chip chip-accent">{index + 1}</span>
                          <div style={{ lineHeight: 1.55 }}>{action}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="field-label">Lacunas detectadas</div>
                  {clauseGaps.length === 0 ? (
                    <div className="muted">A cobertura heurística não apontou ausência crítica nas cláusulas mapeadas.</div>
                  ) : (
                    <div className="col" style={{ gap: 8 }}>
                      {clauseGaps.slice(0, 5).map((clause) => (
                        <div key={clause.id} className="row sp-between" style={{ gap: 12 }}>
                          <div style={{ lineHeight: 1.45 }}>{clause.title}</div>
                          <span className={`chip ${clause.status === "missing_required" ? "chip-red" : "chip-amber"}`}>
                            {clause.status === "missing_required" ? "Obrigatória" : "Recomendada"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="muted">Este contrato ainda não possui versão de análise persistida.</div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Partes, datas e valores</div>
            <div className="card-sub">Elementos estruturados detectados no documento.</div>
            <div className="col" style={{ gap: 12 }}>
              <ArrayBlock title="Partes" values={contract.parties} emptyLabel="Nenhuma parte detectada." />
              <ArrayBlock title="Datas" values={contract.dates} emptyLabel="Nenhuma data detectada." />
              <ArrayBlock title="Valores" values={contract.amounts} emptyLabel="Nenhum valor detectado." />
            </div>
            {contract.documentMetrics ? (
              <>
                <div className="divider" />
                <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                  <span className="chip">{contract.documentMetrics.fileFormat || "sem formato"}</span>
                  <span className="chip">{contract.documentMetrics.tablesCount} tabelas</span>
                  <span className="chip">{contract.documentMetrics.picturesCount} imagens</span>
                </div>
              </>
            ) : null}
          </div>

          <div className="card">
            <div className="card-title">Assinaturas</div>
            <div className="card-sub">
              Acompanhe o envio e o progresso dos signatários vinculados a este contrato.
            </div>
            {contract.signatureRequests.length === 0 ? (
              <div className="col" style={{ gap: 12 }}>
                <div className="muted">
                  Ainda não existe solicitação real de assinatura para este contrato.
                </div>
                <SendForSignatureCard
                  contractId={contract.id}
                  providerReady={clicksignStatus.configured}
                  providerEnvironment={clicksignStatus.environment}
                  initialSigner={{
                    name: contract.client?.name || "",
                    email: contract.client?.email === "—" ? "" : contract.client?.email || "",
                    document: contract.client?.document === "—" ? "" : contract.client?.document || "",
                  }}
                />
              </div>
            ) : (
              <div className="col" style={{ gap: 12 }}>
                {contract.signatureRequests.map((request) => {
                  const signedCount = request.signers.filter((signer) => signer.status === "signed").length;
                  const total = request.signers.length;

                  return (
                    <div
                      key={request.id}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                      }}
                    >
                      <div className="row sp-between" style={{ alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{request.provider}</div>
                          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                            Enviado em {request.sentAt ? formatDateTime(request.sentAt) : "—"}
                          </div>
                        </div>
                        <span className={`chip ${request.status === "completed" ? "chip-green" : "chip-accent"}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="muted" style={{ marginBottom: 10 }}>
                        {signedCount} de {total} assinaturas concluídas
                      </div>
                      <div className="col" style={{ gap: 8 }}>
                        {request.signers.map((signer) => (
                          <div key={signer.id} className="row sp-between" style={{ gap: 12, alignItems: "center" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600 }}>{signer.name}</div>
                              <div className="muted" style={{ fontSize: 12 }}>{signer.email}</div>
                            </div>
                            <div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                              {signer.signatureUrl ? (
                                <a
                                  href={signer.signatureUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-ghost btn-sm"
                                  style={{ textDecoration: "none" }}
                                >
                                  <Icon name="send" size={12} />
                                  Abrir link
                                </a>
                              ) : null}
                              <span className={`chip ${signer.status === "signed" ? "chip-green" : signer.status === "viewed" ? "chip-accent" : signer.status === "refused" ? "chip-red" : "chip-amber"}`}>
                                {signer.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <Link href="/assinaturas" className="btn btn-secondary" style={{ width: "fit-content", textDecoration: "none" }}>
                  <Icon name="send" size={14} />
                  Ver painel de assinaturas
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row sp-between" style={{ gap: 12, alignItems: "flex-start" }}>
      <div className="dim" style={{ fontSize: 12.5 }}>{label}</div>
      <div style={{ textAlign: "right", fontWeight: 600, maxWidth: "60%" }}>{value}</div>
    </div>
  );
}

function ArrayBlock({
  title,
  values,
  emptyLabel,
}: {
  title: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="field-label">{title}</div>
      {values.length === 0 ? (
        <div className="muted">{emptyLabel}</div>
      ) : (
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {values.map((value, index) => (
            <span key={`${title}-${index}`} className="chip">
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function beautifySource(value: string) {
  return value.replaceAll("_", " ");
}

function normalizeRiskKey(value: string) {
  if (value === "low" || value === "high") {
    return value;
  }
  return "medium";
}

const RISK_LABELS = {
  low: { label: "baixo", chip: "chip-green" },
  medium: { label: "médio", chip: "chip-amber" },
  high: { label: "alto", chip: "chip-red" },
} as const;
