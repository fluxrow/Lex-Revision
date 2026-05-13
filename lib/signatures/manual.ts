import { createHmac, timingSafeEqual } from "node:crypto";

function getManualSignatureSecret() {
  return (
    process.env.SIGNATURE_LINK_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.LEX_PREVIEW_ADMIN_SECRET?.trim() ||
    ""
  );
}

export function hasManualSignatureSecret() {
  return Boolean(getManualSignatureSecret());
}

export function createManualSignatureToken(signerId: string) {
  const secret = getManualSignatureSecret();

  if (!secret) {
    throw new Error(
      "O ambiente não possui uma chave segura para gerar links internos de assinatura. Defina SIGNATURE_LINK_SECRET ou mantenha SUPABASE_SERVICE_ROLE_KEY no runtime."
    );
  }

  return createHmac("sha256", secret).update(signerId).digest("hex");
}

export function verifyManualSignatureToken(signerId: string, token: string | null) {
  if (!token) {
    return false;
  }

  try {
    const expected = createManualSignatureToken(signerId);
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildManualSignatureUrl(origin: string, signerId: string) {
  const url = new URL(`/assinar/${signerId}`, origin);
  url.searchParams.set("token", createManualSignatureToken(signerId));
  return url.toString();
}
