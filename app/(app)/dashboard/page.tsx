import AccountStatusBanner from "@/components/account/AccountStatusBanner";
import OnboardingChecklist from "@/components/account/OnboardingChecklist";
import Icon from "@/components/ui/Icon";
import { getAccountOverview } from "@/lib/account/overview";
import { getCurrentAccount } from "@/lib/auth/account";
import { STATUS_LABELS, fmtBRL, fmtDate } from "@/lib/data";
import { getContracts } from "@/lib/data.server";
import Link from "next/link";

export default async function Dashboard() {
  const account = await getCurrentAccount();
  const overview = await getAccountOverview();
  const contracts = await getContracts();
  const firstName = account.membership?.full_name?.split(" ")[0] || "Marina";
  const planLabel = account.organization?.plan ? account.organization.plan.replace("_", " ") : "plano ativo";
  const pendingSteps = overview?.onboardingSteps.filter((step) => !step.complete).slice(0, 3) ?? [];
  
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bom dia, {firstName}</h1>
          <div className="page-sub">
            {account.organization?.name || "Sua operação"} está em {planLabel}. Você tem {contracts.filter(c => c.status === 'aguardando').length} contratos aguardando assinatura.
          </div>
        </div>
        <div className="actions">
          <Link href="/novo/upload" className="btn btn-secondary" style={{ textDecoration: "none" }}><Icon name="upload" size={15}/>Importar</Link>
          <Link href="/novo" className="btn btn-primary" style={{textDecoration: 'none'}}><Icon name="plus" size={15}/>Novo contrato</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-4" style={{marginBottom: 24}}>
        {[
          { label: 'Contratos este mês', value: contracts.length.toString(), delta: '+18%', icon: 'file', good: true },
          { label: 'Aguardando assinatura', value: contracts.filter(c => c.status === 'aguardando').length.toString(), delta: '2 vencem hoje', icon: 'clock', warn: true },
          { label: 'Tempo médio', value: '2min', delta: '−84% vs manual', icon: 'bolt', good: true },
          { label: 'Clientes ativos', value: (overview?.clientCount ?? 0).toString(), delta: `${overview?.memberCount ?? 1} pessoa(s) no workspace`, icon: 'users', good: true },
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

      {overview ? (
        <AccountStatusBanner
          organizationName={overview.account.organization?.name || "Lex Revision"}
          planLabel={overview.planLabel}
          statusLabel={overview.statusLabel}
          statusTone={overview.statusTone}
          progressPercent={overview.progressPercent}
          completedSteps={overview.completedSteps}
          totalSteps={overview.onboardingSteps.length}
          nextStep={overview.nextStep}
        />
      ) : null}

      {/* Main 2-col */}
      <div className="grid" style={{gridTemplateColumns: '1.6fr 1fr'}}>
        {/* Recent contracts */}
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          <div className="row sp-between" style={{padding: '18px 20px', borderBottom: '1px solid var(--border)'}}>
            <div>
              <div className="card-title">Contratos recentes</div>
              <div style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 2}}>Últimos 7 dias</div>
            </div>
            <Link href="/historico" className="btn btn-ghost btn-sm" style={{textDecoration: 'none'}}>
              Ver tudo <Icon name="chevron-right" size={13}/>
            </Link>
          </div>
          <table className="table">
            <tbody>
              {contracts.slice(0, 5).map(c => (
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
            <div className="row" style={{gap: 8, marginBottom: 14, flexWrap: "wrap"}}>
              <span className="chip chip-accent">Plano {account.organization?.plan || "ativo"}</span>
              <span className={`chip ${account.organization?.subscription_status === "past_due" ? "chip-amber" : "chip-green"}`}>
                {account.organization?.subscription_status || "active"}
              </span>
            </div>
            <div className="row" style={{gap: 8}}>
              <Link href="/novo/ia" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Revisar</Link>
              <Link href="/historico" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>Depois</Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-title">Ações rápidas</div>
            <div className="card-sub">Comece um contrato de 3 formas</div>
            {[
              { icon:'upload',  title:'Subir modelo .docx',    sub:'Detectamos variáveis automaticamente', to:'/novo/upload' },
              { icon:'sparkle', title:'Gerar com IA',           sub:'Descreva e a IA escreve pra você', to:'/novo/ia' },
              { icon:'folder',  title:'Escolher da biblioteca', sub:'8 modelos prontos', to:'/novo/modelo' },
            ].map((a, i) => (
              <Link key={i} href={a.to} className="row card-hover"
                style={{padding: '12px', marginTop: i===0?0:6, borderRadius: 10, border: '1px solid var(--border)', gap: 12, textDecoration:'none', color:'inherit'}}>
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
              </Link>
            ))}
          </div>

          {overview && pendingSteps.length > 0 ? (
            <OnboardingChecklist
              steps={pendingSteps}
              title="Ajustes prioritários"
              subtitle="Os próximos 3 movimentos mais úteis para o workspace."
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
