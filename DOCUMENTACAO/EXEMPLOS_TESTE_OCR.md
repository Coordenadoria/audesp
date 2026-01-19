# 🧪 Exemplos de Teste - OCR Integrado no Formulário

## Status: ✅ OCR Integrado em 2 Seções Principais

- ✅ **GeneralDataBlocks** - Seção 21 Declarações
- ✅ **FinanceBlocks** - Contratos e Documentos Fiscais
- 📄 **PDFUploader** - Pronto para usar em qualquer seção

---

## 🎯 Teste 1: Extração de Dados Gerais

### Cenário:
Você tem um PDF com informações de uma entidade que precisa preencher no formulário.

### Arquivo de Teste - `teste_dados_gerais.pdf`
```
═══════════════════════════════════════════════
PREFEITURA MUNICIPAL DE EXEMPLO
═══════════════════════════════════════════════

CNPJ: 12.345.678/0001-00
Razão Social: PREFEITURA MUNICIPAL DE EXEMPLO
Cidade: São Paulo
Exercício: 2024
Período: Dezembro

Responsáveis:
- Diretor: João Silva (CPF: 123.456.789-01)
- Contador: Maria Santos (CPF: 987.654.321-09)
- Gestor: Pedro Costa (CPF: 555.666.777-88)

Data de Elaboração: 31/12/2024
═══════════════════════════════════════════════
```

### Como Testar:

1. **Abra o formulário:**
   - Vá para seção "21. Declarações Obrigatórias"

2. **Procure o upload:**
   - Você verá um card azul com "📄 Pré-preenchimento Automático"
   - Texto: "Carregue um PDF com dados de empresas e responsáveis..."

3. **Faça o upload:**
   - Clique no campo de upload
   - Selecione `teste_dados_gerais.pdf`
   - Aguarde progresso (0-100%)

4. **Verifique os resultados:**
   - Deve aparecer a confiança (ex: 83%)
   - Se bem-sucedido:
     - ✓ CNPJ pré-preenchido
     - ✓ Ano pré-preenchido (2024)
     - ✓ Mês pré-preenchido (12)
     - ✓ CPFs extraídos

5. **Resultado Esperado:**
   ```
   Extraído com 83% confiança!
   
   CNPJ: 12345678000100
   Ano: 2024
   Mês: 12
   CPFs: [12345678901, 98765432109, 55566677788]
   ```

---

## 🎯 Teste 2: Extração de Contratos

### Cenário:
PDF com informações de contratos para pré-preenchimento da seção 6.

### Arquivo de Teste - `teste_contratos.pdf`
```
═══════════════════════════════════════════════
RELAÇÃO DE CONTRATOS - EXERCÍCIO 2024
═══════════════════════════════════════════════

CONTRATO 1
Número: 2024/001
Data Assinatura: 15/03/2024
Vigência: 15/03/2024 a 14/03/2025
Credor: EMPRESA JUNIOR LTDA
CNPJ Credor: 98.765.432/0001-11
Objeto: Fornecimento de água mineral
Valor: R$ 250.000,00

CONTRATO 2
Número: 2024/002
Data Assinatura: 20/05/2024
Vigência: 20/05/2024 a 19/05/2025
Credor: SERVIÇOS GERAIS BRASIL S/A
CNPJ Credor: 11.222.333/0001-44
Objeto: Serviços de limpeza e conservação
Valor: R$ 180.000,00

CONTRATO 3
Número: 2024/003
Data Assinatura: 31/12/2024
Vigência: 31/12/2024 a 30/12/2025
Credor: TECNOLOGIA SOLUTIONS INC
CNPJ Credor: 55.666.777/0001-99
Objeto: Implantação de sistema de gestão
Valor: R$ 500.000,00

═══════════════════════════════════════════════
```

### Como Testar:

1. **Abra o formulário:**
   - Vá para seção "6. Contratos"

2. **Procure o upload:**
   - Card roxo com "📄 Extrair Contratos de PDF"
   - Texto: "Carregue um PDF com dados de contratos..."

3. **Faça o upload:**
   - Selecione `teste_contratos.pdf`
   - Aguarde OCR processar

4. **Resultado Esperado:**
   - ✓ 3 contratos adicionados automaticamente
   - ✓ Números: 2024/001, 2024/002, 2024/003
   - ✓ Valores: 250000, 180000, 500000
   - ✓ Datas preenchidas
   - ✓ Credores com CNPJ

5. **Verá no Console (F12):**
   ```
   ✓ 3 contrato(s) adicionado(s) com 85% confiança
   ```

---

## 🎯 Teste 3: Extração de Documentos Fiscais

### Cenário:
PDF com notas fiscais para seção 7.

### Arquivo de Teste - `teste_notas_fiscais.pdf`
```
═══════════════════════════════════════════════
RELAÇÃO DE NOTAS FISCAIS - 2024
═══════════════════════════════════════════════

NOTA FISCAL 1
Número: NF 000001
Data: 10/01/2024
Emitente: EMPRESA A LTDA
CNPJ: 11.111.111/0001-11
Valor Bruto: R$ 5.000,00

NOTA FISCAL 2
Número: NF 000002
Data: 15/02/2024
Emitente: EMPRESA B EIRELI
CNPJ: 22.222.222/0001-22
Valor Bruto: R$ 8.500,00

NOTA FISCAL 3
Número: NF 000003
Data: 20/03/2024
Emitente: EMPRESA C S/A
CNPJ: 33.333.333/0001-33
Valor Bruto: R$ 12.300,00

═══════════════════════════════════════════════
```

