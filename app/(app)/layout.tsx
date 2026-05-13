import { MobileNav, Sidebar, Topbar } from "@/components/shell/Shell";
import SignOutButton from "@/components/auth/SignOutButton";
import { getCurrentAccount } from "@/lib/auth/account";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const HARD_BLOCKED_STATUSES = ["canceled", "incomplete_expired"];
const SOFT_WARNING_STATUSES = ["inactive", "unpaid", "past_due"];

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const account = await getCurrentAccount();

  if (account.envMissing) {
    redirect("/login");
  }

  if (!account.user) {
    redirect("/login");
  }

  if (!account.membership || !account.organization) {
    redirect("/signup?activation=required");
  }

  const subscriptionStatus = account.organization.subscription_status ?? "";

  if (HARD_BLOCKED_STATUSES.includes(subscriptionStatus)) {
    redirect("/login?billing=inactive");
  }

  return (
    <div className="app">
      <Sidebar
        userName={account.membership.full_name || undefined}
        userEmail={account.user?.email || ""}
      />
      <div className="app-main">
        <Topbar
          title="Lex Revision"
          actions={
            <SignOutButton />
          }
        />
        <div className="app-content">
          {account.isPreview ? (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--amber-soft)",
                color: "var(--amber)",
                fontSize: 13,
              }}
            >
              Admin preview ativo. Este acesso serve para validacao interna da interface e do fluxo; a operacao real ainda depende de um Supabase remoto configurado.
            </div>
          ) : null}
          {!account.isPreview && SOFT_WARNING_STATUSES.includes(subscriptionStatus) ? (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--amber-soft)",
                color: "var(--amber)",
                fontSize: 13,
              }}
            >
              Sua organizacao esta com status <strong>{subscriptionStatus}</strong>. O acesso segue liberado para configuracao e onboarding, mas revise faturamento e ativacao para evitar bloqueio posterior.
            </div>
          ) : null}
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
