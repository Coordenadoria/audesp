# 🚀 Guia Completo: Conectar AuDesp no Vercel

## ✅ Status do Repositório
- ✅ Código commitado e enviado para GitHub
- ✅ Branch: `main`
- ✅ Repositório: `https://github.com/Coordenadoria/audesp`
- ✅ Configurações Vercel adicionadas (`vercel.json`)

---

## 📋 Passos para Conectar no Vercel

### **Passo 1: Criar Conta no Vercel** (2 minutos)
1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize a conexão com sua conta GitHub
4. Permita que Vercel acesse seus repositórios

### **Passo 2: Importar Projeto** (1 minuto)
1. Após login, clique em **"New Project"**
2. Em "Import Git Repository", procure por `audesp`
3. Selecione o repositório: `Coordenadoria/audesp`
4. Clique em **"Import"**

### **Passo 3: Configurar Build Settings** (2 minutos)
O Vercel deve detectar automaticamente:
- **Framework Preset**: React
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

**Se não detectar**, configure manualmente:
```
Build Command:   npm run build
Output Directory: build
Node.js Version:  18.x (ou 20.x)
```

### **Passo 4: Adicionar Variáveis de Ambiente** (3 minutos)
1. Na tela de configuração, role até **"Environment Variables"**
2. Adicione a variável necessária:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `sua-chave-aqui`

3. **Para obter a Gemini API Key**:
   - Acesse: https://ai.google.dev/
   - Clique em **"Get API Key"** ou **"Create API Key"**
   - Copie a chave gerada
   - Cole no Vercel

### **Passo 5: Deploy** (1 minuto)
1. Clique em **"Deploy"** na tela de configuração
2. Aguarde o processo (geralmente 2-5 minutos)
3. Verá uma tela de sucesso com URL como: `https://audesp-xxx.vercel.app`

---

## 🔧 Configurações do Projeto

### Build Command
```bash
npm run build
```
Executa `react-scripts build` que gera a pasta `build/`

### Environment Variables Usadas
| Variável | Origem | Uso |
|----------|--------|-----|
| `GEMINI_API_KEY` | Gemini AI Studio | API de IA para processamento |
| `REACT_APP_*` | Variáveis de aplicação | Acessíveis via `process.env` |

### Proxy Configuration
- **Arquivo**: `setupProxy.js`
- **Uso**: Proxificar requisições para evitar CORS
- **Vercel**: Não precisa configurar (frontend puro)

---

## ✨ Funcionalidades do Projeto

### Stack Técnico
- **Frontend**: React 18.2 + TypeScript
- **Styling**: Lucide React (ícones)
- **Build**: React Scripts (Create React App)
- **API**: Gemini AI
- **OCR**: Processamento de documentos

### Componentes Principais
```
App.tsx (entrada)
├── Dashboard
├── ConferenceReport
├── FormSections
├── GeminiUploader (upload de arquivos)
├── FullReportImporter
├── TransmissionResult
└── Sidebar
```

---

## 🔍 Troubleshooting

### ❌ Build falha com erro de import
**Solução**: Verificar path aliases em `tsconfig.json`
```json
"baseUrl": ".",
"paths": {
  "@/*": ["./*"]
}
```

### ❌ Variável de ambiente não reconhecida
**Solução**: Variáveis React Scripts precisam de prefixo `REACT_APP_`
```
❌ Errado: GEMINI_API_KEY
✅ Certo: REACT_APP_GEMINI_API_KEY
```

### ❌ Build local falha mas Vercel não mostra erro
**Solução**: Testar localmente primeiro
```bash
npm install
npm run build
npm start
```

---

## 📊 URLs Importantes

| Item | URL |
|------|-----|
| GitHub | https://github.com/Coordenadoria/audesp |
| Vercel | https://vercel.com |
| Gemini API | https://ai.google.dev |
| Documentação | https://vercel.com/docs |

---

## 🎯 Próximos Passos Após Deploy

1. **Testar a aplicação**: Abra a URL e valide funcionamento
2. **Configurar domínio customizado** (opcional)
3. **Habilitar CI/CD automático**: Cada push em `main` deploya automaticamente
4. **Monitorar analytics**: Vercel fornece analytics automático

---

## ❓ Dúvidas Frequentes

**P: Posso usar Vite em vez de React Scripts?**
R: Sim, mas precisaria migrar `package.json` e alterar `vercel.json`

**P: Como faço para testar antes de publicar?**
R: Use `npm run build` localmente para simular o build de produção

**P: Quantas deploys consigo?**
R: Plano gratuito permite deploys ilimitados com histórico dos últimos 10

---

**Status**: ✅ Pronto para conectar no Vercel!
