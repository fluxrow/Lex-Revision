export type ContractType =
  | "general"
  | "service_agreement"
  | "nda"
  | "lease"
  | "employment";

export type ClauseImportance = "required" | "recommended";
export type RiskLevel = "low" | "medium" | "high";

export interface ClauseDefinition {
  id: string;
  title: string;
  description: string;
  importance: ClauseImportance;
  riskIfMissing: RiskLevel;
  guidance: string;
  sampleText: string;
  keywords: string[];
  recommendedFor: ContractType[];
}

export interface ContractProfile {
  type: ContractType;
  label: string;
  description: string;
  indicators: string[];
  requiredClauseIds: string[];
  recommendedClauseIds: string[];
}

export const CONTRACT_PROFILES: ContractProfile[] = [
  {
    type: "service_agreement",
    label: "Prestacao de servicos",
    description: "Contrato de prestacao de servicos profissionais, consultoria ou honorarios recorrentes.",
    indicators: [
      "prestacao de servicos",
      "prestadora",
      "contratada",
      "consultoria",
      "honorarios",
      "escopo do servico",
    ],
    requiredClauseIds: [
      "parties",
      "scope",
      "term",
      "fees",
      "termination",
      "forum",
    ],
    recommendedClauseIds: [
      "confidentiality",
      "data_protection",
      "liability",
      "penalties",
      "adjustment",
    ],
  },
  {
    type: "nda",
    label: "Acordo de confidencialidade",
    description: "Instrumento focado em compartilhamento de informacoes confidenciais.",
    indicators: [
      "confidencialidade",
      "nao divulgacao",
      "informacoes confidenciais",
      "segredo",
      "nda",
    ],
    requiredClauseIds: [
      "parties",
      "scope",
      "confidentiality",
      "term",
      "termination",
      "forum",
    ],
    recommendedClauseIds: [
      "data_protection",
      "penalties",
      "liability",
    ],
  },
  {
    type: "lease",
    label: "Locacao",
    description: "Contrato de locacao residencial ou comercial.",
    indicators: [
      "locacao",
      "locador",
      "locatario",
      "imovel",
      "aluguel",
      "fiador",
    ],
    requiredClauseIds: [
      "parties",
      "scope",
      "term",
      "fees",
      "adjustment",
      "termination",
      "forum",
    ],
    recommendedClauseIds: [
      "penalties",
      "liability",
      "data_protection",
    ],
  },
  {
    type: "employment",
    label: "Trabalho ou emprego",
    description: "Contrato de trabalho, admissao ou relacao empregaticia.",
    indicators: [
      "empregado",
      "empregador",
      "clt",
      "jornada",
      "salario",
      "trabalho",
    ],
    requiredClauseIds: [
      "parties",
      "scope",
      "term",
      "fees",
      "termination",
      "forum",
    ],
    recommendedClauseIds: [
      "confidentiality",
      "data_protection",
      "liability",
    ],
  },
  {
    type: "general",
    label: "Contrato geral",
    description: "Contrato sem classificacao clara ou com natureza mista.",
    indicators: [],
    requiredClauseIds: [
      "parties",
      "scope",
      "term",
      "termination",
      "forum",
    ],
    recommendedClauseIds: [
      "fees",
      "confidentiality",
      "data_protection",
      "liability",
      "penalties",
    ],
  },
];

