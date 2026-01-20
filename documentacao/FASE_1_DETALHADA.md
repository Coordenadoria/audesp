# 🚀 FASE 1: MVP BÁSICO - PLANO DETALHADO

**Duração**: 3-4 meses | **Sprint Duration**: 2 semanas | **Equipe**: 3-4 devs

---

## 📋 OBJETIVOS DA FASE 1

- ✅ Arquitetura base funcional (backend + frontend)
- ✅ Autenticação JWT com email
- ✅ CRUD completo de prestações
- ✅ Validação JSON Schema integrada
- ✅ 5 formulários principais funcionais
- ✅ Geração de JSON v1.9 validado
- ✅ Deploy em dev/staging

**Saída esperada**: Sistema funcional com todas as funcionalidades básicas

---

## 📊 SPRINTS ORGANIZADAS

### SPRINT 0: Setup e Arquitetura (Semana 1-2)

#### Sprint 0.1: Backend Scaffold
- [ ] Criar repo backend separado ou pasta `/backend-v3`
- [ ] Initialize Node.js + Express + TypeScript
- [ ] Setup prettier, eslint, husky
- [ ] Criar estrutura de pastas (routes, services, models, middleware)
- [ ] Configure environment variables (.env.example)
- [ ] Setup PostgreSQL connection (TypeORM ou Prisma)
- [ ] Create Docker Compose com PostgreSQL + Redis

**Deliverable**: Backend scaffold pronto com conexão DB

#### Sprint 0.2: Frontend Integration Setup
- [ ] Verificar React 18 + Vite + TypeScript
- [ ] Integrar React Hook Form + Zod
- [ ] Setup environment para apontar para API backend
- [ ] Criar API client (axios/fetch wrapper)
- [ ] Setup global state (Redux/Context API)
- [ ] Criar estrutura de componentes reutilizáveis

**Deliverable**: Frontend setup com integration ready

#### Sprint 0.3: Database Schema
- [ ] Criar migrations para tabelas principais:
  - `users` (id, email, cpf, nome, senha_hash, created_at)
  - `sessions` (id, user_id, token, expires_at)
  - `prestacoes` (id, user_id, status, versao, data_criacao, data_atualizacao)
  - `prestacao_items` (descritores, responsáveis, contratos, etc - JSONs)
  - `auditoria` (user_id, prestacao_id, acao, timestamp)
- [ ] Criar índices para queries frequentes
- [ ] Setup seed data para testes

**Deliverable**: Database schema migrado e testado

---

### SPRINT 1: Autenticação e Autorização (Semana 3-4)

#### Sprint 1.1: Backend Auth
- [ ] Implementar `/auth/register` (validação email + CPF)
- [ ] Implementar `/auth/login` (JWT com 7 dias)
- [ ] Implementar `/auth/logout`
- [ ] Implementar `/auth/refresh` (refresh token)
- [ ] Implementar `/auth/me` (obter usuário atual)
- [ ] Middleware de autenticação (verificar JWT)
- [ ] Middleware de rate limiting

**Deliverable**: API de autenticação completa

#### Sprint 1.2: Frontend Auth UI
- [ ] Criar componente LoginForm
- [ ] Criar componente RegisterForm
- [ ] Criar componente ProtectedRoute
- [ ] Implementar Context/Redux para auth state
- [ ] Integrar com backend API
- [ ] Persistent session (localStorage/sessionStorage)
- [ ] Redirect automático para login

**Deliverable**: Sistema de login funcional

#### Sprint 1.3: Autenticação Testing
- [ ] Testes unitários para validators (email, CPF)
- [ ] Testes de integração para endpoints auth
- [ ] Testes e2e para fluxo login/logout
- [ ] Validação de tokens JWT

**Deliverable**: 90%+ cobertura de testes para auth

---

### SPRINT 2: CRUD Base (Semana 5-6)

#### Sprint 2.1: Backend CRUD
- [ ] GET `/prestacoes` (listar todas do usuário)
- [ ] GET `/prestacoes/:id` (obter uma)
- [ ] POST `/prestacoes` (criar nova)
- [ ] PATCH `/prestacoes/:id` (atualizar)
- [ ] DELETE `/prestacoes/:id` (deletar)
- [ ] GET `/prestacoes/:id/history` (versões anteriores)
- [ ] POST `/prestacoes/:id/restore` (restaurar versão)

**Deliverable**: API REST completa para prestações

#### Sprint 2.2: Frontend CRUD Views
- [ ] Criar tela listagem de prestações
- [ ] Criar tela criação nova prestação
- [ ] Criar tela edição de prestação
- [ ] Criar tela visualização (read-only)
- [ ] Breadcrumbs e navegação clara
- [ ] Loading states e error handling
- [ ] Confirmação de delete

**Deliverable**: UI para CRUD funcional

#### Sprint 2.3: Auditoria e Logging
- [ ] Registrar todas as mudanças em `auditoria` table
- [ ] Criar tela de histórico por usuário
- [ ] Criar API `/auditoria` com filtros
- [ ] Logging estruturado (Winston/Pino)

**Deliverable**: Auditoria completa rastreando todas as operações

