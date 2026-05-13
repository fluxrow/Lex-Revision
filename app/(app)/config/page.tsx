import ConfigPageClient from "@/components/config/ConfigPageClient";
import { getAccountOverview } from "@/lib/account/overview";

export default async function ConfigPage() {
  const overview = await getAccountOverview();

  if (!overview) {
    return null;
  }

  return (
    <ConfigPageClient
      userName={overview.account.membership?.full_name || "Marina Rocha"}
      userEmail={overview.account.user?.email || "marina@silvaadv.com"}
      userOab={overview.account.membership?.oab_number || null}
      organizationName={overview.account.organization?.name || "Lex Revision"}
      roleLabel={overview.roleLabel}
      memberCount={overview.memberCount}
      clientCount={overview.clientCount}
      contractCount={overview.contractCount}
      teamMembers={overview.teamMembers}
      accessVouchers={overview.accessVouchers}
      planLabel={overview.planLabel}
      subscriptionStatus={overview.subscriptionStatus}
      clicksignConfigured={overview.integrations.clicksignConfigured}
      clicksignEnvironment={overview.integrations.clicksignEnvironment}
      clicksignWebhookProtected={overview.integrations.clicksignWebhookProtected}
      canManageBilling={overview.canManageBilling}
      canManageWorkspace={["owner", "admin"].includes(overview.account.membership?.role || "")}
      canManageVouchers={overview.canManageVouchers}
      onboardingSteps={overview.onboardingSteps}
    />
  );
}
