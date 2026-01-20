# Schema Mapper - Guia de Funcionamento

## Visão Geral

O **Schema Mapper Service** integra os schemas de Prestação de Contas v1.9 no sistema AUDESP v3.0, permitindo:

1. **Extração automática de dados de PDFs** usando padrões regex
2. **Mapeamento inteligente** para campos do schema
3. **Detecção de seções** e tabelas no documento
4. **Validação contra schema** oficial
5. **Sugestões de preenchimento** baseadas em padrões

## Como Funciona

### 1. Extração de Dados do PDF

Quando um PDF é enviado, o serviço extrai:

```
- Descritor (municipio, entidade, ano, mês)
- Código do ajuste (15-19 dígitos)
- Retificação (sim/não)
- Seções e tabelas
- CPFs e CNPJs
- Datas
- Valores monetários
```

### 2. Mapeamento para Schema

Os dados extraídos são mapeados para o schema seguindo a estrutura oficial:

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
  ...
}
```

### 3. Detecção Inteligente de Seções

O serviço detecta automaticamente seções como:

- **relacao_empregados**: Procura por "empregado", "servidor", "pessoal"
- **relacao_bens**: Procura por "bem", "móvel", "imóvel", "patrimônio"
- **contratos**: Procura por "contrato", "fornecedor", "prestador"
- **documentos_fiscais**: Procura por "nota fiscal", "nf", "documento fiscal"
- **pagamentos**: Procura por "pagamento", "desembolso", "saída"
- **disponibilidades**: Procura por "saldo", "caixa", "fundo fixo"
- **receitas**: Procura por "receita", "entrada", "arrecadação", "repasse"

### 4. Extração de Estruturas

Para cada seção detectada, extrai:

```
Linhas e colunas de tabelas
Valores associados
CPFs/CNPJs dos responsáveis
Datas de referência
Valores monetários
```

### 5. Validação contra Schema

Valida se os dados extraídos seguem o schema oficial:

```typescript
const validacao = SchemaMapperService.validarContraSchema(dados);

if (!validacao.valido) {
  console.log('Erros encontrados:');
  validacao.erros.forEach(erro => console.log(` - ${erro}`));
}
```

## Padrões Regex Utilizados

```typescript
// Data do relatório
/data\s*(?:de\s+)?(?:conclusão|emissão|relatório)[\s:]*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})/gi

// Código do ajuste (15-19 dígitos)
/código\s+(?:do\s+)?ajuste[\s:]*(\d{15,19})/gi

// Municipio
/municipio\s*(?:código)?[\s:]*(\d{1,5})/gi

// Entidade
/entidade\s*(?:código)?[\s:]*(\d{1,5})/gi

// CPF
/\d{3}[.,]\d{3}[.,]\d{3}[.,]\d{2}/g

// CNPJ
/\d{2}[.,]\d{3}[.,]\d{3}[.,]\d{4}[.,]\d{2}/g
```

## Fluxo de Integração

```
PDF Upload
    ↓
OCRService.processPDF() - Extrai texto e tabelas
    ↓
SchemaMapperService.mapearParaSchema() - Mapeia para schema
    ↓
SchemaMapperService.sugerirPreenchimento() - Gera sugestões
    ↓
SchemaMapperService.validarContraSchema() - Valida dados
    ↓
Dados preenchidos no formulário com validação
```

## Exemplo de Uso no Componente

```tsx
// Em FormWithOCR.tsx
import SchemaMapperService from '../services/schemaMapperService';

// Após extrair dados do PDF
const pdfDataForMapping = {
  fullText: extracted.fullText,
  tables: extracted.tables,
  metadata: {
    filename: pdfFile.name,
    extractedAt: new Date().toISOString(),
    pageCount: extracted.pageCount,
  }
};

// Mapear para schema
const schemaMapeado = SchemaMapperService.mapearParaSchema(pdfDataForMapping);

// Validar
const validacao = SchemaMapperService.validarContraSchema(schemaMapeado);

// Sugerir preenchimento adicional
const sugestoes = SchemaMapperService.sugerirPreenchimento(pdfDataForMapping);

// Usar dados no formulário
setFormData({
  ...schemaMapeado,
  ...sugestoes
});
```

## Campos Obrigatórios do Schema

Conforme a especificação v1.9:

```
- descritor (com municipio, entidade, ano, mes)
- codigo_ajuste (15-19 dígitos)
- relacao_empregados
- relacao_bens (com 6 subseções)
- contratos
- documentos_fiscais
- pagamentos
- disponibilidades
- receitas (com subcampos de repasses)
- ajustes_saldo (com retificações e inclusões)
- servidores_cedidos
- descontos
- devolucoes
- glosas
- empenhos
- repasses
- relatorio_atividades (com programas)
- dados_gerais_entidade_beneficiaria
- responsaveis_membros_orgao_concessor
- declaracoes
- relatorio_governamental_analise_execucao
- demonstracoes_contabeis
- publicacoes_parecer_ata
- prestacao_contas_entidade_beneficiaria
- parecer_conclusivo
- transparencia
```

## Dados Extraídos Automaticamente

O serviço tenta extrair:

1. **Descritor**: Detecta ano, mês, municipio, entidade do texto
2. **Código Ajuste**: Busca números de 15-19 dígitos
3. **Retificação**: Verifica se contém palavra "retificação"
4. **CPFs**: Extrai todos os CPFs encontrados
5. **CNPJs**: Extrai todos os CNPJs encontrados
6. **Datas**: Extrai datas no formato DD/MM/AAAA ou DD-MM-AAAA
7. **Valores**: Extrai valores monetários em formato R$ 1.234,56
8. **Tabelas**: Estrutura dados de tabelas encontradas no PDF

## Sugestões Automáticas

O serviço pode sugerir:

```typescript
{
  retificacao: true,           // Se encontrar palavra "retificação"
  temTabelas: true,           // Se encontrar "tabela" ou "quadro"
  temDocumentacao: true,      // Se encontrar "documento" ou "anexo"
  temResponsaveis: true       // Se encontrar "responsável" ou "assinatura"
}
```

## Como Melhorar a Detecção

1. **Adicione mais padrões regex** em `regexPatterns` para casos específicos
2. **Expanda mapeamento de palavras-chave** em `mapeamento` para detectar mais seções
3. **Refine extração de tabelas** para capturar estruturas complexas
4. **Customize validação** de campos específicos

## Próximos Passos

1. Testar com PDFs reais da Prefeitura
2. Ajustar padrões regex conforme necessário
3. Adicionar suporte a mais formatos de documento
4. Implementar aprendizado de padrões comuns
5. Criar interface para revisar e editar dados extraídos

---

**Versão**: 1.0  
**Data**: 20/01/2026  
**Schema**: Prestação de Contas de Convênio v1.9
