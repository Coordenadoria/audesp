# 🏛️ ARQUITETURA COMPLETA - SISTEMA DE PRESTAÇÃO DE CONTAS DE CONVÊNIOS v1.9

**Status**: Especificação Arquitetural Executiva  
**Versão**: 1.0  
**Data**: 20/01/2026  
**Organismo**: TCE-SP / Coordenadoria / AUDESP  
**Schema**: Prestação de Contas de Convênio v1.9

---

## 📋 ÍNDICE DE CONTEÚDO

1. Visão Geral do Sistema
2. Requisitos Funcionais
3. Requisitos Não-Funcionais
4. Arquitetura Geral
5. Módulos Principais
6. Fluxos de Negócio
7. Stack Tecnológica
8. Estratégia de Conformidade
9. Roadmap de Implementação

---

## 1. VISÃO GERAL DO SISTEMA

### Objetivo Primário

Criar plataforma web corporativa que:

- **Captura** dados de prestação de contas conforme JSON Schema v1.9 AUDESP
- **Valida** rigorosamente contra schema e regras contábeis
- **Importa** automaticamente documentos de PDFs (OCR + extração estruturada)
- **Gera** relatórios técnicos, contábeis e gerenciais
- **Exporta** JSON validado para AUDESP

### Atores Principais

```
┌─────────────────────────────────────────────────────────┐
│ OPERADOR ADMINISTRATIVO                                 │
│ • Preenche dados de prestação                            │
│ • Valida informações                                     │
│ • Gera JSON e exporta                                    │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ GESTOR FINANCEIRO                                       │
│ • Aprova lançamentos                                     │
│ • Revisa relatórios                                      │
│ • Autoriza envio à AUDESP                                │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ CONTADOR / AUDITOR                                      │
│ • Valida conformidade contábil                           │
│ • Assina parecer conclusivo                              │
│ • Gera demonstrações contábeis                           │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ SISTEMA AUDESP (TCE-SP)                                 │
│ • Recebe JSON via API                                    │
│ • Valida e processa                                      │
│ • Retorna comprovante de entrega                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. REQUISITOS FUNCIONAIS

### RF-01: Gestão de Identificadores

**Descritor**: Informações básicas da prestação

```
RF-01.1 - Registrar tipo de documento
         (sempre "Prestação de Contas de Convênio")
         
RF-01.2 - Registrar código do municipio (1-9999)
         Validação: Deve existir na base IBGE
         
RF-01.3 - Registrar código da entidade (1-99999)
         Validação: Deve existir no CADESP
         
RF-01.4 - Registrar ano de referência (2000+)
         Validação: Ano ≤ ano atual
         
RF-01.5 - Registrar mês de referência (1-12)
         Validação: Deve ser mês válido
         
RF-01.6 - Registrar código do ajuste (15-19 dígitos)
         Formato: YYYYNNNNNNNNNNNN
         Validação: Deve corresponder a contrato ativo
```

### RF-02: Gestão de Contatos e Responsáveis

```
RF-02.1 - Registrar responsáveis do órgão concessor
         • Nome completo
         • CPF (validação módulo 11)
         • Cargo
         • Data nomeação
         • Assinatura digital (quando aplicável)
         
RF-02.2 - Registrar dados da entidade beneficiária
         • CNPJ (validação módulo 11)
         • Razão social
         • Endereço
         • Corpo diretivo
         • Membros de conselho fiscal
         
RF-02.3 - Manter histórico de alterações
         • Quem alterou
         • Quando alterou
         • O que alterou
         • Motivo
```

### RF-03: Gestão de Contratos e Documentos

```
RF-03.1 - Registrar contratos (Array)
         Campos mínimos:
         • ID único
         • Data celebração
         • Data vigência (início/fim)
         • Valor total
         • Objeto do contrato
         • Partes
         
RF-03.2 - Registrar documentos fiscais (Array)
         Campos mínimos:
         • ID único
         • Tipo (NF, RPS, CT-e, etc)
         • Número documento
         • Data emissão
         • CNPJ/CPF fornecedor
         • Valor bruto
         • Encargos
         • Valor líquido
         • Descrição
         • Vínculo a contrato
         
