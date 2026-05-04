import Icon from "@/components/ui/Icon";
import { MOCK_SIGNATURES } from "@/lib/data";

export default function AssinaturasPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Assinaturas</h1>
          <div className="page-sub">{MOCK_SIGNATURES.length} processos em andamento</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary"><Icon name="send" size={14}/>Enviar contrato</button>
        </div>
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
                  <div className="avatar sm">{signer.name.split(' ').map((w: string)=>w[0]).slice(0,2).join('')}</div>
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
