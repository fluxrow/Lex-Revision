import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const PREVIEW_COOKIE_NAME = "lex_preview_admin";
const PREVIEW_USER_ID = "preview-user-admin";
const PREVIEW_ORGANIZATION_ID = "preview-organization-admin";

type PreviewSessionPayload = {
  email: string;
  signature: string;
};

export type PreviewAccount = {
  user: {
    id: string;
    email: string;
  };
  membership: {
    id: string;
    role: "owner";
    full_name: string;
    oab_number: string;
  };
  organization: {
    id: string;
    name: string;
    plan: "professional";
    subscription_status: "active";
    stripe_customer_id: null;
    stripe_subscription_id: null;
    stripe_price_id: null;
    activated_at: string;
    trial_ends_at: null;
    previewMode: true;
  };
};

export function hasPreviewAdminEnv() {
  return (
    process.env.LEX_PREVIEW_ADMIN_ENABLED === "1" &&
    Boolean(process.env.LEX_PREVIEW_ADMIN_EMAIL?.trim()) &&
    Boolean(process.env.LEX_PREVIEW_ADMIN_PASSWORD?.trim()) &&
    Boolean(process.env.LEX_PREVIEW_ADMIN_SECRET?.trim())
  );
}

export function getPreviewLoginHint() {
  if (!hasPreviewAdminEnv()) {
    return null;
  }

  return {
    email: process.env.LEX_PREVIEW_ADMIN_EMAIL!.trim(),
    label: "Admin preview",
  };
}

export function verifyPreviewCredentials(email: string, password: string) {
  if (!hasPreviewAdminEnv()) {
    return false;
  }

  return (
    email.trim().toLowerCase() === process.env.LEX_PREVIEW_ADMIN_EMAIL!.trim().toLowerCase() &&
    password === process.env.LEX_PREVIEW_ADMIN_PASSWORD
  );
}

export async function createPreviewSession() {
  if (!hasPreviewAdminEnv()) {
    throw new Error("Preview admin nao configurado.");
  }

  const cookieStore = await cookies();
  const payload = {
    email: process.env.LEX_PREVIEW_ADMIN_EMAIL!.trim(),
    signature: signPreviewValue(process.env.LEX_PREVIEW_ADMIN_EMAIL!.trim()),
  };

  cookieStore.set(PREVIEW_COOKIE_NAME, encodePayload(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearPreviewSession() {
  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getPreviewAccountFromSession(): Promise<PreviewAccount | null> {
  if (!hasPreviewAdminEnv()) {
    return null;
  }

  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PREVIEW_COOKIE_NAME)?.value;
  if (!rawValue) {
    return null;
  }

  const payload = decodePayload(rawValue);
  if (!payload) {
    return null;
  }

  if (!isValidSignature(payload.email, payload.signature)) {
    return null;
  }

  return buildPreviewAccount(payload.email);
}

function buildPreviewAccount(email: string): PreviewAccount {
  return {
    user: {
      id: PREVIEW_USER_ID,
      email,
    },
    membership: {
      id: "preview-membership-owner",
      role: "owner",
      full_name: "Admin Preview",
      oab_number: "OAB 000000-PR",
    },
    organization: {
      id: PREVIEW_ORGANIZATION_ID,
      name: "Lex Revision Preview Workspace",
      plan: "professional",
      subscription_status: "active",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      activated_at: new Date("2026-05-05T12:00:00.000Z").toISOString(),
      trial_ends_at: null,
      previewMode: true,
    },
  };
}

function encodePayload(payload: PreviewSessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): PreviewSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<PreviewSessionPayload>;
    if (!parsed.email || !parsed.signature) {
      return null;
    }

    return {
      email: parsed.email,
      signature: parsed.signature,
    };
  } catch {
    return null;
  }
}

function signPreviewValue(email: string) {
  return createHmac("sha256", process.env.LEX_PREVIEW_ADMIN_SECRET!.trim())
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function isValidSignature(email: string, signature: string) {
  const expected = signPreviewValue(email);

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
