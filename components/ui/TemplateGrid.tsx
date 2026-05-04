import Icon from "@/components/ui/Icon";
import { MOCK_TEMPLATES, fmtDate } from "@/lib/data";
import Link from "next/link";

export default function TemplateGrid({ basePath }: { basePath: string }) {
  return (
    <div className="grid grid-3">
      {MOCK_TEMPLATES.map(t => (
        <Link key={t.id} href={`${basePath}?template=${t.id}`} className="card card-hover"
          style={{padding: 20, display: 'flex', flexDirection: 'column', gap: 12, textDecoration:'none', color:'inherit'}}>
          <div style={{
            height: 100, borderRadius: 10,
            background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}11)`,
            border: `1px solid ${t.accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.accent,
          }}>
            <Icon name="file" size={36}/>
          </div>
          <div>
            <div className="row sp-between" style={{marginBottom: 4}}>
              <span className="chip" style={{fontSize: 10.5}}>{t.cat}</span>
              <span className="muted" style={{fontSize: 11}}>{t.uses} usos</span>
            </div>
            <div style={{fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em'}}>{t.name}</div>
            <div className="muted" style={{fontSize: 12, marginTop: 2}}>{t.vars} variáveis · atualizado {fmtDate(t.updated)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
