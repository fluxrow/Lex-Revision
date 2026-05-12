import { Suspense } from "react";

import SignupPageClient from "@/components/auth/SignupPageClient";
import { hasPublicSupabaseEnv } from "@/lib/supabase/env";

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type SignupPageProps = {
  searchParams?: SearchParamsInput;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabaseSetupRequired =
    getSearchParamValue(resolvedSearchParams.setup) === "supabase" &&
    !hasPublicSupabaseEnv();

  return (
    <Suspense fallback={null}>
      <SignupPageClient supabaseSetupRequired={supabaseSetupRequired} />
    </Suspense>
  );
}
