import { MobileNav, Sidebar, Topbar } from "@/components/shell/Shell";
import SignOutButton from "@/components/auth/SignOutButton";
import { getCurrentAccount } from "@/lib/auth/account";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const account = await getCurrentAccount();

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
        userName={account.membership.full_name}
        userEmail={account.user.email || ""}
      />
      <div className="app-main">
        <Topbar
          title="Lex Revision"
          actions={
            <SignOutButton />
          }
        />
        <div className="app-content">
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
