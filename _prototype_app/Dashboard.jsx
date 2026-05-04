// Dashboard — Home of the Lex Revision app

function Dashboard({ nav }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bom dia, Marina</h1>
          <div className="page-sub">Você tem 3 contratos aguardando assinatura e 1 sugestão da IA.</div>
        </div>
        <div className="actions">
          <button className="btn btn-secondary"><Icon name="upload" size={15}/>Importar</button>
          <button className="btn btn-primary" onClick={() => nav('novo')}><Icon name="plus" size={15}/>Novo contrato</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-4" style={{marginBottom: 24}}>
        {[
          { label: 'Contratos este mês', value: '24', delta: '+18%', icon: 'file', good: true },
          { label: 'Aguardando assinatura', value: '3', delta: '2 vencem hoje', icon: 'clock', warn: true },
          { label: 'Tempo médio', value: '2min', delta: '−84% vs manual', icon: 'bolt', good: true },
          { label: 'Clientes ativos', value: '127', delta: '+4 esta semana', icon: 'users', good: true },
        ].map((k, i) => (
          <div key={i} className="card">
            <div className="row sp-between" style={{marginBottom: 14}}>
              <span className="muted" style={{fontSize: 12.5, fontWeight: 500}}>{k.label}</span>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: k.warn ? 'var(--amber-soft)' : 'var(--accent-soft)',
                color: k.warn ? 'var(--amber)' : 'var(--accent)',
                display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Icon name={k.icon} size={14}/>
              </div>
            </div>
            <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em'}}>{k.value}</div>
            <div style={{fontSize: 12, color: k.warn ? 'var(--amber)' : 'var(--green)', marginTop: 4, fontWeight: 500}}>
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col */}
      <div className="grid" style={{gridTemplateColumns: '1.6fr 1fr'}}>
        {/* Recent contracts */}
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          <div className="row sp-between" style={{padding: '18px 20px', borderBottom: '1px solid var(--border)'}}>
            <div>
              <div className="card-title">Contratos recentes</div>
              <div style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 2}}>Últimos 7 dias</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('historico')}>
              Ver tudo <Icon name="chevron-right" size={13}/>
            </button>
          </div>
          <table className="table">
            <tbody>
              {MOCK_CONTRACTS.slice(0, 5).map(c => (
                <tr key={c.id}>
                  <td style={{width:'50%'}}>
                    <div style={{fontWeight: 600}}>{c.name}</div>
                    <div className="muted" style={{fontSize: 12, marginTop: 2}}>{c.client}</div>
                  </td>
                  <td><span className="mono muted" style={{fontSize:12.5}}>{fmtBRL(c.value)}</span></td>
                  <td><span className={`chip ${STATUS_LABELS[c.status].chip}`}><span className="chip-dot"/>{STATUS_LABELS[c.status].label}</span></td>
                  <td className="muted" style={{fontSize: 12}}>{fmtDate(c.updated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="col">
          {/* AI suggestion */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--accent-soft), transparent)',
            borderColor: 'var(--accent-glow)',
          }}>
            <div className="row" style={{gap: 8, marginBottom: 10}}>
              <Icon name="sparkle" size={16} style={{color: 'var(--accent)'}}/>
              <span style={{fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)'}}>
                Sugestão da IA
              </span>
            </div>
            <div style={{fontWeight: 600, fontSize: 15, marginBottom: 6}}>
              3 contratos podem ter cláusula de reajuste
            </div>
            <div className="muted" style={{fontSize: 13, lineHeight: 1.5, marginBottom: 14}}>
              Detectamos contratos de longa duração sem índice de reajuste. Posso sugerir cláusulas adequadas.
            </div>
            <div className="row" style={{gap: 8}}>
              <button className="btn btn-primary btn-sm">Revisar</button>
              <button className="btn btn-ghost btn-sm">Depois</button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-title">Ações rápidas</div>
            <div className="card-sub">Comece um contrato de 3 formas</div>
            {[
              { icon:'upload',  title:'Subir modelo .docx',    sub:'Detectamos variáveis automaticamente', to:'novo/upload' },
              { icon:'sparkle', title:'Gerar com IA',           sub:'Descreva e a IA escreve pra você', to:'novo/ia' },
              { icon:'folder',  title:'Escolher da biblioteca', sub:'8 modelos prontos', to:'novo/modelo' },
            ].map((a, i) => (
              <div key={i} className="row card-hover"
                style={{padding: '12px', marginTop: i===0?0:6, borderRadius: 10, border: '1px solid var(--border)', gap: 12}}
                onClick={() => nav(a.to)}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><Icon name={a.icon} size={16}/></div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontWeight: 600, fontSize: 13.5}}>{a.title}</div>
                  <div className="muted" style={{fontSize: 12, marginTop: 2}}>{a.sub}</div>
                </div>
                <Icon name="chevron-right" size={14} style={{color: 'var(--text-dim)'}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

window.Dashboard = Dashboard;
