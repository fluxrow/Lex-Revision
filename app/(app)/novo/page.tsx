import Icon from "@/components/ui/Icon";
import Link from "next/link";

export default function NovoPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Novo contrato</h1>
          <div className="page-sub">Escolha como quer começar</div>
        </div>
      </div>
      <div className="grid grid-3">
        {[
          { id: 'upload', icon: 'upload', title: 'Subir modelo', desc: 'Envie um .docx e preencha variáveis', chip: 'Mais rápido', chipClass: 'chip-accent' },
          { id: 'ia', icon: 'sparkle', title: 'Gerar com IA', desc: 'Descreva e a IA escreve pra você', chip: 'Novo', chipClass: 'chip-green' },
          { id: 'modelo', icon: 'folder', title: 'Da biblioteca', desc: '8 modelos prontos para uso', chip: null, chipClass: '' },
        ].map(o => (
          <Link key={o.id} href={`/novo/${o.id}`} className="card card-hover"
            style={{padding: 28, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 220, textDecoration: 'none', color: 'inherit'}}>
            <div className="row sp-between">
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name={o.icon} size={22}/></div>
              {o.chip && <span className={`chip ${o.chipClass}`}>{o.chip}</span>}
            </div>
            <div>
              <div style={{fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 6}}>{o.title}</div>
              <div className="muted" style={{fontSize: 13.5, lineHeight: 1.45}}>{o.desc}</div>
            </div>
            <div className="row" style={{color: 'var(--accent)', fontSize: 13, fontWeight: 600, marginTop: 'auto'}}>
              Começar <Icon name="arrow-right" size={14}/>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