export const CLAUSE_LIBRARY: ClauseDefinition[] = [
  {
    id: "parties",
    title: "Qualificacao das partes",
    description: "Identifica contratantes, representantes e dados minimos para validade e cobranca.",
    importance: "required",
    riskIfMissing: "high",
    guidance: "Descreva quem sao as partes, documentos, enderecos e poderes de representacao quando aplicavel.",
    sampleText:
      "As partes qualificam-se neste instrumento com nome, documento, endereco e representacao legal suficiente para a celebracao do ajuste.",
    keywords: ["qualificacao", "contratante", "contratada", "partes", "locador", "locatario", "empregador", "empregado"],
    recommendedFor: ["general", "service_agreement", "nda", "lease", "employment"],
  },
  {
    id: "scope",
    title: "Objeto e escopo",
    description: "Define o que sera entregue, os limites do servico e o resultado esperado.",
    importance: "required",
    riskIfMissing: "high",
    guidance: "Detalhe o servico, obrigacoes principais e limites do trabalho para reduzir disputa interpretativa.",
    sampleText:
      "Constitui objeto deste contrato a prestacao dos servicos descritos no Anexo I, observados os limites de escopo e as responsabilidades aqui fixadas.",
    keywords: ["objeto", "escopo", "servicos", "prestacao", "atividade", "entrega", "obrigacoes"],
    recommendedFor: ["general", "service_agreement", "nda", "lease", "employment"],
  },
  {
    id: "term",
    title: "Prazo e vigencia",
    description: "Explica inicio, termino, renovacao e condicoes de vigencia.",
    importance: "required",
    riskIfMissing: "high",
    guidance: "Informe data de inicio, duracao, prorrogacao e gatilhos de renovacao ou encerramento.",
    sampleText:
      "Este contrato entra em vigor na data de sua assinatura e permanece valido pelo prazo de 12 meses, admitida prorrogacao por termo aditivo.",
    keywords: ["prazo", "vigencia", "inicio", "termino", "renovacao", "duracao", "vigor"],
    recommendedFor: ["general", "service_agreement", "nda", "lease", "employment"],
  },
  {
    id: "fees",
    title: "Preco, remuneracao e pagamento",
    description: "Regula valor, forma de pagamento, vencimento e tributos.",
    importance: "required",
    riskIfMissing: "high",
    guidance: "Defina preco, periodicidade, vencimento, tributos, reembolso e prova de inadimplencia.",
    sampleText:
      "Pela execucao do objeto, a CONTRATANTE pagara a quantia e nas datas previstas neste instrumento, mediante emissao do documento fiscal cabivel.",
    keywords: ["valor", "pagamento", "remuneracao", "preco", "honorarios", "aluguel", "salario", "vencimento"],
    recommendedFor: ["general", "service_agreement", "lease", "employment"],
  },
  {
    id: "adjustment",
    title: "Reajuste e atualizacao monetaria",
    description: "Previne erosao economica e disputa sobre correcao do valor.",
    importance: "recommended",
    riskIfMissing: "medium",
    guidance: "Indique indice, periodicidade e criterio de substituicao em caso de extincao do indice.",
    sampleText:
      "Os valores serao reajustados anualmente pelo indice pactuado, ou por indice oficial substitutivo que preserve o equilibrio economico do contrato.",
    keywords: ["reajuste", "indice", "correcao monetaria", "ipca", "igpm", "atualizacao monetaria"],
    recommendedFor: ["general", "service_agreement", "lease"],
  },
  {
    id: "confidentiality",
    title: "Confidencialidade",
    description: "Protege informacoes sensiveis compartilhadas entre as partes.",
    importance: "recommended",
    riskIfMissing: "medium",
    guidance: "Defina informacoes protegidas, excecoes, prazo de sigilo e medidas em caso de violacao.",
    sampleText:
      "As partes obrigam-se a manter sigilo sobre todas as informacoes confidenciais obtidas em razao deste contrato, utilizando-as apenas para a sua execucao.",
    keywords: ["confidencialidade", "sigilo", "nao divulgacao", "informacoes confidenciais", "segredo"],
    recommendedFor: ["general", "service_agreement", "nda", "employment"],
  },
  {
    id: "data_protection",
    title: "Protecao de dados e LGPD",
    description: "Disciplina tratamento de dados pessoais e alocacao de responsabilidade.",
    importance: "recommended",
    riskIfMissing: "medium",
    guidance: "Identifique base de tratamento, papeis das partes e deveres de seguranca e cooperacao sob a LGPD.",
    sampleText:
      "As partes comprometem-se a tratar dados pessoais em conformidade com a LGPD, adotando medidas tecnicas e administrativas adequadas e cooperando em incidentes.",
    keywords: ["dados pessoais", "lgpd", "protecao de dados", "tratamento de dados", "controlador", "operador"],
    recommendedFor: ["general", "service_agreement", "nda", "lease", "employment"],
  },
  {
    id: "liability",
    title: "Responsabilidade e limitacao",
    description: "Distribui riscos, define indenizacao e limita exposicao indevida.",
    importance: "recommended",
    riskIfMissing: "medium",
    guidance: "Explique responsabilidade por danos, limites proporcionais e exclusoes razoaveis.",
    sampleText:
      "Cada parte respondera pelos danos diretos comprovadamente causados por descumprimento contratual, observados os limites e exclusoes previstos neste ajuste.",
    keywords: ["responsabilidade", "indenizacao", "danos", "perdas", "lucros cessantes", "limitacao de responsabilidade"],
    recommendedFor: ["general", "service_agreement", "nda", "lease", "employment"],
  },
  {
    id: "termination",
    title: "Rescisao e encerramento",
    description: "Organiza hipoteses de termino, aviso previo e efeitos do encerramento.",
    importance: "required",
    riskIfMissing: "high",
    guidance: "Preveja descumprimento, aviso previo, cura, efeitos financeiros e devolucao de materiais.",
    sampleText:
      "O contrato podera ser rescindido por inadimplemento ou mediante aviso previo, aplicando-se os efeitos financeiros e operacionais aqui previstos.",
    keywords: ["rescisao", "encerramento", "aviso previo", "inadimplemento", "rescindido", "terminacao"],
    recommendedFor: ["general", "service_agreement", "nda", "lease", "employment"],
  },
  {
    id: "penalties",
    title: "Multa e penalidades",
    description: "Cria consequencias economicas para o inadimplemento.",
    importance: "recommended",
    riskIfMissing: "medium",
    guidance: "Defina multa proporcional, juros e criterio de apuracao para evitar abusividade.",
    sampleText:
      "O inadimplemento sujeitara a parte faltosa a multa nao compensatoria, sem prejuizo de perdas e danos nos limites legais e contratuais.",
    keywords: ["multa", "penalidade", "juros", "mora", "inadimplemento", "clausula penal"],
    recommendedFor: ["general", "service_agreement", "nda", "lease"],
  },
  {
    id: "forum",
    title: "Foro e resolucao de disputas",
    description: "Define a competencia ou o mecanismo para resolver conflitos.",
    importance: "required",
    riskIfMissing: "high",
    guidance: "Escolha foro, mediacao ou arbitragem, observando equilibrio e exequibilidade.",
    sampleText:
      "Fica eleito o foro da comarca pactuada, com renuncia a qualquer outro, por mais privilegiado que seja, para dirimir controversias deste contrato.",
    keywords: ["foro", "comarca", "arbitragem", "mediacao", "solucao de conflitos", "jurisdicao"],
    recommendedFor: ["general", "service_agreement", "nda", "lease", "employment"],
  },
];

export const CLAUSE_BY_ID = new Map(
  CLAUSE_LIBRARY.map((clause) => [clause.id, clause])
);

export function getContractProfile(type: ContractType): ContractProfile {
  return (
    CONTRACT_PROFILES.find((profile) => profile.type === type) ??
    CONTRACT_PROFILES.find((profile) => profile.type === "general")!
  );
}
