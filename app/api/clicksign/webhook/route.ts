import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { finalizeSignatureRequest, syncSignatureRequestStatus } from "@/lib/signatures/status";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-clicksign-signature");

    if (!rawBody.trim()) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    validateWebhookSignature(rawBody, signature);

    const body = JSON.parse(rawBody);
    const eventType = body?.event?.name;
    const documentKey = body?.document?.key;

    if (!eventType || !documentKey) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: signatureRequest } = await admin
      .from("signature_requests")
      .select("id, contract_id")
      .eq("external_id", documentKey)
      .maybeSingle();

    if (!signatureRequest) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    switch (eventType) {
      case "sign":
        await updateSignerStatus(admin, signatureRequest.id, getSignerEmail(body), "signed");
        break;
      case "refusal":
        await updateSignerStatus(admin, signatureRequest.id, getSignerEmail(body), "refused");
        break;
      case "view":
        await updateSignerStatus(admin, signatureRequest.id, getSignerEmail(body), "viewed");
        break;
      case "auto_close":
        await finalizeSignatureRequest(admin, signatureRequest.id, signatureRequest.contract_id);
        break;
      default:
        return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    await syncSignatureRequestStatus(admin, signatureRequest.id, signatureRequest.contract_id);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Webhook Error" }, { status: 400 });
  }
}

function validateWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.CLICKSIGN_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return;
  }

  if (!signature) {
    throw new Error("Missing webhook signature.");
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (!safeCompare(expected, signature)) {
    throw new Error("Invalid webhook signature.");
  }
}

function safeCompare(left: string, right: string) {
  try {
    return timingSafeEqual(Buffer.from(left), Buffer.from(right));
  } catch {
    return false;
  }
}

function getSignerEmail(body: any) {
  const value =
    body?.signer?.email ||
    body?.signer?.sign_as?.email ||
    body?.signer?.data?.email ||
    null;

  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

async function updateSignerStatus(
  admin: ReturnType<typeof createAdminClient>,
  signatureRequestId: string,
  email: string | null,
  status: "signed" | "refused" | "viewed"
) {
  if (!email) {
    return;
  }

  const patch: Record<string, string> = {
    status,
  };

  if (status === "signed") {
    patch.signed_at = new Date().toISOString();
  }

  if (status === "viewed") {
    patch.viewed_at = new Date().toISOString();
  }

  await admin
    .from("signers")
    .update(patch)
    .eq("signature_request_id", signatureRequestId)
    .ilike("email", email);
}
