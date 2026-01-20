# Integração de Schemas de Prestação de Contas

## Visão Geral

O sistema AUDESP agora suporta mapeamento automático de dados extraídos de PDFs para a estrutura de schema completa da Prestação de Contas de Convênio versão 1.9.

## Estrutura do Schema

O schema define a estrutura JSON esperada para uma prestação de contas completa com os seguintes campos principais:

### 1. Descritor (Obrigatório)
Informações básicas do documento:
- `tipo_documento`: "Prestação de Contas de Convênio"
- `municipio`: Código do município (1-9999)
- `entidade`: Código da entidade (1-99999)
- `ano`: Ano da prestação
- `mes`: Mês (sempre 12 para ano completo)

### 2. Código do Ajuste (Obrigatório)
- `codigo_ajuste`: String com 15-19 dígitos (ex: "2024000000000001")
- `retificacao`: Boolean indicando se é uma retificação

### 3. Relações e Listas

#### Relação de Empregados
```json
{
  "cpf": "00000000191",
  "data_admissao": "2024-01-01",
  "data_demissao": "2024-04-30",
  "cbo": "123456",
  "salario_contratual": 1320.00,
  "periodos_remuneracao": [
    { "mes": 1, "carga_horaria": 160.0, "remuneracao_bruta": 1320.00 }
  ]
}
```

#### Relação de Bens
- `relacao_bens_moveis_adquiridos`: Bens móveis comprados
- `relacao_bens_moveis_cedidos`: Bens móveis doados/repassados
- `relacao_bens_moveis_baixados_devolvidos`: Bens móveis removidos ou devolvidos
- `relacao_bens_imoveis_adquiridos`: Imóveis comprados
- `relacao_bens_imoveis_cedidos`: Imóveis doados
- `relacao_bens_imoveis_baixados_devolvidos`: Imóveis removidos

#### Contratos
```json
{
  "numero": "1234657890",
  "credor": {
    "documento_tipo": 1,
    "documento_numero": "00000000191",
    "nome": "Nome/Razão Social"
  },
  "data_assinatura": "2024-01-01",
  "vigencia_tipo": 1,
  "vigencia_data_inicial": "2024-01-01",
  "vigencia_data_final": "2025-07-31",
  "objeto": "Objeto do contrato",
  "natureza_contratacao": [1, 2, 3],
  "criterio_selecao": 1,
  "valor_montante": 1.23,
  "valor_tipo": 1
}
```

#### Documentos Fiscais
```json
{
  "numero": "0987654321",
  "credor": {
    "documento_tipo": 1,
    "documento_numero": "00000000272",
    "nome": "Nome/Razão Social"
  },
  "descricao": "Descrição do Documento Fiscal",
  "data_emissao": "2024-02-01",
  "estado_emissor": 26,
  "valor_bruto": 1.23,
  "valor_encargos": 1.23,
  "categoria_despesas_tipo": 1,
  "rateio_proveniente_tipo": 1
}
```

#### Pagamentos
```json
{
  "identificacao_documento_fiscal": {
    "numero": "0987654321",
    "identificacao_credor": {
      "documento_tipo": 1,
      "documento_numero": "00000000272"
    }
  },
  "pagamento_data": "2024-02-01",
  "pagamento_valor": 1.23,
  "fonte_recurso_tipo": 1,
  "meio_pagamento_tipo": 1,
  "banco": 1,
  "agencia": 1234,
  "conta_corrente": "5678X"
}
```

### 4. Objetos Estruturados

#### Disponibilidades
```json
{
  "saldos": [
    {
      "banco": 1,
      "agencia": 1234,
      "conta": "5678X",
      "conta_tipo": 1,
      "saldo_bancario": 1.23,
      "saldo_contabil": 1.23
    }
  ],
  "saldo_fundo_fixo": 1.23
}
```

#### Receitas
```json
{
  "receitas_aplic_financ_repasses_publicos_municipais": 1.23,
  "receitas_aplic_financ_repasses_publicos_estaduais": 1.23,
  "receitas_aplic_financ_repasses_publicos_federais": 1.23,
  "repasses_recebidos": [...],
  "outras_receitas": [...],
  "recursos_proprios": [...]
}
```

#### Ajustes de Saldo
```json
{
  "retificacao_repasses": [...],
  "inclusao_repasses": [...],
  "retificacao_pagamentos": [...],
  "inclusao_pagamentos": [...]
}
```

### 5. Dados da Entidade

#### Dados Gerais da Entidade Beneficiária
```json
{
  "identificacao_certidao_dados_gerais": "0123456789",
  "identificacao_certidao_corpo_diretivo": "0123456789",
  "identificacao_certidao_membros_conselho": "0123456789"
}
```

#### Responsáveis e Membros do Órgão Concessor
```json
{
  "identificacao_certidao_responsaveis": "0123456789",
  "identificacao_certidao_membros_comissao_avaliacao": "0123456789",
  "identificacao_certidao_membros_controle_interno": "0123456789"
}
```

### 6. Informações Específicas

