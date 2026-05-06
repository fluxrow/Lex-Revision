"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SignOutButton from "@/components/auth/SignOutButton";
import CustomerPortalButton from "@/components/billing/CustomerPortalButton";
import OnboardingChecklist from "@/components/account/OnboardingChecklist";
import Icon from "@/components/ui/Icon";
import type {
  AccessVoucherSummary,
  OnboardingStep,
  TeamMemberSummary,
} from "@/lib/account/overview";

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
  accessVouchers: AccessVoucherSummary[];
  planLabel: string;
  subscriptionStatus: string;
  canManageBilling: boolean;
  canManageWorkspace: boolean;
  canManageVouchers: boolean;
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
  accessVouchers,
  planLabel,
  subscriptionStatus,
  canManageBilling,
  canManageWorkspace,
  canManageVouchers,
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
  const [voucherRecipientName, setVoucherRecipientName] = useState("");
  const [voucherRecipientEmail, setVoucherRecipientEmail] = useState("");
  const [voucherCompanyName, setVoucherCompanyName] = useState("");
  const [voucherPlan, setVoucherPlan] = useState("professional");
  const [voucherRole, setVoucherRole] = useState("owner");
  const [voucherExpiresAt, setVoucherExpiresAt] = useState("");
  const [voucherNotes, setVoucherNotes] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const tabs = [
    ["perfil", "Perfil"],
    ["equipe", "Equipe"],
    ["vouchers", "Vouchers"],
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

  const copyVoucherValue = async (value: string, successLabel: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setVoucherMessage(successLabel);
      setVoucherError(null);
    } catch {
      setVoucherError("Nao foi possivel copiar automaticamente. Copie manualmente o valor exibido.");
    }
  };

  const createVoucher = async () => {
    setVoucherLoading(true);
    setVoucherMessage(null);
    setVoucherError(null);

    try {
      const response = await fetch("/api/account/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientName: voucherRecipientName,
          recipientEmail: voucherRecipientEmail,
          companyName: voucherCompanyName,
          plan: voucherPlan,
          role: voucherRole,
          expiresAt: voucherExpiresAt || null,
          notes: voucherNotes,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel emitir o voucher.");
      }

      setVoucherRecipientName("");
      setVoucherRecipientEmail("");
      setVoucherCompanyName("");
      setVoucherPlan("professional");
      setVoucherRole("owner");
      setVoucherExpiresAt("");
      setVoucherNotes("");
      setVoucherMessage(`Voucher criado com sucesso: ${payload.voucher.code}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      setVoucherError(error.message || "Nao foi possivel emitir o voucher.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const getVoucherLink = (voucher: AccessVoucherSummary) => {
    const baseUrl =
      (typeof window !== "undefined" ? window.location.origin : "") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";
    const searchParams = new URLSearchParams({
      voucher: voucher.code,
      email: voucher.recipientEmail,
    });

    return `${baseUrl}/signup?${searchParams.toString()}`;
  };

  const getVoucherStatusLabel = (voucher: AccessVoucherSummary) => {
    if (voucher.status === "redeemed") {
      return "Resgatado";
    }

    if (voucher.status === "revoked") {
      return "Revogado";
    }

    if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < Date.now()) {
      return "Expirado";
    }

    return "Emitido";
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
            ["Google Drive", "Camada de produto ainda sem painel de conexão dedicado", "folder", false],
            ["Clicksign", "Webhook e estrutura backend prontos; UI de envio dedicado em evolução", "pen", true],
            ["Stripe", canManageBilling ? "Cobrança e portal ativos" : "Conecte a cobrança para autoatendimento", "card", canManageBilling],
            ["WhatsApp", "Canal planejado para fases futuras do rollout", "send", false],
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
                <span className={`chip ${enabled ? "chip-green" : "chip-amber"}`}>
                  {enabled ? "Backend disponível" : "Painel em evolução"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "vouchers" && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.05fr", gap: 20 }}>
          <div className="card">
            <div className="card-title">Emitir voucher de acesso</div>
            <div className="card-sub">
              Libere um workspace sem Stripe para pessoas específicas testarem a plataforma.
            </div>
            <div className="field">
              <label className="field-label">Nome da pessoa</label>
              <input
                className="input"
                value={voucherRecipientName}
                onChange={(event) => setVoucherRecipientName(event.target.value)}
                disabled={!canManageVouchers || voucherLoading}
              />
            </div>
            <div className="field">
              <label className="field-label">E-mail autorizado</label>
              <input
                className="input"
                type="email"
                value={voucherRecipientEmail}
                onChange={(event) => setVoucherRecipientEmail(event.target.value)}
                disabled={!canManageVouchers || voucherLoading}
              />
            </div>
            <div className="field">
              <label className="field-label">Nome do workspace</label>
              <input
                className="input"
                placeholder="Ex: Teste Silva Adv"
                value={voucherCompanyName}
                onChange={(event) => setVoucherCompanyName(event.target.value)}
                disabled={!canManageVouchers || voucherLoading}
              />
            </div>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Plano liberado</label>
                <select
                  className="input"
                  value={voucherPlan}
                  onChange={(event) => setVoucherPlan(event.target.value)}
                  disabled={!canManageVouchers || voucherLoading}
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="firm">Firm</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Papel inicial</label>
                <select
                  className="input"
                  value={voucherRole}
                  onChange={(event) => setVoucherRole(event.target.value)}
                  disabled={!canManageVouchers || voucherLoading}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="lawyer">Advogado</option>
                  <option value="paralegal">Paralegal</option>
                  <option value="viewer">Leitura</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Expira em</label>
              <input
                className="input"
                type="date"
                value={voucherExpiresAt}
                onChange={(event) => setVoucherExpiresAt(event.target.value)}
                disabled={!canManageVouchers || voucherLoading}
              />
            </div>
            <div className="field">
              <label className="field-label">Observações internas</label>
              <textarea
                className="input"
                style={{ minHeight: 92, resize: "vertical", paddingTop: 12 }}
                value={voucherNotes}
                onChange={(event) => setVoucherNotes(event.target.value)}
                disabled={!canManageVouchers || voucherLoading}
              />
            </div>
            {!canManageVouchers ? (
              <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
                Somente owner ou admin podem emitir vouchers.
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
                Cada voucher libera um acesso sem cobrança, vinculado ao e-mail definido acima.
              </div>
            )}
            {voucherError ? (
              <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
                {voucherError}
              </div>
            ) : null}
            {voucherMessage ? (
              <div style={{ color: "var(--green)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "var(--green-soft)", borderRadius: 6 }}>
                {voucherMessage}
              </div>
            ) : null}
            <button
              className="btn btn-primary"
              type="button"
              onClick={createVoucher}
              disabled={!canManageVouchers || voucherLoading}
              style={{ width: "100%" }}
            >
              {voucherLoading ? "Emitindo..." : "Criar voucher"}
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="row sp-between" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div className="card-title" style={{ margin: 0 }}>Vouchers emitidos</div>
                <div className="card-sub">{accessVouchers.length} acesso(s) administrativo(s) sem custo emitidos</div>
              </div>
            </div>
            {accessVouchers.length === 0 ? (
              <div className="muted" style={{ padding: 20, fontSize: 13 }}>
                Nenhum voucher emitido ainda. Use esta área para liberar testes controlados sem passar pelo Stripe.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12, padding: 16 }}>
                {accessVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="card-hover"
                    style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}
                  >
                    <div className="row sp-between" style={{ gap: 12, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{voucher.recipientName || voucher.recipientEmail}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{voucher.recipientEmail}</div>
                      </div>
                      <span className={`chip ${voucher.status === "redeemed" ? "chip-green" : "chip-accent"}`}>
                        {getVoucherStatusLabel(voucher)}
                      </span>
                    </div>
                    <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <span className="chip chip-accent">{voucher.plan}</span>
                      <span className="chip">{voucher.role}</span>
                      {voucher.companyName ? <span className="chip">{voucher.companyName}</span> : null}
                    </div>
                    <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Código</div>
                      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13.5, fontWeight: 700 }}>
                        {voucher.code}
                      </div>
                    </div>
                    {voucher.notes ? (
                      <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                        {voucher.notes}
                      </div>
                    ) : null}
                    <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={() => copyVoucherValue(voucher.code, `Codigo ${voucher.code} copiado.`)}
                      >
                        Copiar código
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={() => copyVoucherValue(getVoucherLink(voucher), "Link de ativacao copiado.")}
                      >
                        Copiar link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <Link href="/recuperar-senha" className="btn btn-secondary" style={{ width: "100%", marginBottom: 8, textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
              Alterar senha
            </Link>
            <div className="muted" style={{ fontSize: 12 }}>
              MFA/2FA entra na próxima rodada de segurança. Por enquanto, o fluxo real disponível é a redefinição de senha por e-mail.
            </div>
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