---

### SPRINT 3: Validação JSON Schema (Semana 7-8)

#### Sprint 3.1: Backend Validation
- [ ] Implementar validador JSON Schema (ajv library)
- [ ] Criar schemas TypeScript dos 25 campos raiz
- [ ] Endpoint POST `/validate` (validar JSON contra schema)
- [ ] Retornar erros estruturados (path, message, type)
- [ ] Implementar validações customizadas (CPF, CNPJ, etc)

**Deliverable**: Serviço de validação robusto

#### Sprint 3.2: Frontend Validation Integration
- [ ] Integrar Zod validators com React Hook Form
- [ ] Real-time validation enquanto usuário digita
- [ ] Mostrar erros inline (por campo)
- [ ] Indicador visual de campos inválidos
- [ ] Summary de erros (quantos campos faltam)
- [ ] Auto-save em localStorage (rascunho)

**Deliverable**: Validação real-time no frontend

#### Sprint 3.3: Validation Testing
- [ ] Testes para cada regra de validação
- [ ] Testes de edge cases (valores limites)
- [ ] Testes de performance (schema grande)
- [ ] Testes de mensagens de erro

**Deliverable**: Validation service com 95%+ cobertura

---

### SPRINT 4: Formulários Principais (Semana 9-10)

#### Sprint 4.1: Formulário Descritor
- [ ] Campos: número, competência, gestor, responsável, etc
- [ ] Máscaras de input (datas, valores)
- [ ] Autocomplete para CPF/CNPJ
- [ ] Validação em tempo real
- [ ] Save/Draft funcionalidade
- [ ] Integração com SchemaMapperService (OCR)

**Deliverable**: Formulário descritor 100% funcional

#### Sprint 4.2: Formulário Responsáveis
- [ ] Array de responsáveis (ADD/REMOVE linhas)
- [ ] Campos: nome, CPF, cargo, email
- [ ] Validação de CPF (módulo 11)
- [ ] Duplicate prevention
- [ ] Ordenação de linhas

**Deliverable**: Formulário com array fields funcional

#### Sprint 4.3: Formulário Contratos
- [ ] Array de contratos (ADD/REMOVE)
- [ ] Campos: número, fornecedor, data, valor
- [ ] Busca de fornecedor (autocomplete)
- [ ] Cálculo de totais
- [ ] Validações contábeis (valor > 0)

**Deliverable**: Formulário Contratos com validações

#### Sprint 4.4: Formulários Documentos + Pagamentos
- [ ] Formulário Documentos Fiscais (12 campos)
- [ ] Formulário Pagamentos (7 campos)
- [ ] Integrações entre formulários (refs)
- [ ] Validação de consistência

**Deliverable**: 5 formulários principais prontos

---

### SPRINT 5: Geração JSON v1.9 (Semana 11-12)

#### Sprint 5.1: JSON Schema Generator
- [ ] Backend service: converter dados form → JSON v1.9
- [ ] Validar JSON contra schema oficial
- [ ] Gerar arquivo JSON downloadável
- [ ] Endpoint: POST `/prestacoes/:id/generate-json`

**Deliverable**: Gerador JSON validado

#### Sprint 5.2: Frontend Download
- [ ] Botão para download JSON
- [ ] Botão para preview JSON
- [ ] Validação antes de gerar
- [ ] Histórico de gerações

**Deliverable**: Download JSON funcionando

#### Sprint 5.3: JSON Preview/Editor
- [ ] Componente JSONPreview (já existe)
- [ ] Validar JSON ao editar manualmente
- [ ] Sugestões de auto-correção

**Deliverable**: Preview e edição JSON funcional

---

### SPRINT 6: Testing e Polish (Semana 13-14)

#### Sprint 6.1: Unit Tests
- [ ] Testes para todas as validações
- [ ] Testes para CRUD operations
- [ ] Testes para JSON generation
- [ ] Target: 80%+ coverage

#### Sprint 6.2: Integration Tests
- [ ] E2E flow: register → login → create → validate → download JSON
- [ ] Teste de concorrência (múltiplos usuarios)
- [ ] Teste de rollback/restore

#### Sprint 6.3: Performance & Security
- [ ] Otimizar queries DB (índices, pagination)
- [ ] Rate limiting por usuário
- [ ] CORS configurado
- [ ] Sanitização de inputs
- [ ] HTTPS ready

#### Sprint 6.4: Documentation
- [ ] OpenAPI/Swagger spec completo
- [ ] README para desenvolvedores
- [ ] Setup local guide
- [ ] Deploy guide

**Deliverable**: Sistema testado, documentado, pronto para staging

---

## 🏗️ ESTRUTURA DE PASTAS RECOMENDADA

