/**
 * Branding e identificação societária da operadora.
 *
 * Centraliza identidade da Fluxrow para uso em páginas legais, footer,
 * e-mails transacionais e qualquer outro lugar que exija identificação
 * formal (LGPD, Procon, Marco Civil).
 *
 * Valores configuráveis via env (com fallback para placeholder visível):
 *   NEXT_PUBLIC_FLUXROW_LEGAL_NAME   → razão social
 *   NEXT_PUBLIC_FLUXROW_CNPJ         → CNPJ formatado XX.XXX.XXX/0001-XX
 *   NEXT_PUBLIC_FLUXROW_ADDRESS      → endereço comercial (opcional)
 *   NEXT_PUBLIC_FLUXROW_CONTACT_EMAIL → e-mail de contato geral (opcional)
 *
 * Quando o placeholder ainda aparece em produção, é sinal claro de que falta
 * cadastrar — não é vazamento, é nudge visível para o Cauã.
 */

export const fluxrowBranding = {
  legalName:
    process.env.NEXT_PUBLIC_FLUXROW_LEGAL_NAME ||
    "Fluxrow Inteligência Criativa Ltda.",
  cnpj: process.env.NEXT_PUBLIC_FLUXROW_CNPJ || "[CNPJ a cadastrar]",
  address: process.env.NEXT_PUBLIC_FLUXROW_ADDRESS || "Brasil",
  contactEmail:
    process.env.NEXT_PUBLIC_FLUXROW_CONTACT_EMAIL || "contato@fluxrow.com",
  privacyEmail: "privacidade@fluxrow.com",
  dpoEmail: "dpo@fluxrow.com",
  legalEmail: "juridico@fluxrow.com",
  supportEmail: "suporte@fluxrow.com",
  website: "https://fluxrow.com",
} as const;

export type FluxrowBranding = typeof fluxrowBranding;
