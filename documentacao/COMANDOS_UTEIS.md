# Comandos Úteis - AUDESP v3.0 OCR

## Instalação de Dependências

```bash
# Instalar Tesseract.js e PDF.js
npm install tesseract.js pdfjs-dist

# Verificar instalação
npm list tesseract.js pdfjs-dist
```

## Testes

```bash
# Rodar suite de testes automatizados
bash test-ocr-integration.sh

# Rodar testes com filtro específico
grep "Testando: " test-ocr-integration.sh | head -5
```

## Build e Desenvolvimento

```bash
# Build do projeto
npm run build

# Modo desenvolvimento com watch
npm run dev

# Preview do build
npm run preview

# Checar tipos TypeScript
tsc --noEmit
```

## Debugging

```bash
# Habilitar logs de OCR
localStorage.setItem('DEBUG_OCR', 'true');

# Habilitar logs de validação
localStorage.setItem('DEBUG_VALIDATION', 'true');

# Desabilitar logs
localStorage.removeItem('DEBUG_OCR');
localStorage.removeItem('DEBUG_VALIDATION');
```

## Verificação de Arquivos

```bash
# Listar arquivos criados
ls -lh components/FormWithOCR* components/JSONPreview.tsx
ls -lh src/services/advancedOCRService.ts src/services/jsonValidationService.ts

# Contar linhas de código
wc -l components/FormWithOCR.tsx components/JSONPreview.tsx
wc -l src/services/*.ts

# Total de linhas
find . -name "FormWithOCR*" -o -name "JSONPreview.tsx" -o -name "*OCRService.ts" -o -name "*ValidationService.ts" | xargs wc -l
```

## Documentação

```bash
# Visualizar índice de documentação
cat INDICE_OCR_V3.md

# Visualizar relatório final
cat RELATORIO_FINAL_OCR_V3.md

# Visualizar quick reference
cat QUICK_REFERENCE_OCR_V3.md

# Visualizar checklist de integração
cat CHECKLIST_INTEGRACAO_OCR_V3.md
```

## Git e Versionamento

```bash
# Ver status dos novos arquivos
git status

# Adicionar arquivos
git add components/FormWithOCR* components/JSONPreview.tsx
git add src/services/advancedOCRService.ts src/services/jsonValidationService.ts
git add *.md DOCUMENTACAO/GUIA_OCR_PDF_JSON_V3.md test-ocr-integration.sh

# Commit
git commit -m "feat: OCR + PDF + JSON v3.0 integration complete"

# Ver diff
git diff --stat

# Ver histórico
git log --oneline | head -5
```

## Limpeza e Manutenção

```bash
# Limpar node_modules
rm -rf node_modules
npm install

# Limpar cache de build
rm -rf dist build .next

# Limpar arquivos temporários
find . -name "*.swp" -o -name "*.swo" -delete

# Verificar espaço em disco
du -sh .
```

## Performance e Monitoramento

```bash
# Verificar tamanho do bundle
npm run build
ls -lh dist/

# Analisar performance com Lighthouse
# (Use Chrome DevTools F12 > Lighthouse)

# Monitor de performance em tempo real
# (Abra DevTools F12 > Performance)
```

## Deploy

```bash
# Build para produção
npm run build

# Verificar build localmente
npm run preview

# Deploy para Vercel (se configurado)
npm run deploy

# Deploy para GitHub Pages (se configurado)
npm run deploy:gh-pages
```

## Troubleshooting

```bash
# Verificar se TypeScript tem erros
tsc --noEmit --listFiles 2>&1 | grep -i error

# Verificar se há problemas de import
grep -r "import.*from" src/ components/ | grep -v node_modules

# Encontrar console.log (remover em produção)
grep -r "console\." src/ components/ | grep -v node_modules

# Verificar tamanho dos arquivos
du -sh components/* src/services/*
```

## Integração com Ferramentas

```bash
# Integração com ESLint (se configurado)
npx eslint src/ components/ --fix

# Integração com Prettier (se configurado)
npx prettier --write src/ components/

# Integração com Husky (se configurado)
npm run prepare

# Integração com CI/CD
# Adicionar test-ocr-integration.sh ao seu pipeline CI
```

## Documentação Rápida

```bash
# Abrir documentação no navegador (Linux)
xdg-open INDICE_OCR_V3.md

# Abrir documentação no navegador (Mac)
open INDICE_OCR_V3.md

# Abrir documentação no navegador (Windows)
start INDICE_OCR_V3.md
```

## Estrutura de Diretórios

```bash
# Listar estrutura do projeto
tree -L 2 --ignore 'node_modules'

# Listar apenas arquivos criados
find . -type f -name "*OCR*" -o -name "*JSON*" | grep -v node_modules
```

## Ambiente

```bash
# Verificar versão do Node.js
node --version

# Verificar versão do npm
npm --version

# Verificar versão do TypeScript
npx tsc --version

# Verificar versão do React
npm list react

# Verificar versão do Tailwind
npm list tailwindcss
```

## Útil para Desenvolvimento

```bash
# Copiar arquivo para clipboard (Linux)
cat components/FormWithOCR.tsx | xclip -selection clipboard

# Copiar arquivo para clipboard (Mac)
cat components/FormWithOCR.tsx | pbcopy

# Contar palavras na documentação
wc -w *.md DOCUMENTACAO/*.md

# Buscar padrão específico
grep -r "interface.*Props" src/ components/

# Listar métodos públicos
grep -r "public\|export" src/services/ | grep "^\s*\(public\|export\)"
```

## Integração Contínua

```bash
# Rodar todos os testes
npm test

# Rodar testes com cobertura
npm test -- --coverage

# Rodar testes de integração
bash test-ocr-integration.sh

# Rodar linting
npm run lint

# Build de verificação
npm run build

# Deploy de verificação (dry-run)
npm run deploy -- --dry-run
```

## Documentação Interativa

```bash
# Gerar documentação HTML (se configurado)
npm run docs

# Servir documentação localmente (se configurado)
npm run docs:serve

# Deploy de documentação (se configurado)
npm run docs:deploy
```

---

## Atalhos Rápidos

| Tarefa | Comando |
|--------|---------|
| Instalar deps | `npm install tesseract.js pdfjs-dist` |
| Rodar testes | `bash test-ocr-integration.sh` |
| Build | `npm run build` |
| Dev | `npm run dev` |
| Testes TypeScript | `tsc --noEmit` |
| Linting | `npm run lint` |
| Formatação | `npm run format` |
| Deploy | `npm run deploy` |
| Ver docs | `cat INDICE_OCR_V3.md` |
| Ver exemplos | `cat components/FormWithOCR.examples.tsx` |

---

## Próximas Etapas

1. **Instalação**
   ```bash
   npm install tesseract.js pdfjs-dist
   ```

2. **Testes**
   ```bash
   bash test-ocr-integration.sh
   ```

3. **Integração**
   - Seguir CHECKLIST_INTEGRACAO_OCR_V3.md

4. **Development**
   ```bash
   npm run dev
   ```

5. **Production**
   ```bash
   npm run build
   npm run deploy
   ```

---

**Versão:** 3.0
**Data:** 2024
**Status:** Pronto para Produção
