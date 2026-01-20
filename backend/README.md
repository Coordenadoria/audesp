# AUDESP v3.0 Backend API

**API REST para gerenciamento de Prestações de Contas de Convênios**

100% compatível com JSON Schema v1.9 (Resolução TCE-SP)

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js**: 18+ LTS
- **npm**: 9+
- **Docker**: Para executar PostgreSQL + Redis (opcional)
- **PostgreSQL**: 14+ (local ou docker)
- **Redis**: 7+ (local ou docker)

### Setup Local

1. **Clone e navegue para o backend**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. **Inicie containers Docker** (PostgreSQL + Redis)

```bash
docker-compose up -d
```

5. **Rode as migrações do banco**

```bash
npm run db:migrate
```

6. **Seed data (opcional)**

```bash
npm run db:seed
```

7. **Inicie o servidor**

```bash
npm run dev
```

Servidor estará disponível em `http://localhost:3000`

## 📖 Estrutura de Diretórios

```
src/
├── config/              # Configuração (env, logger, database)
├── middleware/          # Middleware Express (auth, error, logging)
├── models/              # Entidades de banco (User, Prestacao, etc)
├── routes/              # Rotas da API
├── services/            # Lógica de negócio
├── types/               # Tipos TypeScript
├── utils/               # Utilitários (validators, formatters, etc)
└── app.ts               # Arquivo principal

tests/
├── unit/                # Testes unitários
├── integration/         # Testes de integração
└── fixtures/            # Dados de teste

migrations/              # Migrações de banco de dados
logs/                    # Arquivos de log
```

## 🛠️ Scripts Disponíveis

### Development

```bash
npm run dev              # Inicia com hot reload (tsx watch)
npm run build            # Compila TypeScript
npm run start            # Inicia versão compilada
npm run typecheck        # Verifica tipos TypeScript
```

### Linting & Formatting

```bash
npm run lint             # ESLint
npm run lint:fix         # ESLint com auto-fix
npm run format           # Prettier
```

### Testing

```bash
npm run test             # Vitest (unit + integration)
npm run test:cov         # Coverage report
npm run test:int         # Apenas testes de integração
```

### Database

```bash
npm run db:migrate       # Rode todas as migrações
npm run db:revert        # Reverte última migração
npm run db:seed          # Carrega dados de teste
```

### Docker

```bash
npm run docker:build     # Build imagem Docker
npm run docker:run       # Executa container
```

## 📚 API Documentation

### OpenAPI / Swagger

Documentação interativa disponível em: `http://localhost:3000/api/docs` (quando implementado)

Arquivo de spec: [openapi.yaml](../openapi.yaml)

### Principais Endpoints

#### Autenticação

```bash
POST   /api/auth/register          # Criar conta
POST   /api/auth/login             # Fazer login
POST   /api/auth/logout            # Logout
POST   /api/auth/refresh           # Renovar token
GET    /api/auth/me                # Dados do usuário
```

#### Prestações

```bash
GET    /api/prestacoes             # Listar (com filtros)
POST   /api/prestacoes             # Criar nova
GET    /api/prestacoes/:id         # Obter uma
PATCH  /api/prestacoes/:id         # Atualizar
DELETE /api/prestacoes/:id         # Deletar
GET    /api/prestacoes/:id/history # Histórico de versões
POST   /api/prestacoes/:id/restore # Restaurar versão anterior
```

#### Validação

```bash
POST   /api/validate               # Validar dados contra schema
POST   /api/prestacoes/:id/generate-json  # Gerar JSON v1.9
GET    /api/prestacoes/:id/download-json  # Download JSON
```

#### Auditoria

```bash
GET    /api/auditoria              # Logs de auditoria (com filtros)
```

## 🔐 Autenticação

Todos os endpoints protegidos requerem header:

```
Authorization: Bearer {JWT_TOKEN}
```

Token JWT válido por 7 dias, com refresh disponível por 30 dias.

