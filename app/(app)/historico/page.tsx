"use client";

import Icon from "@/components/ui/Icon";
import { MOCK_CONTRACTS, STATUS_LABELS, fmtBRL, fmtDate } from "@/lib/data";
import Link from "next/link";
import { useState } from "react";

export default function HistoricoPage() {
  const [filter, setFilter] = useState('todos');
  const filtered = filter === 'todos' ? MOCK_CONTRACTS : MOCK_CONTRACTS.filter(c => c.status === filter);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Histórico</h1>
          <div className="page-sub">{MOCK_CONTRACTS.length} contratos · {MOCK_CONTRACTS.filter(c=>c.status==='assinado').length} assinados</div>
        </div>
        <div className="actions">
          <button className="btn btn-secondary"><Icon name="download" size={14}/>Exportar</button>
          <Link href="/novo" className="btn btn-primary" style={{textDecoration:'none'}}><Icon name="plus" size={14}/>Novo</Link>
        </div>
      </div>

      <div className="row" style={{gap: 8, marginBottom: 16, flexWrap: 'wrap'}}>
        <div className="search-box" style={{maxWidth: 340, flex: '1 1 260px'}}>
          <Icon name="search" size={14}/>
          <input placeholder="Buscar por nome, cliente, ID…"/>
        </div>
        {[['todos','Todos'],['rascunho','Rascunhos'],['aguardando','Aguardando'],['em_analise','Em análise'],['assinado','Assinados']].map(([k,l]) => (
          <span key={k} className="chip card-hover"
            onClick={() => setFilter(k)}
            style={{padding: '7px 14px', cursor: 'pointer',
              background: filter === k ? 'var(--accent-soft)' : undefined,
              color: filter === k ? 'var(--accent)' : undefined}}>{l}</span>
        ))}
        <button className="btn btn-ghost btn-sm" style={{marginLeft: 'auto'}}><Icon name="filter" size={13}/>Filtros</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Contrato</th><th>Cliente</th><th>Valor</th><th>Status</th><th>Atualizado</th><th style={{width:40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{fontWeight: 600}}>{c.name}</div>
                  <div className="dim mono" style={{fontSize: 11, marginTop: 2}}>#{c.id}</div>
                </td>
                <td>{c.client}</td>
                <td className="mono">{fmtBRL(c.value)}</td>
                <td><span className={`chip ${STATUS_LABELS[c.status].chip}`}><span className="chip-dot"/>{STATUS_LABELS[c.status].label}</span></td>
                <td className="muted">{fmtDate(c.updated)}</td>
                <td><Icon name="more" size={15} style={{color:'var(--text-dim)'}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
