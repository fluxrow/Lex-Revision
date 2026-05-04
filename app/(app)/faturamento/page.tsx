import Icon from "@/components/ui/Icon";

export default function FaturamentoPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Faturamento</h1>
          <div className="page-sub">Plano, uso e faturas</div>
        </div>
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
