# Guia de Deploy no Vercel - AuDesp Connect Phase V

## 📋 Análise do Projeto

### Estrutura Técnica
- **Framework**: React 18.2.0 com TypeScript
- **Build Tool**: Vite (configurado) + React Scripts
- **Node.js**: Compatível com versões modernas
- **API Key**: Gemini API (via variável de ambiente `GEMINI_API_KEY`)
- **Banco de Dados**: Não aplicável (App frontend)

### Componentes Principais
- **Entrada**: `index.tsx` → `App.tsx`
- **HTML**: `index.html` (Vite)
- **Configurações**: 
  - `vite.config.ts` (Vite)
  - `tsconfig.json` (TypeScript)
  - `package.json` (dependências)

---

## 🚀 Passos para Conectar no Vercel

### 1️⃣ **Preparar Repositório Git**

```bash
# Verificar se está tudo commitado
git status

# Se houver mudanças, fazer commit
git add .
git commit -m "Preparação para deploy Vercel"

# Verificar branch e commits
git log --oneline -n 5
```

### 2️⃣ **Criar Conta no Vercel**

- Acesse: https://vercel.com
- Clique em "Sign Up"
- Opções:
  - **GitHub**: Recomendado (integração automática)
  - **GitLab** ou **Bitbucket**
  - Email direto

### 3️⃣ **Conectar Repositório**

Se usando GitHub:
```bash
# Certifique-se que está no GitHub
git remote -v

# Deve mostrar algo como:
# origin  https://github.com/seu-usuario/audesp-connect-phase-v.git (fetch)
```

### 4️⃣ **Configurar Build Settings no Vercel**

| Configuração | Valor |
|-------------|-------|
| **Build Command** | `npm run build` |
| **Output Directory** | `build/` (React Scripts) |
| **Install Command** | `npm install` |
| **Node.js Version** | `18.x` ou `20.x` |

### 5️⃣ **Adicionar Variáveis de Ambiente**

No painel do Vercel, ir em **Settings → Environment Variables** e adicionar:

```
GEMINI_API_KEY = seu-valor-aqui
REACT_APP_API_KEY = seu-valor-aqui  (se necessário)
```

⚠️ **Obtendo Gemini API Key**:
1. Acesse: https://ai.google.dev
2. Click em "Get API Key"
3. Crie uma nova chave de API
4. Copie o valor

### 6️⃣ **Problema: Vite vs React Scripts**

⚠️ **Atenção**: Há conflito na configuração do projeto:
- `package.json` usa `react-scripts` (Create React App)
- `vite.config.ts` existe mas não está sendo usado

**Opções de Solução**:

#### ✅ Opção A: Usar Create React App (Atual)
O Vercel detectará automaticamente e usará `npm run build`

#### ✅ Opção B: Migrar para Vite (Melhor Performance)
```bash
# Remover react-scripts
npm uninstall react-scripts

# Adicionar dependências Vite
npm install -D vite @vitejs/plugin-react

# Atualizar package.json scripts
```

Veja **seção "Migração para Vite"** abaixo.

---

## 📝 Arquivo vercel.json (Opcional)

Se quiser controle fino, criar `/workspaces/audesp/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "GEMINI_API_KEY": "@GEMINI_API_KEY"
  },
  "envPrefix": "REACT_APP_",
  "regions": ["sfo1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

---

## 🔄 Migração para Vite (Recomendado)

Se quiser melhor performance e menos overhead:

### Passo 1: Atualizar package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Passo 2: Remover react-scripts
```bash
npm uninstall react-scripts
```

### Passo 3: Vite ja está configurado em `vite.config.ts` ✓

### Passo 4: Atualizar setupProxy.js (se necessário)

Vite não usa `setupProxy.js`. Em vez disso, use `vite.config.ts`:

```typescript
// já está configurado, apenas confirme
```

---

## ✅ Checklist Final

- [ ] Git repositório sincronizado
- [ ] Conta Vercel criada
- [ ] Repositório conectado ao Vercel
- [ ] `GEMINI_API_KEY` adicionada em Environment Variables
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build/`
- [ ] Node.js Version: 18.x ou superior
- [ ] Primeiro deploy iniciado
- [ ] Domínio personalizado configurado (opcional)

---

## 🔗 Recursos Úteis

- **Documentação Vercel**: https://vercel.com/docs
- **React Deployment**: https://vercel.com/docs/frameworks/react
- **Variáveis de Ambiente**: https://vercel.com/docs/projects/environment-variables
- **Gemini API**: https://ai.google.dev

---

## 📞 Troubleshooting

### Deploy falha com erro de build
```bash
# Local: testar build
npm run build

# Verificar logs no Vercel dashboard
```

### Variáveis de ambiente não funcionam
```bash
# Verificar nomes das variáveis
# Adicionar prefix se necessário: REACT_APP_
# Rebuild após adicionar variáveis
```

### API Key não reconhecida
```bash
# Confirmar que GEMINI_API_KEY está corretamente adicionada
# Verificar em Settings → Environment Variables no Vercel
```
