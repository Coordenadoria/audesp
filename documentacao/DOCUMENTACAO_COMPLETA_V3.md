# AUDESP v3.0 - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fases de Desenvolvimento](#fases-de-desenvolvimento)
4. [Componentes](#componentes)
5. [Serviços](#serviços)
6. [API Reference](#api-reference)
7. [Setup & Instalação](#setup--instalação)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Performance & Monitoring](#performance--monitoring)
11. [Troubleshooting](#troubleshooting)

---

## Visão Geral

**AUDESP v3.0** é um sistema web moderno e completo para gestão de formulários, processamento de documentos, transmissão de dados e análise em tempo real.

### Características Principais
- ✅ Formulário adaptativo com 27 seções
- ✅ Processamento OCR/PDF com IA
- ✅ Geração de relatórios (HTML, PDF, Excel, XML)
- ✅ Transmissão segura via WebService AUDESP
- ✅ Sistema RBAC com 5 roles e 14 permissões
- ✅ Framework de testes integrado
- ✅ CI/CD Pipeline com GitHub Actions
- ✅ Monitoramento de performance em tempo real
- ✅ Cache otimizado com múltiplas estratégias

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript
- **Build**: Vite/react-scripts
- **Styling**: Tailwind CSS + Lucide Icons
- **Charts**: Recharts
- **OCR**: Tesseract.js
- **PDF**: html2canvas + jsPDF
- **Excel**: XLSX
- **Backend**: Node.js/Python (opcional)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Containerização**: Docker + Docker Compose

---

## Arquitetura

### Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 18)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Components (PDFReviewPanel, AdminDashboard, etc)    │   │
│  │  Hooks (useAccessControl, useAuditedAction)          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                      │                       │
         ▼                      ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Core Services   │  │ Reporting        │  │ Security         │
│  • OCRService    │  │ • ReportGen      │  │ • RBACService    │
│  • FieldExtract  │  │ • PDFReporter    │  │ • JWTAuth        │
│  • DocClassify   │  │ • ExcelReporter  │  │ • AccessControl  │
│  • DocLinker     │  │ • XMLReporter    │  └──────────────────┘
└──────────────────┘  └──────────────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│  Optimization    │  │  WebService      │
│  • PerfMonitor   │  │  • AUDESPWebSvc  │
│  • CacheOptim    │  │  • JWTAuthSvc    │
│  • Analytics     │  │  • TransMon      │
└──────────────────┘  └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  External Services & Data               │
│  • Tesseract OCR API                     │
│  • AUDESP WebService                     │
│  • PostgreSQL Database                   │
│  • Redis Cache                           │
│  • Analytics Server                      │
└──────────────────────────────────────────┘
```

### Padrões de Design Utilizados
- **Singleton**: Todos os serviços utilizam padrão singleton
- **Factory**: Criação de templates em ReportGenerator
- **Observer**: Observables para audit logging
- **Strategy**: Múltiplas estratégias de reportagem
- **Decorator**: Componentes envolvidos com permissões

---

## Fases de Desenvolvimento

### FASE 1: Schema & Validator ✅
**Objetivo**: Criar base sólida com validação

**Arquivos**:
- `types.ts` - Tipos TypeScript para formulário
- `AUDESPValidator.ts` - Validador com 20+ regras
- `FormLayout.tsx` - Component de layout adaptativo

**Recursos**:
- Validação CNPJ/CPF/Data/Moeda
- Normalização de dados
- Relatórios de conformidade

---

### FASE 2: Components & Layout ✅
**Objetivo**: Criar componentes reutilizáveis

**Arquivos**:
- Field components (TextInput, SelectField, DateField, etc)
- FormBuilder.tsx - Construtor dinâmico
- FormPreview.tsx - Visualização
- SectionCollapse.tsx - Seções colapsáveis

**Recursos**:
- 27 seções de formulário
- 100+ campos validados
- Layout responsivo
- Tema claro/escuro

---

### FASE 3: Advanced JSON Viewer ✅
**Objetivo**: Visualização avançada de dados

**Arquivos**:
- JSONViewer.tsx - Viewer com expansão
- DataExporter.tsx - Exportação em múltiplos formatos

**Recursos**:
- Navegação em árvore
- Formatação colorida
- Search e filtering
- Exportação JSON/CSV

---

### FASE 4: OCR & PDF Import ✅
**Objetivo**: Processamento de documentos

**Arquivos**:
- `OCRService.ts` - Extração de texto via Tesseract
- `DocumentClassifier.ts` - Classificação de documentos
- `FieldExtractor.ts` - Mapeamento para campos
- `DocumentLinker.ts` - Vinculação de documentos
- `PDFReviewPanel.tsx` - Interface de revisão
- `DocumentUploadManager.tsx` - Upload com pipeline

**Recursos**:
- OCR com confiança em 3 níveis
- Detecção automática de tipos de documento
- Mapeamento inteligente de campos
- Validação de integridade de vínculos

---

### FASE 5: Reporting ✅
**Objetivo**: Geração de relatórios multi-formato

**Arquivos**:
- `ReportGenerator.ts` - Framework base
- `PDFReporter.ts` - Geração PDF
- `ExcelReporter.ts` - Geração XLSX
- `XMLReporter.ts` - Geração XML (v1.2)

**Recursos**:
- 2 templates pré-configurados
- Customização de templates
- Watermarks e assinaturas
- Validação de schemas
- Conversão XML ↔ JSON

---

### FASE 6: WebService Transmission ✅
**Objetivo**: Integração com AUDESP

**Arquivos**:
- `AUDESPWebService.ts` - Transmissão com retry
- `JWTAuthService.ts` - Autenticação JWT
- `TransmissionMonitor.tsx` - Monitoramento em tempo real

**Recursos**:
- Autenticação HS256
- Retry configurável
- Health checks
- Histórico de transmissões
- Dashboard de monitoramento

---

### FASE 7: Security & Permissions ✅
**Objetivo**: Controle de acesso granular

**Arquivos**:
- `RBACService.ts` - 5 roles, 14 permissões
- `AccessControl.tsx` - Wrapper com permissões
- `AdminDashboard.tsx` - Painel admin

**Roles**:
- `admin` - Acesso total
- `auditor` - Apenas leitura
- `manager` - Gestão de usuários
- `operator` - Operações padrão
- `viewer` - Visualização apenas

**Permissões** (14 total):
- `form:create`, `form:read`, `form:update`, `form:delete`
- `report:create`, `report:download`, `report:email`
- `document:upload`, `document:process`, `document:approve`
- `transmission:send`, `transmission:monitor`
- `user:manage`, `audit:view`

**Recursos**:
- Auditoria completa de operações
- Detecção de atividades suspeitas
- Ativação/desativação de usuários
- Geração de relatórios de acesso

---

### FASE 8: Testing Framework ✅
**Objetivo**: Framework de testes integrado

**Arquivos**:
- `TestSuite.ts` - Framework com hooks
- `ServiceTests.ts` - 18 testes auto-registrados
- `TestRunner.tsx` - UI para execução

**Testes Inclusos**:
- Validator: 6 testes (CNPJ, CPF, Date, Currency, etc)
- RBAC: 5 testes (auth, permissions, roles)
- JWT: 4 testes (token generation, verification, renewal)
- XML: 3 testes (validation, conversion)

**Recursos**:
- Before/After hooks
- Tag filtering
- Report generation
- Assertions customizadas

---

### FASE 9: Deployment & CI/CD ✅
**Objetivo**: Automação de deployment

**Arquivos**:
- `DeploymentConfig.ts` - Configurações de ambiente
- `CIPipelineService.ts` - Gerenciamento de pipeline
- `CIDashboard.tsx` - Visualização de pipeline
- `.github/workflows/ci-cd.yml` - GitHub Actions
- `docker-compose.dev.yml` - Desenvolvimento
- `docker-compose.prod.yml` - Produção
- `deploy.sh` - Script de deploy

**Pipeline Stages**:
1. Lint & Type Check
2. Tests
3. Security Scan
4. Build
5. Deploy (Staging/Production)

**Ambientes**:
- Development (localhost:3000)
- Staging (staging.audesp.gov.br)
- Production (audesp.gov.br)

**Recursos**:
- Configurações por ambiente
- Health checks
- Artifact management
- Automatização completa

---

### FASE 10: Production Optimization ✅
**Objetivo**: Otimização e monitoramento

**Arquivos**:
- `PerformanceMonitor.ts` - Coleta de Web Vitals
- `CacheOptimizer.ts` - Cache com LRU/LFU/FIFO
- `AnalyticsService.ts` - Tracking de eventos
- `MonitoringDashboard.tsx` - Dashboard de métricas

**Recursos**:
- Coleta de FCP, LCP, FID, CLS, TTFB
- Cache persistente com localStorage
- Estratégias de remoção LRU/LFU/FIFO
- Event tracking (página, clique, formulário)
- Error tracking (não capturados, rejeições)
- Conversions tracking

---

## Componentes

### Component Structure

```
src/components/
├── AUDESPForm.tsx              # Main form component
├── FormLayout.tsx              # Layout wrapper
├── FormBuilder.tsx             # Dynamic builder
├── FormPreview.tsx             # Preview/export
├── JSONViewer.tsx              # JSON visualization
├── DataExporter.tsx            # Multi-format export
├── PDFReviewPanel.tsx          # OCR review (FASE 4)
├── DocumentUploadManager.tsx   # Upload manager (FASE 4)
├── TransmissionMonitor.tsx     # WebService monitor (FASE 6)
├── AccessControl.tsx           # Permission wrapper (FASE 7)
├── AdminDashboard.tsx          # Admin panel (FASE 7)
├── TestRunner.tsx              # Test UI (FASE 8)
├── CIDashboard.tsx             # CI/CD monitor (FASE 9)
└── MonitoringDashboard.tsx     # Prod monitor (FASE 10)
```

### Core Components

#### AUDESPForm
```tsx
<AUDESPForm
  initialData={data}
  onSubmit={handleSubmit}
  readOnly={false}
  theme="light"
/>
```

#### FormBuilder
```tsx
<FormBuilder
  sections={sections}
  onFieldChange={handleChange}
  validateOnChange={true}
/>
```

#### AccessControl
```tsx
<AccessControl requiredPermission="form:create" requiredRole="operator">
  <button>Create Form</button>
</AccessControl>
```

#### CIDashboard
```tsx
<CIDashboard refreshInterval={5000} />
```

#### MonitoringDashboard
```tsx
<MonitoringDashboard refreshInterval={5000} />
```

---

## Serviços

### Core Services

#### AUDESPValidator
```typescript
const validator = AUDESPValidator.getInstance();

// Validar CNPJ
const result = validator.validateCNPJ('11.222.333/0001-81');
// { valid: true, errors: [] }

// Validar formulário completo
const formResult = validator.validateForm(formData);
// { valid: true, errors: [], warnings: [] }
```

#### OCRService
```typescript
const ocr = OCRService.getInstance();

// Extrair texto
const text = await ocr.extractText(imageFile);

// Classificar documento
const classification = await ocr.classifyDocument(text);
// { type: 'NF', confidence: 0.95 }
```

#### ReportGenerator
```typescript
const generator = ReportGenerator.getInstance();

// Gerar HTML
const html = generator.generateHTML(data, 'resumo-executivo');

// Gerar XML
const xml = generator.generateXML(data);
```

#### RBACService
```typescript
const rbac = RBACService.getInstance();

// Criar usuário
rbac.createUser('user@example.com', 'password123', 'operator');

// Verificar permissão
const hasPermission = rbac.hasPermission(userId, 'form:create');

// Gerar auditoria
const audit = rbac.generateAuditLog();
```

#### PerformanceMonitor
```typescript
const perf = PerformanceMonitor.getInstance();

// Iniciar monitoramento
perf.startMonitoring(5000);

// Obter métricas
const metrics = perf.getMetrics();

// Gerar relatório
const report = perf.generatePerformanceReport();
```

#### CacheOptimizer
```typescript
const cache = CacheOptimizer.getInstance();

// Configurar
cache.configure({ ttl: 3600, maxSize: 50*1024*1024 });

// Armazenar
cache.set('key', value, 3600);

// Recuperar
const value = cache.get('key');

// Estatísticas
const stats = cache.getStats();
```

#### AnalyticsService
```typescript
const analytics = AnalyticsService.getInstance();

// Rastrear evento
analytics.trackEvent('form_submission', 'form', 1, { formName: 'AUDESP' });

// Rastrear erro
analytics.trackError('Network error', 'high');

// Rastrear conversão
analytics.trackConversion('form_completed', 100, 'BRL');

// Obter relatório
const report = analytics.generateAnalyticsReport();
```

---

## API Reference

### Form Validation
```typescript
// Validar CNPJ
POST /api/validate/cnpj
{ "cnpj": "11.222.333/0001-81" }
// { "valid": true, "normalized": "11222333000181" }

// Validar CPF
POST /api/validate/cpf
{ "cpf": "123.456.789-09" }

// Validar formulário
POST /api/validate/form
{ "data": {...} }
```

### OCR & Documents
```typescript
// Upload e OCR
POST /api/documents/ocr
FormData: { file: File }

// Classificar documento
POST /api/documents/classify
{ "text": "..." }

// Vincular documento
POST /api/documents/link
{ "documentId": "...", "formId": "..." }
```

### Reports
```typescript
// Gerar relatório
POST /api/reports/generate
{ "data": {...}, "format": "pdf|excel|xml|html" }

// Download relatório
GET /api/reports/:reportId/download

// Listar relatórios
GET /api/reports
```

### WebService
```typescript
// Transmitir
POST /api/transmission/send
{ "data": {...} }

// Status
GET /api/transmission/:transactionId

// Monitorar
WS /api/transmission/monitor
```

### RBAC
```typescript
// Login
POST /api/auth/login
{ "email": "user@example.com", "password": "..." }

// Verificar permissão
GET /api/auth/permissions?userId=...&permission=form:create

// Usuários (admin)
GET /api/admin/users
POST /api/admin/users
PATCH /api/admin/users/:userId
DELETE /api/admin/users/:userId
```

### Analytics
```typescript
// Rastrear evento
POST /api/analytics/events
{ "eventName": "...", "category": "..." }

// Rastrear erro
POST /api/analytics/errors
{ "message": "...", "severity": "..." }

// Obter estatísticas
GET /api/analytics/stats
```

---

## Setup & Instalação

### Pré-requisitos
- Node.js 18+
- npm 9+
- Docker & Docker Compose (opcional)
- Python 3.9+ (para backend, opcional)

### Instalação Local

```bash
# 1. Clonar repositório
git clone https://github.com/Coordenadoria/audesp.git
cd audesp

# 2. Instalar dependências
npm ci

# 3. Configurar ambiente
cp .env.example .env.local
# Editar .env.local com suas configurações

# 4. Iniciar desenvolvimento
npm start

# 5. Build para produção
npm run build
```

### Docker Setup

```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up

# Produção
docker-compose -f docker-compose.prod.yml up
```

### Verificar Instalação

```bash
# Testar aplicação
npm test

# Build de produção
npm run build

# Servir localmente
npx serve -s build -l 3000
```

---

## Testing

### Executar Testes

```bash
# Todos os testes
npm test

# Testes de integração
npm run test:integration

# Com cobertura
npm test -- --coverage

# Modo watch
npm test -- --watch
```

### TestRunner UI

```tsx
import TestRunner from './components/TestRunner';

function App() {
  return <TestRunner />;
}
```

### Testes Disponíveis

| Serviço | Testes | Cobertura |
|---------|--------|-----------|
| Validator | 6 | CNPJ, CPF, Date, Currency, Form |
| RBAC | 5 | Auth, Permissions, Roles |
| JWT | 4 | Generation, Verification, Renewal |
| XML | 3 | Validation, Conversion |

---

## Deployment

### CI/CD Pipeline

**Trigger**: Push para `main` ou `develop`

**Stages**:
1. **Lint & Type Check** (2 min)
   - ESLint
   - TypeScript type check

2. **Tests** (3 min)
   - Unit tests
   - Integration tests

3. **Security Scan** (2 min)
   - npm audit
   - Snyk scanning

4. **Build** (2 min)
   - npm run build
   - Artifact upload

5. **Deploy Staging** (5 min)
   - Se branch = develop
   - Deploy para staging.audesp.gov.br

6. **Deploy Production** (5 min)
   - Se branch = main
   - Deploy para audesp.gov.br

**Tempo Total**: ~20 minutos

### Deployment Manual

```bash
# Usar script de deploy
chmod +x deploy.sh
./deploy.sh production v3.0.0

# Ou com docker
docker build -t audesp:v3.0.0 .
docker run -p 3000:3000 audesp:v3.0.0
```

### Configurações de Ambiente

```bash
# Development
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_LOG_LEVEL=debug

# Staging
REACT_APP_API_BASE_URL=https://api-staging.audesp.gov.br
REACT_APP_LOG_LEVEL=info

# Production
REACT_APP_API_BASE_URL=https://api.audesp.gov.br
REACT_APP_LOG_LEVEL=warn
REACT_APP_JWT_SECRET=<set-in-github-secrets>
```

---

## Performance & Monitoring

### Web Vitals

| Métrica | Target | Status |
|---------|--------|--------|
| FCP (First Contentful Paint) | < 1.8s | ✅ |
| LCP (Largest Contentful Paint) | < 2.5s | ✅ |
| FID (First Input Delay) | < 100ms | ✅ |
| CLS (Cumulative Layout Shift) | < 0.1 | ✅ |
| TTFB (Time to First Byte) | < 600ms | ✅ |

### Build Optimization

- **Bundle Size**: 295 KB (gzip)
- **CSS Size**: 8.5 KB (gzip)
- **Splitting**: Automático com react-scripts
- **Tree-shaking**: Ativado em produção

### Caching Strategy

| Tipo | TTL | Strategy | Max Size |
|------|-----|----------|----------|
| API | 3600s | LRU | 50MB |
| Form | 1800s | LFU | 10MB |
| Reports | 3600s | FIFO | 20MB |

### Monitoramento

```typescript
// Dashboard em tempo real
import MonitoringDashboard from './components/MonitoringDashboard';

function App() {
  return <MonitoringDashboard refreshInterval={5000} />;
}
```

**Métricas Monitoradas**:
- Response times
- Memory usage
- Cache hit rate
- Error rates
- Event tracking
- Security alerts

---

## Troubleshooting

### Build Fails

```bash
# Limpar cache
rm -rf node_modules package-lock.json build

# Reinstalar
npm ci

# Build
npm run build
```

### TypeScript Errors

```bash
# Verificar tipos
npx tsc --noEmit

# Diagnosticar
npx tsc --listFiles
```

### Performance Issues

```typescript
// Monitorar performance
const perfMonitor = PerformanceMonitor.getInstance();
perfMonitor.startMonitoring(5000);
console.log(perfMonitor.generatePerformanceReport());
```

### Cache Issues

```typescript
// Limpar cache
const cache = CacheOptimizer.getInstance();
cache.clear();
```

### Docker Issues

```bash
# Limpar volumes
docker-compose down -v

# Rebuild
docker-compose up --build
```

### Database Connection

```bash
# Testar conexão
psql -h localhost -U audesp -d audesp_dev

# Ver logs
docker-compose logs postgres
```

---

## Roadmap Futuro

### v3.1 (Próximo)
- [ ] Integração com múltiplos provedores de OCR
- [ ] Suporte a mais idiomas
- [ ] Machine learning para classificação automática
- [ ] Webhooks para integrações customizadas
- [ ] API GraphQL

### v3.2
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] P2P transmission
- [ ] Blockchain validation

### v3.3+
- [ ] AI-powered document processing
- [ ] Advanced analytics dashboard
- [ ] Custom workflows
- [ ] Plugin system

---

## Support & Contribuição

### Reportar Issues
- GitHub Issues: https://github.com/Coordenadoria/audesp/issues
- Email: suporte@audesp.gov.br

### Contribuir
- Fork o repositório
- Criar branch feature (`git checkout -b feature/NewFeature`)
- Commit changes (`git commit -m 'Add NewFeature'`)
- Push to branch (`git push origin feature/NewFeature`)
- Abrir Pull Request

### License
MIT License - veja LICENSE.md para detalhes

---

## Contacts & Informações

- **Repositório**: https://github.com/Coordenadoria/audesp
- **Documentação**: https://docs.audesp.gov.br
- **Suporte**: suporte@audesp.gov.br
- **Status**: https://status.audesp.gov.br

---

**Última atualização**: Dezembro 2024
**Versão**: 3.0.0
**Status**: Production Ready ✅
