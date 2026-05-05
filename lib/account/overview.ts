import { getCurrentAccount } from "@/lib/auth/account";
import { PLAN_CATALOG, normalizePlan } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { MOCK_CONTRACTS } from "@/lib/data";

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
};

export type AccountStatusTone = "healthy" | "warning" | "setup";

export type TeamMemberSummary = {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  role: string;
  roleLabel: string;
  oabNumber: string | null;
  createdAt: string | null;
};

export async function getAccountOverview() {
  const account = await getCurrentAccount();

  if (!account.user || !account.membership || !account.organization) {
    return null;
  }

  const previewOrganization = account.organization as typeof account.organization & {
    previewMode?: boolean;
  };

  if (account.isPreview || previewOrganization.previewMode) {
    const onboardingSteps: OnboardingStep[] = [
      {
        id: "billing",
        label: "Assinatura operacional",
        description: "Preview ativo para validar a interface comercial antes do billing real.",
        complete: true,
      },
      {
        id: "profile",
        label: "Responsável identificado",
        description: `Perfil de preview carregado com OAB ${account.membership.oab_number}.`,
        complete: true,
      },
      {
        id: "clients",
        label: "Base de clientes iniciada",
        description: "Workspace de preview usando dados de demonstração controlados.",
        complete: true,
      },
      {
        id: "contracts",
        label: "Fluxo de contratos iniciado",
        description: `${MOCK_CONTRACTS.length} contratos de preview disponíveis para validar navegação.`,
        complete: true,
      },
      {
        id: "team",
        label: "Equipe configurada",
        description: "Equipe de preview carregada para testar gestão interna.",
        complete: true,
      },
    ];

    return {
      account,
      memberCount: 4,
      clientCount: 12,
      contractCount: MOCK_CONTRACTS.length,
      completedSteps: onboardingSteps.length,
      progressPercent: 100,
      onboardingSteps,
      plan: "professional",
      planLabel: PLAN_CATALOG.professional.label,
      planMeta: PLAN_CATALOG.professional,
      subscriptionStatus: "active",
      statusTone: "healthy" as const,
      statusLabel: "Preview interno",
      roleLabel: getRoleLabel(account.membership.role),
      teamMembers: [
        {
          id: "preview-owner",
          userId: "preview-user-admin",
          fullName: "Admin Preview",
          email: account.user.email || "admin@preview.lex",
          role: "owner",
          roleLabel: "Owner",
          oabNumber: account.membership.oab_number ?? null,
          createdAt: new Date("2026-05-05T12:00:00.000Z").toISOString(),
        },
        {
          id: "preview-lawyer",
          userId: "preview-user-lawyer",
          fullName: "Marina Rocha",
          email: "marina@silvaadv.com",
          role: "lawyer",
          roleLabel: "Advogado",
          oabNumber: "OAB 12345-SP",
          createdAt: new Date("2026-05-04T12:00:00.000Z").toISOString(),
        },
      ],
      nextStep: null,
      canManageBilling: false,
    };
  }

  const supabase = await createClient();
  const [memberCountResult, clientCountResult, contractCountResult] = await Promise.all([
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", account.organization.id),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", account.organization.id),
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", account.organization.id),
  ]);

  const memberCount = memberCountResult.count ?? 0;
  const clientCount = clientCountResult.count ?? 0;
  const contractCount = contractCountResult.count ?? 0;
  const { data: teamRows } = await supabase
    .from("memberships")
    .select("id, user_id, full_name, role, oab_number, created_at")
    .eq("organization_id", account.organization.id)
    .order("created_at", { ascending: true });

  const emailByUserId = new Map<string, string>();

  if (hasAdminSupabaseEnv()) {
    const supabaseAdmin = createAdminClient();
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

    if (usersError) {
      throw usersError;
    }

    for (const user of usersData.users) {
      if (user.email) {
        emailByUserId.set(user.id, user.email);
      }
    }
  }

  const teamMembers: TeamMemberSummary[] = (teamRows ?? []).map((member) => ({
    id: member.id,
    userId: member.user_id,
    fullName: member.full_name,
    email: emailByUserId.get(member.user_id) ?? null,
    role: member.role,
    roleLabel: getRoleLabel(member.role),
    oabNumber: member.oab_number ?? null,
    createdAt: member.created_at ?? null,
  }));
  const normalizedPlan = normalizePlan(account.organization.plan) ?? "starter";
  const planMeta = PLAN_CATALOG[normalizedPlan];
  const subscriptionStatus = account.organization.subscription_status ?? "inactive";
  const canManageBilling = Boolean(account.organization.stripe_customer_id);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "billing",
      label: "Assinatura operacional",
      description:
        subscriptionStatus === "past_due"
          ? "Existe uma cobrança pendente; vale revisar o portal do Stripe."
          : canManageBilling
            ? "Conta vinculada ao Stripe e pronta para autoatendimento."
            : "Vincule a cobrança para liberar a gestão completa do plano.",
      complete: ["active", "trialing"].includes(subscriptionStatus) && canManageBilling,
    },
    {
      id: "profile",
      label: "Responsável identificado",
      description: account.membership.oab_number
        ? `O perfil já tem OAB registrada: ${account.membership.oab_number}.`
        : "Preencha OAB e dados do responsável na área de configurações.",
      complete: Boolean(account.membership.full_name && account.membership.oab_number),
    },
    {
      id: "clients",
      label: "Base de clientes iniciada",
      description:
        clientCount > 0
          ? `${clientCount} cliente(s) já cadastrado(s) no escritório.`
          : "Cadastre o primeiro cliente para organizar a operação.",
      complete: clientCount > 0,
    },
    {
      id: "contracts",
      label: "Fluxo de contratos iniciado",
      description:
        contractCount > 0
          ? `${contractCount} contrato(s) já criado(s) na plataforma.`
          : "Crie ou importe o primeiro contrato para validar o fluxo.",
      complete: contractCount > 0,
    },
    {
      id: "team",
      label: "Equipe configurada",
      description:
        memberCount > 1
          ? `${memberCount} membro(s) com acesso ao workspace.`
          : "Convide pelo menos mais uma pessoa para distribuir a operação.",
      complete: memberCount > 1,
    },
  ];

  const completedSteps = onboardingSteps.filter((step) => step.complete).length;
  const progressPercent = Math.round((completedSteps / onboardingSteps.length) * 100);

  return {
    account,
    memberCount,
    clientCount,
    contractCount,
    completedSteps,
    progressPercent,
    onboardingSteps,
    plan: normalizedPlan,
    planLabel: planMeta.label,
    planMeta,
    subscriptionStatus,
    statusTone: getStatusTone(subscriptionStatus, progressPercent),
    statusLabel: getStatusLabel(subscriptionStatus),
    roleLabel: getRoleLabel(account.membership.role),
    teamMembers,
    nextStep: onboardingSteps.find((step) => !step.complete) ?? null,
    canManageBilling,
  };
}

function getStatusTone(subscriptionStatus: string, progressPercent: number): AccountStatusTone {
  if (subscriptionStatus === "past_due") {
    return "warning";
  }

  if (["active", "trialing"].includes(subscriptionStatus) && progressPercent >= 80) {
    return "healthy";
  }

  return "setup";
}

function getStatusLabel(subscriptionStatus: string) {
  switch (subscriptionStatus) {
    case "active":
      return "Operação ativa";
    case "trialing":
      return "Conta em trial";
    case "past_due":
      return "Cobrança pendente";
    default:
      return "Configuração em andamento";
  }
}

export function getRoleLabel(role?: string | null) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "lawyer":
      return "Advogado";
    case "paralegal":
      return "Paralegal";
    case "viewer":
      return "Leitura";
    default:
      return "Membro";
  }
}
