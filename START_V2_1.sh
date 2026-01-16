#!/bin/bash
# Quick Start Script - AUDESP v2.1

echo "=================================="
echo "🎉 AUDESP v2.1 - QUICK START 🎉"
echo "=================================="
echo ""
echo "Sistema com todas as funcionalidades integradas!"
echo ""
echo "📋 Funcionalidades Disponíveis:"
echo "  ✅ Login Multi-Ambiente (Piloto/Produção)"
echo "  ✅ PDFs com IA (Claude 3.5 Sonnet)"
echo "  ✅ Validação em Tempo Real"
echo "  ✅ 13 APIs Implementadas"
echo "  ✅ Interface Intuitiva com 3 abas"
echo ""
echo "=================================="
echo ""
echo "🚀 INICIANDO SERVIDOR..."
echo ""

# Ensure we're in the right directory
cd /workspaces/audesp || exit

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Start the dev server
echo "🔄 Iniciando npm start..."
echo ""
echo "⏳ Aguarde 30 segundos para o servidor iniciar..."
echo ""

npm start &
PID=$!

sleep 35

echo ""
echo "=================================="
echo "✅ SERVIDOR INICIADO!"
echo "=================================="
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo ""
echo "📝 CREDENCIAIS DE TESTE:"
echo "   Email: afpereira@saude.sp.gov.br"
echo "   Senha: M@dmax2026"
echo "   Ambiente: 🧪 Piloto (padrão)"
echo ""
echo "🎯 O QUE FAZER:"
echo "   1. Abra http://localhost:3000"
echo "   2. Faça login"
echo "   3. Clique em '📄 PDFs (IA)'"
echo "   4. Arraste um PDF"
echo "   5. Veja Claude extrair dados automaticamente"
echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "   • GUIA_USO_V2_1_INTEGRADO.md (Instruções de uso)"
echo "   • AUDESP_V2_1_COMPLETO.md (Detalhes completos)"
echo "   • RESUMO_FINAL_V2_1.md (Resumo executivo)"
echo ""
echo "=================================="
echo "Sistema rodando em background (PID: $PID)"
echo "Pressione Ctrl+C para parar"
echo "=================================="
echo ""

wait $PID
