import HistoricoPageClient from "@/app/(app)/historico/HistoricoPageClient";
import { getContracts } from "@/lib/data.server";

export default async function HistoricoPage() {
  const contracts = await getContracts();

  return <HistoricoPageClient contracts={contracts} />;
}
