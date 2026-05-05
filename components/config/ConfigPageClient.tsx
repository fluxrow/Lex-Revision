"use client";

import { useEffect, useState } from "react";

import CustomerPortalButton from "@/components/billing/CustomerPortalButton";
import SignOutButton from "@/components/auth/SignOutButton";
import OnboardingChecklist from "@/components/account/OnboardingChecklist";
import type { OnboardingStep } from "@/lib/account/overview";
import Icon from "@/components/ui/Icon";

type ConfigPageClientProps = {
  userName: string;
  userEmail: string;
  userOab: string | null;
  organizationName: string;
  roleLabel: string;
  memberCount: number;
  clientCount: number;
  contractCount: number;
  planLabel: string;
  subscriptionStatus: string;
  canManageBilling: boolean;
  onboardingSteps: OnboardingStep[];
};

export default function ConfigPageClient({
  userName,
  userEmail,
  userOab,
  organizationName,
  roleLabel,
  memberCount,
  clientCount,
  contractCount,
  planLabel,
  subscriptionStatus,
  canManageBilling,
  onboardingSteps,
}: ConfigPageClientProps) {
  const [tab, setTab] = useState("perfil");
  const tabs = [
    ["perfil", "Perfil"],
    ["equipe", "Equipe"],
    ["integracao", "Integrações"],
    ["notif", "Notificações"],
    ["seguranca", "Segurança"],
  ];

  const [theme, setThemeState] = useState("dark");

  useEffect(() => {
    try {
      setThemeState(localStorage.getItem("lex-revision-theme") || "dark");
    } catch {}
  }, []);

  const setTheme = (themeName: string) => {
    setThemeState(themeName);
    document.documentElement.setAttribute("data-theme", themeName);
    try {
      localStorage.setItem("lex-revision-theme", themeName);
    } catch {}
  };

  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Configurações</h1>
          <div className="page-sub">Gerencie perfil, equipe e o estado operacional da conta</div>
        </div>
      </div>
      <div className="row" style={{ gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        {tabs.map(([key, label]) => (
          <div
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 14px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              color: tab === key ? "var(--text)" : "var(--text-muted)",
              borderBottom: `2px solid ${tab === key ? "var(--accent)" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {tab === "perfil" && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <div className="card-title">Informações pessoais</div>
            <div className="card-sub">Responsável principal e dados do workspace</div>
            <div className="row" style={{ gap: 14, marginBottom: 18 }}>
              <div className="avatar xl">{initials || "LR"}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{organizationName}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{roleLabel}</div>
              </div>
            </div>
            <div className="field"><label className="field-label">Nome completo</label><input className="input" defaultValue={userName} /></div>
            <div className="field"><label className="field-label">E-mail</label><input className="input" defaultValue={userEmail} /></div>
            <div className="field"><label className="field-label">OAB</label><input className="input" defaultValue={userOab || ""} placeholder="Ex: SP 123.456" /></div>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary">Salvar</button>
              <SignOutButton label="Sair para login" className="btn-secondary" />
            </div>
          </div>

          <div className="col" style={{ gap: 20 }}>
            <div className="card">
              <div className="card-title">Estado da conta</div>
              <div className="card-sub">Status comercial e estrutura do workspace</div>
              <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <span className="chip chip-accent">{planLabel}</span>
                <span className={`chip ${subscriptionStatus === "past_due" ? "chip-amber" : "chip-green"}`}>{subscriptionStatus}</span>
              </div>
              <div className="grid grid-2" style={{ marginTop: 16, gap: 12 }}>
                <div className="card-hover" style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Equipe</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{memberCount}</div>
                </div>
                <div className="card-hover" style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Clientes</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{clientCount}</div>
                </div>
                <div className="card-hover" style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Contratos</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{contractCount}</div>
                </div>
                <div className="card-hover" style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Cobrança</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 8 }}>
                    {canManageBilling ? "Portal ativo" : "Sem portal"}
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {canManageBilling ? <CustomerPortalButton label="Gerenciar cobrança" /> : null}
              </div>
            </div>

            <OnboardingChecklist
              steps={onboardingSteps}
              title="Checklist da conta"
              subtitle="Os principais marcos para a operação ficar pronta para escalar."
            />
          </div>
        </div>
      )}

      {tab === "equipe" && (
        <div className="card" style={{ padding: 0 }}>
          <div className="row sp-between" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="card-title" style={{ margin: 0 }}>Membros da equipe</div>
              <div className="card-sub">{memberCount} acesso(s) ativo(s) no workspace</div>
            </div>
            <button className="btn btn-primary btn-sm"><Icon name="plus" size={12} />Convidar</button>
          </div>
          <table className="table">
            <tbody>
              {[
                [userName, userEmail, roleLabel],
                ["Convide outro membro", "equipe@seuescritorio.com.br", "Pendente"],
              ].map(([name, email, role], index) => (
                <tr key={index}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div className="avatar sm">{name.split(" ").map((word: string) => word[0]).slice(0, 2).join("")}</div>
                      <div><div style={{ fontWeight: 600 }}>{name}</div><div className="muted" style={{ fontSize: 11 }}>{email}</div></div>
                    </div>
                  </td>
                  <td><span className={`chip ${role === roleLabel ? "chip-accent" : ""}`}>{role}</span></td>
                  <td style={{ textAlign: "right" }}><Icon name="more" size={15} style={{ color: "var(--text-dim)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "integracao" && (
        <div className="grid grid-2">
          {[
            ["Google Drive", "Salve contratos no Drive", "folder", true],
            ["Clicksign", "Assinatura digital avançada", "pen", true],
            ["Stripe", canManageBilling ? "Cobrança e portal ativos" : "Conecte a cobrança para autoatendimento", "card", canManageBilling],
            ["WhatsApp", "Envie contratos por mensagem", "send", false],
          ].map(([name, description, icon, enabled], index) => (
            <div key={index} className="card row" style={{ gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={icon as string} size={20} style={{ color: "var(--accent)" }} />
              </div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{name}</div><div className="muted" style={{ fontSize: 12 }}>{description}</div></div>
              {name === "Stripe" && canManageBilling ? (
                <CustomerPortalButton variant="secondary" size="sm" label="Abrir portal" />
              ) : (
                <button className={`btn ${enabled ? "btn-secondary" : "btn-primary"} btn-sm`}>{enabled ? "Conectado" : "Conectar"}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "notif" && (
        <div className="card">
          <div className="card-title">Notificações</div>
          {["Contrato assinado", "Assinatura pendente há 24h", "Cláusula sugerida pela IA", "Novo membro na equipe", "Faturamento mensal"].map((notification, index) => (
            <div key={index} className="row sp-between" style={{ padding: "14px 0", borderBottom: index < 4 ? "1px solid var(--border)" : "none" }}>
              <div><div style={{ fontWeight: 500 }}>{notification}</div></div>
              <div className="row" style={{ gap: 16 }}>
                <label className="row muted" style={{ gap: 6, fontSize: 12 }}><input type="checkbox" defaultChecked={index !== 4} />E-mail</label>
                <label className="row muted" style={{ gap: 6, fontSize: 12 }}><input type="checkbox" defaultChecked={index < 2} />App</label>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "seguranca" && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">Autenticação</div><div className="card-sub">Senha e 2FA</div>
            <button className="btn btn-secondary" style={{ width: "100%", marginBottom: 8 }}>Alterar senha</button>
            <button className="btn btn-secondary" style={{ width: "100%" }}><Icon name="shield" size={14} />Ativar 2FA</button>
          </div>
          <div className="card">
            <div className="card-title">Sessões ativas</div><div className="card-sub">Contexto desta sessão</div>
            <div className="muted" style={{ fontSize: 12.5 }}>Workspace: {organizationName}</div>
            <div className="divider" />
            <div className="muted" style={{ fontSize: 12.5 }}>Responsável: {userEmail}</div>
          </div>
        </div>
      )}
    </>
  );
}
