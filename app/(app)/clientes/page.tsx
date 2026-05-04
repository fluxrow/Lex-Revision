"use client";

import Icon from "@/components/ui/Icon";
import { getClients, MOCK_CLIENTS } from "@/lib/data";
import { useState, useEffect } from "react";

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>(MOCK_CLIENTS);
  const [selected, setSelected] = useState(MOCK_CLIENTS[0]);

  useEffect(() => {
    getClients().then(data => {
      setClients(data);
      if (data.length > 0) setSelected(data[0]);
    });
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <div className="page-sub">{clients.length} clientes ativos</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary"><Icon name="plus" size={14}/>Novo cliente</button>
        </div>
      </div>
      <div className="grid" style={{gridTemplateColumns: '1.3fr 1fr', gap: 20, alignItems: 'start'}}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Cliente</th><th>Tipo</th><th>Contratos</th></tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  style={{background: selected.id === c.id ? 'var(--surface-2)':undefined, cursor: 'pointer'}}>
                  <td>
                    <div className="row" style={{gap:10}}>
                      <div className="avatar sm" style={{background: c.type==='PJ' ? 'var(--amber)':undefined}}>
                        {c.name.split(' ').map((w: string) => w[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div style={{fontWeight:600}}>{c.name}</div>
                        <div className="muted" style={{fontSize:11}}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`chip ${c.type==='PJ'?'chip-amber':'chip-accent'}`}>{c.type}</span></td>
                  <td className="mono">{c.contracts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{position:'sticky', top: 20}}>
          <div className="row" style={{gap: 14, marginBottom: 18}}>
            <div className="avatar xl">{selected.name.split(' ').map((w: string) => w[0]).slice(0,2).join('')}</div>
            <div>
              <div style={{fontSize: 18, fontWeight: 700, letterSpacing:'-0.01em'}}>{selected.name}</div>
              <div className="muted mono" style={{fontSize: 12, marginTop: 2}}>{selected.doc}</div>
              <div className="row" style={{gap: 6, marginTop: 8}}>
                <span className={`chip ${selected.type==='PJ'?'chip-amber':'chip-accent'}`}>{selected.type}</span>
                <span className="chip">Cliente desde {selected.since}</span>
              </div>
            </div>
          </div>
          <div className="divider"/>
          <div className="col" style={{gap: 10}}>
            <div className="row sp-between">
              <span className="muted" style={{fontSize:12}}>E-mail</span>
              <span style={{fontSize:13}}>{selected.email}</span>
            </div>
            <div className="row sp-between">
              <span className="muted" style={{fontSize:12}}>Contratos</span>
              <span style={{fontSize:13, fontWeight:600}}>{selected.contracts}</span>
            </div>
            <div className="row sp-between">
              <span className="muted" style={{fontSize:12}}>Valor total</span>
              <span className="mono" style={{fontSize:13}}>R$ {(selected.contracts * 8500).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <div className="divider"/>
          <button className="btn btn-primary" style={{width:'100%'}}>
            <Icon name="plus" size={14}/>Novo contrato para {selected.name.split(' ')[0]}
          </button>
        </div>
      </div>
    </>
  );
}
