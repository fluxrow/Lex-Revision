"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SignOutButton from "@/components/auth/SignOutButton";
import CustomerPortalButton from "@/components/billing/CustomerPortalButton";
import OnboardingChecklist from "@/components/account/OnboardingChecklist";
import Icon from "@/components/ui/Icon";
import type { OnboardingStep, TeamMemberSummary } from "@/lib/account/overview";

type ConfigPageClientProps = {
  userName: string;
  userEmail: string;
  userOab: string | null;
  organizationName: string;
  roleLabel: string;
  memberCount: number;
  clientCount: number;
  contractCount: number;
  teamMembers: TeamMemberSummary[];
  planLabel: string;
  subscriptionStatus: string;
  canManageBilling: boolean;
  canManageWorkspace: boolean;
  onboardingSteps: OnboardingStep[];
};

const TEAM_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "lawyer", label: "Advogado" },
  { value: "paralegal", label: "Paralegal" },
  { value: "viewer", label: "Leitura" },
] as const;

export default function ConfigPageClient({
  userName,
  userEmail,
  userOab,
  organizationName,
  roleLabel,
  memberCount,
  clientCount,
  contractCount,
  teamMembers,
  planLabel,
  subscriptionStatus,
  canManageBilling,
  canManageWorkspace,
  onboardingSteps,
}: ConfigPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState("perfil");
  const [theme, setThemeState] = useState("dark");
  const [profileName, setProfileName] = useState(userName);
  const [profileOab, setProfileOab] = useState(userOab || "");
  const [workspaceName, setWorkspaceName] = useState(organizationName);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof TEAM_ROLE_OPTIONS)[number]["value"]>("lawyer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const tabs = [
    ["perfil", "Perfil"],
    ["equipe", "Equipe"],
    ["integracao", "Integrações"],
    ["notif", "Notificações"],
    ["seguranca", "Segurança"],
  ];

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

  const saveProfile = async () => {
    setProfileLoading(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profileName,
          oabNumber: profileOab,
          organizationName: workspaceName,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel salvar o perfil.");
      }

      setProfileMessage("Perfil atualizado com sucesso.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      setProfileError(error.message || "Nao foi possivel salvar o perfil.");
    } finally {
      setProfileLoading(false);
    }
  };

  const inviteMember = async () => {
    setInviteLoading(true);
    setInviteMessage(null);
    setInviteError(null);

    try {
      const response = await fetch("/api/account/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel convidar o membro.");
      }

      setInviteMessage(
        payload.mode === "invite_sent"
          ? "Convite enviado. A pessoa recebera um e-mail para definir o acesso."
          : "Membro adicionado ao workspace."
      );
      setInviteName("");
      setInviteEmail("");
      setInviteRole("lawyer");
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      setInviteError(error.message || "Nao foi possivel convidar o membro.");
    } finally {
      setInviteLoading(false);
    }
  };

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
            <div className="field">
              <label className="field-label">Nome completo</label>
              <input className="input" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">E-mail</label>
              <input className="input" value={userEmail} disabled />
            </div>
            <div className="field">
              <label className="field-label">OAB</label>
              <input
                className="input"
                value={profileOab}
                onChange={(event) => setProfileOab(event.target.value)}
                placeholder="Ex: SP 123.456"
              />
            </div>
            <div className="field">
              <label className="field-label">Nome do workspace</label>
              <input
                className="input"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                disabled={!canManageWorkspace}
              />
            </div>
            {!canManageWorkspace ? (
              <div className="muted" style={{ fontSize: 12, marginTop: -6, marginBottom: 16 }}>
                Somente owner ou admin podem alterar o nome do workspace.
              </div>
            ) : null}
            {profileError ? (
              <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
                {profileError}
              </div>
            ) : null}
            {profileMessage ? (
              <div style={{ color: "var(--green)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "var(--green-soft)", borderRadius: 6 }}>
                {profileMessage}
              </div>
            ) : null}
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary" type="button" onClick={saveProfile} disabled={profileLoading}>
                {profileLoading ? "Salvando..." : "Salvar"}
              </button>
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
        <div className="grid" style={{ gridTemplateColumns: "1.25fr 0.9fr", gap: 20 }}>
          <div className="card" style={{ padding: 0 }}>
            <div className="row sp-between" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div className="card-title" style={{ margin: 0 }}>Membros da equipe</div>
                <div className="card-sub">{memberCount} acesso(s) ativo(s) no workspace</div>
              </div>
            </div>
            <table className="table">
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div className="avatar sm">
                          {member.fullName
                            .split(" ")
                            .map((word) => word[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{member.fullName}</div>
                          <div className="muted" style={{ fontSize: 11 }}>
                            {member.email || "E-mail protegido neste ambiente"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${member.roleLabel === roleLabel ? "chip-accent" : ""}`}>
                        {member.roleLabel}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: 11 }}>
                      {member.oabNumber || "Sem OAB"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-title">Convidar membro</div>
            <div className="card-sub">Adicione a operação real do escritório ao workspace</div>
            <div className="field">
              <label className="field-label">Nome completo</label>
              <input
                className="input"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                disabled={!canManageWorkspace || inviteLoading}
              />
            </div>
            <div className="field">
              <label className="field-label">E-mail profissional</label>
              <input
                className="input"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                disabled={!canManageWorkspace || inviteLoading}
              />
            </div>
            <div className="field">
              <label className="field-label">Função</label>
              <select
                className="input"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as (typeof TEAM_ROLE_OPTIONS)[number]["value"])}
                disabled={!canManageWorkspace || inviteLoading}
              >
                {TEAM_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {!canManageWorkspace ? (
              <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
                Somente owner ou admin podem convidar novos membros.
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
                Para novos e-mails, o Lex cria o acesso e dispara um e-mail para a pessoa definir a senha.
              </div>
            )}
            {inviteError ? (
              <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
                {inviteError}
              </div>
            ) : null}
            {inviteMessage ? (
              <div style={{ color: "var(--green)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "var(--green-soft)", borderRadius: 6 }}>
                {inviteMessage}
              </div>
            ) : null}
            <button
              className="btn btn-primary"
              type="button"
              onClick={inviteMember}
              disabled={!canManageWorkspace || inviteLoading}
              style={{ width: "100%" }}
            >
              {inviteLoading ? "Convidando..." : "Convidar membro"}
            </button>
          </div>
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
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{description}</div>
              </div>
              {name === "Stripe" && canManageBilling ? (
                <CustomerPortalButton variant="secondary" size="sm" label="Abrir portal" />
              ) : (
                <button className={`btn ${enabled ? "btn-secondary" : "btn-primary"} btn-sm`}>
                  {enabled ? "Conectado" : "Conectar"}
                </button>
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
              <div>
                <div style={{ fontWeight: 500 }}>{notification}</div>
              </div>
              <div className="row" style={{ gap: 16 }}>
                <label className="row muted" style={{ gap: 6, fontSize: 12 }}>
                  <input type="checkbox" defaultChecked={index !== 4} />
                  E-mail
                </label>
                <label className="row muted" style={{ gap: 6, fontSize: 12 }}>
                  <input type="checkbox" defaultChecked={index < 2} />
                  App
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "seguranca" && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">Autenticação</div>
            <div className="card-sub">Senha e 2FA</div>
            <button className="btn btn-secondary" style={{ width: "100%", marginBottom: 8 }}>Alterar senha</button>
            <button className="btn btn-secondary" style={{ width: "100%" }}>
              <Icon name="shield" size={14} />
              Ativar 2FA
            </button>
          </div>
          <div className="card">
            <div className="card-title">Sessões ativas</div>
            <div className="card-sub">Contexto desta sessão</div>
            <div className="muted" style={{ fontSize: 12.5 }}>Workspace: {organizationName}</div>
            <div className="divider" />
            <div className="muted" style={{ fontSize: 12.5 }}>Responsável: {userEmail}</div>
            <div className="divider" />
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button
                className={`btn btn-${theme === "dark" ? "secondary" : "primary"} btn-sm`}
                type="button"
                onClick={() => setTheme("dark")}
              >
                Tema escuro
              </button>
              <button
                className={`btn btn-${theme === "light" ? "secondary" : "primary"} btn-sm`}
                type="button"
                onClick={() => setTheme("light")}
              >
                Tema claro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
