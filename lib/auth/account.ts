import { cache } from "react";

import { getPreviewAccountFromSession } from "@/lib/auth/preview";
import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type CurrentAccount = {
  user: {
    id: string;
    email?: string | null;
  } | null;
  membership: {
    id: string;
    role?: string | null;
    full_name?: string | null;
    oab_number?: string | null;
  } | null;
  organization: {
    id: string;
    name?: string | null;
    plan?: string | null;
    subscription_status?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_price_id?: string | null;
    activated_at?: string | null;
    trial_ends_at?: string | null;
    previewMode?: boolean;
  } | null;
  envMissing: boolean;
  isPreview: boolean;
};

export const getCurrentAccount = cache(async () => {
  let supabase;

  try {
    supabase = await createClient();
  } catch (error) {
    if (isSupabaseEnvError(error)) {
      const previewAccount = await getPreviewAccountFromSession();
      if (previewAccount) {
        return {
          ...previewAccount,
          envMissing: false,
          isPreview: true,
        } satisfies CurrentAccount;
      }

      return {
        user: null,
        membership: null,
        organization: null,
        envMissing: true,
        isPreview: false,
      };
    }

    throw error;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      membership: null,
      organization: null,
      envMissing: false,
      isPreview: false,
    };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select(
      `
        id,
        role,
        full_name,
        oab_number,
        organization:organizations (
          id,
          name,
          plan,
          subscription_status,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          activated_at,
          trial_ends_at
        )
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const organization = Array.isArray(membership?.organization)
    ? membership.organization[0] ?? null
    : membership?.organization ?? null;

  return {
    user,
    membership: membership ?? null,
    organization,
    envMissing: false,
    isPreview: false,
  };
});
