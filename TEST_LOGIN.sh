#!/bin/bash

###############################################################################
# TESTE COMPLETO DE LOGIN AUDESP
# Este script testa o fluxo de autenticação local
###############################################################################

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║          🔐 TESTE DE LOGIN - AUDESP PILOTO                       ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
LOCALHOST_URL="http://localhost:3000"
PROXY_LOGIN="/proxy-piloto-login/login"
TEST_EMAIL="afpereira@saude.sp.gov.br"
TEST_PASSWORD="M@dmax2026"
MAX_RETRIES=30
RETRY_DELAY=2

# ============================================================================
# FUNÇÕES
# ============================================================================

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ============================================================================
# PASSO 1: VERIFICAR SE O SERVIDOR ESTÁ RODANDO
# ============================================================================

print_step "Verificando se o servidor está rodando em $LOCALHOST_URL..."

RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOCALHOST_URL" 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
        print_success "Servidor está rodando (HTTP 200)"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            print_warning "Aguardando servidor... (tentativa $RETRY_COUNT/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    fi
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    print_error "Servidor não respondeu após $MAX_RETRIES tentativas!"
    echo ""
    echo "📋 INSTRUÇÕES:"
    echo "1. Em outro terminal, execute: cd /workspaces/audesp && npm start"
    echo "2. Aguarde a compilação (cerca de 1-2 minutos)"
    echo "3. Execute este script novamente"
    exit 1
fi

echo ""

# ============================================================================
# PASSO 2: TESTAR O PROXY DE LOGIN
# ============================================================================

print_step "Testando proxy de login..."

LOGIN_RESPONSE=$(curl -s -X POST "${LOCALHOST_URL}${PROXY_LOGIN}" \
  -H "Content-Type: application/json" \
  -H "x-authorization: ${TEST_EMAIL}:${TEST_PASSWORD}" \
  -d '{}' \
  -w "\n%{http_code}" 2>&1)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

echo "   Status HTTP: $HTTP_CODE"
echo "   Resposta (primeiros 150 chars):"
echo "   ${RESPONSE_BODY:0:150}"
echo ""

case $HTTP_CODE in
    200)
        print_success "Login bem-sucedido! Token foi gerado."
        
        # Tentar extrair o token
        TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 || echo "não encontrado")
        if [ "$TOKEN" != "não encontrado" ]; then
            print_success "Token extraído: ${TOKEN:0:30}..."
        else
            TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "não encontrado")
            if [ "$TOKEN" != "não encontrado" ]; then
                print_success "Token extraído: ${TOKEN:0:30}..."
            fi
        fi
        ;;
    401)
        print_warning "Credenciais inválidas (HTTP 401)"
        echo "   Possível causa:"
        echo "   - Usuário/senha incorretos"
        echo "   - Usuário sem permissão no ambiente piloto"
        echo "   - Servidor Audesp offline"
        ;;
    403)
        print_warning "Acesso proibido (HTTP 403)"
        echo "   Possível causa:"
        echo "   - Usuário sem permissão"
        echo "   - IP bloqueado"
        ;;
    404)
        print_error "Endpoint não encontrado (HTTP 404)"
        echo "   Possível causa:"
        echo "   - Proxy não está configurado corretamente"
        echo "   - Caminho do proxy está errado"
        ;;
    503)
        print_error "Serviço indisponível (HTTP 503)"
        echo "   Possível causa:"
        echo "   - Servidor Audesp Piloto offline"
        echo "   - Erro de conexão com o proxy"
        ;;
    *)
        print_error "Erro desconhecido (HTTP $HTTP_CODE)"
        echo "   Resposta completa:"
        echo "   $RESPONSE_BODY"
        ;;
esac

echo ""

# ============================================================================
# PASSO 3: TESTAR A INTERFACE WEB
# ============================================================================

print_step "Testando a interface web..."

HOME_PAGE=$(curl -s "$LOCALHOST_URL" | head -20)

if echo "$HOME_PAGE" | grep -q "Audesp"; then
    print_success "Interface web está respondendo corretamente"
else
    print_warning "Interface web respondeu mas pode ter problemas"
fi

echo ""

# ============================================================================
# RESUMO
# ============================================================================

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                      📊 RESUMO DO TESTE                          ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔍 Resultados:"
echo "   • Servidor: ✅ Rodando"
echo "   • Proxy: $([ "$HTTP_CODE" = "200" ] && echo "✅ Funcionando" || echo "⚠️  Status: HTTP $HTTP_CODE")"
echo "   • Login: $([ "$HTTP_CODE" = "200" ] && echo "✅ Bem-sucedido" || echo "❌ Falhou")"
echo ""

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "401" ] && [ "$HTTP_CODE" != "403" ]; then
    echo "❌ PROBLEMA DETECTADO:"
    echo ""
    echo "Próximos passos:"
    echo "1. Verifique se o servidor npm está rodando:"
    echo "   $ ps aux | grep 'npm start'"
    echo ""
    echo "2. Se não estiver, inicie com:"
    echo "   $ cd /workspaces/audesp && npm start"
    echo ""
    echo "3. Aguarde a compilação completa (webpack compiled successfully)"
    echo ""
    echo "4. Execute este teste novamente"
fi

echo ""
echo "📚 Próximos passos:"
if [ "$HTTP_CODE" = "200" ]; then
    echo "1. Acesse http://localhost:3000"
    echo "2. Use as credenciais: $TEST_EMAIL / $TEST_PASSWORD"
    echo "3. Clique em 'Acessar Ambiente Piloto'"
    echo "4. O formulário deve carregar"
else
    echo "1. Verifique se o servidor AUDESP Piloto está online"
    echo "2. Verifique se as credenciais estão corretas"
    echo "3. Verifique se o proxy está configurado corretamente"
fi

echo ""
echo "✅ Teste concluído!"
echo ""