RF-03.3 - Registrar pagamentos (Array)
         Campos mínimos:
         • ID único
         • Data pagamento
         • Forma pagamento
         • Valor
         • Número comprovante
         • Vínculo a documento fiscal
         
RF-03.4 - Validar coerência entre documentos
         • Pagamento ≤ valor documento fiscal
         • Documento fiscal vinculado a contrato válido
         • Datas coerentes (emissão < pagamento)
```

### RF-04: Gestão de Disponibilidades e Receitas

```
RF-04.1 - Registrar saldo inicial e final
         • Saldo em caixa
         • Saldo em fundo fixo
         • Saldo em contas bancárias
         
RF-04.2 - Registrar receitas
         • Repasses municipais
         • Repasses estaduais
         • Repasses federais
         • Outras receitas
         • Recursos próprios
         
RF-04.3 - Validar conciliação financeira
         Saldo Inicial + Receitas - Despesas = Saldo Final
```

### RF-05: Gestão de Bens Patrimoniais

```
RF-05.1 - Registrar bens móveis
         Subcategories:
         • Bens adquiridos
         • Bens cedidos
         • Bens baixados/devolvidos
         
RF-05.2 - Registrar bens imóveis
         Subcategories:
         • Imóveis adquiridos
         • Imóveis cedidos
         • Imóveis baixados/devolvidos
         
RF-05.3 - Validar patrimônio
         • Descrição completa
         • Valor de aquisição
         • Data aquisição
         • Situação atual
```

### RF-06: Importação Inteligente de PDFs

```
RF-06.1 - Upload de documentos (PDF, ZIP)
         • Suportar múltiplos arquivos
         • Validar tamanho máximo (100MB por arquivo)
         
RF-06.2 - OCR automático
         • Tesseract.js (cliente)
         • Fallback servidor Python
         • Tratamento de PDFs escaneados
         
RF-06.3 - Extração estruturada
         • Detectar tipo documento (NF, contrato, etc)
         • Extrair dados-chave automaticamente
         • Sugerir classificação
         
RF-06.4 - Conferência humana
         • Exibir dados extraídos
         • Permitir correção antes de gravar
         • Log de alterações
```

### RF-07: Relatórios Obrigatórios

```
RF-07.1 - Demonstrativo de Execução Financeira
         Seções:
         • Receitas por fonte
         • Despesas por natureza
         • Saldo final
         • Análise de execução
         
RF-07.2 - Relação de Pagamentos
         Colunas:
         • Data pagamento
         • Favorecido
         • CPF/CNPJ
         • Valor
         • Comprovante
         
RF-07.3 - Relação de Documentos Fiscais
         Colunas:
         • Tipo documento
         • Número
         • Fornecedor
         • Data
         • Valor
         • Situação (pago/pendente)
         
RF-07.4 - Análise de Conformidade
         Validações:
         • Campos obrigatórios preenchidos
         • Valores coerentes
         • Datas válidas
         • Documentação completa
```

### RF-08: Geração e Envio do JSON

```
RF-08.1 - Gerar JSON conforme schema v1.9
         • Estrutura exata do schema
         • Validação antes de exportação
         • Log de erros com caminho JSON
         
RF-08.2 - Assinatura digital (opcional)
         • Integração com certificado digital
         • Carimbo de tempo
         
RF-08.3 - Envio à AUDESP
         • Via API (endpoint fornecido)
         • Via upload manual (fallback)
         • Histórico de envios
         • Protocolo de entrega
         
RF-08.4 - Reenvio/Retificação
         • Versionar prestações
         • Controlar retificações
         • Manter histórico completo
