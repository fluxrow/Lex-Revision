"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ConfigPage() {
  const [tab, setTab] = useState('perfil');
  const tabs = [['perfil','Perfil'],['equipe','Equipe'],['integracao','Integrações'],['notif','Notificações'],['seguranca','Segurança']];
  
  const [theme, setThemeState] = useState('dark');
  
  useEffect(() => {
    try {
      setThemeState(localStorage.getItem('lex-revision-theme') || 'dark');
    } catch {}
  }, []);

  const setTheme = (t: string) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('lex-revision-theme', t); } catch {}
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Configurações</h1>
          <div className="page-sub">Gerencie sua conta e preferências</div>
        </div>
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
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary">Salvar</button>
              <Link href="/login" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                <Icon name="logout" size={14}/>Sair para login
              </Link>
            </div>
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
                  <td>
                    <div className="row" style={{gap:10}}>
                      <div className="avatar sm">{n.split(' ').map((w: string) => w[0]).slice(0,2).join('')}</div>
                      <div><div style={{fontWeight:600}}>{n}</div><div className="muted" style={{fontSize:11}}>{e}</div></div>
                    </div>
                  </td>
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
              <div style={{width:44,height:44,borderRadius:10,background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon name={ic as string} size={20} style={{color:'var(--accent)'}}/>
              </div>
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
          <div className="card">
            <div className="card-title">Autenticação</div><div className="card-sub">Senha e 2FA</div>
            <button className="btn btn-secondary" style={{width:'100%',marginBottom:8}}>Alterar senha</button>
            <button className="btn btn-secondary" style={{width:'100%'}}><Icon name="shield" size={14}/>Ativar 2FA</button>
          </div>
          <div className="card">
            <div className="card-title">Sessões ativas</div><div className="card-sub">2 dispositivos conectados</div>
            <div className="muted" style={{fontSize:12.5}}>MacBook Pro · São Paulo · agora</div>
            <div className="divider"/>
            <div className="muted" style={{fontSize:12.5}}>iPhone · São Paulo · há 2h</div>
          </div>
        </div>
      )}
    </>
  );
}
