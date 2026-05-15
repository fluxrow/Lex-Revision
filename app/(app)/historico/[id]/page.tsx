import Link from "next/link";
import { notFound } from "next/navigation";

import ContractDetailActions from "@/components/contracts/ContractDetailActions";
import LegalReferenceExplorer from "@/components/legal/LegalReferenceExplorer";
import SendForSignatureCard from "@/components/signatures/SendForSignatureCard";
import SignatureLinkActions from "@/components/signatures/SignatureLinkActions";
import SignatureRequestActions from "@/components/signatures/SignatureRequestActions";
import Icon from "@/components/ui/Icon";
import { getClicksignRuntimeStatus } from "@/lib/clicksign";
import { fmtBRL, STATUS_LABELS } from "@/lib/data";
import { getContractDetail } from "@/lib/data.server";
import {
  buildLegalReferenceContext,
  searchLegalReferences,
} from "@/lib/legal/references";
import {
  buildSuggestedLegalQueries,
  normalizeContractTypeForSearch,
} from "@/lib/legal/search-context";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContractDetail(id);
  const clicksignStatus = getClicksignRuntimeStatus();
  const signatureDeliveryMode = clicksignStatus.configured ? "clicksign" : "manual_beta";
  const hasOpenSignatureFlow = contract?.signatureRequests.some((request) =>
    ["sent", "partial"].includes(request.status)
  );

  if (!contract) {
    notFound();
  }

  const riskLabel = RISK_LABELS[contract.analysis?.overallRisk || "medium"];
  const clauseCoverage = contract.analysis?.clauseCoverage || [];
  const clauseGaps = clauseCoverage.filter((clause) => clause.status !== "present");
  const coveredClauses = clauseCoverage.filter((clause) => clause.status === "present").length;
  const requiredMissingClauses = clauseCoverage.filter((clause) => clause.status === "missing_required").length;
  const recommendedMissingClauses = clauseCoverage.filter((clause) => clause.status === "missing_recommended").length;
  const clauseCoveragePercent = clauseCoverage.length > 0 ? Math.round((coveredClauses / clauseCoverage.length) * 100) : 0;
  const suggestedLegalQueries = buildSuggestedLegalQueries({
    contractType: contract.contractType,
    clauseGaps: clauseGaps.map((clause) => clause.title),
    findings: contract.analysis?.findings.map((finding) => finding.title) || [],
  });
  const initialLegalQuery = suggestedLegalQueries[0] || contract.contractType;
  const normalizedContractType = normalizeContractTypeForSearch(contract.contractType);
  const initialLegalResults = searchLegalReferences({
    query: initialLegalQuery,
    contractType: normalizedContractType,
    clauseIds: clauseGaps.map((clause) => clause.id),
  });
  const initialLegalContext = buildLegalReferenceContext({
    query: initialLegalQuery,
    contractType: normalizedContractType,
    clauseIds: clauseGaps.map((clause) => clause.id),
    results: initialLegalResults,
  });

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
          hasSignatureFlow={Boolean(hasOpenSignatureFlow)}
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

      {contract.isFallback ? (
        <div
          className="card"
          style={{
            marginBottom: 18,
            borderColor: "var(--amber)",
            background: "linear-gradient(135deg, var(--amber-soft), transparent)",
          }}
        >
          <div className="card-title">Contrato de demonstração</div>
          <div className="card-sub" style={{ maxWidth: 760 }}>
            Este detalhe foi aberto a partir do fallback controlado do Lex. Ele ajuda no onboarding, mas não
            reflete o banco remoto nem grava novas etapas reais de assinatura, análise ou exportação.
          </div>
          <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/novo" className="btn btn-primary" style={{ textDecoration: "none" }}>
              <Icon name="plus" size={14} />
              Criar contrato real
            </Link>
            <Link href="/historico" className="btn btn-secondary" style={{ textDecoration: "none" }}>
              <Icon name="folder" size={14} />
              Voltar ao histórico
            </Link>
          </div>
        </div>
      ) : null}

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

          <div className="card">
            <div className="card-title">Linha do tempo</div>
            <div className="card-sub">Eventos operacionais registrados para este contrato e suas rodadas de assinatura.</div>
            {contract.activityLog.length === 0 ? (
              <div className="muted" style={{ marginTop: 14 }}>
                Ainda não existe atividade registrada para este contrato.
              </div>
            ) : (
              <div className="col" style={{ gap: 10, marginTop: 14 }}>
                {contract.activityLog.slice(0, 8).map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                    }}
                  >
                    <div className="row sp-between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700 }}>{entry.title}</div>
                      <span className="dim" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                    <div className="muted" style={{ lineHeight: 1.55 }}>
                      {entry.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <LegalReferenceExplorer
            initialQuery={initialLegalQuery}
            contractType={normalizedContractType}
            clauseIds={clauseGaps.map((clause) => clause.id)}
            suggestedQueries={suggestedLegalQueries}
            initialResults={initialLegalResults}
            initialNote="Pesquisa beta baseada na base jurídica curada do Lex. Não representa jurisprudência live nem substitui validação humana."
            initialContext={initialLegalContext}
          />
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

                {clauseCoverage.length > 0 ? (
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                    }}
                  >
                    <div className="row sp-between" style={{ alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>Cobertura de cláusulas</div>
                        <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                          Cobertura: {coveredClauses}/{clauseCoverage.length} cláusulas recomendadas presentes
                        </div>
                      </div>
                      <span
                        className={`chip ${
                          clauseCoveragePercent >= 80
                            ? "chip-green"
                            : clauseCoveragePercent >= 50
                              ? "chip-amber"
                              : "chip-red"
                        }`}
                      >
                        {clauseCoveragePercent}%
                      </span>
                    </div>

                    <div
                      aria-hidden="true"
                      style={{
                        width: "100%",
                        height: 10,
                        borderRadius: 999,
                        background: "var(--surface-3)",
                        overflow: "hidden",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: `${clauseCoveragePercent}%`,
                          height: "100%",
                          borderRadius: 999,
                          background:
                            clauseCoveragePercent >= 80
                              ? "var(--green)"
                              : clauseCoveragePercent >= 50
                                ? "var(--amber)"
                                : "var(--red)",
                        }}
                      />
                    </div>

                    <div className="grid grid-3">
                      <CoverageStat label="Presentes" value={String(coveredClauses)} tone="var(--green)" />
                      <CoverageStat
                        label="Obrigatórias ausentes"
                        value={String(requiredMissingClauses)}
                        tone="var(--red)"
                      />
                      <CoverageStat
                        label="Recomendadas ausentes"
                        value={String(recommendedMissingClauses)}
                        tone="var(--amber)"
                      />
                    </div>
                  </div>
                ) : null}

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
                  deliveryMode={signatureDeliveryMode}
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
                {!hasOpenSignatureFlow ? (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--amber-soft)",
                      color: "var(--amber)",
                    }}
                  >
                    A última rodada já foi encerrada. Você pode iniciar uma nova rodada com novos signatários
                    ou reaproveitar a base de uma rodada anterior.
                  </div>
                ) : null}

                {!hasOpenSignatureFlow ? (
                  <SendForSignatureCard
                    contractId={contract.id}
                    deliveryMode={signatureDeliveryMode}
                    providerEnvironment={clicksignStatus.environment}
                    initialSigner={{
                      name: contract.client?.name || "",
                      email: contract.client?.email === "—" ? "" : contract.client?.email || "",
                      document: contract.client?.document === "—" ? "" : contract.client?.document || "",
                    }}
                  />
                ) : null}

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
                          <div style={{ fontWeight: 700 }}>{formatSignatureProvider(request.provider)}</div>
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
                              {signer.signatureUrl ? <SignatureLinkActions signatureUrl={signer.signatureUrl} /> : null}
                              <span className={`chip ${signer.status === "signed" ? "chip-green" : signer.status === "viewed" ? "chip-accent" : signer.status === "refused" ? "chip-red" : "chip-amber"}`}>
                                {signer.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <SignatureRequestActions
                        requestId={request.id}
                        provider={request.provider}
                        status={request.status}
                        allowRestart={!hasOpenSignatureFlow}
                        signerLinks={request.signers.map((signer) => ({
                          name: signer.name,
                          email: signer.email,
                          signatureUrl: signer.signatureUrl,
                        }))}
                      />
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

function formatSignatureProvider(provider: string) {
  switch (provider) {
    case "lex_beta":
      return "Lex beta manual";
    case "clicksign":
      return "Clicksign";
    default:
      return provider;
  }
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row sp-between" style={{ gap: 12, alignItems: "flex-start" }}>
      <div className="dim" style={{ fontSize: 12.5 }}>{label}</div>
      <div style={{ textAlign: "right", fontWeight: 600, maxWidth: "60%" }}>{value}</div>
    </div>
  );
}

function CoverageStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
      }}
    >
      <div className="dim" style={{ fontSize: 11.5, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 22, color: tone }}>{value}</div>
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
