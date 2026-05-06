"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import Icon from "@/components/ui/Icon";
import { STATUS_LABELS, fmtBRL, fmtDate } from "@/lib/data";

type ContractListItem = {
  id: string;
  name: string;
  client: string;
  value: number;
  status: string;
  updated: string;
  type: string;
};

export default function HistoricoPageClient({
  contracts,
}: {
  contracts: ContractListItem[];
}) {
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");

  const exportContracts = () => {
    const lines = [
      ["id", "nome", "cliente", "tipo", "status", "valor_brl", "atualizado"],
      ...filtered.map((contract) => [
        contract.id,
        contract.name,
        contract.client,
        contract.type,
        contract.status,
        contract.value.toString(),
        contract.updated,
      ]),
    ];

    const csv = lines
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lex-revision-contratos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesFilter = filter === "todos" ? true : contract.status === filter;
      const haystack = `${contract.name} ${contract.client} ${contract.id} ${contract.type}`.toLowerCase();
      const matchesQuery = query.trim() ? haystack.includes(query.trim().toLowerCase()) : true;

      return matchesFilter && matchesQuery;
    });
  }, [contracts, filter, query]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Histórico</h1>
          <div className="page-sub">
            {contracts.length} contratos · {contracts.filter((contract) => contract.status === "assinado").length} assinados
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" type="button" onClick={exportContracts}>
            <Icon name="download" size={14} />
            Exportar
          </button>
          <Link href="/novo" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Icon name="plus" size={14} />
            Novo
          </Link>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="search-box" style={{ maxWidth: 340, flex: "1 1 260px" }}>
          <Icon name="search" size={14} />
          <input
            placeholder="Buscar por nome, cliente, ID…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {[
          ["todos", "Todos"],
          ["rascunho", "Rascunhos"],
          ["aguardando", "Aguardando"],
          ["em_analise", "Em análise"],
          ["assinado", "Assinados"],
        ].map(([key, label]) => (
          <span
            key={key}
            className="chip card-hover"
            onClick={() => setFilter(key)}
            style={{
              padding: "7px 14px",
              cursor: "pointer",
              background: filter === key ? "var(--accent-soft)" : undefined,
              color: filter === key ? "var(--accent)" : undefined,
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Atualizado</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract) => (
              <tr key={contract.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{contract.name}</div>
                  <div className="dim mono" style={{ fontSize: 11, marginTop: 2 }}>
                    #{contract.id}
                  </div>
                </td>
                <td>{contract.client}</td>
                <td className="mono">{fmtBRL(contract.value)}</td>
                <td>
                  <span className={`chip ${STATUS_LABELS[contract.status]?.chip || ""}`}>
                    <span className="chip-dot" />
                    {STATUS_LABELS[contract.status]?.label || contract.status}
                  </span>
                </td>
                <td className="muted">{fmtDate(contract.updated)}</td>
                <td>
                  <Icon name="more" size={15} style={{ color: "var(--text-dim)" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
