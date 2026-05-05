import { getCurrentAccount } from "@/lib/auth/account";
import { PLAN_CATALOG, normalizePlan } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
};

export type AccountStatusTone = "healthy" | "warning" | "setup";

export async function getAccountOverview() {
  const account = await getCurrentAccount();

  if (!account.user || !account.membership || !account.organization) {
    return null;
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

function getRoleLabel(role?: string | null) {
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
