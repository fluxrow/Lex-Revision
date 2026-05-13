import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  getPublicSupabaseEnv,
  getSupabaseProductionSetupMessage,
  isSupabaseEnvError,
} from "@/lib/supabase/env";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = loginSchema.parse(await request.json());
    const { url, anonKey } = getPublicSupabaseEnv();

    let response = NextResponse.json({ ok: true });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.json({ ok: true });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return response;
  } catch (error: any) {
    if (isSupabaseEnvError(error)) {
      return NextResponse.json(
        { error: getSupabaseProductionSetupMessage() },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Falha ao conectar com a autenticacao." },
      { status: 400 }
    );
  }
}
