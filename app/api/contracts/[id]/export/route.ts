import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { NextResponse } from "next/server";

import { getCurrentAccount } from "@/lib/auth/account";
import { renderContractPdf } from "@/lib/clicksign";
import { getContractDetail } from "@/lib/data.server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getCurrentAccount();
  if (!account.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "docx").toLowerCase();

  const contract = await getContractDetail(id);
  if (!contract) {
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }

  if (format === "docx") {
    const document = new Document({
      sections: [
        {
          children: buildContractDocument(contract),
        },
      ],
    });

    const buffer = await Packer.toBuffer(document);
    const filename = `${slugify(contract.name) || "contrato"}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": contentDisposition(filename),
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "pdf") {
    const pdfBuffer = renderContractPdf(contract.name, contract.body);
    const filename = `${slugify(contract.name) || "contrato"}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(filename),
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json(
    { error: "Formato ainda não suportado. Use format=docx ou format=pdf." },
    { status: 400 }
  );
}

function buildContractDocument(
  contract: Awaited<ReturnType<typeof getContractDetail>>
) {
  if (!contract) {
    return [];
  }

  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(contract.name)],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Status: ${contract.status} · Tipo: ${contract.contractType}`,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun(
          `Cliente: ${contract.client?.name || "Rascunho interno"}`
        ),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun(`Atualizado em: ${formatDateTime(contract.updatedAt)}`),
      ],
    }),
    blankParagraph(),
  ];

  if (contract.analysis?.summary) {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Resumo jurídico do Lex")],
      }),
      new Paragraph({
        children: [new TextRun(contract.analysis.summary)],
      }),
      blankParagraph()
    );
  }

  contract.sections.forEach((section, index) => {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(section.title || `Seção ${index + 1}`)],
      }),
      ...toParagraphs(section.text)
    );
  });

  if (Object.keys(contract.variableValues).length > 0) {
    paragraphs.push(
      blankParagraph(),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Variáveis detectadas")],
      })
    );

    for (const [key, value] of Object.entries(contract.variableValues)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${key}: `, bold: true }),
            new TextRun(value || "—"),
          ],
        })
      );
    }
  }

  return paragraphs;
}

function toParagraphs(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [new Paragraph("Sem conteúdo disponível.")];
  }

  return [
    ...blocks.flatMap((block) => [
      new Paragraph({
        children: [new TextRun(block)],
      }),
      blankParagraph(),
    ]),
  ];
}

function blankParagraph() {
  return new Paragraph("");
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function contentDisposition(filename: string) {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`;
}
