"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { ReviewStage } from "@/app/(app)/novo/upload/page";

export default function FlowIA() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState('');
  const [generated, setGenerated] = React.useState(false);

  const handleGenerate = () => {
    // Mock the 2 second delay proposed in HANDOFF.md
    setTimeout(() => {
      setGenerated(true);
    }, 2000);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Gerar com IA <span className="chip chip-green" style={{marginLeft: 10, verticalAlign: 'middle'}}>Novo</span></h1>
          <div className="page-sub">Descreva o contrato e a IA escreve para você</div>
        </div>
        <div className="actions">
          <Link href="/novo" className="btn btn-ghost" style={{textDecoration:'none'}}>
            <Icon name="arrow-left" size={14}/>Voltar
          </Link>
        </div>
      </div>

      {!generated ? (
        <div className="card" style={{padding: 32}}>
          <label className="field-label">Descreva o contrato</label>
          <textarea className="textarea" rows={6}
            placeholder="Ex: Contrato de prestação de consultoria jurídica para empresa de tecnologia, com valor de R$ 20.000, prazo de 6 meses, cláusula de confidencialidade e foro em São Paulo."
            value={prompt} onChange={e => setPrompt(e.target.value)}/>

          <div style={{marginTop: 20}}>
            <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10}}>Sugestões</div>
            <div className="row" style={{gap: 8, flexWrap: 'wrap'}}>
              {['NDA bilateral', 'Consultoria recorrente', 'Locação comercial', 'Honorários êxito', 'Termo de acordo'].map(s => (
                <span key={s} className="chip card-hover" style={{padding: '6px 12px', cursor: 'pointer'}} onClick={() => setPrompt(s)}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="row sp-between" style={{marginTop: 28}}>
            <span className="muted" style={{fontSize: 12}}><Icon name="shield" size={12}/> Dados nunca saem da sua conta</span>
            <button className="btn btn-primary btn-lg" disabled={!prompt}
              style={{opacity: prompt ? 1 : 0.5}}
              onClick={handleGenerate}>
              <Icon name="sparkle" size={16}/>Gerar contrato
            </button>
          </div>
        </div>
      ) : (
        <ReviewStage onBack={() => setGenerated(false)} onDone={() => router.push('/historico')}/>
      )}
    </>
  );
}