```

---

## 3. REQUISITOS NÃO-FUNCIONAIS

### Performance
- Tempo de resposta < 2s para operações comuns
- Suportar até 10.000 documentos por prestação
- OCR de 100 páginas em < 60s

### Segurança
- Autenticação via CPF + senha (mínimo)
- SSL/TLS obrigatório
- Auditoria de todas operações
- Controle de acesso por perfil
- Backup diário

### Conformidade
- 100% aderência ao JSON Schema v1.9
- Regras contábeis TCE-SP
- Lei de Transparência
- LGPD (proteção de dados)

### Disponibilidade
- SLA: 99.5% uptime
- Backup automático a cada 1h
- Disaster recovery em 4h

---

## 4. ARQUITETURA GERAL

```
┌──────────────────────────────────────────────────────────────┐
│                     USUÁRIO FINAL                             │
│            (Browser Web - Chrome/Firefox/Safari)              │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼────────┐ ┌────▼──────────┐
│   FRONTEND     │ │   OCR SPA   │ │  STORAGE      │
│   (React 18+)  │ │ (Tesseract) │ │  (LocalStore) │
│                │ │             │ │               │
│ • Formulários  │ │ • PDF Parse  │ │ • Drafts      │
│ • Validação    │ │ • Extraction │ │ • History     │
│ • Relatórios   │ │ • ML Hints   │ │               │
└────────┬───────┘ └─────────────┘ └───────────────┘
         │
         │ HTTPS/JSON
         │
    ┌────▼────────────────────────────────┐
    │      API GATEWAY (Node.js/Express)  │
    │  • Auth (JWT/OAuth)                 │
    │  • Rate limiting                    │
    │  • Request validation               │
    │  • CORS                             │
    └────────┬─────────────────────────────┘
             │
    ┌────────┴─────────────────────────┐
    │                                   │
┌───▼───────────────────┐  ┌───────────▼──────┐
│  BUSINESS LOGIC       │  │  OCR SERVICE      │
│  (Python/FastAPI)     │  │  (Python)         │
│                       │  │                   │
│ • Validação Schema    │  │ • PDF2Text (Tess)│
│ • Regras Contábeis    │  │ • Layout Analysis│
│ • Lógica Negócio      │  │ • Data Extraction│
│ • Geração Relatórios  │  │ • ML Classification
│ • Orquestração        │  │                   │
└───┬───────────────────┘  └───────────────────┘
    │
    ├─────────────────────────────────────┐
    │                                     │
┌───▼──────────────────┐  ┌──────────────▼────┐
│  DATA LAYER          │  │  EXTERNAL SERVICES│
│  (PostgreSQL)        │  │                    │
│                      │  │ • AUDESP API       │
│ • Prestações         │  │ • IBGE API (CNPJ)  │
│ • Documentos         │  │ • Certificação     │
│ • Auditoria          │  │ • Email            │
│ • Usuários           │  │                    │
└──────────────────────┘  └────────────────────┘
```

---

## 5. MÓDULOS PRINCIPAIS

### Módulo 1: Autenticação e Autorização

```
Responsabilidades:
✓ Autenticar usuário (CPF + senha)
✓ Gerar tokens JWT/OAuth
✓ Validar permissões por perfil
✓ Registrar tentativas de acesso
✓ Suportar SSO (SAML/OAuth2)

Entidades:
• Usuário
• Perfil/Papel
• Permissão
• Sessão
• Auditoria de Acesso

Endpoints:
POST   /auth/login
POST   /auth/logout
GET    /auth/me
POST   /auth/refresh
```

### Módulo 2: Gestão de Prestações

```
Responsabilidades:
✓ CRUD de prestações de contas
✓ Versionamento
✓ Workflow (rascunho → validado → enviado)
✓ Suporte a retificações
✓ Concorrência (locks pessimistas)

Entidades:
• Prestação
• Versão
• Status
• Histórico
• Comentários/Anotações

Endpoints:
POST   /prestacoes
GET    /prestacoes
GET    /prestacoes/:id
PUT    /prestacoes/:id
DELETE /prestacoes/:id
POST   /prestacoes/:id/versions
GET    /prestacoes/:id/history
```

### Módulo 3: Importação de Documentos

```
Responsabilidades:
✓ Upload de arquivos
✓ OCR de PDFs
✓ Extração estruturada
✓ Classificação automática
✓ Validação de integridade
✓ Interface de conferência

