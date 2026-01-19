#!/bin/bash

# Test Audesp API Authentication
# This script tests the token authentication against the actual endpoint

echo "======================================"
echo "AUDESP TOKEN AUTHENTICATION TEST"
echo "======================================"
echo ""

# Test 1: Login and get token
echo "1️⃣  Testing login endpoint..."
echo ""

LOGIN_RESPONSE=$(curl -s -X POST 'https://audesp-piloto.tce.sp.gov.br/login' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'x-authorization: 22586034805:M@dmax2026' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)' \
  -H 'Origin: https://audesp-piloto.tce.sp.gov.br' \
  -H 'Referer: https://audesp-piloto.tce.sp.gov.br/' \
  --insecure)

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // .token // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: Could not extract token from response"
    exit 1
fi

echo "✅ Token extracted (first 30 chars): ${TOKEN:0:30}..."
echo ""

# Test 2: Try transmission with the token
echo "2️⃣  Testing transmission endpoint..."
echo ""

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

# Create temp file for transmission
TEMP_FILE=$(mktemp)
echo "$TEST_JSON" > "$TEMP_FILE"

# Send request
TRANS_RESPONSE=$(curl -s -X POST 'https://audesp-piloto.tce.sp.gov.br/f5/enviar-prestacao-contas-convenio' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' \
  -H 'X-User-CPF: 22586034805' \
  -F "documentoJSON=@${TEMP_FILE}" \
  --insecure \
  -w "\n%{http_code}")

# Parse response
HTTP_CODE=$(echo "$TRANS_RESPONSE" | tail -1)
BODY=$(echo "$TRANS_RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Cleanup
rm -f "$TEMP_FILE"

# Conclusion
echo "======================================"
if [ "$HTTP_CODE" = "401" ]; then
    echo "❌ RESULT: 401 Unauthorized - Token is not valid for transmission endpoint"
    echo ""
    echo "Debugging info:"
    echo "- Token format: Bearer $TOKEN (first 50 chars)"
    echo "- Token length: ${#TOKEN}"
    echo ""
    echo "Possible causes:"
    echo "1. Token is expired"
    echo "2. Token format from login response is incorrect"
    echo "3. Endpoint requires different authentication method"
    echo "4. Token is not active for transmission operations"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ RESULT: Authentication successful!"
else
    echo "⚠️  RESULT: Status $HTTP_CODE (unexpected)"
fi
echo "======================================"
