#!/bin/bash

# Test Audesp Transmission with x-authorization header (like login does)
# Maybe /f5/ expects x-authorization instead of Bearer token

echo "======================================"
echo "AUDESP TRANSMISSION WITH X-AUTH TEST"
echo "======================================"
echo ""

CPF="22586034805"
PASSWORD="M@dmax2026"

# Create test data
TEST_JSON=$(cat <<'EOF'
{
  "descritor": {
    "orgao": "1234",
    "mes": 1,
    "ano": 2024,
    "entidade": "ENTITY123"
  },
  "periodo": {
    "mesInicio": 1,
    "anoInicio": 2024,
    "mesFim": 1,
    "anoFim": 2024
  },
  "resumo": {
    "total": 1000.00,
    "receitas": [],
    "despesas": []
  }
}
EOF
)

# Create temp file
TEMP_FILE=$(mktemp)
echo "$TEST_JSON" > "$TEMP_FILE"

echo "Testing transmission with X-AUTHORIZATION header (cpf:password format)..."
echo ""

# Try with x-authorization instead of Bearer
RESPONSE=$(curl -s -X POST 'https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio' \
  -H "x-authorization: ${CPF}:${PASSWORD}" \
  -H 'Accept: application/json' \
  -H 'X-User-CPF: 22586034805' \
  -F "documentoJSON=@${TEMP_FILE}" \
  --insecure \
  -w "\n%{http_code}")

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Cleanup
rm -f "$TEMP_FILE"

# Conclusion
echo "======================================"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCCESS: x-authorization header works for transmission!"
    echo "This means /f5/ endpoint expects x-authorization, not Bearer token"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Still 401 with x-authorization - both auth methods fail"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "⚠️  Status 400 - Authentication accepted but data format invalid"
else
    echo "⚠️  Status $HTTP_CODE (unexpected)"
fi
echo "======================================"
