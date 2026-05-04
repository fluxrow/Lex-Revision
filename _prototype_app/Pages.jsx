// Histórico, Modelos, Clientes, Assinatura, Config, Faturamento pages

function Historico({ nav }) {
  const [filter, setFilter] = React.useState('todos');
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
          <button className="btn btn-primary" onClick={() => nav('novo')}><Icon name="plus" size={14}/>Novo</button>
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

function Modelos({ nav }) {
  return (
    <>
      <div className="page-head">
        <div><h1>Modelos</h1><div className="page-sub">Biblioteca de contratos reutilizáveis</div></div>
        <div className="actions">
          <button className="btn btn-secondary"><Icon name="upload" size={14}/>Importar</button>
          <button className="btn btn-primary"><Icon name="plus" size={14}/>Novo modelo</button>
        </div>
      </div>
      <div className="row" style={{gap:8, marginBottom: 18, flexWrap:'wrap'}}>
        {['Todos','Comercial','Corporativo','Imobiliário','Jurídico','Trabalhista'].map((c,i) => (
          <span key={c} className="chip" style={{padding: '7px 14px',
            background: i===0 ? 'var(--accent-soft)':undefined,
            color: i===0 ? 'var(--accent)':undefined}}>{c}</span>
        ))}
      </div>
      <TemplateGrid onPick={() => nav('novo/upload')}/>
    </>
  );
}

function Clientes() {
  const [selected, setSelected] = React.useState(MOCK_CLIENTS[0]);
  return (
    <>
      <div className="page-head">
        <div><h1>Clientes</h1><div className="page-sub">{MOCK_CLIENTS.length} clientes ativos</div></div>
        <div className="actions"><button className="btn btn-primary"><Icon name="plus" size={14}/>Novo cliente</button></div>
      </div>
      <div className="grid" style={{gridTemplateColumns: '1.3fr 1fr', gap: 20, alignItems: 'start'}}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Tipo</th><th>Contratos</th></tr></thead>
            <tbody>
              {MOCK_CLIENTS.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  style={{background: selected.id === c.id ? 'var(--surface-2)':undefined}}>
                  <td>
                    <div className="row" style={{gap:10}}>
                      <div className="avatar sm" style={{background: c.type==='PJ' ? 'var(--amber)':undefined}}>
                        {c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                      </div>
                      <div><div style={{fontWeight:600}}>{c.name}</div><div className="muted" style={{fontSize:11}}>{c.email}</div></div>
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
            <div className="avatar xl">{selected.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
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
            <div className="row sp-between"><span className="muted" style={{fontSize:12}}>E-mail</span><span style={{fontSize:13}}>{selected.email}</span></div>
            <div className="row sp-between"><span className="muted" style={{fontSize:12}}>Contratos</span><span style={{fontSize:13, fontWeight:600}}>{selected.contracts}</span></div>
            <div className="row sp-between"><span className="muted" style={{fontSize:12}}>Valor total</span><span className="mono" style={{fontSize:13}}>R$ {(selected.contracts * 8500).toLocaleString('pt-BR')}</span></div>
          </div>
          <div className="divider"/>
          <button className="btn btn-primary" style={{width:'100%'}}><Icon name="plus" size={14}/>Novo contrato para {selected.name.split(' ')[0]}</button>
        </div>
      </div>
    </>
  );
}

function Assinatura() {
  return (
    <>
      <div className="page-head">
        <div><h1>Assinaturas</h1><div className="page-sub">{MOCK_SIGNATURES.length} processos em andamento</div></div>
        <div className="actions"><button className="btn btn-primary"><Icon name="send" size={14}/>Enviar contrato</button></div>
      </div>
      <div className="col" style={{gap: 14}}>
        {MOCK_SIGNATURES.map(s => (
          <div key={s.id} className="card" style={{padding: 0}}>
            <div className="row sp-between" style={{padding: '18px 20px', borderBottom: '1px solid var(--border)'}}>
              <div>
                <div style={{fontWeight: 700, fontSize: 15}}>{s.contract}</div>
                <div className="muted" style={{fontSize: 12, marginTop: 3}}>{s.progress} de {s.total} assinaturas</div>
              </div>
              <div className="row" style={{gap: 12}}>
                <div style={{width: 140, height: 6, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden'}}>
                  <div style={{width: `${s.progress/s.total*100}%`, height: '100%',
                    background: s.progress===s.total?'var(--green)':'var(--accent)'}}/>
                </div>
                <button className="btn btn-ghost btn-sm"><Icon name="more" size={14}/></button>
              </div>
            </div>
            <div style={{padding: 8}}>
              {s.signers.map((signer, i) => (
                <div key={i} className="row" style={{padding: '12px 16px', gap: 12, borderBottom: i<s.signers.length-1 ? '1px solid var(--border)':'none'}}>
                  <div className="avatar sm">{signer.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
                  <div style={{flex: 1}}>
                    <div style={{fontWeight: 600, fontSize: 13.5}}>{signer.name}</div>
                    <div className="muted" style={{fontSize: 11.5}}>{signer.email}</div>
                  </div>
                  {signer.status === 'signed' && <span className="chip chip-green"><Icon name="check" size={11}/>Assinou · {signer.when}</span>}
                  {signer.status === 'viewed' && <span className="chip chip-accent"><Icon name="eye" size={11}/>Visualizou · {signer.when}</span>}
                  {signer.status === 'pending' && <span className="chip chip-amber"><Icon name="clock" size={11}/>Aguardando</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Config({ theme, setTheme }) {
  const [tab, setTab] = React.useState('perfil');
  const tabs = [['perfil','Perfil'],['equipe','Equipe'],['integracao','Integrações'],['notif','Notificações'],['seguranca','Segurança']];
  return (
    <>
      <div className="page-head">
        <div><h1>Configurações</h1><div className="page-sub">Gerencie sua conta e preferências</div></div>
      </div>
      <div className="row" style={{gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', flexWrap:'wrap'}}>
        {tabs.map(([k,l]) => (
          <div key={k} onClick={() => setTab(k)} style={{
            padding: '10px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            color: tab===k?'var(--text)':'var(--text-muted)',
            borderBottom: `2px solid ${tab===k?'var(--accent)':'transparent'}`,
            marginBottom: -1,
          }}>{l}</div>
        ))}
      </div>

      {tab==='perfil' && (
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap: 20}}>
          <div className="card">
            <div className="card-title">Informações pessoais</div>
            <div className="card-sub">Nome, e-mail, OAB</div>
            <div className="row" style={{gap: 14, marginBottom: 18}}>
              <div className="avatar xl">MR</div>
              <button className="btn btn-secondary btn-sm">Alterar foto</button>
            </div>
            <div className="field"><label className="field-label">Nome completo</label><input className="input" defaultValue="Marina Rocha"/></div>
            <div className="field"><label className="field-label">E-mail</label><input className="input" defaultValue="marina@silvaadv.com"/></div>
            <div className="field"><label className="field-label">OAB</label><input className="input" defaultValue="SP 123.456"/></div>
            <button className="btn btn-primary">Salvar</button>
          </div>
          <div className="card">
            <div className="card-title">Aparência</div>
            <div className="card-sub">Tema e densidade</div>
            <div className="row" style={{gap: 10, marginBottom: 18}}>
              {[['dark','Escuro','moon'],['light','Claro','sun']].map(([k,l,ic]) => (
                <div key={k} onClick={() => setTheme(k)} className="card-hover" style={{
                  flex: 1, padding: 18, borderRadius: 10,
                  border: `1.5px solid ${theme===k?'var(--accent)':'var(--border)'}`,
                  background: theme===k?'var(--accent-soft)':'var(--surface-2)',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                  <Icon name={ic} size={20} style={{color: theme===k?'var(--accent)':'var(--text-muted)', marginBottom: 6}}/>
                  <div style={{fontSize: 13, fontWeight: 600}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='equipe' && (
        <div className="card" style={{padding: 0}}>
          <div className="row sp-between" style={{padding: '18px 20px', borderBottom: '1px solid var(--border)'}}>
            <div className="card-title" style={{margin:0}}>Membros da equipe</div>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={12}/>Convidar</button>
          </div>
          <table className="table">
            <tbody>
              {[['Marina Rocha','marina@silvaadv.com','Admin'],['João Pereira','joao@silvaadv.com','Advogado'],['Ana Costa','ana@silvaadv.com','Paralegal']].map(([n,e,r],i)=>(
                <tr key={i}>
                  <td><div className="row" style={{gap:10}}><div className="avatar sm">{n.split(' ').map(w=>w[0]).slice(0,2).join('')}</div><div><div style={{fontWeight:600}}>{n}</div><div className="muted" style={{fontSize:11}}>{e}</div></div></div></td>
                  <td><span className={`chip ${r==='Admin'?'chip-accent':''}`}>{r}</span></td>
                  <td style={{textAlign:'right'}}><Icon name="more" size={15} style={{color:'var(--text-dim)'}}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='integracao' && (
        <div className="grid grid-2">
          {[['Google Drive','Salve contratos no Drive','folder',true],['Clicksign','Assinatura digital avançada','pen',true],['Stripe','Receba pagamentos','card',false],['WhatsApp','Envie contratos por mensagem','send',false]].map(([n,d,ic,on],i)=>(
            <div key={i} className="card row" style={{gap:14}}>
              <div style={{width:44,height:44,borderRadius:10,background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name={ic} size={20} style={{color:'var(--accent)'}}/></div>
              <div style={{flex:1}}><div style={{fontWeight:600}}>{n}</div><div className="muted" style={{fontSize:12}}>{d}</div></div>
              <button className={`btn ${on?'btn-secondary':'btn-primary'} btn-sm`}>{on?'Conectado':'Conectar'}</button>
            </div>
          ))}
        </div>
      )}

      {tab==='notif' && (
        <div className="card">
          <div className="card-title">Notificações</div>
          {['Contrato assinado','Assinatura pendente há 24h','Cláusula sugerida pela IA','Novo membro na equipe','Faturamento mensal'].map((n,i)=>(
            <div key={i} className="row sp-between" style={{padding:'14px 0', borderBottom: i<4?'1px solid var(--border)':'none'}}>
              <div><div style={{fontWeight:500}}>{n}</div></div>
              <div className="row" style={{gap: 16}}>
                <label className="row muted" style={{gap:6,fontSize:12}}><input type="checkbox" defaultChecked={i!==4}/>E-mail</label>
                <label className="row muted" style={{gap:6,fontSize:12}}><input type="checkbox" defaultChecked={i<2}/>App</label>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='seguranca' && (
        <div className="grid grid-2">
          <div className="card"><div className="card-title">Autenticação</div><div className="card-sub">Senha e 2FA</div>
            <button className="btn btn-secondary" style={{width:'100%',marginBottom:8}}>Alterar senha</button>
            <button className="btn btn-secondary" style={{width:'100%'}}><Icon name="shield" size={14}/>Ativar 2FA</button>
          </div>
          <div className="card"><div className="card-title">Sessões ativas</div><div className="card-sub">2 dispositivos conectados</div>
            <div className="muted" style={{fontSize:12.5}}>MacBook Pro · São Paulo · agora</div>
            <div className="divider"/>
            <div className="muted" style={{fontSize:12.5}}>iPhone · São Paulo · há 2h</div>
          </div>
        </div>
      )}
    </>
  );
}

function Faturamento() {
  return (
    <>
      <div className="page-head">
        <div><h1>Faturamento</h1><div className="page-sub">Plano, uso e faturas</div></div>
      </div>
      <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr', gap: 20, marginBottom: 24}}>
        <div className="card" style={{background:'linear-gradient(135deg, var(--accent-soft), transparent)', borderColor:'var(--accent-glow)'}}>
          <div className="row sp-between" style={{marginBottom: 14}}>
            <span className="chip chip-accent">Plano atual</span>
            <span className="muted" style={{fontSize:12}}>Renova em 15 mai</span>
          </div>
          <div style={{fontSize: 28, fontWeight: 700, letterSpacing:'-0.02em'}}>Professional</div>
          <div className="muted" style={{fontSize:13, marginBottom:18}}>R$ 297/mês · até 100 contratos/mês</div>
          <div className="row" style={{gap:8}}>
            <button className="btn btn-primary btn-sm">Fazer upgrade</button>
            <button className="btn btn-ghost btn-sm">Cancelar plano</button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Uso este mês</div>
          {[['Contratos criados','24','100'],['Assinaturas','18','200'],['Clientes','127','∞']].map(([l,v,m],i)=>{
            const pct = m==='∞'?0: Math.min(100, parseInt(v)/parseInt(m)*100);
            return (
              <div key={i} style={{marginTop: i===0?10:14}}>
                <div className="row sp-between" style={{marginBottom:6}}>
                  <span className="muted" style={{fontSize:13}}>{l}</span>
                  <span className="mono" style={{fontSize:13, fontWeight:600}}>{v} / {m}</span>
                </div>
                <div style={{height:6, background:'var(--surface-2)', borderRadius:999, overflow:'hidden'}}>
                  <div style={{width:`${pct}%`, height:'100%', background:'var(--accent)'}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{marginBottom: 24}}>
        <div className="card-title">Planos disponíveis</div>
        <div className="grid grid-3" style={{marginTop: 14}}>
          {[
            {name:'Starter', price:'97', tag:'Solo', feat:['20 contratos/mês','IA básica','1 usuário'], cur:false},
            {name:'Professional', price:'297', tag:'Popular', feat:['100 contratos/mês','IA avançada','5 usuários','Assinatura digital'], cur:true},
            {name:'Firm', price:'697', tag:'Escritórios', feat:['Ilimitado','IA + API','Usuários ilimitados','SSO + SLA'], cur:false},
          ].map((p,i)=>(
            <div key={i} style={{
              padding: 22, borderRadius: 12,
              border: `1.5px solid ${p.cur?'var(--accent)':'var(--border)'}`,
              background: p.cur?'var(--accent-soft)':'transparent',
            }}>
              <div className="row sp-between" style={{marginBottom:10}}>
                <div style={{fontWeight:700, fontSize:16}}>{p.name}</div>
                <span className={`chip ${p.cur?'chip-accent':''}`}>{p.tag}</span>
              </div>
              <div style={{fontSize: 32, fontWeight: 800, letterSpacing:'-0.02em'}}>R$ {p.price}<span className="muted" style={{fontSize: 14, fontWeight: 500}}>/mês</span></div>
              <div className="col" style={{gap: 8, marginTop: 16, marginBottom: 16}}>
                {p.feat.map((f,j)=>(<div key={j} className="row" style={{gap:8, fontSize:13}}><Icon name="check" size={13} style={{color:'var(--accent)'}}/>{f}</div>))}
              </div>
              <button className={`btn ${p.cur?'btn-secondary':'btn-primary'}`} style={{width:'100%'}} disabled={p.cur}>
                {p.cur?'Plano atual':'Escolher'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="row sp-between" style={{padding:'18px 20px', borderBottom:'1px solid var(--border)'}}>
          <div className="card-title" style={{margin:0}}>Faturas</div>
          <button className="btn btn-ghost btn-sm"><Icon name="download" size={13}/>Exportar todas</button>
        </div>
        <table className="table">
          <thead><tr><th>Fatura</th><th>Data</th><th>Valor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {[['INV-2026-04','15/04/2026','297,00','paga'],['INV-2026-03','15/03/2026','297,00','paga'],['INV-2026-02','15/02/2026','297,00','paga'],['INV-2026-01','15/01/2026','97,00','paga']].map(([id,d,v,s],i)=>(
              <tr key={i}>
                <td className="mono">{id}</td><td>{d}</td><td className="mono">R$ {v}</td>
                <td><span className="chip chip-green"><Icon name="check" size={11}/>Paga</span></td>
                <td><Icon name="download" size={14} style={{color:'var(--text-muted)'}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

Object.assign(window, { Historico, Modelos, Clientes, Assinatura, Config, Faturamento });
