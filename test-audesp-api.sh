#!/bin/bash

# Script de Teste - Sistema AUDESP v3.0
# Testa todos os endpoints implementados

set -e

BASE_URL="https://sistemas.tce.sp.gov.br/audesp/api"
EMAIL="usuario@teste.sp.gov.br"
SENHA="teste123"

echo "=========================================="
echo "🏛️  TESTE DO SISTEMA AUDESP V3.0"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. LOGIN
echo -e "${YELLOW}1. Testando Autenticação...${NC}"
echo "POST $BASE_URL/login"

AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "x-authorization: $EMAIL:$SENHA" \
  -H "Content-Type: application/json")

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token' 2>/dev/null || echo "")
EXPIRE_IN=$(echo $AUTH_RESPONSE | jq -r '.expire_in' 2>/dev/null || echo "")

if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Autenticação bem-sucedida${NC}"
  echo "   Token: ${TOKEN:0:20}..."
  echo "   Expira em: $EXPIRE_IN segundos"
else
  echo -e "${RED}❌ Falha na autenticação${NC}"
  echo "   Resposta: $AUTH_RESPONSE"
  exit 1
fi

echo ""

# 2. ENVIAR EDITAL (Fase IV)
echo -e "${YELLOW}2. Testando Envio de Edital (Fase IV)...${NC}"
echo "POST $BASE_URL/recepcao-fase-4/f4/enviar-edital"

EDITAL_JSON=$(cat <<'EOF'
{
  "numero_edital": "001/2024",
  "titulo": "Aquisição de Equipamentos",
  "objeto": "Adquirir computadores para a prefeitura",
  "data_publicacao": "2024-01-10",
  "numero_siconv": "123456"
}
EOF
)

EDITAL_RESPONSE=$(curl -s -X POST "$BASE_URL/recepcao-fase-4/f4/enviar-edital" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EDITAL_JSON")

PROTOCOLO=$(echo $EDITAL_RESPONSE | jq -r '.protocolo' 2>/dev/null || echo "")

if [ ! -z "$PROTOCOLO" ] && [ "$PROTOCOLO" != "null" ]; then
  echo -e "${GREEN}✅ Edital enviado com sucesso${NC}"
  echo "   Protocolo: $PROTOCOLO"
  EDITAL_PROTOCOLO=$PROTOCOLO
else
  echo -e "${YELLOW}⚠️  Aviso (pode ser erro esperado em ambiente de teste)${NC}"
  echo "   Resposta: $EDITAL_RESPONSE"
fi

echo ""

# 3. ENVIAR LICITAÇÃO (Fase IV)
echo -e "${YELLOW}3. Testando Envio de Licitação (Fase IV)...${NC}"
echo "POST $BASE_URL/recepcao-fase-4/f4/enviar-licitacao"

LICITACAO_JSON=$(cat <<'EOF'
{
  "numero_licitacao": "001/2024",
  "tipo": "Pregão",
  "valor_estimado": 100000.00,
  "numero_siconv": "123456"
}
EOF
)

LICITACAO_RESPONSE=$(curl -s -X POST "$BASE_URL/recepcao-fase-4/f4/enviar-licitacao" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$LICITACAO_JSON")

echo "   Resposta: $LICITACAO_RESPONSE"

echo ""

# 4. ENVIAR PRESTAÇÃO (Fase V)
echo -e "${YELLOW}4. Testando Envio de Prestação de Contas (Fase V)...${NC}"
echo "POST $BASE_URL/f5/enviar-prestacao-contas-convenio"

PRESTACAO_JSON=$(cat <<'EOF'
{
  "descricao": {
    "numero_siconv": "123456",
    "modalidade": "Convênio",
    "instrumento_juridico": "Decreto 123/2024"
  },
  "entidade_beneficiaria": {
    "razao_social": "Prefeitura de Teste",
    "cnpj": "12345678000195",
    "tipo_entidade": "Prefeitura"
  },
  "vigencia": {
    "data_inicio": "2024-01-01",
    "data_fim": "2024-12-31"
  },
  "responsaveis": [
    {
      "nome": "João Silva",
      "cpf": "12345678901",
      "cargo": "Prefeito",
      "funcao": "Presidente"
    }
  ]
}
EOF
)

PRESTACAO_RESPONSE=$(curl -s -X POST "$BASE_URL/f5/enviar-prestacao-contas-convenio" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PRESTACAO_JSON")

PROTOCOLO_PRESTACAO=$(echo $PRESTACAO_RESPONSE | jq -r '.protocolo' 2>/dev/null || echo "")

if [ ! -z "$PROTOCOLO_PRESTACAO" ] && [ "$PROTOCOLO_PRESTACAO" != "null" ]; then
  echo -e "${GREEN}✅ Prestação enviada com sucesso${NC}"
  echo "   Protocolo: $PROTOCOLO_PRESTACAO"
else
  echo -e "${YELLOW}⚠️  Aviso (pode ser erro esperado em ambiente de teste)${NC}"
  echo "   Resposta: $PRESTACAO_RESPONSE"
fi

echo ""

# 5. CONSULTAR PROTOCOLO (Fase IV)
if [ ! -z "$EDITAL_PROTOCOLO" ] && [ "$EDITAL_PROTOCOLO" != "null" ]; then
  echo -e "${YELLOW}5. Testando Consulta de Protocolo (Fase IV)...${NC}"
  echo "GET $BASE_URL/f4/consulta/$EDITAL_PROTOCOLO"

  CONSULTA_RESPONSE=$(curl -s -X GET "$BASE_URL/f4/consulta/$EDITAL_PROTOCOLO" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

  STATUS=$(echo $CONSULTA_RESPONSE | jq -r '.status' 2>/dev/null || echo "")
  echo "   Status: $STATUS"
  echo "   Resposta: $CONSULTA_RESPONSE"
else
  echo -e "${YELLOW}5. Pulando consulta de protocolo (Fase IV)${NC}"
fi

echo ""

# 6. CONSULTAR PROTOCOLO (Fase V)
if [ ! -z "$PROTOCOLO_PRESTACAO" ] && [ "$PROTOCOLO_PRESTACAO" != "null" ]; then
  echo -e "${YELLOW}6. Testando Consulta de Protocolo (Fase V)...${NC}"
  echo "GET $BASE_URL/f5/consulta/$PROTOCOLO_PRESTACAO"

  CONSULTA_RESPONSE=$(curl -s -X GET "$BASE_URL/f5/consulta/$PROTOCOLO_PRESTACAO" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

  STATUS=$(echo $CONSULTA_RESPONSE | jq -r '.status' 2>/dev/null || echo "")
  echo "   Status: $STATUS"
  echo "   Resposta: $CONSULTA_RESPONSE"
else
  echo -e "${YELLOW}6. Pulando consulta de protocolo (Fase V)${NC}"
fi

echo ""

# 7. RESUMO
echo "=========================================="
echo -e "${GREEN}✅ TESTES CONCLUÍDOS${NC}"
echo "=========================================="
echo ""
echo "Resumo:"
echo "  ✅ Autenticação: OK"
echo "  ⚠️  Edital: Enviado (conferir resposta)"
echo "  ⚠️  Licitação: Enviado (conferir resposta)"
echo "  ⚠️  Prestação: Enviado (conferir resposta)"
echo ""
echo "Notas:"
echo "  - Este script testa a conectividade e formato das requisições"
echo "  - Respostas reais dependem do servidor AUDESP"
echo "  - Em produção, usar autenticação real do TCE-SP"
echo ""