### Como Testar:

1. **Abra seção "7. Documentos Fiscais"**

2. **Procure o upload:**
   - Card cyan com "📄 Extrair Documentos Fiscais de PDF"

3. **Upload:**
   - Selecione `teste_notas_fiscais.pdf`
   - Aguarde processamento

4. **Resultado:**
   - ✓ 3 documentos adicionados
   - ✓ Números: NF 000001, NF 000002, NF 000003
   - ✓ Valores: 5000, 8500, 12300
   - ✓ Datas: 2024-01-10, 2024-02-15, 2024-03-20
   - ✓ Credores com CNPJ

5. **Console Output:**
   ```
   ✓ 3 documento(s) fiscal(is) adicionado(s)
   ```

---

## 📊 Métricas de Sucesso

Para cada teste, você deve ver:

| Métrica | Esperado | Status |
|---------|----------|--------|
| Progresso OCR | 0-100% visível | ✅ Deve aparecer |
| Confiança | > 50% | ✅ Deve mostrar % |
| Itens adicionados | > 0 | ✅ Deve preencher |
| Console log | `✓` mensagem | ✅ F12 mostrar |
| Sem erros | 0 errors | ✅ Console limpo |
| Campos preenchidos | Auto-preenchidos | ✅ Valores corretos |

---

## 🐛 Troubleshooting

### ❌ "Tipo de documento não suportado"
- **Causa:** Arquivo não é PDF
- **Solução:** Converta para PDF antes de fazer upload

### ❌ "Erro no processamento"
- **Causa:** PDF com texto pixelado/imagem
- **Solução:** Use PDF com texto selecionável

### ⚠️ "Confiança muito baixa (< 30%)"
- **Causa:** Poucos padrões detectados
- **Solução:** Adicione mais informações ao PDF (CNPJ, datas, valores)

### ⚠️ "Nenhum item adicionado"
- **Causa:** Dados extraídos mas estrutura diferente
- **Solução:** Verifique console para ver o que foi extraído

### 🔍 "Preciso ver logs de debug"
- **Como fazer:**
  1. Abra DevTools (F12)
  2. Vá para tab **Console**
  3. Procure por logs `[OCR]`
  4. Veja progresso e dados em tempo real

---

## 🎓 Exemplos de Logs Esperados

### Sucesso:
```
[OCR] Iniciando extração de PDF: teste_contratos.pdf
[OCR] Processando página 1/1...
[OCR] Página 1: 100%
[OCR] CNPJ detectado: 98765432000111
[OCR] CPFs detectados: (1) ['12345678901']
[OCR] Datas detectadas: (3) ['2024-03-15', '2024-05-20', '2024-12-31']
[OCR] Valores detectados: [250000, 180000, 500000]
[OCR] Confiança da extração: 85%
✓ 3 contrato(s) adicionado(s) com 85% confiança
```

### Com Aviso:
```
[OCR] Confiança baixa: 40%
⚠️ Apenas alguns campos foram detectados
Revisar dados manualmente antes de transmitir
```

---

## 📋 Checklist de Integração

### Geral
- [x] PDFUploader importado
- [x] mapExtractedDataToForm importado
- [x] Callbacks configurados
- [x] Erro handling presente

### GeneralDataBlocks
- [x] Upload na seção 21
- [x] Feedback visual (card azul)
- [x] Dados mapeados para `descritor` e `dados_gerais`

### FinanceBlocks
- [x] Upload em Contratos (card roxo)
- [x] Upload em Docs Fiscais (card cyan)
- [x] Dados adicionados com `onAdd()`
- [x] Feedback de quantidade

### Faltando (opcional)
- [ ] HRBlocks com extração de CPFs
- [ ] ActivityReportsBlock
- [ ] Outras seções conforme necessário

---

## 🚀 Próximos Passos

1. **Teste com seus PDFs:**
   - Use PDFs reais da instituição
   - Verifique acurácia da extração
   - Ajuste padrões se necessário

2. **Integre em mais seções:**
   - Copie padrão de GeneralDataBlocks
   - Adicione para cada seção importante
   - Teste incrementalmente

3. **Otimize:**
   - Ajuste regex patterns em `detectPatterns()`
   - Melhore feedback para usuário
   - Considere web workers para performance

4. **Deploy:**
   - Commit com integrações
   - Push para Vercel
   - Teste em produção

---

## 📞 Suporte

**Alguma coisa não funcionou?**

1. Verifique console (F12 → Console)
2. Procure por `[OCR]` logs
3. Veja se há erros vermelhos
4. Leia QUICK_START_OCR.md
5. Consulte CHECKLIST_INTEGRACAO_OCR.md

---

## ✨ Pronto para Começar!

**Você pode agora:**
- ✅ Fazer upload de PDFs
- ✅ Extrair dados automaticamente
- ✅ Pré-preencher formulário
- ✅ Aumentar produtividade
- ✅ Reduzir erros de digitação

---

**Versão:** 1.0
**Status:** Testado e Funcionando
**Última Atualização:** 2024
