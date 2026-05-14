"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import LegalReferenceExplorer from "@/components/legal/LegalReferenceExplorer";
import Icon from "@/components/ui/Icon";
import type { GeneratedContractDraft } from "@/lib/legal/generation";
import {
  buildSuggestedLegalQueries,
  normalizeContractTypeForSearch,
} from "@/lib/legal/search-context";

type ReviewResponse = {
  provider: string;
  review: {
    executiveSummary: string;
    overallRisk: "low" | "medium" | "high";
    findings: Array<{
      title: string;
      risk: "low" | "medium" | "high";
      trecho: string;
      motivo: string;
      sugestao: string;
      legalBasis?: string;
    }>;
    nextActions: string[];
  };
};

type ClausesResponse = {
  provider: string;
  clauseCoverage: Array<{
    id: string;
    title: string;
    status: "present" | "missing_required" | "missing_recommended";
    importance: "required" | "recommended";
    riskIfMissing: "low" | "medium" | "high";
  }>;
  suggestedClauses: Array<{
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    motivo: string;
    text: string;
  }>;
};

type GenerationResult = {
  generateProvider: string;
  reviewProvider: string;
  clausesProvider: string;
  contract: GeneratedContractDraft;
  review: ReviewResponse["review"];
  clauseCoverage: ClausesResponse["clauseCoverage"];
  suggestions: ClausesResponse["suggestedClauses"];
};

