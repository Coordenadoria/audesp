# Usando Schemas com PDFs - Manual Prático

## O que foi implementado

O sistema agora automaticamente:

1. **Extrai dados de PDFs** usando OCR (Tesseract.js)
2. **Mapeia automaticamente** para o schema de Prestação de Contas v1.9
3. **Preenche campos** do formulário baseado no que foi extraído
4. **Valida** os dados contra o schema oficial
5. **Sugere** preenchimento automático

## Como Funciona - Fluxo Prático

### Passo 1: Upload do PDF

Quando você carrega um PDF de Prestação de Contas, o sistema:

```
Arquivo PDF → OCRService → Texto + Tabelas extraídas
```

### Passo 2: Extração de Informações Chave

O sistema procura e extrai automaticamente:

```
DESCRITOR:
- Municipio: Busca por "municipio" ou "código" seguido de número
- Entidade: Busca por "entidade" ou "código" seguido de número
- Ano: Busca por "ano" na data do documento
- Mês: Busca por "mês" ou mês específico

IDENTIFICADORES:
- Código Ajuste: Procura 15-19 dígitos consecutivos
- CPFs: 123.456.789-00
- CNPJs: 12.345.678/0001-90

DATAS:
- Formato DD/MM/AAAA ou DD-MM-AAAA

VALORES:
- R$ 1.234,56 ou valores monetários
```

### Passo 3: Mapeamento para Schema

Os dados extraídos são organizados seguindo o schema:

```json
{
  "descritor": {
    "tipo_documento": "Prestação de Contas de Convênio",
    "municipio": 7107,      ← Extraído automaticamente
    "entidade": 10048,      ← Extraído automaticamente
    "ano": 2024,            ← Extraído automaticamente
    "mes": 12               ← Extraído automaticamente
  },
  "codigo_ajuste": "2024000000000001",  ← Extraído automaticamente
  "retificacao": false,                  ← Detectado no texto
  // ... outros campos preenchidos
}
```

### Passo 4: Validação

O sistema verifica se todos os campos obrigatórios estão presentes:

```
✓ Descritor válido
✓ Código ajuste válido (15-19 dígitos)
✓ Todos os campos obrigatórios presentes
```

Se houver erros, exibe:
```
✗ Campo obrigatório faltando: relacao_bens
✗ Descritor: municipio inválido
```

### Passo 5: Sugestões Automáticas

Com base no PDF, o sistema sugere:

```
temTabelas: true          ← Encontrou tabelas no PDF
temDocumentacao: true     ← Encontrou referências a documentos
temResponsaveis: true     ← Encontrou assinaturas ou responsáveis
retificacao: true         ← Se for uma retificação
```

## Seções Detectadas Automaticamente

O sistema procura por estas palavras-chave para preencher cada seção:

### Relação de Empregados
Palavras-chave: "empregado", "servidor", "pessoal", "recursos humanos", "rh"

**Resultado**: Lista de empregados com dados extraídos de tabelas

### Relação de Bens
Palavras-chave: "bem", "móvel", "imóvel", "patrimônio", "ativo fixo"

**Resultado**: 
- Bens móveis adquiridos
- Bens móveis cedidos
- Bens móveis baixados/devolvidos
- Bens imóveis adquiridos
- Bens imóveis cedidos
- Bens imóveis baixados/devolvidos

### Contratos
Palavras-chave: "contrato", "fornecedor", "prestador"

**Resultado**: Lista de contratos com valores

### Documentos Fiscais
Palavras-chave: "nota fiscal", "nf", "documento fiscal", "recibo"

**Resultado**: Lista de documentos com números e valores

### Pagamentos
Palavras-chave: "pagamento", "desembolso", "saída", "comprovante"

**Resultado**: Registros de pagamentos realizados

### Disponibilidades
Palavras-chave: "saldo", "disponibilidade", "caixa", "fundo fixo"

**Resultado**: Saldo e disponibilidades em contas

### Receitas
Palavras-chave: "receita", "entrada", "arrecadação", "repasse"

**Resultado**: 
- Repasses municipais
- Repasses estaduais
- Repasses federais
- Outras receitas

### Glosas
Palavras-chave: "glosa", "desconto", "impugnação"

**Resultado**: Valores glosados com motivo

### Empenhos
Palavras-chave: "empenho", "compromisso"

**Resultado**: Empenhos registrados

## Exemplo de Uso

### Cenário: PDF de Prefeitura Municipal

**Arquivo**: `relatorio_contas_2024_sao_paulo.pdf`

