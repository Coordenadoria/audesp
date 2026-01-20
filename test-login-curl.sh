#!/bin/bash

# ============================================
# 🔐 TESTE DE LOGIN AUDESP - CURL
# ============================================
# Use este script para testar suas credenciais
# ANTES de integrar no React

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   🔐 TESTE DE LOGIN AUDESP COM CURL                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ============================================
# CONFIGURAÇÃO - EDITE COM SUAS CREDENCIAIS
# ============================================

EMAIL="usuario@tce.sp.gov.br"  # Trocar com seu email real (ex: seu-email@orgao.sp.gov.br)
SENHA="demo123"                # Trocar com sua senha
AMBIENTE="piloto"                  # piloto ou producao

# Determinar URL baseado no ambiente
if [ "$AMBIENTE" = "producao" ]; then
    BASE_URL="https://audesp.tce.sp.gov.br"
else
    BASE_URL="https://audesp-piloto.tce.sp.gov.br"
fi

# ============================================
# TESTES
# ============================================

echo "📋 Configuração:"
echo "   Email:     $EMAIL"
echo "   Ambiente:  $AMBIENTE"
echo "   Base URL:  $BASE_URL"
echo ""

# Teste 1: Verificar conectividade
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 1: Conectividade com servidor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

echo "Status HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Servidor respondendo"
else
    echo "❌ Erro conectando ao servidor"
    exit 1
fi
echo ""

# Teste 2: Testar login SEM header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 2: Login SEM header x-authorization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"senha\":\"$SENHA\"}")

echo "Resposta:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Teste 3: Testar login COM header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 3: Login COM header x-authorization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "URL: $BASE_URL/login"
echo "Método: POST"
echo "Headers:"
echo "  - Content-Type: application/json"
echo "  - x-authorization: $EMAIL:$SENHA"
echo "Body: {\"email\":\"$EMAIL\",\"senha\":\"$SENHA\"}"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -H "x-authorization: $EMAIL:$SENHA" \
  -d "{\"email\":\"$EMAIL\",\"senha\":\"$SENHA\"}")

echo "Resposta:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Analisar resposta
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ LOGIN REALIZADO COM SUCESSO!"
    echo ""
    echo "Token recebido. Você pode usar este token para:"
    echo "  • Enviar documentos"
    echo "  • Consultar protocolos"
    echo "  • Acessar dashboard"
elif echo "$RESPONSE" | grep -q '"success":false'; then
    echo "❌ FALHA NA AUTENTICAÇÃO"
    echo "Verifique:"
    echo "  1. Email está correto?"
    echo "  2. Senha está correta?"
    echo "  3. Usuário está ativo no AUDESP?"
elif echo "$RESPONSE" | grep -q '"error":"Bad Request"'; then
    echo "❌ HEADER OBRIGATÓRIO FALTANDO"
    echo "Verifique se está enviando: x-authorization: $EMAIL:$SENHA"
elif echo "$RESPONSE" | grep -q '"error":"Forbidden"'; then
    echo "❌ ACESSO NEGADO (403)"
    echo "Possíveis causas:"
    echo "  • Credenciais inválidas"
    echo "  • Usuário sem permissão"
    echo "  • Órgão não está ativo"
else
    echo "⚠️  RESPOSTA DESCONHECIDA"
    echo "Entre em contato com TCE-SP se o erro persistir"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testes concluídos!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Teste 4: Se login funcionou, testar envio de documento
if echo "$RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$RESPONSE" | jq -r '.token' 2>/dev/null)
    
    if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════╗"
        echo "║   ✅ TOKEN VÁLIDO - PRÓXIMOS PASSOS                    ║"
        echo "╚════════════════════════════════════════════════════════╝"
        echo ""
        echo "Seu token de autenticação:"
        echo "$TOKEN" | fold -w 80
        echo ""
        echo "Use em requisições futuras:"
        echo "  Header: Authorization: Bearer $TOKEN"
        echo ""
        echo "Endpoints disponíveis:"
        echo "  • POST /f4/enviar-edital"
        echo "  • POST /f4/enviar-licitacao"
        echo "  • POST /f5/enviar-prestacao-contas"
        echo "  • GET /f4/consulta/{protocolo}"
        echo "  • GET /f5/consulta/{protocolo}"
    fi
fi

echo ""
