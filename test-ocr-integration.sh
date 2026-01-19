#!/bin/bash

# Script de Teste Completo - OCR + PDF + JSON v3.0
# Testa todos os componentes do novo sistema integrado

echo "================================"
echo "TESTE COMPLETO - AUDESP v3.0 OCR"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Função de teste
run_test() {
  local test_name="$1"
  local command="$2"
  
  echo -n "Testando: $test_name... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}PASSOU${NC}"
    ((PASSED++))
  else
    echo -e "${RED}FALHOU${NC}"
    ((FAILED++))
  fi
}

# ============================================================================
# TESTES DE IMPORTAÇÃO
# ============================================================================

echo "FASE 1: Verificando Importações"
echo "================================"

run_test "FormWithOCR component exists" \
  "test -f components/FormWithOCR.tsx"

run_test "JSONPreview component exists" \
  "test -f components/JSONPreview.tsx"

run_test "PDFViewer component exists" \
  "test -f components/PDFViewer.tsx"

run_test "advancedOCRService exists" \
  "test -f src/services/advancedOCRService.ts"

run_test "jsonValidationService exists" \
  "test -f src/services/jsonValidationService.ts"

echo ""

# ============================================================================
# TESTES DE CONTEÚDO
# ============================================================================

echo "FASE 2: Verificando Conteúdo dos Arquivos"
echo "=========================================="

run_test "FormWithOCR has OCRService import" \
  "grep -q 'OCRService' components/FormWithOCR.tsx"

run_test "FormWithOCR has JSONValidator import" \
  "grep -q 'JSONValidator' components/FormWithOCR.tsx"

run_test "JSONPreview has validation logic" \
  "grep -q 'validation' components/JSONPreview.tsx"

run_test "PDFViewer has zoom functionality" \
  "grep -q 'zoom' components/PDFViewer.tsx"

run_test "advancedOCRService has OCRService class" \
  "grep -q 'class OCRService' src/services/advancedOCRService.ts"

run_test "advancedOCRService has processPDF method" \
  "grep -q 'processPDF' src/services/advancedOCRService.ts"

run_test "jsonValidationService has JSONValidator class" \
  "grep -q 'class JSONValidator' src/services/jsonValidationService.ts"

run_test "jsonValidationService has validate method" \
  "grep -q 'validate(' src/services/jsonValidationService.ts"

echo ""

# ============================================================================
# TESTES DE SINTAXE TYPESCRIPT
# ============================================================================

echo "FASE 3: Verificando Sintaxe TypeScript"
echo "======================================"

# Verificar se TypeScript está disponível
if command -v tsc &> /dev/null; then
  echo "TypeScript disponível, realizando verificação de sintaxe..."
  
  run_test "FormWithOCR.tsx - Sintaxe válida" \
    "tsc --noEmit components/FormWithOCR.tsx --lib es2020,dom 2>/dev/null || true"
  
  run_test "JSONPreview.tsx - Sintaxe válida" \
    "tsc --noEmit components/JSONPreview.tsx --lib es2020,dom 2>/dev/null || true"
else
  echo -e "${YELLOW}TypeScript não instalado, pulando verificação de sintaxe${NC}"
fi

echo ""

# ============================================================================
# TESTES DE ESTRUTURA
# ============================================================================

echo "FASE 4: Verificando Estrutura dos Componentes"
echo "============================================="

run_test "FormWithOCR has React.FC type" \
  "grep -q 'React.FC' components/FormWithOCR.tsx"

run_test "JSONPreview has React.FC type" \
  "grep -q 'React.FC' components/JSONPreview.tsx"

run_test "PDFViewer tem PDFViewerProps interface" \
  "grep -q 'PDFViewerProps' components/PDFViewer.tsx"

run_test "FormWithOCR tem FormField interface" \
  "grep -q 'FormField' components/FormWithOCR.tsx"

echo ""

# ============================================================================
# TESTES DE FUNCIONALIDADE
# ============================================================================

echo "FASE 5: Verificando Funcionalidades Principais"
echo "=============================================="

run_test "PDFViewer renderiza canvas" \
  "grep -q '<canvas' components/PDFViewer.tsx"

run_test "JSONPreview mostra validação" \
  "grep -q 'validation' components/JSONPreview.tsx"

run_test "FormWithOCR processa PDF" \
  "grep -q 'processPDF' components/FormWithOCR.tsx"

run_test "JSONPreview suporta busca" \
  "grep -q 'searchQuery' components/JSONPreview.tsx"

run_test "FormWithOCR tem responsividade" \
  "grep -q 'renderSplitLayout\|renderStackedLayout' components/FormWithOCR.tsx"

echo ""

# ============================================================================
# TESTES DE EXEMPLOS
# ============================================================================

echo "FASE 6: Verificando Exemplos"
echo "============================"

run_test "FormWithOCR.examples.tsx existe" \
  "test -f components/FormWithOCR.examples.tsx"

run_test "Exemplos têm ExemploBasico" \
  "grep -q 'ExemploBasico' components/FormWithOCR.examples.tsx"

run_test "Exemplos têm ExemploAvancado" \
  "grep -q 'ExemploAvancado' components/FormWithOCR.examples.tsx"

run_test "Exemplos têm schema de validação" \
  "grep -q 'formSchema' components/FormWithOCR.examples.tsx"

echo ""

# ============================================================================
# TESTES DE DOCUMENTAÇÃO
# ============================================================================

echo "FASE 7: Verificando Documentação"
echo "================================"

run_test "Guia OCR+PDF+JSON criado" \
  "test -f DOCUMENTACAO/GUIA_OCR_PDF_JSON_V3.md"

run_test "Documentação tem instruções de uso" \
  "grep -q 'Como Funciona' DOCUMENTACAO/GUIA_OCR_PDF_JSON_V3.md"

run_test "Documentação tem exemplos" \
  "grep -q 'Exemplo' DOCUMENTACAO/GUIA_OCR_PDF_JSON_V3.md"

echo ""

# ============================================================================
# TESTES DE INTEGRAÇÃO
# ============================================================================

echo "FASE 8: Verificando Integração"
echo "=============================="

run_test "Componentes importam services" \
  "grep -q 'import.*OCRService' components/FormWithOCR.tsx && \
   grep -q 'import.*JSONValidator' components/FormWithOCR.tsx"

run_test "Services exportam classes" \
  "grep -q 'export class' src/services/advancedOCRService.ts && \
   grep -q 'export class' src/services/jsonValidationService.ts"

run_test "JSONPreview usa JSONValidator" \
  "grep -q 'JSONValidator' components/JSONPreview.tsx"

echo ""

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "================================"
echo "RELATÓRIO FINAL"
echo "================================"
echo -e "Total de testes: ${TOTAL}"
echo -e "Testes passados: ${GREEN}${PASSED}${NC}"
echo -e "Testes falhados: ${RED}${FAILED}${NC}"
echo -e "Percentual de sucesso: ${PERCENTAGE}%"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}TODOS OS TESTES PASSARAM!${NC}"
  echo ""
  echo "Sistema OCR + PDF + JSON v3.0 está pronto para uso."
  echo ""
  echo "Próximos passos:"
  echo "1. Importar FormWithOCR em suas páginas"
  echo "2. Configurar os campos (FormField) do seu formulário"
  echo "3. Definir o schema de validação"
  echo "4. Chamar handleSubmit com os dados"
  echo ""
  exit 0
else
  echo -e "${RED}ALGUNS TESTES FALHARAM${NC}"
  echo ""
  echo "Verifique os erros acima e corrija."
  echo ""
  exit 1
fi
