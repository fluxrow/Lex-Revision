import { cache } from "react";

import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const getCurrentAccount = cache(async () => {
  let supabase;

  try {
    supabase = await createClient();
  } catch (error) {
    if (isSupabaseEnvError(error)) {
      return {
        user: null,
        membership: null,
        organization: null,
        envMissing: true,
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
  };
});
