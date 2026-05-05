import { NextResponse } from "next/server";
import { z } from "zod";

import { createPreviewSession, hasPreviewAdminEnv, verifyPreviewCredentials } from "@/lib/auth/preview";

const previewLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!hasPreviewAdminEnv()) {
    return NextResponse.json({ error: "Preview admin nao configurado neste ambiente." }, { status: 503 });
  }

  try {
    const payload = previewLoginSchema.parse(await request.json());

    if (!verifyPreviewCredentials(payload.email, payload.password)) {
      return NextResponse.json({ error: "Credenciais invalidas para o preview admin." }, { status: 401 });
    }

    await createPreviewSession();

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Nao foi possivel iniciar o preview admin." },
      { status: 400 }
    );
  }
}