Entidades:
• Documento (carregado)
• Metadados
• Texto OCR
• Dados extraídos
• Classificação sugerida
• Fila de processamento

Endpoints:
POST   /documentos/upload
GET    /documentos/:id
GET    /documentos/:id/ocr
POST   /documentos/:id/confirm
GET    /documentos/status/:id
DELETE /documentos/:id
```

### Módulo 4: Validação e Regras

```
Responsabilidades:
✓ Validação contra JSON Schema
✓ Regras contábeis
✓ Consistência de dados
✓ Relatório de erros detalhado
✓ Sugestões de correção

Entidades:
• Regra
• Violação
• Log de validação
• Sugestão

Endpoints:
POST   /validar
       Body: { prestacao_id, modo: 'strict'|'warning' }
       Return: { valido, erros[], avisos[] }
       
GET    /validar/:prestacao_id
       Return: último resultado de validação
```

### Módulo 5: Relatórios

```
Responsabilidades:
✓ Gerar relatórios obrigatórios
✓ Exportar em PDF/Excel/Web
✓ Cálculos contábeis
✓ Análise de conformidade
✓ Cache de relatórios

Entidades:
• Relatório
• Template
• Cálculo derivado
• Cache

Endpoints:
GET    /relatorios?tipo=execucao_financeira&formato=pdf
GET    /relatorios/pagamentos?prestacao_id=...
GET    /relatorios/documentos-fiscais?prestacao_id=...
GET    /relatorios/conformidade?prestacao_id=...
POST   /relatorios/:id/export?formato=excel
```

### Módulo 6: JSON e Envio

```
Responsabilidades:
✓ Gerar JSON v1.9
✓ Validação final
✓ Assinatura (se aplicável)
✓ Envio à AUDESP
✓ Rastreamento de envio

Entidades:
• Payload JSON
• Protocolo de envio
• Resposta AUDESP
• Log de sincronização

Endpoints:
POST   /exportar/json?prestacao_id=...
       Return: JSON completo + validação

POST   /enviar/audesp
       Body: { prestacao_id, assinado: true/false }
       Return: { protocolo, status, timestamp }
       
GET    /envios?prestacao_id=...
       Return: histórico de envios

GET    /envios/:protocolo/status
       Return: status no AUDESP
```

---

## 6. FLUXOS DE NEGÓCIO

### Fluxo Principal: Criação e Envio

```
1. OPERADOR: Inicia nova prestação
   └─ Sistema: Cria registro com status "RASCUNHO"
   
2. OPERADOR: Preenche descritor
   └─ Sistema: Valida campos básicos
   
3. OPERADOR: Importa documentos (PDF)
   └─ Sistema:
      • OCR automático
      • Extração de dados
      • Sugestão de classificação
      • Conferência do operador
      └─ Documento associado à prestação
      
4. OPERADOR: Preenche contratos, pagamentos, etc
   └─ Sistema: Validação contínua
   
5. OPERADOR: Solicita validação completa
   └─ Sistema:
      • Executa todas regras
      • Gera lista de erros/avisos
      └─ Status: "PENDENTE_CORREÇÃO" ou "VALIDADO"
      
6. GESTOR: Revisa prestação
   └─ Sistema: Exibe relatórios de conformidade
   
7. CONTADOR: Assina parecer conclusivo
   └─ Prestação: Status "PRONTA_ENVIO"
   
8. GESTOR: Autoriza envio
   └─ Sistema:
      • Gera JSON final
      • Assina digitalmente (se aplicável)
      • Envia à AUDESP
      • Recebe protocolo
      └─ Status: "ENVIADO"
      
9. AUDESP: Processa (assincrono)
   └─ Sistema: Monitora status
   
10. AUDESP: Responde com aceite/rejeição
    └─ Sistema: Atualiza status
        Se rejeição:
        └─ OPERADOR: Retifica e resubmete
        
