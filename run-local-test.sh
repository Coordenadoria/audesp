#!/bin/bash
# Script para testar AUDESP v3 localmente

echo "🚀 AUDESP v3 - LOCAL TEST SETUP"
echo "================================="
echo ""

# Verificar se Node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"
echo ""

# Criar .env.local se não existir
if [ ! -f ".env.local" ]; then
    echo "📝 Criando .env.local..."
    cat > .env.local << 'EOF'
REACT_APP_AUDESP_URL=https://sistemas.tce.sp.gov.br/audesp/api
EOF
    echo "✅ .env.local criado"
else
    echo "✅ .env.local já existe"
fi

echo ""
echo "📦 Instalando dependências..."
npm install > /dev/null 2>&1

echo ""
echo "🔨 Build do projeto..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido"
else
    echo "❌ Build falhou"
    exit 1
fi

echo ""
echo "🌐 Iniciando servidor local..."
echo "================================="
echo ""
echo "📍 Acesse: http://localhost:3000"
echo ""
echo "🔐 LOGIN:"
echo "  Email: [suas credenciais reais]"
echo "  Senha: [suas credenciais reais]"
echo ""
echo "🔍 DEBUG:"
echo "  Pressione F12 para abrir console"
echo "  Procure por 'INICIANDO LOGIN COM AUDESP'"
echo "  Copie todos os logs"
echo ""
echo "⏹️  Para parar: Pressione Ctrl+C"
echo "================================="
echo ""

npm start
