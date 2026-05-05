import Icon from "@/components/ui/Icon";
import CustomerPortalButton from "@/components/billing/CustomerPortalButton";
import { getCurrentAccount } from "@/lib/auth/account";
import { getBillingOverview } from "@/lib/billing/overview";
import { PLAN_CATALOG } from "@/lib/billing/plans";
import Link from "next/link";

export default async function FaturamentoPage() {
  const account = await getCurrentAccount();

  if (!account.organization) {
    return null;
  }

  const billing = await getBillingOverview(account.organization);
  const planEntries = Object.entries(PLAN_CATALOG);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Faturamento</h1>
          <div className="page-sub">Plano, uso, renovação e últimas faturas da conta</div>
        </div>
      </div>
      <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr', gap: 20, marginBottom: 24}}>
        <div className="card" style={{background:'linear-gradient(135deg, var(--accent-soft), transparent)', borderColor:'var(--accent-glow)'}}>
          <div className="row sp-between" style={{marginBottom: 14}}>
            <span className="chip chip-accent">Plano atual</span>
            <span className="muted" style={{fontSize:12}}>
              {billing.renewalDate ? `Renova em ${billing.renewalDate}` : "Aguardando ciclo inicial"}
            </span>
          </div>
          <div style={{fontSize: 28, fontWeight: 700, letterSpacing:'-0.02em'}}>{billing.planMeta.label}</div>
          <div className="muted" style={{fontSize:13, marginBottom:18}}>
            {billing.monthlyPriceLabel}/mês · {billing.planMeta.contractLimitLabel} · {billing.planMeta.userLimitLabel}
          </div>
          <div className="row" style={{gap:8, flexWrap: "wrap", marginBottom: 10}}>
            <span className={`chip ${billing.status === "past_due" ? "chip-amber" : billing.status === "canceled" ? "" : "chip-green"}`}>
              Status: {billing.status}
            </span>
            {billing.activatedAt && (
              <span className="chip">Ativado em {new Intl.DateTimeFormat("pt-BR").format(new Date(billing.activatedAt))}</span>
            )}
          </div>
          <div className="row" style={{gap:8, flexWrap: "wrap"}}>
            {billing.canManageBilling ? (
              <CustomerPortalButton variant="primary" label="Gerenciar cobrança" />
            ) : (
              <Link href="/#precos" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                Escolher plano
              </Link>
            )}
            <Link href="/#precos" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
              Ver planos da LP
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Uso este mês</div>
          {[
            ['Contratos criados', billing.contractUsage.current.toString(), billing.contractUsage.limitLabel, billing.contractUsage.percent],
            ['Assinaturas', billing.signatureUsage.current.toString(), billing.signatureUsage.limitLabel, billing.signatureUsage.percent],
            ['Usuários ativos', billing.memberUsage.current.toString(), billing.memberUsage.limitLabel, billing.memberUsage.percent],
            ['Clientes ativos', billing.clientUsage.current.toString(), billing.clientUsage.limitLabel, billing.clientUsage.percent],
          ].map(([l,v,m,pct],i)=>{
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
          {planEntries.map(([planKey, plan])=>(
            <div key={planKey} style={{
              padding: 22, borderRadius: 12,
              border: `1.5px solid ${billing.plan === planKey?'var(--accent)':'var(--border)'}`,
              background: billing.plan === planKey?'var(--accent-soft)':'transparent',
            }}>
              <div className="row sp-between" style={{marginBottom:10}}>
                <div style={{fontWeight:700, fontSize:16}}>{plan.label}</div>
                <span className={`chip ${billing.plan === planKey?'chip-accent':''}`}>{plan.tag}</span>
              </div>
              <div style={{fontSize: 32, fontWeight: 800, letterSpacing:'-0.02em'}}>
                {(plan.monthlyPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                <span className="muted" style={{fontSize: 14, fontWeight: 500}}>/mês</span>
              </div>
              <div className="col" style={{gap: 8, marginTop: 16, marginBottom: 16}}>
                {plan.features.map((feature,j)=>(<div key={j} className="row" style={{gap:8, fontSize:13}}><Icon name="check" size={13} style={{color:'var(--accent)'}}/>{feature}</div>))}
              </div>
              {billing.plan === planKey ? (
                <button className="btn btn-secondary" style={{width:'100%'}} disabled>
                  Plano atual
                </button>
              ) : billing.canManageBilling ? (
                <CustomerPortalButton fullWidth variant="primary" label={`Migrar para ${plan.label}`} />
              ) : (
                <Link href="/#precos" className="btn btn-primary" style={{width:'100%', textDecoration: "none", display: "inline-flex", justifyContent: "center"}}>
                  Escolher
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="row sp-between" style={{padding:'18px 20px', borderBottom:'1px solid var(--border)'}}>
          <div className="card-title" style={{margin:0}}>Faturas</div>
          {billing.canManageBilling ? (
            <CustomerPortalButton variant="ghost" label="Abrir portal" />
          ) : (
            <button className="btn btn-ghost btn-sm" disabled><Icon name="download" size={13}/>Sem portal</button>
          )}
        </div>
        <table className="table">
          <thead><tr><th>Fatura</th><th>Data</th><th>Valor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {billing.invoices.length > 0 ? billing.invoices.map((invoice, i)=>(
              <tr key={i}>
                <td className="mono">{invoice.externalId || invoice.id}</td>
                <td>{invoice.dateLabel || "—"}</td>
                <td className="mono">{invoice.amountLabel}</td>
                <td>
                  <span className={`chip ${invoice.status === "paid" ? "chip-green" : invoice.status === "open" ? "chip-amber" : ""}`}>
                    {invoice.status === "paid" ? <Icon name="check" size={11}/> : null}
                    {invoice.status}
                  </span>
                </td>
                <td>
                  {invoice.pdfUrl ? (
                    <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" style={{color:'var(--text-muted)'}}>
                      <Icon name="download" size={14} style={{color:'var(--text-muted)'}}/>
                    </a>
                  ) : (
                    <Icon name="download" size={14} style={{color:'var(--text-dim)'}}/>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="muted" style={{padding: "18px 20px"}}>
                  As faturas ainda vao aparecer aqui conforme o Stripe confirmar o ciclo inicial e as proximas cobrancas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