Fim: Prestação aceita pela AUDESP
```

### Fluxo Secundário: Importação em Lote

```
1. OPERADOR: Faz upload de ZIP
   └─ Sistema: Extrai arquivos
   
2. Para cada PDF:
   a) OCR
   b) Classificação (NF, contrato, etc)
   c) Extração de dados
   d) Sugestão automática
   └─ Fila de conferência
   
3. OPERADOR: Revisa lote
   └─ Aceita ou edita dados sugeridos
   
4. Sistema: Grava documentos associados
   └─ Exibe resumo de associações
```

---

## 7. STACK TECNOLÓGICA

### Frontend

```
Framework:     React 18+
Linguagem:     TypeScript 4.5+
Styling:       Tailwind CSS 3+
State Mgmt:    Redux/Zustand
Formulários:   React Hook Form + Zod
Validação:     Zod (client-side)
OCR:           Tesseract.js
PDF:           PDF.js
Relatórios:    ReportLab / PDFMake
Excel:         ExcelJS
Charts:        Chart.js / D3.js
HTTP Client:   Axios
Bundler:       Vite
Testing:       Vitest + React Testing Library
CI/CD:         GitHub Actions
Deploy:        Vercel/AWS
```

### Backend

```
Runtime:       Node.js 18+ (API Gateway)
Framework:     Express.js / FastAPI (Python)
Linguagem:     TypeScript + Python
Validação:     Zod (Node) + Pydantic (Python)
OCR:           Tesseract (Python) + Pytesseract
JSON Schema:   Ajv (Node) + JsonSchema (Python)
ORM:           Sequelize / SQLAlchemy
Cache:         Redis
Queue:         Bull / Celery
Logging:       Winston / Python logging
Security:      Passport.js / JWT + bcrypt
Email:         Nodemailer / SendGrid
Testing:       Jest + Pytest
API Docs:      Swagger/OpenAPI
```

### Banco de Dados

```
Primary:       PostgreSQL 14+
Features:
  • JSON fields para dados dinâmicos
  • Full-text search para documentos
  • Triggers para auditoria
  • Row-level security (RLS)
  • Particionamento por ano

Secondary:     Redis (cache)
Backup:        S3-compatible storage
```

### OCR e Processamento

```
OCR:           Tesseract 5.x
Language Pack: Portuguese Brazil
GPU Support:   CUDA (opcional)
ML Framework:  TensorFlow.js (classificação)
PDF Parser:    pdfplumber (Python)
```

### Segurança

```
Auth:          OAuth2 + JWT
Tokens:        RS256 (asymmetric)
TLS:           1.3+
WAF:           AWS WAF / CloudFlare
Encryption:    AES-256 (dados em repouso)
Certificate:   Let's Encrypt Auto-Renewal
Secrets Mgmt:  AWS Secrets Manager / HashiCorp Vault
```

### Infraestrutura

```
Container:     Docker + Docker Compose
Orquestração:  Kubernetes (prod)
CDN:           CloudFront / CloudFlare
Load Balancer: ALB (AWS) / NGINX
Monitoring:    Prometheus + Grafana
Logging:       ELK Stack / CloudWatch
APM:           New Relic / DataDog
IaC:           Terraform
```

---

## 8. ESTRATÉGIA DE CONFORMIDADE

### Conformidade Contábil

```
Validações Obrigatórias:

✓ Equação Contábil
  Saldo Inicial + Receitas - Despesas = Saldo Final
  
✓ Integralidade
  • Todos campos obrigatórios preenchidos
  • Sem valores nulos em campos críticos
  • Documentação completa
  
✓ Consistência Temporal
  • Datas respeitem vigência de contratos
  • Cronologia de eventos
  • Sincronização com SIAF (se aplicável)
  
✓ Rastreabilidade
  • Cada transação vinculada a documento
  • Auditoria de origem
  • Rastreamento de alterações
  
✓ Aderência ao Schema
  • Validação JSON Schema v1.9
  • Tipos de dados corretos
  • Enumerações válidas
  • Limites respeitados
