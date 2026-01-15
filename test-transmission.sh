#!/bin/bash

# Script para testar fluxo completo de Login + Transmissão via Localhost

echo "🔄 TESTE COMPLETO: LOGIN + TRANSMISSÃO"
echo "======================================="
echo ""

# 1. Teste de conectividade ao servidor localhost
echo "1️⃣  Testando conectividade ao servidor localhost..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$STATUS" = "200" ]; then
    echo "   ✅ Servidor localhost:3000 respondendo (HTTP $STATUS)"
else
    echo "   ❌ Servidor localhost:3000 NÃO respondendo (HTTP $STATUS)"
    echo "   Execute: npm start"
    exit 1
fi
echo ""

# 2. Teste de proxy login
echo "2️⃣  Testando proxy /proxy-login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/proxy-login/login \
  -H "Content-Type: application/json" \
  -H "x-authorization: teste@email.com:senha123" \
  -d '{}' \
  -w "\n%{http_code}")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

echo "   Status: HTTP $LOGIN_STATUS"
echo "   Resposta: $(echo "$LOGIN_BODY" | head -c 100)..."

if [ "$LOGIN_STATUS" = "403" ] || [ "$LOGIN_STATUS" = "401" ]; then
    echo "   ✅ Proxy /proxy-login funcionando (credenciais inválidas = esperado)"
else
    echo "   ❌ Problema no proxy /proxy-login"
fi
echo ""

# 3. Teste de proxy transmissão
echo "3️⃣  Testando proxy /proxy-f5..."
cat > /tmp/test-payload.json << 'PAYLOAD'
{
  "descritor": {
    "tipo_documento": "Prestação de Contas de Convênio",
    "entidade": "TEST-ENTITY",
    "mes": 1,
    "ano": 2026
  }
}
PAYLOAD

TRANS_RESPONSE=$(curl -s -X POST http://localhost:3000/proxy-f5/enviar-prestacao-contas-convenio \
  -H "Authorization: Bearer invalid-token" \
  -F "documentoJSON=@/tmp/test-payload.json" \
  -w "\n%{http_code}")

TRANS_STATUS=$(echo "$TRANS_RESPONSE" | tail -1)
TRANS_BODY=$(echo "$TRANS_RESPONSE" | head -n -1)

echo "   Status: HTTP $TRANS_STATUS"
echo "   Resposta: $(echo "$TRANS_BODY" | head -c 100)..."

if [ "$TRANS_STATUS" = "401" ] || [ "$TRANS_STATUS" = "400" ]; then
    echo "   ✅ Proxy /proxy-f5 funcionando"
else
    echo "   ❌ Problema no proxy /proxy-f5"
fi
echo ""

# 4. Verificar se HPM está reescrevendo
echo "4️⃣  Verificando reescrita de caminhos no proxy (HPM)..."
echo "   Se ver '[HPM] Rewriting path' nos testes acima = ✅"
echo ""

# 5. Teste direto via HTTPS em produção
echo "5️⃣  Testando acesso direto à API Piloto (sem proxy)..."
DIRECT_RESPONSE=$(curl -s -X POST https://audesp-piloto.tce.sp.gov.br/login \
  -H "Content-Type: application/json" \
  -H "x-authorization: teste@email.com:senha123" \
  -d '{}' \
  -w "\n%{http_code}")

DIRECT_STATUS=$(echo "$DIRECT_RESPONSE" | tail -1)
echo "   Status: HTTP $DIRECT_STATUS"

if [ "$DIRECT_STATUS" = "403" ] || [ "$DIRECT_STATUS" = "200" ]; then
    echo "   ✅ API Piloto acessível"
else
    echo "   ⚠️  API Piloto pode estar indisponível (HTTP $DIRECT_STATUS)"
fi
echo ""

# Resumo
echo "📋 RESUMO"
echo "========="
echo "✅ Localhost:3000 = $([ "$STATUS" = "200" ] && echo "OK" || echo "ERRO")"
echo "✅ Proxy Login = $([ "$LOGIN_STATUS" = "403" ] || [ "$LOGIN_STATUS" = "401" ] && echo "OK" || echo "ERRO")"
echo "✅ Proxy Transmissão = $([ "$TRANS_STATUS" = "401" ] || [ "$TRANS_STATUS" = "400" ] && echo "OK" || echo "ERRO")"
echo "✅ API Piloto Direta = $([ "$DIRECT_STATUS" = "403" ] && echo "OK" || echo "AVISO")"
echo ""
echo "🎯 Se todos estiverem OK, o problema está na aplicação React"
echo "   Verifique: Console do navegador (F12) > Console > Erros"
