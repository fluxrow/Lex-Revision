import { MobileNav, Sidebar, Topbar } from "@/components/shell/Shell";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mock Auth
  const session = { user: { id: 'demo', email: 'demo@lexrevision.com.br', org_id: 'demo-org' } };
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="app-main">
        <Topbar
          title="Lex Revision"
          actions={
            <>
              <Link href="/login" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                <Icon name="logout" size={13}/>Sair
              </Link>
            </>
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
