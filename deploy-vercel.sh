#!/bin/bash

# Script de Deploy para Vercel
# Uso: ./deploy-vercel.sh

echo "🚀 Iniciando processo de deploy para Vercel..."
echo ""

# 1. Verificar se tem mudanças não commitadas
echo "📋 Verificando status do Git..."
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Há mudanças não commitadas. Faça commit primeiro:"
    echo "   git add ."
    echo "   git commit -m 'mensagem de commit'"
    exit 1
fi

# 2. Verificar se Vercel CLI está instalado
echo "🔍 Verificando Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI não encontrada. Instalando..."
    npm i -g vercel
fi

# 3. Fazer push para repositório remoto
echo "📤 Push para repositório remoto..."
git push origin HEAD

# 4. Iniciar deploy
echo "🚀 Iniciando deploy no Vercel..."
vercel --prod

echo ""
echo "✅ Deploy iniciado!"
echo "📍 Verifique o progresso em: https://vercel.com/dashboard"