### Exemplo de Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "senha": "Password123"
  }'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nome": "Usuário Teste",
    "cpf": "12345678901"
  }
}
```

## ✅ Validação

### JSON Schema

Todos os dados validados contra JSON Schema v1.9 conforme resolução TCE-SP.

Validações incluem:

- **Tipos de dados**: string, number, date, array, object
- **Enumerações**: valores pré-definidos para campos específicos
- **Padrões**: CPF, CNPJ, datas, emails via regex
- **Regras contábeis**: equação fundamental, integridade referencial
- **Conformidade**: campos obrigatórios, documentação

Exemplo de erro de validação:

```json
{
  "valid": false,
  "errors": [
    {
      "path": "prestacao.descritor.cpfGestor",
      "message": "CPF inválido (módulo 11)",
      "code": "INVALID_FORMAT"
    }
  ],
  "warnings": [
    {
      "path": "prestacao.contratos[0].dataFim",
      "message": "Data de término posterior ao esperado",
      "code": "WARNING_DATE_RANGE"
    }
  ]
}
```

## 🗄️ Banco de Dados

### Estrutura

- **users**: Usuários do sistema
- **sessions**: Sessões ativas
- **prestacoes**: Prestações de contas (com JSONB para flexibilidade)
- **prestacao_versoes**: Histórico de versões
- **auditoria**: Log de todas as operações
- **json_export_historico**: Histórico de gerações JSON
- **api_keys**: Chaves de API (futuro)

### Views

- **prestacoes_resumo**: Resumo de prestações com contadores
- **usuario_estatisticas**: Estatísticas por usuário

### Soft Deletes

Deletions são soft deletes (marca `deletado_em`), preservando dados para auditoria.

## 🔗 Integrações

### Externas

- **AUDESP API**: Envio de JSONs para órgão estadual (Fase 4)
- **Email**: Notificações (futuro - Fase 5)
- **Storage**: Upload de documentos (futuro - Fase 2)

### Internas

- **Frontend React**: `http://localhost:5173` (CORS configurado)
- **SchemaMapperService**: OCR e extração de PDFs
- **Python OCR Backend**: Processamento pesado (Fase 2)

## 📊 Monitoramento & Logging

### Logs

- **Console**: Desenvolvimento
- **File**: `logs/all.log` e `logs/error.log`
- **Format**: JSON estruturado com timestamp

Níveis: `debug`, `info`, `http`, `warn`, `error`

### Health Check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:45.123Z",
  "version": "1.0.0"
}
```

## 🧪 Testing

### Unit Tests

```bash
npm run test -- src/services/validators.test.ts
```

### Integration Tests

```bash
npm run test:int
```

### Coverage

```bash
npm run test:cov
```

Target: 80%+ coverage

## 🐛 Troubleshooting

### Erro: Database connection refused

```
Solução: Certifique-se que PostgreSQL está rodando
docker-compose up -d postgres
```

### Erro: JWT_SECRET não definido

```
Solução: Configure em .env
echo "JWT_SECRET=seu_secret_aqui_minimo_32_caracteres" >> .env
```

### Erro: CORS bloqueado

```
Solução: Adicione URL do frontend em CORS_ORIGIN
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## 📝 Conventions

### Nomenclatura

- **Variáveis**: camelCase
- **Funções**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Arquivos**: kebab-case (routes) ou PascalCase (classes)
- **Database**: snake_case

### Commits

```
type: descrição breve

feat: adicionar endpoint de login
fix: corrigir validação de CPF
docs: atualizar documentação de API
test: adicionar testes para validadores
refactor: reorganizar serviço de auth
```

### Code Style

- ESLint + Prettier configurados
- TypeScript strict mode
- Sem `any` types (sem exceções)

## 🚀 Deployment

### Build

```bash
npm run build
```

Gera em `dist/`

### Docker

```bash
npm run docker:build
npm run docker:run
```

### Vercel (Node.js)

```bash
vercel deploy --prod
```

### Production Checklist

- [ ] JWT_SECRET com 32+ caracteres aleatórios
- [ ] DATABASE_PASSWORD forte
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN configurado para domínio real
- [ ] Logs salvos em storage externo
- [ ] Backups automáticos do banco
- [ ] Monitoramento/alertas ativados
- [ ] Rate limiting ajustado
- [ ] HTTPS obrigatório

## 📞 Support

- **Issues**: GitHub
- **Docs**: Veja [FASE_1_DETALHADA.md](../FASE_1_DETALHADA.md)
- **OpenAPI**: [openapi.yaml](../openapi.yaml)

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025  
**Status**: Em desenvolvimento (Sprint 0)