export default function FlowIA() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [loadingLabel, setLoadingLabel] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [addedClauseIds, setAddedClauseIds] = React.useState<string[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const previewClauses = React.useMemo(() => {
    if (!result) {
      return [];
    }

    const appended = result.suggestions
      .filter((suggestion) => addedClauseIds.includes(suggestion.id))
      .map((suggestion, index) => ({
        id: suggestion.id,
        number: `${result.contract.clauses.length + index + 1}`,
        title: suggestion.title,
        body: suggestion.text,
      }));

    return [...result.contract.clauses, ...appended];
  }, [addedClauseIds, result]);

  const legalSearchContext = React.useMemo(() => {
    if (!result) {
      return null;
    }

    const clauseGaps = result.clauseCoverage
      .filter((clause) => clause.status !== "present")
      .map((clause) => clause.title);
    const suggestedQueries = buildSuggestedLegalQueries({
      contractType: result.contract.contractLabel,
      clauseGaps,
      findings: result.review.findings.map((finding) => finding.title),
    });

    return {
      contractType: normalizeContractTypeForSearch(result.contract.contractType),
      clauseIds: result.clauseCoverage
        .filter((clause) => clause.status !== "present")
        .map((clause) => clause.id),
      suggestedQueries,
      initialQuery: suggestedQueries[0] || result.contract.contractLabel,
    };
  }, [result]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAddedClauseIds([]);
    setCopied(false);

    try {
      setLoadingLabel("Gerando rascunho contratual...");
      const generateResponse = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const generatePayload = await generateResponse.json();

      if (!generateResponse.ok) {
        throw new Error(generatePayload.error || "Nao foi possivel gerar o contrato.");
      }

      const contract = generatePayload.contract as GeneratedContractDraft;
      const contractBody = contract.body;

      setLoadingLabel("Revisando riscos e cobrindo clausulas...");
      const [reviewResponse, clausesResponse] = await Promise.all([
        fetch("/api/ai/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentContent: contractBody,
            contractTypeHint: contract.contractType,
          }),
        }),
        fetch("/api/ai/clauses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentContent: contractBody,
            contractTypeHint: contract.contractType,
          }),
        }),
      ]);

      const reviewPayload = (await reviewResponse.json()) as ReviewResponse & { error?: string };
      const clausesPayload = (await clausesResponse.json()) as ClausesResponse & { error?: string };

      if (!reviewResponse.ok) {
        throw new Error(reviewPayload.error || "Nao foi possivel revisar o rascunho.");
      }

      if (!clausesResponse.ok) {
        throw new Error(clausesPayload.error || "Nao foi possivel sugerir clausulas.");
      }

      setResult({
        generateProvider: generatePayload.provider,
        reviewProvider: reviewPayload.provider,
        clausesProvider: clausesPayload.provider,
        contract,
        review: reviewPayload.review,
        clauseCoverage: clausesPayload.clauseCoverage,
        suggestions: clausesPayload.suggestedClauses,
      });
    } catch (requestError: any) {
      setError(requestError.message || "Nao foi possivel concluir a geracao.");
    } finally {
      setLoading(false);
      setLoadingLabel("");
    }
  };

  const handleCopy = async () => {
    if (!result) {
      return;
    }

    const content = previewClauses
      .map((clause) => `Clausula ${clause.number} - ${clause.title}\n${clause.body}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(`${result.contract.title}\n\n${content}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Nao foi possivel copiar o texto deste rascunho.");
    }
  };

  const handleSaveDraft = async () => {
    if (!result) {
      return;
    }

    setSaveLoading(true);
    setSaveMessage(null);
    setError(null);

    try {
      const appliedSuggestions = result.suggestions.filter((suggestion) =>
        addedClauseIds.includes(suggestion.id)
      );
      const content = previewClauses
        .map((clause) => `Clausula ${clause.number} - ${clause.title}\n${clause.body}`)
        .join("\n\n");

      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: result.contract.title,
          contractType: result.contract.contractLabel,
          body: `${result.contract.title}\n\n${content}`,
          appliedSuggestions,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel salvar este rascunho.");
      }

      setSaveMessage("Rascunho salvo no historico com sucesso.");
      router.push("/historico");
      router.refresh();
    } catch (saveError: any) {
      setError(saveError.message || "Nao foi possivel salvar este rascunho.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Gerar com IA <span className="chip chip-green" style={{ marginLeft: 10, verticalAlign: "middle" }}>Novo</span></h1>
          <div className="page-sub">Descreva o contrato e a IA monta um rascunho com leitura juridica do Lex</div>
        </div>
        <div className="actions">
          <Link href="/novo" className="btn btn-ghost" style={{ textDecoration: "none" }}>
            <Icon name="arrow-left" size={14} />
            Voltar
          </Link>
        </div>
      </div>

      {!result ? (
        <div className="card" style={{ padding: 32 }}>
          <label className="field-label">Descreva o contrato</label>
          <textarea
            className="textarea"
            rows={6}
            placeholder="Ex: Contrato de prestacao de consultoria juridica para empresa de tecnologia, com valor de R$ 20.000, prazo de 6 meses, clausula de confidencialidade e foro em Sao Paulo."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={loading}
          />

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10 }}>Sugestões</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {[
                "NDA bilateral entre startup e parceiro comercial",
                "Consultoria recorrente para escritorio de advocacia",
                "Locacao comercial com reajuste anual",
                "Honorarios com clausula de exito",
                "Termo de acordo com confidencialidade",
              ].map((suggestion) => (
                <span
                  key={suggestion}
                  className="chip card-hover"
                  style={{ padding: "6px 12px", cursor: "pointer" }}
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>

          {error ? (
            <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, marginTop: 16, padding: "10px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 8 }}>
              {error}
            </div>
          ) : null}

          <div className="row sp-between" style={{ marginTop: 28, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 12 }}>
              <Icon name="shield" size={12} /> {loading ? loadingLabel : "A geracao segue a base juridica do Lex quando houver heuristica disponivel."}
            </span>
            <button
              className="btn btn-primary btn-lg"
              disabled={!prompt.trim() || loading}
              style={{ opacity: prompt.trim() && !loading ? 1 : 0.5 }}
              onClick={handleGenerate}
            >
              <Icon name="sparkle" size={16} />
              {loading ? "Processando..." : "Gerar contrato"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div className="card-title">{result.contract.title}</div>
              <div className="card-sub">
                {result.contract.contractLabel} · {result.contract.summary}
              </div>
            </div>
            <div style={{ background: "#fafaf6", color: "#1a1a1a", padding: 30, fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.7, minHeight: 520 }}>
              <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 18 }}>
                {result.contract.title}
              </div>
              {previewClauses.map((clause) => (
                <div key={`${clause.id}-${clause.number}`} style={{ marginBottom: 18 }}>
                  <p style={{ fontWeight: 700, margin: "0 0 6px" }}>
                    Clausula {clause.number} - {clause.title}
                    {addedClauseIds.includes(clause.id) ? (
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 10,
                          fontWeight: 700,
                          background: "rgba(91,111,209,0.18)",
                          color: "#5b6fd1",
                          padding: "2px 6px",
                          borderRadius: 999,
                          marginLeft: 8,
                        }}
                      >
                        IA
                      </span>
                    ) : null}
                  </p>
                  <p style={{ margin: 0 }}>{clause.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="col" style={{ gap: 16 }}>
            {error ? (
              <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, padding: "10px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 8 }}>
                {error}
              </div>
            ) : null}

            {saveMessage ? (
              <div style={{ color: "var(--green)", fontSize: 13, padding: "10px 12px", background: "var(--green-soft)", borderRadius: 8 }}>
                {saveMessage}
              </div>
            ) : null}

            <div className="card">
              <div className="card-title">Resumo da geração</div>
              <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <span className="chip chip-accent">{result.contract.contractLabel}</span>
                <span className="chip">{result.generateProvider}</span>
                <span className="chip">{result.reviewProvider}</span>
                <span className="chip">{result.clausesProvider}</span>
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.6 }}>
                Variaveis sugeridas: {result.contract.variables.join(", ")}.
              </div>
            </div>

            <div
              className="card"
              style={{
                background:
                  result.review.overallRisk === "high"
                    ? "linear-gradient(135deg, rgba(239,68,68,0.12), transparent)"
                    : result.review.overallRisk === "medium"
                      ? "linear-gradient(135deg, var(--amber-soft), transparent)"
                      : "linear-gradient(135deg, var(--green-soft), transparent)",
              }}
            >
              <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                <Icon name="shield" size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>
                  Revisao do Lex
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>
                Risco {result.review.overallRisk}
              </div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                {result.review.executiveSummary}
              </div>
              <div className="col" style={{ gap: 10 }}>
                {result.review.findings.slice(0, 3).map((finding) => (
                  <div key={`${finding.title}-${finding.trecho}`} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
                    <div className="row" style={{ gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13.5 }}>{finding.title}</strong>
                      <span className={`chip ${finding.risk === "high" ? "chip-amber" : finding.risk === "medium" ? "chip-accent" : "chip-green"}`}>
                        {finding.risk}
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{finding.motivo}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Clausulas sugeridas</div>
              <div className="card-sub">Ajustes que elevam a qualidade juridica do rascunho</div>
              <div className="col" style={{ gap: 12, marginTop: 14 }}>
                {result.suggestions.length === 0 ? (
                  <div className="muted" style={{ fontSize: 12.5 }}>Nenhuma sugestao adicional foi gerada para este rascunho.</div>
                ) : (
                  result.suggestions.slice(0, 4).map((suggestion) => {
                    const added = addedClauseIds.includes(suggestion.id);
                    return (
                      <div key={suggestion.id} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)" }}>
                        <div className="row sp-between" style={{ gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 13.5 }}>{suggestion.title}</strong>
                          <span className={`chip ${suggestion.priority === "high" ? "chip-amber" : suggestion.priority === "medium" ? "chip-accent" : "chip-green"}`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 10 }}>
                          {suggestion.motivo}
                        </div>
                        <button
                          className={`btn ${added ? "btn-secondary" : "btn-primary"} btn-sm`}
                          type="button"
                          onClick={() =>
                            setAddedClauseIds((current) =>
                              added ? current.filter((item) => item !== suggestion.id) : [...current, suggestion.id]
                            )
                          }
                        >
                          <Icon name={added ? "check" : "plus"} size={13} />
                          {added ? "Aplicada" : "Aplicar no rascunho"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {legalSearchContext ? (
              <LegalReferenceExplorer
                key={`${result.contract.contractType}-${legalSearchContext.initialQuery}`}
                initialQuery={legalSearchContext.initialQuery}
                contractType={legalSearchContext.contractType}
                clauseIds={legalSearchContext.clauseIds}
                suggestedQueries={legalSearchContext.suggestedQueries}
                initialNote="Pesquisa beta baseada na base jurídica curada do Lex. Use como apoio à revisão antes de salvar o rascunho."
              />
            ) : null}

            <div className="card">
              <div className="card-title">Proximo passo</div>
              <div className="card-sub">Agora o rascunho pode entrar no historico da operacao antes de seguir para assinatura.</div>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginBottom: 8 }}
                onClick={handleSaveDraft}
                disabled={saveLoading}
              >
                <Icon name="file" size={15} />
                {saveLoading ? "Salvando..." : "Salvar no histórico"}
              </button>
              <button className="btn btn-primary btn-lg" style={{ width: "100%", marginBottom: 8 }} onClick={handleCopy}>
                <Icon name="copy" size={15} />
                {copied ? "Texto copiado" : "Copiar rascunho"}
              </button>
              <button className="btn btn-secondary" style={{ width: "100%", marginBottom: 8 }} onClick={() => setResult(null)}>
                <Icon name="sparkle" size={15} />
                Gerar novamente
              </button>
              <Link href="/historico" className="btn btn-ghost" style={{ width: "100%", textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
                <Icon name="history" size={15} />
                Ir para historico
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