### Backend
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Prestacao.ts
│   │   ├── Session.ts
│   │   └── Auditoria.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── prestacoes.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── PrestacaoService.ts
│   │   ├── ValidationService.ts
│   │   ├── JSONGeneratorService.ts
│   │   └── AuditoriaService.ts
│   ├── types/
│   │   ├── schema.ts
│   │   ├── api.ts
│   │   └── entities.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── errors.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── migrations/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tsconfig.json
└── package.json
```

### Frontend
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── forms/
│   │   ├── DescriptorForm.tsx
│   │   ├── ResponsaveisForm.tsx
│   │   ├── ContratosForm.tsx
│   │   ├── DocumentosForm.tsx
│   │   └── PagamentosForm.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── ArrayField.tsx
│   └── ...
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── PrestacoesListPage.tsx
│   ├── PrestacaoFormPage.tsx
│   └── JSONPreviewPage.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── prestacoes.ts
│   └── validation.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useForm.ts
│   └── usePrestacao.ts
├── store/
│   ├── authStore.ts
│   ├── prestacaoStore.ts
│   └── store.ts
├── types/
│   ├── schema.ts
│   ├── api.ts
│   └── forms.ts
└── ...
```

---

## 🔌 TECNOLOGIAS SELECIONADAS

### Backend
| Tecnologia | Versão | Razão |
|-----------|--------|-------|
| Node.js | 18+ | LTS, performance |
| Express | 4.18+ | HTTP framework maduro |
| TypeScript | 5+ | Type safety |
| TypeORM | 0.3+ | ORM moderno, migrations |
| PostgreSQL | 14+ | BD relacional robusto |
| JWT (jsonwebtoken) | 9+ | Auth stateless |
| Zod | 3.21+ | Validação schemas |
| ajv | 8+ | JSON Schema validator |
| Winston | 3+ | Logging estruturado |
| Jest | 29+ | Testing framework |
| Docker | latest | Containerização |

### Frontend
| Tecnologia | Versão | Razão |
|-----------|--------|-------|
| React | 18+ | UI framework |
| TypeScript | 5+ | Type safety |
| Vite | 4+ | Build tool rápido |
| Tailwind CSS | 3+ | Styling |
| React Hook Form | 7+ | Form management |
| Zod | 3.21+ | Form validation |
| Zustand/Redux | - | State management |
| Axios | 1+ | HTTP client |
| Vitest | latest | Unit testing |

---

## ⚙️ AMBIENTE DE DESENVOLVIMENTO

### Local Setup
```bash
# Backend
cd backend
npm install
npm run dev  # Inicia com hot reload

# Frontend
npm install
npm run dev  # Vite dev server

# Database
docker-compose up -d  # PostgreSQL + Redis
npm run migrate  # TypeORM migrations
npm run seed  # Seed data
```

### Testing
```bash
# Backend
npm run test           # Unit tests
npm run test:int       # Integration tests
npm run test:cov       # Coverage

# Frontend
npm run test           # Unit tests
npm run test:e2e       # E2E tests
```

### Deployment
```bash
# Build
npm run build

# Docker
docker build -t audesp-backend .
docker run -p 3000:3000 audesp-backend

# Vercel (frontend)
vercel deploy --prod
```

---

## 📈 MÉTRICAS DE SUCESSO - FASE 1

| Métrica | Target | Verificação |
|---------|--------|------------|
| Test Coverage | 80%+ | `npm run test:cov` |
| Build Size | < 500KB | `npm run build` |
| API Response | < 200ms | Load testing |
| Login Flow | < 3 cliques | UX review |
| Error Messages | 100% i18n | PT-BR ready |
| Uptime Staging | 99.5% | 24h monitoring |

---

## 🎯 CHECKPOINTS

| Sprint | Checkpoint | Owner | Date |
|--------|-----------|-------|------|
| 0 | Backend + DB scaffold ready | Backend Lead | Week 2 |
| 1 | Auth API + Login UI done | Full Stack | Week 4 |
| 2 | CRUD ops working | Backend + Frontend | Week 6 |
| 3 | Validation integrated | QA + Dev | Week 8 |
| 4 | 5 Forms working | Frontend Lead | Week 10 |
| 5 | JSON generation verified | Backend | Week 12 |
| 6 | E2E tests passing, ready staging | QA | Week 14 |

---

## 🚨 RISCOS IDENTIFICADOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|----------|
| Delay no setup DB | Alta | Médio | Usar Docker Compose |
| Validação complexa | Média | Alto | Schema clara, POC cedo |
| Requisitos mudarem | Média | Alto | Weekly sync com stakeholder |
| Performance DB | Baixa | Alto | Índices, monitoring cedo |

---

## 📞 COMUNICAÇÃO

- **Daily Standup**: 10:00 AM (15 min)
- **Sprint Planning**: 2ª feira 14:00 (1h)
- **Sprint Review**: 6ª feira 15:00 (1h)
- **Slack channel**: `#audesp-dev`
- **GitHub Projects**: Kanban board para tracking

---

## ✅ DEFINIÇÃO DE PRONTO (Definition of Done)

**Para cada feature:**
- [ ] Código implementado e revisado
- [ ] Testes unitários (80%+)
- [ ] Testes de integração passando
- [ ] Documentação atualizada
- [ ] Sem warnings de linter
- [ ] Performance aceitável
- [ ] Acessibilidade validada
- [ ] Merge para main branch

---

**Início da Fase 1**: Agora!
**Fim esperado**: 3-4 meses
**Próxima revisão**: Sprint 1 checkpoint (Week 4)
