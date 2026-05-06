import ClientsPageClient from "@/components/clients/ClientsPageClient";
import { getClientsOverview } from "@/lib/data.server";

export default async function ClientesPage() {
  const clients = await getClientsOverview();

  return <ClientsPageClient initialClients={clients} />;
}
