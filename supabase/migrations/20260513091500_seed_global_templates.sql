with templates (
  id,
  name,
  category,
  description,
  storage_path,
  variables,
  uses_count
) as (
  values
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1001'::uuid,
      'Prestação de serviços',
      'Comercial',
      'Modelo base para consultorias, assessorias e serviços recorrentes.',
      'global/prestacao-servicos.md',
      '[
        {"key":"contratante_nome","label":"Nome do contratante","type":"text","required":true},
        {"key":"contratada_nome","label":"Nome da contratada","type":"text","required":true},
        {"key":"objeto","label":"Objeto do contrato","type":"textarea","required":true},
        {"key":"valor","label":"Valor total","type":"currency","required":true},
        {"key":"prazo","label":"Prazo de vigência","type":"text","required":true}
      ]'::jsonb,
      142
    ),
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1002'::uuid,
      'NDA — Confidencialidade',
      'Corporativo',
      'Acordo de confidencialidade bilateral para trocas de informação sensível.',
      'global/nda-confidencialidade.md',
      '[
        {"key":"parte_1","label":"Parte 1","type":"text","required":true},
        {"key":"parte_2","label":"Parte 2","type":"text","required":true},
        {"key":"objetivo","label":"Contexto da troca de informações","type":"textarea","required":true},
        {"key":"vigencia","label":"Prazo de confidencialidade","type":"text","required":true},
        {"key":"foro","label":"Foro","type":"text","required":false}
      ]'::jsonb,
      98
    ),
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1003'::uuid,
      'Locação residencial',
      'Imobiliário',
      'Contrato padrão para aluguel residencial com garantias e reajuste.',
      'global/locacao-residencial.md',
      '[
        {"key":"locador","label":"Nome do locador","type":"text","required":true},
        {"key":"locatario","label":"Nome do locatário","type":"text","required":true},
        {"key":"imovel","label":"Descrição do imóvel","type":"textarea","required":true},
        {"key":"aluguel","label":"Valor do aluguel","type":"currency","required":true},
        {"key":"reajuste","label":"Índice de reajuste","type":"text","required":true},
        {"key":"garantia","label":"Garantia locatícia","type":"text","required":false}
      ]'::jsonb,
      67
    ),
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1004'::uuid,
      'Honorários advocatícios',
      'Jurídico',
      'Modelo para contratação de serviços advocatícios com escopo e remuneração.',
      'global/honorarios-advocaticios.md',
      '[
        {"key":"cliente","label":"Nome do cliente","type":"text","required":true},
        {"key":"advogado","label":"Advogado ou escritório","type":"text","required":true},
        {"key":"escopo","label":"Escopo da atuação","type":"textarea","required":true},
        {"key":"honorarios","label":"Honorários contratados","type":"currency","required":true},
        {"key":"forma_pagamento","label":"Forma de pagamento","type":"text","required":true}
      ]'::jsonb,
      54
    ),
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1005'::uuid,
      'Compra e venda de imóvel',
      'Imobiliário',
      'Instrumento para promessa ou venda definitiva de imóvel urbano.',
      'global/compra-venda-imovel.md',
      '[
        {"key":"vendedor","label":"Nome do vendedor","type":"text","required":true},
        {"key":"comprador","label":"Nome do comprador","type":"text","required":true},
        {"key":"imovel","label":"Descrição do imóvel","type":"textarea","required":true},
        {"key":"preco","label":"Preço do imóvel","type":"currency","required":true},
        {"key":"entrada","label":"Valor de entrada","type":"currency","required":false},
        {"key":"prazo_escritura","label":"Prazo para escritura","type":"text","required":false}
      ]'::jsonb,
      41
    ),
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1006'::uuid,
      'Rescisão contratual',
      'Trabalhista',
      'Termo para encerramento amigável de obrigações contratuais.',
      'global/rescisao-contratual.md',
      '[
        {"key":"parte_1","label":"Parte 1","type":"text","required":true},
        {"key":"parte_2","label":"Parte 2","type":"text","required":true},
        {"key":"contrato_origem","label":"Contrato de origem","type":"text","required":true},
        {"key":"data_rescisao","label":"Data da rescisão","type":"date","required":true},
        {"key":"quitacao","label":"Condição de quitação","type":"textarea","required":false}
      ]'::jsonb,
      32
    ),
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1007'::uuid,
      'Procuração ad judicia',
      'Jurídico',
      'Procuração judicial com poderes gerais para representação processual.',
      'global/procuracao-ad-judicia.md',
      '[
        {"key":"outorgante","label":"Outorgante","type":"text","required":true},
        {"key":"outorgado","label":"Advogado outorgado","type":"text","required":true},
        {"key":"oab","label":"Número da OAB","type":"text","required":true},
        {"key":"poderes","label":"Poderes especiais","type":"textarea","required":false}
      ]'::jsonb,
      28
    ),
    (
      '3f8a4a6a-3d9b-4f0e-9dbe-f7d9b70a1008'::uuid,
      'Termo de acordo',
      'Jurídico',
      'Acordo extrajudicial com obrigações, prazos e penalidades.',
      'global/termo-acordo.md',
      '[
        {"key":"parte_1","label":"Parte 1","type":"text","required":true},
        {"key":"parte_2","label":"Parte 2","type":"text","required":true},
        {"key":"objeto","label":"Objeto do acordo","type":"textarea","required":true},
        {"key":"valor","label":"Valor acordado","type":"currency","required":false},
        {"key":"parcelas","label":"Parcelamento","type":"text","required":false},
        {"key":"multa","label":"Multa por inadimplemento","type":"text","required":false}
      ]'::jsonb,
      19
    )
)
insert into contract_templates (
  id,
  organization_id,
  name,
  category,
  description,
  storage_path,
  variables,
  uses_count,
  is_global,
  created_by
)
select
  templates.id,
  null,
  templates.name,
  templates.category,
  templates.description,
  templates.storage_path,
  templates.variables,
  templates.uses_count,
  true,
  null
from templates
where not exists (
  select 1
  from contract_templates existing
  where existing.is_global = true
    and existing.storage_path = templates.storage_path
);
