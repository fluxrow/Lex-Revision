import HistoricoPageClient from "@/app/(app)/historico/HistoricoPageClient";
import { getContractsFeed } from "@/lib/data.server";

export default async function HistoricoPage() {
  const contractsFeed = await getContractsFeed();

  return (
    <HistoricoPageClient
      contracts={contractsFeed.items}
      isFallback={contractsFeed.isFallback}
      isEmpty={contractsFeed.isEmpty}
    />
  );
}
