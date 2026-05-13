"use client";

import { useEffect, useState } from "react";

import Icon from "@/components/ui/Icon";

type LegalReferenceEntry = {
  id: string;
  title: string;
  category: string;
  summary: string;
  practicalUse: string;
  legalBasis: string;
  sourceLabel: string;
};

type LegalReferenceExplorerProps = {
  initialQuery: string;
  contractType: string;
  clauseIds: string[];
  suggestedQueries: string[];
};

export default function LegalReferenceExplorer({
  initialQuery,
  contractType,
  clauseIds,
  suggestedQueries,
}: LegalReferenceExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LegalReferenceEntry[]>([]);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResults = async (nextQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (nextQuery.trim()) {
        params.set("query", nextQuery.trim());
      }
      if (contractType) {
        params.set("contractType", contractType);
      }
      if (clauseIds.length > 0) {
        params.set("clauseIds", clauseIds.join(","));
      }

      const response = await fetch(`/api/legal/jurisprudencia?${params.toString()}`, {
        method: "GET",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel carregar as referencias.");
      }

      setResults(Array.isArray(payload.results) ? payload.results : []);
      setNote(typeof payload.note === "string" ? payload.note : "");
    } catch (searchError: any) {
      setError(searchError.message || "Nao foi possivel carregar as referencias.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults(initialQuery);
    // initialQuery/contract metadata define the first curated load for this contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadResults(query);
  };

  return (
    <div className="card">
      <div className="card-title">Pesquisa jurídica do Lex</div>
      <div className="card-sub">
        Explore fundamentos e referências curadas para apoiar a revisão deste contrato.
      </div>

      <form onSubmit={submit} style={{ marginTop: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <div className="search-box" style={{ flex: "1 1 280px" }}>
            <Icon name="search" size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: rescisão, LGPD, cláusula penal, foro..."
            />
          </div>
          <button className="btn btn-secondary" type="submit" disabled={loading}>
            <Icon name="search" size={14} />
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
        </div>
      </form>

      {suggestedQueries.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div className="field-label">Sugestões rápidas</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {suggestedQueries.map((suggestion) => (
              <button
                key={suggestion}
                className="chip chip-accent"
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  loadResults(suggestion);
                }}
                style={{ cursor: "pointer", border: "none" }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {note ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--accent-soft)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            lineHeight: 1.55,
            fontSize: 13,
          }}
        >
          {note}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--red-soft)",
            border: "1px solid var(--border)",
            color: "var(--red)",
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="col" style={{ gap: 10, marginTop: 14 }}>
        {results.length > 0 ? (
          results.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}
            >
              <div className="row sp-between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{entry.title}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                    {entry.category}
                  </div>
                </div>
                <span className="chip">{entry.sourceLabel}</span>
              </div>
              <div style={{ lineHeight: 1.55, marginBottom: 8 }}>{entry.summary}</div>
              <div className="muted" style={{ lineHeight: 1.55, marginBottom: 8 }}>
                {entry.practicalUse}
              </div>
              <div style={{ fontSize: 12.5 }}>
                <span className="dim">Base legal:</span> {entry.legalBasis}
              </div>
            </div>
          ))
        ) : !loading && !error ? (
          <div className="muted">Nenhuma referência curada foi encontrada para essa busca.</div>
        ) : null}
      </div>
    </div>
  );
}
