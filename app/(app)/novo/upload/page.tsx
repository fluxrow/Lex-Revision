import UploadFlowClient from "@/app/(app)/novo/upload/UploadFlowClient";
import { getTemplateById } from "@/lib/data.server";

export default async function FlowUpload({
  searchParams,
}: {
  searchParams?: Promise<{ template?: string }> | { template?: string };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const selectedTemplate = await getTemplateById(resolvedSearchParams?.template);

  return <UploadFlowClient selectedTemplate={selectedTemplate} />;
}
