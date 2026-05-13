import { NextResponse } from "next/server";

import { searchLegalReferences } from "@/lib/legal/references";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const contractType = searchParams.get("contractType");
    const clauseIds = searchParams
      .get("clauseIds")
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) || [];

    const results = searchLegalReferences({
      query,
      contractType,
      clauseIds,
    });

    return NextResponse.json({
      ok: true,
      mode: "knowledge_base",
      note: "Pesquisa beta baseada na base jurídica curada do Lex. Não representa jurisprudência live nem substitui validação humana.",
      query,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Nao foi possivel consultar referencias juridicas." },
      { status: 500 }
    );
  }
}
