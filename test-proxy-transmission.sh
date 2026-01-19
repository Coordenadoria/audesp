#!/bin/bash

# Test transmission through proxy (like the React app does)
# This tests against localhost proxy instead of direct API

echo "=================================================="
echo "TEST TRANSMISSION THROUGH DEVELOPMENT PROXY"
echo "=================================================="
echo ""

echo "⚠️  NOTE: This requires the dev server running at http://localhost:3000"
echo ""

# Step 1: Login first to get a fresh token
echo "Step 1: Login to get fresh token..."
echo ""

LOGIN_URL="http://localhost:3000/proxy-piloto-login"

LOGIN_RESPONSE=$(curl -s -X POST "$LOGIN_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'x-authorization: 22586034805:M@dmax2026' \
  -H 'User-Agent: Mozilla/5.0' \
  --insecure)

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: Could not extract token from login response"
    exit 1
fi

echo "✅ Token obtained (length: ${#TOKEN})"
echo ""

# Step 2: Transmission through proxy
echo "Step 2: Test transmission through proxy at /proxy-piloto-f5..."
echo ""

TEST_JSON=$(cat <<'EOF'
{
  "descritor": {
    "orgao": "1234",
    "mes": 1,
    "ano": 2024,
    "entidade": "ENTITY123",
    "tipo_documento": "Prestação de Contas de Convênio"
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

TEMP_FILE=$(mktemp)
echo "$TEST_JSON" > "$TEMP_FILE"

TRANSMISSION_URL="http://localhost:3000/proxy-piloto-f5/enviar-prestacao-contas-convenio"

TRANS_RESPONSE=$(curl -s -v -X POST "$TRANSMISSION_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' \
  -H 'X-User-CPF: 22586034805' \
  -F "documentoJSON=@${TEMP_FILE}" \
  --insecure \
  2>&1)

# Extract HTTP code and body
HTTP_CODE=$(echo "$TRANS_RESPONSE" | grep "^< HTTP" | awk '{print $3}')
BODY=$(echo "$TRANS_RESPONSE" | tail -30)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY"
echo ""

# Cleanup
rm -f "$TEMP_FILE"

# Summary
echo "=================================================="
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCCESS: Transmission through proxy works!"
elif [ -z "$HTTP_CODE" ]; then
    echo "⚠️  Could not connect to localhost:3000"
    echo "Make sure the dev server is running: npm start"
else
    echo "❌ HTTP Status: $HTTP_CODE"
fi
echo "=================================================="