```

### Conformidade Legal (LGPD)

```
Proteções Implementadas:

✓ Consentimento
  • Usuário consente com termos
  • Consentimento registrado
  
✓ Minimização de Dados
  • Coleta apenas dados necessários
  • Retenção conforme legislação
  
✓ Segurança
  • Criptografia em repouso e trânsito
  • Senhas hasheadas (bcrypt)
  • Sem armazenamento de dados sensíveis
  
✓ Direitos dos Titulares
  • Exportar dados pessoais
  • Solicitar exclusão
  • Portabilidade
  
✓ Auditoria
  • Log de todos acessos
  • Rastreamento de alterações
  • Retenção de logs (1 ano mínimo)
```

### Auditoria Contínua

```
Eventos Registrados:

✓ Acesso
  • Quem acessou
  • Quando
  • De onde (IP)
  • O quê acessou
  
✓ Modificação
  • Quem modificou
  • O quê mudou
  • Antes/Depois
  • Quando
  • Motivo (se aplicável)
  
✓ Envio à AUDESP
  • Timestamp de envio
  • Protocolo recebido
  • Resposta da AUDESP
  • Status de processamento
  
✓ Erros e Exceções
  • Log detalhado
  • Stack trace
  • Contexto da operação
  • Ação tomada
```

---

## 9. ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: MVP (3-4 meses)
- [ ] Arquitetura base
- [ ] Autenticação e autorização
- [ ] Módulo de prestações (CRUD básico)
- [ ] Formulários principais (descritor, contratos, documentos)
- [ ] Validação JSON Schema
- [ ] Geração JSON
- [ ] Relatório básico de conformidade

### Fase 2: OCR e Importação (2 meses)
- [ ] Upload de documentos
- [ ] OCR com Tesseract
- [ ] Extração estruturada
- [ ] Classificação automática
- [ ] Interface de conferência
- [ ] Importação em lote

### Fase 3: Relatórios Avançados (2 meses)
- [ ] Relatório de Execução Financeira
- [ ] Relatório de Pagamentos
- [ ] Relatório de Conformidade
- [ ] Exportação em PDF/Excel
- [ ] Dashboards interativos

### Fase 4: Integração AUDESP (2 meses)
- [ ] API de envio à AUDESP
- [ ] Rastreamento de protocolo
- [ ] Retificações
- [ ] Assinatura digital (opcional)
- [ ] Webhook para feedback AUDESP

### Fase 5: Produção e Otimização (ongoing)
- [ ] Performance tuning
- [ ] Segurança em profundidade
- [ ] Disaster recovery
- [ ] Monitoramento 24/7
- [ ] Suporte ao usuário

---

## 10. MÉTRICAS DE SUCESSO

```
Operacionais:
• 99.5% uptime
• Tempo resposta < 2s (95 percentil)
• OCR de 100 páginas em < 60s

Funcionais:
• 100% aderência JSON Schema v1.9
• 0% de erros de validação não detectados
• 100% de importações com conferência

Negócio:
• Reduzir tempo de prestação de contas em 80%
• Reduzir erros de conformidade em 95%
• Automação de 70% do processo manual

Satisfação:
• NPS > 60
• Adoção por 95% dos usuários
• Tempo médio de treinamento < 4h
```

---

## PRÓXIMOS DOCUMENTOS

Este documento é parte de um conjunto de especificações:

1. ✓ **ARQUITETURA_COMPLETA.md** (este)
2. → **FORMULARIOS_DETALHADOS.md** (próximo)
3. → **REGRAS_VALIDACAO.md**
4. → **MOTOR_IMPORTACAO_PDF.md**
5. → **ESTRUTURA_RELATORIOS.md**
6. → **API_SPECIFICATION.md**
7. → **FLUXOS_DETALHADOS.md**
8. → **GUIA_CONFORMIDADE_TCE_SP.md**

---

**Documento Arquitetural**  
**Coordenadoria / TCE-SP**  
**Versão 1.0 | 20/01/2026**
