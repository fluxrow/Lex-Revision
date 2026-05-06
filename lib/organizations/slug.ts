export function buildUniqueOrganizationSlug(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "lex-revision";

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
