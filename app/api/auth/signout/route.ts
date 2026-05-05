import { NextResponse } from "next/server";

import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    if (!isSupabaseEnvError(error)) {
      throw error;
    }
  }

  return NextResponse.json({ ok: true });
}
