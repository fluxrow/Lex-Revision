type SignatureSignerInput = {
  name: string;
  email: string;
  document?: string | null;
};

type ClicksignSignerRecord = {
  key: string;
};

type ClicksignDocumentRecord = {
  key: string;
  path?: string | null;
};

type ClicksignListRecord = {
  key: string;
  url?: string | null;
};

type ClicksignEnvelope<T extends Record<string, unknown>> = T & {
  errors?: string[] | null;
};

export class ClicksignConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClicksignConfigError";
  }
}

export function hasClicksignConfig() {
  return Boolean(getClicksignAccessToken());
}

export function getClicksignConfig() {
  const accessToken = getClicksignAccessToken();
  if (!accessToken) {
    throw new ClicksignConfigError(
      "A integração com a Clicksign ainda não foi configurada neste ambiente. Preencha CLICKSIGN_ACCESS_TOKEN no Vercel antes de enviar contratos para assinatura."
    );
  }

  return {
    accessToken,
    baseUrl: (process.env.CLICKSIGN_BASE_URL?.trim() || "https://app.clicksign.com/api/v1").replace(/\/+$/, ""),
  };
}

export async function createClicksignSignatureRequest(args: {
  contractName: string;
  contractBody: string;
  signers: SignatureSignerInput[];
}) {
  const { baseUrl, accessToken } = getClicksignConfig();
  const pdfBuffer = renderContractPdf(args.contractName, args.contractBody);
  const fileName = `${slugify(args.contractName) || "contrato"}.pdf`;

  const formData = new FormData();
  formData.append(
    "document[archive][original]",
    new Blob([pdfBuffer], { type: "application/pdf" }),
    fileName
  );
  formData.append("document[path]", `/${fileName}`);

  const documentPayload = await postMultipart<{
    document: ClicksignDocumentRecord;
  }>(`${baseUrl}/documents?access_token=${encodeURIComponent(accessToken)}`, formData);

  const documentKey = documentPayload.document?.key;
  if (!documentKey) {
    throw new Error("A Clicksign não retornou a chave do documento enviado.");
  }

  const signerPayloads = await Promise.all(
    args.signers.map(async (signer) => {
      const createdSigner = await postJson<{
        signer: ClicksignSignerRecord;
      }>(`${baseUrl}/signers?access_token=${encodeURIComponent(accessToken)}`, {
        signer: {
          name: signer.name,
          email: signer.email,
          documentation: signer.document || undefined,
          auths: ["email"],
        },
      });

      const signerKey = createdSigner.signer?.key;
      if (!signerKey) {
        throw new Error(`A Clicksign não retornou a chave do signatário ${signer.email}.`);
      }

      const listPayload = await postJson<{
        list: ClicksignListRecord;
      }>(`${baseUrl}/lists?access_token=${encodeURIComponent(accessToken)}`, {
        list: {
          document_key: documentKey,
          signer_key: signerKey,
          sign_as: "sign",
          message: buildSignerMessage(args.contractName),
        },
      });

      const listKey = listPayload.list?.key;
      if (!listKey) {
        throw new Error(`A Clicksign não retornou a chave da solicitação para ${signer.email}.`);
      }

      return {
        name: signer.name,
        email: signer.email,
        document: signer.document || null,
        signerKey,
        listKey,
        signatureUrl: listPayload.list?.url || null,
      };
    })
  );

  return {
    documentKey,
    fileName,
    documentPath: documentPayload.document?.path || `/${fileName}`,
    signers: signerPayloads,
  };
}

async function postJson<T extends Record<string, unknown>>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ClicksignEnvelope<T>;

  if (!response.ok) {
    throw new Error(extractClicksignError(payload, "A Clicksign recusou a solicitação."));
  }

  return payload;
}

async function postMultipart<T extends Record<string, unknown>>(url: string, body: FormData) {
  const response = await fetch(url, {
    method: "POST",
    body,
  });

  const payload = (await response.json()) as ClicksignEnvelope<T>;

  if (!response.ok) {
    throw new Error(extractClicksignError(payload, "A Clicksign recusou o upload do documento."));
  }

  return payload;
}

function extractClicksignError(payload: ClicksignEnvelope<Record<string, unknown>>, fallback: string) {
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.join(" | ");
  }

  return fallback;
}

function getClicksignAccessToken() {
  return (
    process.env.CLICKSIGN_ACCESS_TOKEN?.trim() ||
    process.env.CLICKSIGN_API_TOKEN?.trim() ||
    ""
  );
}

function buildSignerMessage(contractName: string) {
  return `O documento "${contractName}" está disponível para assinatura no Lex Revision.`;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function renderContractPdf(title: string, body: string) {
  const normalizedTitle = sanitizePdfText(title);
  const normalizedBody = sanitizePdfText(body);
  const bodyLines = wrapText(normalizedBody, 92);
  const pages = chunk([
    normalizedTitle,
    "",
    ...bodyLines,
  ], 42);

  let nextObjectNumber = 3;
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];
  const objects = new Map<number, string>();

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines) => {
    const pageObjectNumber = nextObjectNumber++;
    const contentObjectNumber = nextObjectNumber++;
    pageObjectNumbers.push(pageObjectNumber);
    contentObjectNumbers.push(contentObjectNumber);

    objects.set(
      pageObjectNumber,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );

    const content = buildPdfContentStream(pageLines);
    objects.set(
      contentObjectNumber,
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`
    );
  });

  objects.set(
    2,
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`
  );

  const objectNumbers = [...objects.keys()].sort((left, right) => left - right);
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objectNumbers.forEach((number) => {
    offsets[number] = Buffer.byteLength(pdf, "latin1");
    pdf += `${number} 0 obj\n${objects.get(number)}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objectNumbers.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  objectNumbers.forEach((number) => {
    pdf += `${String(offsets[number]).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objectNumbers.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

function buildPdfContentStream(lines: string[]) {
  const output: string[] = ["BT", "/F1 14 Tf", "50 760 Td"];

  lines.forEach((line, index) => {
    if (index === 1) {
      output.push("/F1 11 Tf");
    }

    output.push(`(${escapePdfString(line)}) Tj`);
    output.push("0 -16 Td");
  });

  output.push("ET");

  return output.join("\n");
}

function wrapText(value: string, maxLength: number) {
  const lines: string[] = [];

  value
    .split("\n")
    .map((line) => line.trim())
    .forEach((paragraph) => {
      if (!paragraph) {
        lines.push("");
        return;
      }

      let current = "";

      paragraph.split(/\s+/).forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxLength) {
          if (current) {
            lines.push(current);
          }
          current = word;
        } else {
          current = candidate;
        }
      });

      if (current) {
        lines.push(current);
      }
    });

  return lines;
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }

  return groups.length > 0 ? groups : [[]];
}

function sanitizePdfText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/[^\x0A\x20-\x7E\xA0-\xFF]/g, "");
}

function escapePdfString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}
