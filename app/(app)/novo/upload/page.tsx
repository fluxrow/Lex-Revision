"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

function StepsHeader({ steps, current }: { steps: string[], current: number }) {
  return (
    <div className="row" style={{gap: 10, marginBottom: 28, flexWrap: 'wrap'}}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="row" style={{gap: 8, color: i === current ? 'var(--text)' : (i < current ? 'var(--accent)' : 'var(--text-dim)')}}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: i === current ? 'var(--accent)' : (i < current ? 'var(--accent-soft)' : 'var(--surface-2)'),
              color: i === current ? 'var(--bg-deep)' : (i < current ? 'var(--accent)' : 'var(--text-muted)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              border: i === current ? 'none' : '1px solid var(--border)',
            }}>
              {i < current ? <Icon name="check" size={12}/> : i + 1}
            </div>
            <span style={{fontSize: 13, fontWeight: i === current ? 600 : 500}}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{flex: 1, maxWidth: 40, height: 1, background: 'var(--border)'}}/>}
        </React.Fragment>
      ))}
    </div>
  );
}

function UploadStage({ onNext }: { onNext: () => void }) {
  const [hasFile, setHasFile] = React.useState(false);
  return (
    <div className="card" style={{padding: 32}}>
      <div style={{
        height: 320, borderRadius: 18,
        border: `2px dashed ${hasFile ? 'var(--accent)' : 'var(--border-hi)'}`,
        background: hasFile ? 'var(--accent-soft)' : 'var(--surface-2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        cursor: 'pointer',
      }} onClick={() => setHasFile(true)}>
        {!hasFile ? (
          <>
            <div style={{width: 64, height: 64, borderRadius: 16, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon name="upload" size={28}/>
            </div>
            <div style={{fontSize: 18, fontWeight: 600}}>Arraste seu modelo aqui</div>
            <div className="muted" style={{fontSize: 13}}>.docx, .doc, .pdf — até 25 MB</div>
            <button className="btn btn-secondary btn-sm" style={{marginTop: 6}}>Ou escolher arquivo</button>
          </>
        ) : (
          <>
            <div style={{width: 64, height: 64, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-deep)'}}>
              <Icon name="check" size={28}/>
            </div>
            <div style={{fontSize: 16, fontWeight: 600}}>contrato_servicos.docx</div>
            <div style={{color: 'var(--green)', fontSize: 13}}>Enviado · 24 KB · 6 variáveis detectadas</div>
          </>
        )}
      </div>

      {hasFile && (
        <div style={{marginTop: 24}}>
          <div style={{fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10}}>Variáveis detectadas</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8}}>
            {['NOME_CLIENTE','CPF_CLIENTE','VALOR_CONTRATO','PRAZO_DIAS','DATA_INICIO','OBJETO'].map(v => (
              <div key={v} className="row" style={{ padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, gap: 8 }}>
                <span className="mono" style={{color: 'var(--accent)', fontSize: 13}}>{`{{${v}}}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row sp-between" style={{marginTop: 28}}>
        <span className="muted" style={{fontSize: 12}}>{hasFile ? 'Tudo pronto para preencher' : 'Aguardando arquivo'}</span>
        <button className="btn btn-primary" disabled={!hasFile} onClick={onNext} style={{opacity: hasFile ? 1 : 0.5}}>
          Continuar <Icon name="arrow-right" size={14}/>
        </button>
      </div>
    </div>
  );
}

function DocPreview({ vals }: { vals: any }) {
  const hl = (t: string) => <span style={{background: 'var(--green-soft)', color: 'var(--green)', padding: '0 4px', borderRadius: 3, fontWeight: 600}}>{t}</span>;
  return (
    <div style={{
      position: 'sticky', top: 20, background: '#fafaf6', color: '#1a1a1a', padding: '28px 32px', borderRadius: 14,
      fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.55, boxShadow: 'var(--shadow-md)',
    }}>
      <div className="row sp-between" style={{marginBottom: 18}}>
        <span className="chip chip-green" style={{fontFamily:'var(--font-inter)'}}><span className="chip-dot"/>Pré-visualização ao vivo</span>
        <span style={{fontFamily: 'var(--font-inter)', fontSize: 11, color: '#666'}}>Página 1 de 3</span>
      </div>
      <div style={{textAlign: 'center', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16}}>
        Contrato de Prestação de Serviços
      </div>
      <p>Pelo presente instrumento, de um lado {hl(vals.nome)}, inscrita no CPF sob o nº {hl(vals.cpf)}, doravante denominada CONTRATANTE, e de outro lado SILVA & ASSOCIADOS ADVOGADOS, têm entre si justo e contratado:</p>
      <p style={{fontWeight:700, marginTop:12, marginBottom:4}}>Cláusula 1ª — Do Objeto</p>
      <p>A CONTRATADA prestará à CONTRATANTE serviços de {hl(vals.objeto)}.</p>
      <p style={{fontWeight:700, marginTop:12, marginBottom:4}}>Cláusula 2ª — Valor e Prazo</p>
      <p>Valor total de R$ {hl(vals.valor)}, prazo de {hl(vals.prazo)} dias, início em {hl(vals.data)}.</p>
    </div>
  );
}

function FillStage({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const [vals, setVals] = React.useState({
    nome: 'Maria Silva Andrade', cpf: '123.456.789-00', valor: '15.000,00',
    prazo: '90', data: '01/05/2026', objeto: 'Consultoria jurídica',
  });
  const set = (k: string, v: string) => setVals({...vals, [k]: v});

  return (
    <div className="grid" style={{gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start'}}>
      <div className="card">
        <div className="card-title">Preencha as variáveis</div>
        <div className="card-sub">O contrato se atualiza ao vivo ao lado</div>
        {[
          ['nome', 'Nome do cliente'],['cpf', 'CPF / CNPJ'],['valor', 'Valor (R$)'],
          ['prazo', 'Prazo (dias)'],['data', 'Data início'],['objeto', 'Objeto do contrato'],
        ].map(([k, l]) => (
          <div className="field" key={k}>
            <label className="field-label">{l}</label>
            <input className="input" value={(vals as any)[k]} onChange={e => set(k, e.target.value)}/>
          </div>
        ))}
        <div className="row sp-between" style={{marginTop: 8}}>
          <button className="btn btn-ghost" onClick={onBack}><Icon name="arrow-left" size={14}/>Voltar</button>
          <button className="btn btn-primary" onClick={onNext}>Continuar <Icon name="arrow-right" size={14}/></button>
        </div>
      </div>
      <DocPreview vals={vals}/>
    </div>
  );
}

export function ReviewStage({ onBack, onDone }: { onBack: () => void, onDone: () => void }) {
  const [added, setAdded] = React.useState(false);
  return (
    <div className="grid" style={{gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start'}}>
      <div className="card" style={{padding: 0}}>
        <div style={{padding: '18px 20px', borderBottom: '1px solid var(--border)'}}>
          <div className="card-title">Pré-visualização final</div>
        </div>
        <div style={{background: '#fafaf6', color: '#1a1a1a', padding: 30, fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.55, minHeight: 400}}>
          <div style={{textAlign: 'center', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16}}>
            Contrato de Prestação de Serviços
          </div>
          <p>Pelo presente instrumento, de um lado <strong>Maria Silva Andrade</strong>, CPF <strong>123.456.789-00</strong>…</p>
          <p style={{fontWeight:700, marginTop:10}}>Cláusula 1ª — Do Objeto</p>
          <p>Consultoria jurídica.</p>
          <p style={{fontWeight:700, marginTop:10}}>Cláusula 2ª — Valor e Prazo</p>
          <p>R$ 15.000,00 em 90 dias, início 01/05/2026.</p>
          {added && (
            <div style={{marginTop: 10, padding: 10, background: 'rgba(91,111,209,0.1)', border: '1px solid rgba(91,111,209,0.3)', borderRadius: 6}}>
              <p style={{fontWeight:700, margin:'0 0 4px'}}>
                Cláusula 3ª — Da Confidencialidade <span style={{fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 700, background: 'rgba(91,111,209,0.25)', color: '#5b6fd1', padding: '1px 6px', borderRadius: 3, marginLeft: 6}}>IA</span>
              </p>
              <p style={{margin:0}}>As partes obrigam-se a manter sigilo sobre informações trocadas…</p>
            </div>
          )}
        </div>
      </div>

      <div className="col" style={{gap: 16}}>
        <div className="card" style={{background: 'linear-gradient(135deg, var(--accent-soft), transparent)', borderColor: 'var(--accent-glow)'}}>
          <div className="row" style={{gap: 8, marginBottom: 10}}>
            <Icon name="sparkle" size={16} style={{color: 'var(--accent)'}}/>
            <span style={{fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)'}}>IA sugere</span>
          </div>
          <div style={{fontWeight: 600, fontSize: 15, marginBottom: 6}}>Cláusula de confidencialidade</div>
          <div className="muted" style={{fontSize: 13, marginBottom: 14}}>Recomendamos incluir proteção de informações.</div>
          <div className="row" style={{gap: 8}}>
            {!added ? (
              <button className="btn btn-primary btn-sm" onClick={() => setAdded(true)}>
                <Icon name="plus" size={13}/>Adicionar
              </button>
            ) : (
              <span className="chip chip-green"><Icon name="check" size={12}/>Adicionada</span>
            )}
            <button className="btn btn-ghost btn-sm">Ver outras</button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Finalizar</div>
          <div className="card-sub">Escolha como concluir</div>
          <button className="btn btn-primary btn-lg" style={{width: '100%', marginBottom: 8}} onClick={onDone}>
            <Icon name="pen" size={16}/>Enviar para assinatura
          </button>
          <button className="btn btn-secondary" style={{width: '100%', marginBottom: 8}}>
            <Icon name="download" size={15}/>Exportar PDF
          </button>
          <button className="btn btn-ghost" style={{width: '100%'}}>
            <Icon name="file" size={15}/>Salvar como rascunho
          </button>
        </div>

        <div className="row sp-between">
          <button className="btn btn-ghost" onClick={onBack}><Icon name="arrow-left" size={14}/>Voltar</button>
        </div>
      </div>
    </div>
  );
}

export default function FlowUpload() {
  const router = useRouter();
  const [stage, setStage] = React.useState(0);
  
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Subir modelo</h1>
          <div className="page-sub">Envie um .docx e detectamos as variáveis</div>
        </div>
        <div className="actions">
          <Link href="/novo" className="btn btn-ghost" style={{textDecoration:'none'}}>
            <Icon name="arrow-left" size={14}/>Voltar
          </Link>
        </div>
      </div>
      <StepsHeader steps={['Enviar', 'Preencher', 'Revisar']} current={stage}/>

      {stage === 0 && <UploadStage onNext={() => setStage(1)}/>}
      {stage === 1 && <FillStage onNext={() => setStage(2)} onBack={() => setStage(0)}/>}
      {stage === 2 && <ReviewStage onBack={() => setStage(1)} onDone={() => router.push('/historico')}/>}
    </>
  );
}
