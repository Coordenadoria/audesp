# 🧪 Guia de Teste - OCR e PDF Upload

## Status da Implementação

✅ **OCR Service** - Completo e funcional
- Extrai texto de PDFs usando Tesseract.js
- Detecta padrões: CNPJ, CPF, datas, valores monetários
- Calcula confiança da extração (0-100%)
- Mapeia dados para formato do formulário

✅ **GeminiUploader** - Integrado
- Carrega PDFs e documetos
- Chama extractBlockData automaticamente
- Exibe progresso de processamento
- Retorna dados estruturados

✅ **PDFUploader Component** - Disponível
- Upload com validação
- Barra de progresso
- Resumo de dados extraídos
- Callbacks para integração

## Como Testar

### Teste 1: Upload de PDF com CNPJ

1. Vá para a seção de formulário (Dashboard)
2. Procure pelo componente **GeminiUploader** (ícone de upload)
3. Selecione um PDF que contenha:
   - CNPJ (ex: 12.345.678/0001-00)
   - Data (ex: 31/12/2024 ou 2024-12-31)
   - Valor monetário (ex: R$ 1.234.567,89)
   - Nomes ou responsáveis

**Resultado Esperado:**
- Barra de progresso aparecer (0-100%)
- Dados extraídos aparecerem abaixo
- Formulário deve pré-preenchido com dados extraídos

### Teste 2: Validação de Dados Extraídos

O sistema automaticamente detecta:

```
CNPJ    : Padrão 14 dígitos (ex: 12345678000100)
CPF     : Padrão 11 dígitos (ex: 12345678901)
Data    : DD/MM/YYYY ou YYYY-MM-DD
Valor   : R$ X.XXX,XX
Ano     : 4 dígitos
Mês     : Janeiro-Dezembro (força 12 para prestação contas)
Municipio: Código IBGE (35XXXXX para SP)
```

### Teste 3: Verificar Confiança de Extração

A confiança é calculada com base em:
- ✓ CNPJ encontrado
- ✓ Ano detectado
- ✓ Mês detectado
- ✓ CPFs encontrados (multiplos)
- ✓ Datas encontradas (multiplas)
- ✓ Valores monetários detectados

**Confiança = Campos Encontrados / 6**

Exemplo: Se encontrou CNPJ + Ano + Mês + CPFs = 4 campos = **67% confiança**

### Teste 4: Dados Extraídos Aparecem no Formulário

Após extração bem-sucedida, os seguintes campos são pré-preenchidos:

```
Descritor:
  - municipio (código IBGE)
  - entidade (padrão: 1)
  - ano (detectado do PDF)
  - mes (detectado ou forçado para 12)

Dados Gerais:
  - cnpj (extraído)
  - razao_social (se encontrado)

Receitas:
  - repasses_recebidos (valor detectado)

Disponibilidades:
  - saldos.saldo_bancario (valor detectado)
```

## Exemplos de PDFs para Testar

### Exemplo 1: Documento Simples
```
CNPJ: 12.345.678/0001-00
RAZO SOCIAL: PREFEITURA MUNICIPAL DE EXEMPLO
Ano: 2024
Mês: Dezembro
Data: 31/12/2024
Valor: R$ 1.234.567,89
Responsável: João Silva
```

### Exemplo 2: Documento Complexo
```
CNPJ: 12.345.678/0001-00
PRESTAÇÃO DE CONTAS
Exercício: 2024
Data de Emissão: 25/12/2024

CPF RESPONSÁVEL: 123.456.789-01
CPF CONTADOR: 987.654.321-09

RECEITAS:
  Repasses Recebidos: R$ 5.000.000,00
  Receitas Próprias: R$ 1.000.000,00

DISPONIBILIDADES:
  Saldo Bancário: R$ 2.500.000,00
  Caixa: R$ 50.000,00

DESPESAS:
  Pessoal: R$ 3.000.000,00
  Custeio: R$ 1.500.000,00
```

## Troubleshooting

### ❌ "Tipo de documento não suportado"
**Problema:** Tentou fazer upload de arquivo que não é PDF
**Solução:** Converta para PDF usando ferramenta online ou software local

### ❌ "Erro no processamento"
**Problema:** PDF com imagem de baixa qualidade
**Solução:** 
1. Aumente a resolução do PDF
2. Tente outro documento
3. Verifique console do navegador para mais detalhes

### ⚠️ "Confiança baixa (< 50%)"
**Problema:** Poucos campos foram detectados
**Solução:**
1. Certifique-se que PDF contém CNPJ clara
2. Verifique se datas estão no formato DD/MM/YYYY
3. Tente melhorar qualidade do documento

### ⚠️ Dados não aparecem no formulário
**Problema:** Extração funcionou mas formulário não atualizou
**Solução:**
1. Verifique se há callback onDataExtracted configurado
2. Confirme que dados extraídos não são null/undefined
3. Verifique se estrutura do formulário bate com mapExtractedDataToForm()

## Métricas de Sucesso

✅ **Teste Passando Se:**
1. Upload de PDF sem erros
2. Progresso de OCR visível (0-100%)
3. Confiança > 50%
4. Pelo menos 3 campos detectados
5. Dados aparecem no formulário automaticamente
6. Nenhuma página recarrega durante OCR

## Código de Suporte

Importar para suas componentes:

```typescript
import { processPDFFile, mapExtractedDataToForm, extractBlockData } from '../services/ocrService';

// Processar PDF
const extracted = await processPDFFile(file);

// Mapear para formulário
const formData = mapExtractedDataToForm(extracted);

// Usar em componentes
onDataExtracted(formData, extracted.confidence);
```

## Logs de Debug

Para ver logs detalhados no console:
1. Abra DevTools (F12)
2. Vá para tab Console
3. Procure por `[OCR]` - todas as operações estão loggadas
4. Verificar progresso e erros em tempo real

```
[OCR] Iniciando extração de PDF: exemplo.pdf
[OCR] Processando página 1/5...
[OCR] Página 1: 45%
[OCR] CNPJ detectado: 12345678000100
[OCR] CPFs detectados: ['12345678901', '98765432109']
[OCR] Confiança da extração: 67%
```

## Próximos Passos

1. ✅ Testar com PDFs reais de sua instituição
2. 🔄 Ajustar padrões de detecção se necessário
3. 🔄 Integrar com mais seções do formulário
4. 🔄 Adicionar suporte para outros formatos (imagens, Word)
5. 🔄 Implementar fila de processamento para múltiplos PDFs

---

**Status:** Versão 1.0 - Pronto para Teste
**Última Atualização:** 2024
**Suporte:** Veja console DevTools para logs detalhados
