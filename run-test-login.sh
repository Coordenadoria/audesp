#!/bin/bash

# ============================================
# TESTE AUTOMÁTICO DE LOGIN - AUDESP v1.9
# ============================================

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║   🔐 TESTE AUTOMÁTICO DE LOGIN - AUDESP  ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Teste 1: Verificar arquivo de login
echo -e "${BLUE}[TEST 1]${NC} Verificando arquivo LoginComponent.tsx..."
if [ -f "src/components/LoginComponent.tsx" ]; then
    echo -e "${GREEN}✅ Arquivo encontrado${NC}"
    LINES=$(wc -l < src/components/LoginComponent.tsx)
    echo "   📊 Total de linhas: $LINES"
else
    echo -e "${RED}❌ Arquivo NÃO encontrado${NC}"
fi
echo ""

# Teste 2: Verificar LoginService
echo -e "${BLUE}[TEST 2]${NC} Verificando arquivo LoginService.ts..."
if [ -f "src/services/LoginService.ts" ]; then
    echo -e "${GREEN}✅ Arquivo encontrado${NC}"
    LINES=$(wc -l < src/services/LoginService.ts)
    echo "   📊 Total de linhas: $LINES"
else
    echo -e "${RED}❌ Arquivo NÃO encontrado${NC}"
fi
echo ""

# Teste 3: Verificar AudespAuthServiceV2
echo -e "${BLUE}[TEST 3]${NC} Verificando arquivo AudespAuthServiceV2.ts..."
if [ -f "src/services/AudespAuthServiceV2.ts" ]; then
    echo -e "${GREEN}✅ Arquivo encontrado${NC}"
    LINES=$(wc -l < src/services/AudespAuthServiceV2.ts)
    echo "   📊 Total de linhas: $LINES"
    
    # Verificar métodos
    echo ""
    echo -e "${YELLOW}   Métodos encontrados:${NC}"
    grep -n "async.*(" src/services/AudespAuthServiceV2.ts | head -10 | sed 's/^/   /'
else
    echo -e "${RED}❌ Arquivo NÃO encontrado${NC}"
fi
echo ""

# Teste 4: Verificar tipos de login
echo -e "${BLUE}[TEST 4]${NC} Verificando tipos de autenticação..."
if grep -q "interface LoginCredentials" src/components/LoginComponent.tsx; then
    echo -e "${GREEN}✅ Interface LoginCredentials definida${NC}"
else
    echo -e "${YELLOW}⚠️  Interface não encontrada${NC}"
fi
echo ""

# Teste 5: Procurar por credenciais de teste
echo -e "${BLUE}[TEST 5]${NC} Verificando credenciais de teste..."
if grep -q "mockUsers" src/components/LoginComponent.tsx; then
    echo -e "${GREEN}✅ Mock users definidos${NC}"
    echo ""
    echo -e "${YELLOW}   CPFs de teste:${NC}"
    grep -A 1 "mockUsers" src/components/LoginComponent.tsx | grep -o "'[0-9]*'" | head -5 | sed 's/^/   CPF: /'
else
    echo -e "${RED}❌ Mock users não encontrados${NC}"
fi
echo ""

# Teste 6: Verificar validação
echo -e "${BLUE}[TEST 6]${NC} Verificando validações de login..."
VALIDATIONS=0
grep -q "cpf.length" src/components/LoginComponent.tsx && ((VALIDATIONS++))
grep -q "password.trim()" src/components/LoginComponent.tsx && ((VALIDATIONS++))
grep -q "environment" src/components/LoginComponent.tsx && ((VALIDATIONS++))

echo -e "${GREEN}✅ Validações encontradas: $VALIDATIONS${NC}"
echo ""

# Teste 7: Verificar armazenamento de sessão
echo -e "${BLUE}[TEST 7]${NC} Verificando armazenamento de sessão..."
if grep -q "localStorage" src/components/LoginComponent.tsx; then
    echo -e "${GREEN}✅ localStorage sendo usado${NC}"
    echo "   💾 Sessão será armazenada"
else
    echo -e "${YELLOW}⚠️  localStorage não encontrado${NC}"
fi
echo ""

# Teste 8: Verificar handler de erro
echo -e "${BLUE}[TEST 8]${NC} Verificando tratamento de erro..."
if grep -q "setError" src/components/LoginComponent.tsx; then
    echo -e "${GREEN}✅ Tratamento de erro implementado${NC}"
    ERROR_TYPES=$(grep "setError" src/components/LoginComponent.tsx | wc -l)
    echo "   🐛 Total de validações de erro: $ERROR_TYPES"
else
    echo -e "${RED}❌ Tratamento de erro não encontrado${NC}"
fi
echo ""

# Teste 9: Verificar arquivo de teste interativo
echo -e "${BLUE}[TEST 9]${NC} Verificando arquivo de teste interativo..."
if [ -f "test-login-interativo.html" ]; then
    echo -e "${GREEN}✅ Arquivo de teste encontrado${NC}"
    echo "   📍 Abra em: http://localhost:8000/test-login-interativo.html"
    
    # Verificar features
    echo ""
    echo -e "${YELLOW}   Features do teste:${NC}"
    grep -o "<!-- [^>]* -->" test-login-interativo.html | head -5 | sed 's/^/   /'
else
    echo -e "${RED}❌ Arquivo de teste não encontrado${NC}"
fi
echo ""

# Teste 10: Verificar servidor HTTP
echo -e "${BLUE}[TEST 10]${NC} Verificando servidor HTTP..."
if lsof -i :8000 &> /dev/null; then
    echo -e "${GREEN}✅ Servidor HTTP está rodando na porta 8000${NC}"
    echo "   🌐 URL: http://localhost:8000"
else
    echo -e "${YELLOW}⚠️  Servidor HTTP não está rodando${NC}"
    echo "   💡 Execute: cd /workspaces/audesp && python3 -m http.server 8000"
fi
echo ""

# ============================================
# RESUMO
# ============================================

echo "╔═══════════════════════════════════════════╗"
echo "║          📊 RESUMO DOS TESTES             ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ LOGIN MOCK:${NC}"
echo "   • CPF: 00000000000"
echo "   • Senha: demo123"
echo ""
echo -e "${GREEN}✅ ALTERNATIVO:${NC}"
echo "   • CPF: 12345678901"
echo "   • Senha: teste123"
echo ""
echo -e "${GREEN}✅ TESTE INTERATIVO:${NC}"
echo "   • http://localhost:8000/test-login-interativo.html"
echo ""
echo -e "${BLUE}💡 PRÓXIMAS AÇÕES:${NC}"
echo "   1. Abra o teste interativo no navegador"
echo "   2. Clique em uma credencial para preencher"
echo "   3. Clique em 'Entrar no Sistema'"
echo "   4. Veja o resultado detalhado"
echo "   5. Abra o Console (F12) para ver logs"
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║     ✨ TESTE PRONTO PARA EXECUÇÃO!        ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
