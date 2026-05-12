import { Suspense } from "react";

import LoginPageClient from "@/components/auth/LoginPageClient";
import { hasPublicSupabaseEnv } from "@/lib/supabase/env";

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type LoginPageProps = {
  searchParams?: SearchParamsInput;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabaseSetupRequired =
    getSearchParamValue(resolvedSearchParams.setup) === "supabase" &&
    !hasPublicSupabaseEnv();

  return (
    <Suspense fallback={null}>
      <LoginPageClient supabaseSetupRequired={supabaseSetupRequired} />
    </Suspense>
  );
}