#### Declarações
```json
{
  "houve_contratacao_empresas_pertencentes": true,
  "empresas_pertencentes": [
    {
      "cnpj": "12345678901234",
      "cpf": "00000000191"
    }
  ],
  "houve_participacao_quadro_diretivo_administrativo": true,
  "participacoes_quadro_diretivo_administrativo": [...]
}
```

#### Parecer Conclusivo
```json
{
  "identificacao_parecer": "0009/2024",
  "conclusao_parecer": 1,
  "consideracoes_parecer": "Considerações do parecer",
  "declaracoes": [
    {
      "tipo_declaracao": 1,
      "declaracao": 1,
      "justificativa": "Justificativa se necessário"
    }
  ]
}
```

#### Transparência
```json
{
  "entidade_beneficiaria_mantem_sitio_internet": true,
  "sitios_internet": ["https://transparencia.tce.sp.gov.br/"],
  "requisitos_artigos_7o_8o_paragrafo_1o": [
    { "requisito": 1, "atende": true }
  ],
  "requisitos_sitio_artigo_8o_paragrafo_3o": [...],
  "requisitos_divulgacao_informacoes": [...]
}
```

## Como o Sistema Funciona

### 1. Extração de PDF
Quando um PDF é carregado:
```typescript
const ocrResult = await advancedOCRService.extractFromPDF(file);
```

O OCR extrai:
- Texto estruturado do PDF
- Tabelas e listas
- Números e datas
- Informações de identificação

### 2. Mapeamento Automático
Os dados extraídos são mapeados para o schema:
```typescript
const mappedResult = SchemaMappingService.mapPDFDataToSchema(ocrResult.data, {});
```

O serviço:
- Normaliza valores (CPFs, datas, números)
- Converte tipos de dados
- Estrutura arrays e objetos
- Valida campos obrigatórios

### 3. Validação
O resultado inclui:
- `success`: Boolean indicando se o mapeamento foi completo
- `data`: Dados mapeados prontos para envio
- `missingFields`: Campos obrigatórios não encontrados
- `warnings`: Avisos sobre dados potencialmente incompletos

## Integração no Aplicativo

### Usando o Componente PDFSchemaIntegration

```tsx
import PDFSchemaIntegration from './components/PDFSchemaIntegration';

<PDFSchemaIntegration
  onDataExtracted={(data) => {
    // Dados mapeados e prontos para usar
    setFormData(data);
  }}
  onError={(error) => {
    // Tratamento de erros
    showToast(error, 'error');
  }}
/>
```

### Resultado do Mapeamento

```typescript
interface SchemaMappingResult {
  success: boolean;           // Todos os campos obrigatórios foram mapeados
  data: any;                  // Dados estruturados conforme o schema
  missingFields: string[];    // Campos obrigatórios não encontrados
  warnings: string[];         // Avisos e mensagens informativas
}
```

## Campos Calculados e Sugestões

O serviço de mapeamento:
- **Normalizadores**: CPFs e CNPJs padronizados
- **Conversores**: Datas convertidas para ISO format
- **Estruturadores**: Agrupamento automático de campos relacionados
- **Validadores**: Verificação de campos obrigatórios
- **Geradores**: Valores padrão quando ausentes (ex: ano atual, mês 12)

## Exemplo Completo

```json
{
  "descritor": {
    "tipo_documento": "Prestação de Contas de Convênio",
    "municipio": 7107,
    "entidade": 10048,
    "ano": 2024,
    "mes": 12
  },
  "codigo_ajuste": "2024000000000001",
  "retificacao": false,
  "relacao_empregados": [...],
  "relacao_bens": {...},
  "contratos": [...],
  "documentos_fiscais": [...],
  "pagamentos": [...],
  "disponibilidades": {...},
  "receitas": {...},
  "ajustes_saldo": {...},
  "servidores_cedidos": [...],
  "descontos": [...],
  "devolucoes": [...],
  "glosas": [...],
  "empenhos": [...],
  "repasses": [...],
  "relatorio_atividades": {...},
  "dados_gerais_entidade_beneficiaria": {...},
  "responsaveis_membros_orgao_concessor": {...},
  "declaracoes": {...},
  "relatorio_governamental_analise_execucao": {...},
  "demonstracoes_contabeis": {...},
  "publicacoes_parecer_ata": [...],
  "prestacao_contas_entidade_beneficiaria": {...},
  "parecer_conclusivo": {...},
  "transparencia": {...}
}
```

## Notas Importantes

1. **Campos Obrigatórios**: O sistema valida automaticamente se todos os campos obrigatórios foram mapeados
2. **Dados Incompletos**: Quando campos estão faltando, eles aparecem no array `missingFields`
3. **Normalização Automática**: CPFs, datas e valores monetários são normalizados automaticamente
4. **Valores Padrão**: Alguns campos recebem valores padrão quando não encontrados (ex: ano atual)
5. **Avisos**: O sistema fornece avisos sobre dados que podem estar incompletos ou inconsistentes

## Próximos Passos

1. Carregar um PDF com dados de prestação de contas
2. O sistema extrai os dados automaticamente
3. Os dados são mapeados para o schema
4. Campos faltando são identificados
5. Usuário pode completar campos manualmente no formulário
6. Dados são enviados para o servidor quando completos