**Conteúdo do PDF**:
```
PRESTAÇÃO DE CONTAS DE CONVÊNIO

Municipio: 7107
Entidade: 10048
Ano de Referência: 2024
Mês de Referência: 12
Código do Ajuste: 2024000000000001

RELAÇÃO DE EMPREGADOS:
Nome | CPF | Cargo | Salário
João Silva | 123.456.789-00 | Gerente | 5.000,00
Maria Santos | 987.654.321-00 | Auxiliar | 2.000,00

RELAÇÃO DE BENS:
Bem | Descrição | Valor
Computador | Dell i7 | 3.500,00
Impressora | HP LaserJet | 1.200,00

PAGAMENTOS REALIZADOS:
Data | Descrição | Valor
15/01/2024 | Salários | 7.000,00
20/01/2024 | Fornecedores | 5.200,00

SALDO FINAL:
Caixa: R$ 45.300,00
Fundo Fixo: R$ 1.000,00
```

**Resultado da Extração**:

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
  "relacao_empregados": [
    {
      "nome": "João Silva",
      "cpf": "123.456.789-00",
      "cargo": "Gerente",
      "salario": 5000.00
    },
    {
      "nome": "Maria Santos",
      "cpf": "987.654.321-00",
      "cargo": "Auxiliar",
      "salario": 2000.00
    }
  ],
  "disponibilidades": {
    "saldos": [
      { "tipo": "Caixa", "valor": 45300.00 }
    ],
    "saldo_fundo_fixo": 1000.00
  },
  "pagamentos": [
    {
      "data": "15/01/2024",
      "descricao": "Salários",
      "valor": 7000.00
    },
    {
      "data": "20/01/2024",
      "descricao": "Fornecedores",
      "valor": 5200.00
    }
  ],
  "_metadata": {
    "secoes_detectadas": ["relacao_empregados", "relacao_bens", "pagamentos"],
    "tabelas_encontradas": 3,
    "cpfs_extraidos": 2,
    "valores_extraidos": 5
  }
}
```

## Como Usar na Interface

### 1. Acessar o sistema
```
https://audesp-fawnud6q9-coordenadorias-projects.vercel.app
```

### 2. Fazer login (piloto ou produção)
```
Ambiente: Piloto ou Produção
CPF: Digite seu CPF
```

### 3. Ir para seção "Preenchimento com OCR"
```
Menu → FormWithOCR → Upload PDF
```

### 4. Carregar PDF
```
Clique em "Selecionar Arquivo"
Escolha o PDF da prestação de contas
```

### 5. Processar com OCR
```
Clique em "Processar com OCR"
Aguarde extração (progresso em %)
```

### 6. Revisar Dados Extraídos
```
Dados aparecem no formulário
Edite o que for necessário
Valide contra o schema
```

### 7. Enviar
```
Clique em "Enviar Prestação de Contas"
Sistema valida contra schema oficial
Se OK, envia para Audesp
```

## Validação Disponível

O sistema valida:

### Campos Obrigatórios
- ✓ Descritor com todos os subcampos
- ✓ Código Ajuste (15-19 dígitos)
- ✓ Todas as seções presentes

### Formato de Dados
- ✓ CPF: XXX.XXX.XXX-XX
- ✓ CNPJ: XX.XXX.XXX/XXXX-XX
- ✓ Datas: DD/MM/AAAA
- ✓ Valores: R$ 1.234,56

### Lógica de Negócio
- ✓ Municipio existe (1-9999)
- ✓ Entidade existe (1-99999)
- ✓ Ano válido (2000+)
- ✓ Mês válido (1-12)

## Limitações Conhecidas

1. **PDFs Scaneados**: Se o PDF é imagem, precisa de melhor OCR
2. **Formatos Variados**: Cada prefeitura tem um formato diferente
3. **Dados Parciais**: Alguns campos podem não estar no PDF
4. **Precisão OCR**: Texto complexo pode ter erros

## Como Melhorar a Detecção

Se a extração não funcionar bem:

1. **Adicione padrões regex** para seu formato específico
2. **Customize mapeamento** de palavras-chave
3. **Refine regras** de detecção de tabelas
4. **Treine com exemplos** reais do seu municipio

## Arquivo de Configuração

Edite `src/services/schemaMapperService.ts`:

```typescript
private regexPatterns = {
  // Adicione seus padrões aqui
  suaSeçao: /seu_padrao_regex/gi,
};

private mapeamento = {
  // Customize suas palavras-chave
  sua_secao: ['palavra1', 'palavra2', 'palavra3'],
};
```

## Próximas Melhorias

- [ ] Suporte a múltiplos formatos de PDF
- [ ] Interface para treinar padrões
- [ ] Cache de extrações anteriores
- [ ] Exportar para Excel/CSV
- [ ] Integração com Audesp API v2
- [ ] Histórico de extrações
- [ ] Recomendações de correção

---

**Versão**: 1.0  
**Sistema**: AUDESP v3.0  
**Schema**: Prestação de Contas v1.9  
**Data**: 20/01/2026
