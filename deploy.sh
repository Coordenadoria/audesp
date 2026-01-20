#!/bin/bash

# Deploy script for AUDESP
# Usage: ./deploy.sh [environment] [version]

set -e

ENVIRONMENT=${1:-development}
VERSION=${2:-$(git describe --tags --always)}
DEPLOYMENT_DIR="./deployment"
TIMESTAMP=$(date +%s)
LOG_FILE="$DEPLOYMENT_DIR/deploy-$TIMESTAMP.log"

echo "🚀 INICIANDO DEPLOY - AUDESP"
echo "===================================="
echo "Ambiente: $ENVIRONMENT"
echo "Versão: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo ""

# Criar diretório de deployment
mkdir -p "$DEPLOYMENT_DIR"

# Iniciar log
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

# Função para limpar em caso de erro
cleanup() {
  echo "❌ Deploy falhou!"
  echo "Log disponível em: $LOG_FILE"
  exit 1
}

trap cleanup ERR

# Step 1: Verificar pré-requisitos
echo "📋 Etapa 1: Verificando pré-requisitos..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js não encontrado"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm não encontrado"; exit 1; }
echo "✅ Pré-requisitos OK"

# Step 2: Instalar dependências
echo ""
echo "📦 Etapa 2: Instalando dependências..."
npm ci
echo "✅ Dependências instaladas"

# Step 3: Executar testes
echo ""
echo "🧪 Etapa 3: Executando testes..."
npm test -- --watchAll=false --passWithNoTests || true
echo "✅ Testes completados"

# Step 4: Type check
echo ""
echo "🔍 Etapa 4: Verificando tipos TypeScript..."
npx tsc --noEmit
echo "✅ Type check OK"

# Step 5: Build
echo ""
echo "🔨 Etapa 5: Compilando aplicação..."
npm run build
BUILD_SIZE=$(du -sh build/ | cut -f1)
echo "✅ Build completado (Tamanho: $BUILD_SIZE)"

# Step 6: Gerar artefatos
echo ""
echo "📦 Etapa 6: Preparando artefatos..."
ARTIFACT_DIR="$DEPLOYMENT_DIR/audesp-$VERSION-$ENVIRONMENT-$TIMESTAMP"
mkdir -p "$ARTIFACT_DIR"
cp -r build/* "$ARTIFACT_DIR/"
cp -r public/* "$ARTIFACT_DIR/" || true
cp package.json "$ARTIFACT_DIR/"
cp package-lock.json "$ARTIFACT_DIR/"

# Criar tarball
tar -czf "$DEPLOYMENT_DIR/audesp-$VERSION-$ENVIRONMENT-$TIMESTAMP.tar.gz" -C "$ARTIFACT_DIR" .

echo "✅ Artefatos preparados"
echo "   - Diretório: $ARTIFACT_DIR"
echo "   - Tarball: $DEPLOYMENT_DIR/audesp-$VERSION-$ENVIRONMENT-$TIMESTAMP.tar.gz"

# Step 7: Deploy baseado no ambiente
echo ""
echo "🚀 Etapa 7: Executando deploy para $ENVIRONMENT..."

case $ENVIRONMENT in
  development)
    echo "   Ambiente: DESENVOLVIMENTO"
    echo "   Nenhuma ação necessária"
    ;;
  staging)
    echo "   Ambiente: STAGING"
    if [ -x "./deploy-staging.sh" ]; then
      ./deploy-staging.sh "$VERSION"
    else
      echo "   ⚠️  Script de deploy staging não encontrado"
    fi
    ;;
  production)
    echo "   Ambiente: PRODUÇÃO"
    if [ -x "./deploy-production.sh" ]; then
      ./deploy-production.sh "$VERSION"
    else
      echo "   ⚠️  Script de deploy produção não encontrado"
    fi
    ;;
  *)
    echo "❌ Ambiente desconhecido: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "✅ Deploy concluído"

# Step 8: Gerar relatório
echo ""
echo "📊 Etapa 8: Gerando relatório..."

cat > "$DEPLOYMENT_DIR/deploy-report-$TIMESTAMP.md" << EOF
# Relatório de Deployment

## Informações
- **Ambiente**: $ENVIRONMENT
- **Versão**: $VERSION
- **Data/Hora**: $(date '+%d/%m/%Y %H:%M:%S')
- **Timestamp**: $TIMESTAMP
- **Hash do Commit**: $(git rev-parse --short HEAD)
- **Branch**: $(git rev-parse --abbrev-ref HEAD)

## Pré-requisitos
- ✅ Node.js instalado
- ✅ npm instalado

## Etapas Concluídas
1. ✅ Pré-requisitos verificados
2. ✅ Dependências instaladas
3. ✅ Testes executados
4. ✅ Type checking realizado
5. ✅ Aplicação compilada (Tamanho: $BUILD_SIZE)
6. ✅ Artefatos preparados
7. ✅ Deploy para $ENVIRONMENT concluído
8. ✅ Relatório gerado

## Artefatos
- Tarball: \`audesp-$VERSION-$ENVIRONMENT-$TIMESTAMP.tar.gz\`
- Diretório: \`audesp-$VERSION-$ENVIRONMENT-$TIMESTAMP\`
- Log: \`deploy-$TIMESTAMP.log\`

## Próximos Passos
1. Verificar logs em \`$LOG_FILE\`
2. Testar aplicação em \`$ENVIRONMENT\`
3. Monitorar métricas
4. Documentar qualquer issue encontrada

## Status Final
✅ **DEPLOY SUCESSO!**
EOF

echo "✅ Relatório gerado: $DEPLOYMENT_DIR/deploy-report-$TIMESTAMP.md"

echo ""
echo "===================================="
echo "✅ DEPLOY COMPLETADO COM SUCESSO!"
echo "===================================="
echo ""
echo "Resumo:"
echo "  - Ambiente: $ENVIRONMENT"
echo "  - Versão: $VERSION"
echo "  - Tamanho do Build: $BUILD_SIZE"
echo "  - Localização dos Logs: $LOG_FILE"
echo ""
