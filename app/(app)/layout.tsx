import { MobileNav, Sidebar, Topbar } from "@/components/shell/Shell";
import SignOutButton from "@/components/auth/SignOutButton";
import { getCurrentAccount } from "@/lib/auth/account";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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

  if (["inactive", "canceled", "unpaid", "incomplete_expired"].includes(account.organization.subscription_status || "inactive")) {
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
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
