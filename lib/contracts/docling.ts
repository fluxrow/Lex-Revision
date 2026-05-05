import { spawn } from "node:child_process";

export type DoclingStructuredSection = {
  title: string;
  text: string;
};

export type DoclingExtraction = {
  provider: string;
  markdown: string;
  text: string;
  sections: DoclingStructuredSection[];
  tablesCount: number;
  picturesCount: number;
  fileName?: string;
  fileFormat?: string;
};

type ExtractWithDoclingParams = {
  body: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileContentBase64?: string | null;
};

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export async function extractWithDocling(
  params: ExtractWithDoclingParams
): Promise<DoclingExtraction | null> {
  const format = detectDocumentFormat(params.fileName, params.mimeType);
  const fileName = params.fileName?.trim() || `document.${format}`;
  const inputBuffer = buildInputBuffer(params.body, params.fileContentBase64);

  if (!inputBuffer) {
    return null;
  }

  const apiResult = await extractWithDoclingApi({
    body: params.body,
    fileName,
    format,
    fileContentBase64: params.fileContentBase64,
  });
  if (apiResult) {
    return apiResult;
  }

  return extractWithLocalCommand({
    buffer: inputBuffer,
    fileName,
    format,
  });
}

async function extractWithDoclingApi(params: {
  body: string;
  fileName: string;
  format: string;
  fileContentBase64?: string | null;
}): Promise<DoclingExtraction | null> {
  const url = process.env.DOCLING_API_URL?.trim();

  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: params.fileName,
        format: params.format,
        contentBase64: params.fileContentBase64 || null,
        body: params.fileContentBase64 ? null : params.body,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("[docling] API returned non-success status", response.status);
      return null;
    }

    const payload = (await response.json()) as JsonValue;
    return normalizeDoclingPayload(payload, params.fileName, params.format);
  } catch (error) {
    console.warn("[docling] API extraction failed", error);
    return null;
  }
}

async function extractWithLocalCommand(params: {
  buffer: Buffer;
  fileName: string;
  format: string;
}): Promise<DoclingExtraction | null> {
  const command =
    process.env.DOCLING_COMMAND?.trim() ||
    "uv run --with docling python3 scripts/docling_extract.py";

  return new Promise((resolve) => {
    const child = spawn(
      "/bin/sh",
      [
        "-lc",
        `${command} --stdin --format ${shellEscape(params.format)} --name ${shellEscape(params.fileName)}`,
      ],
      {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => {
      console.warn("[docling] Local command failed to start", error);
      resolve(null);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        const stderrText = Buffer.concat(stderr).toString("utf8").trim();
        if (stderrText) {
          console.warn("[docling] Local command returned error", stderrText);
        }
        resolve(null);
        return;
      }

      const payloadText = Buffer.concat(stdout).toString("utf8").trim();
      if (!payloadText) {
        resolve(null);
        return;
      }

      try {
        const parsed = JSON.parse(payloadText) as JsonValue;
        resolve(normalizeDoclingPayload(parsed, params.fileName, params.format));
      } catch (error) {
        console.warn("[docling] Could not parse local response", error);
        resolve(null);
      }
    });

    child.stdin.write(params.buffer);
    child.stdin.end();
  });
}

function normalizeDoclingPayload(
  payload: JsonValue,
  fileName: string,
  format: string
): DoclingExtraction | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const provider = readString(payload.provider);
  const markdown = readString(payload.markdown);
  const text = readString(payload.text);
  const sections = readSections(payload.sections);

  if (!provider || (!markdown && !text)) {
    return null;
  }

  return {
    provider,
    markdown,
    text,
    sections,
    tablesCount: readNumber(payload.tables_count),
    picturesCount: readNumber(payload.pictures_count),
    fileName,
    fileFormat: format,
  };
}

function buildInputBuffer(body: string, fileContentBase64?: string | null) {
  if (fileContentBase64?.trim()) {
    return Buffer.from(fileContentBase64, "base64");
  }

  if (body.trim()) {
    return Buffer.from(body, "utf8");
  }

  return null;
}

function detectDocumentFormat(fileName?: string | null, mimeType?: string | null) {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  if (extension) {
    return extension;
  }

  const mimeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/markdown": "md",
    "text/html": "html",
    "text/plain": "txt",
  };

  return mimeMap[mimeType || ""] || "txt";
}

function readSections(value: JsonValue): DoclingStructuredSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const title = readString(item.title);
      const text = readString(item.text);
      if (!title && !text) {
        return null;
      }

      return {
        title: title || "Secao",
        text,
      };
    })
    .filter((item): item is DoclingStructuredSection => Boolean(item));
}

function readString(value: JsonValue | undefined) {
  return typeof value === "string" ? value : "";
}

function readNumber(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
