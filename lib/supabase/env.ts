const PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const ADMIN_ENV_KEYS = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

export class SupabaseEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseEnvError";
  }
}

export function hasPublicSupabaseEnv() {
  return PUBLIC_ENV_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

export function hasAdminSupabaseEnv() {
  return hasPublicSupabaseEnv() && ADMIN_ENV_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

export function getPublicSupabaseEnv() {
  if (!hasPublicSupabaseEnv()) {
    throw new SupabaseEnvError(getSupabaseProductionSetupMessage());
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  };
}

export function getAdminSupabaseEnv() {
  if (!hasAdminSupabaseEnv()) {
    throw new SupabaseEnvError(getSupabaseAdminSetupMessage());
  }

  return {
    ...getPublicSupabaseEnv(),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}

export function getSupabaseProductionSetupMessage() {
  return "A autenticacao ainda nao foi configurada neste ambiente. Configure um projeto Supabase remoto e preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel antes de liberar login e signup.";
}

export function getSupabaseAdminSetupMessage() {
  return "A camada administrativa do Supabase ainda nao foi configurada neste ambiente. Preencha SUPABASE_SERVICE_ROLE_KEY junto das variaveis publicas para ativar convites, onboarding e automacoes.";
}

export function isSupabaseEnvError(error: unknown): error is SupabaseEnvError {
  return error instanceof SupabaseEnvError;
}
