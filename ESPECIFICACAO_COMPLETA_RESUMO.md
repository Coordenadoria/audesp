# 🏛️ ESPECIFICAÇÃO COMPLETA - SISTEMA PRESTAÇÃO DE CONTAS v1.9

## 📍 LOCALIZAÇÃO DOS DOCUMENTOS ARQUITETÔNICOS

Este é um sumário executivo. Para detalhes completos, consulte:

### 1. Arquitetura Geral
📄 **[ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)**
- Visão geral e objetivos
- 9 módulos principais
- Fluxos de negócio
- Stack tecnológica
- Conformidade e segurança
- Roadmap 5 fases

### 2. Especificação de Formulários
📄 **[FORMULARIOS_DETALHADOS.md](FORMULARIOS_DETALHADOS.md)**
- 10 formulários completos
- 100+ campos especificados
- Máscaras e validações
- Exemplos e mensagens de erro
- Lógica condicional

### 3. Regras de Validação
📄 **[REGRAS_VALIDACAO_CONFORMIDADE.md](REGRAS_VALIDACAO_CONFORMIDADE.md)**
- 7 camadas de validação
- Equação contábil
- Integridade referencial
- Conformidade TCE-SP

---

## 🎯 OBJETIVOS DO SISTEMA

```
INPUT (Usuario)              PROCESSAMENTO                  OUTPUT (AUDESP)
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
│ • PDFs de Notas     │   │ • OCR Automático    │   │ • JSON v1.9     │
│ • Contratos        │──→│ • Validação Contábil│──→│ • Protocolo     │
│ • Pagamentos       │   │ • Regras AUDESP     │   │ • Rastreamento  │
│ • Documentos       │   │ • Geração Relatórios│   │ • Confirmação   │
└──────────────────────┘   └──────────────────────┘   └──────────────────┘
```

---

## 🔧 FUNCIONALIDADES PRINCIPAIS

### ✓ Gestão de Prestações de Contas
- Criação, edição, versionamento
- Suporte a retificações
- Workflow completo (rascunho → validado → enviado)
- Histórico e auditoria

### ✓ Importação Inteligente de PDFs
- Upload de arquivos (PDF, ZIP)
- OCR automático com Tesseract
- Extração estruturada de dados
- Classificação automática (NF, contrato, etc)
- Conferência humana antes de gravar

### ✓ Validação em Múltiplas Camadas
- Tipos de dados (JSON Schema)
- Regras contábeis (equação fundamental)
- Integridade referencial
- Conformidade TCE-SP

### ✓ Relatórios Obrigatórios
- Demonstrativo de Execução Financeira
- Relação de Pagamentos
- Relação de Documentos Fiscais
- Análise de Conformidade
- Exportação em PDF/Excel

### ✓ Envio à AUDESP
- Geração de JSON v1.9
- Assinatura digital (opcional)
- Envio via API
- Rastreamento de protocolo
- Suporte a retificações

---

## 📊 ESTRUTURA DE DADOS

### Campos Obrigatórios (25 raízes)

```
IDENTIFICAÇÃO
├── descritor (municipio, entidade, ano, mes)
├── codigo_ajuste
└── retificacao

CONTRATOS E DOCUMENTOS
├── contratos (array)
├── documentos_fiscais (array)
├── pagamentos (array)
└── ajustes_saldo

PATRIMONIAL
├── relacao_empregados (array)
├── relacao_bens (6 subcategorias)
└── servidores_cedidos (array)

FINANCEIRO
├── disponibilidades
├── receitas
├── descontos (array)
├── devolucoes (array)
├── glosas (array)
├── empenhos (array)
└── repasses (array)

RESPONSAVELIDADES
├── dados_gerais_entidade_beneficiaria
├── responsaveis_membros_orgao_concessor
└── declaracoes

RELATÓRIOS
├── relatorio_atividades
├── relatorio_governamental_analise_execucao
├── demonstracoes_contabeis
├── publicacoes_parecer_ata
├── prestacao_contas_entidade_beneficiaria
├── parecer_conclusivo
└── transparencia
```

### Campos por Formulário

| Formulário | Campos | Obrigatórios | Arrays |
|-----------|--------|-------------|--------|
| Descritor | 9 | 8 | 0 |
| Responsáveis | 7 | 4 | 1 (repeating) |
| Contratos | 11 | 8 | 1 (repeating) |
| Documentos Fiscais | 12 | 9 | 1 (repeating) |
| Pagamentos | 7 | 6 | 1 (repeating) |
| Disponibilidades | 5 | 3 | 1 (saldos) |
| Receitas | 8 | 5 | 3 (sub-arrays) |
| Bens | 15 | 8 | 6 (subcategorias) |
| Declarações | 10 | 5 | 2 (arrays) |
| Parecer | 6 | 4 | 1 (array) |

**Total**: ~90 campos diferentes, ~35 campos obrigatórios

---

## ✓ VALIDAÇÕES IMPLEMENTADAS

### Camada 1: Schema JSON
- Tipo de dados corretos
- Ranges de valores
- Enumerações válidas
- Regex de formatos

### Camada 2: Regras Contábeis
```
Saldo Inicial + Receitas - Despesas = Saldo Final
         (equação fundamental)

Para cada documento:
  ∑ pagamentos ≤ valor_documento
```

### Camada 3: Integridade
- Documentos vinculados a contratos
- Pagamentos vinculados a documentos
- Datas consistentes (cronologia)
- Referências válidas

### Camada 4: Conformidade
- CPF/CNPJ válidos (módulo 11)
- Documentação completa
- Transparência de dados
- Aderência TCE-SP

---

## 🔐 STACK TECNOLÓGICO

### Frontend
```
React 18 + TypeScript
Tailwind CSS 3
React Hook Form + Zod
Tesseract.js (OCR)
PDF.js (visualização)
Vite + Vitest
```

### Backend
```
Node.js + Express (API Gateway)
FastAPI + Python (OCR)
PostgreSQL 14+
Redis (cache)
Celery/Bull (filas)
```

### DevOps
```
Docker + Kubernetes
GitHub Actions (CI/CD)
Terraform (IaC)
AWS/Cloud (hosting)
```

---

## 📈 ROADMAP DE IMPLEMENTAÇÃO

| Fase | Duração | Objetivo | Status |
|------|---------|----------|--------|
| 1 | 3-4 meses | MVP Básico | — |
| 2 | 2 meses | OCR e Importação | — |
| 3 | 2 meses | Relatórios Avançados | — |
| 4 | 2 meses | Integração AUDESP | — |
| 5 | Ongoing | Produção e Otimização | — |

---

## 🚀 PRÓXIMOS PASSOS

### Para Implementação Técnica:

1. **Fase 1: Backend API (2 semanas)**
   - Setup Express + PostgreSQL
   - Autenticação (JWT)
   - Modelos de dados
   - Validações básicas

2. **Fase 2: Frontend (3 semanas)**
   - Setup React + Zod
   - Formulários principais
   - Validação real-time
   - Integração com API

3. **Fase 3: OCR (2 semanas)**
   - Setup Tesseract.js
   - Pipeline de processamento
   - Extração de dados
   - Interface de conferência

4. **Fase 4: Relatórios (2 semanas)**
   - Templates de relatórios
   - Cálculos contábeis
   - Exportação PDF/Excel

5. **Fase 5: AUDESP (1 semana)**
   - Integração API AUDESP
   - Envio e rastreamento
   - Tratamento de erros

---

## 📚 DOCUMENTAÇÃO DISPONÍVEL

Este repositório contém:

```
/ARQUITECTURA_COMPLETA.md              ← Leia primeiro
/FORMULARIOS_DETALHADOS.md             ← Design de UI
/REGRAS_VALIDACAO_CONFORMIDADE.md      ← Regras de negócio
/ESPECIFICACAO_COMPLETA_RESUMO.md      ← Este arquivo

/SCHEMA_MAPPER_GUIDE.md                ← OCR/Extração
/SCHEMAS_PRATICO.md                    ← Uso prático
/SCHEMA_INTEGRATION_GUIDE.md           ← Integração técnica

/src/services/schemaMapperService.ts   ← Código OCR
/src/services/jsonValidationService.ts ← Validação
/components/FormWithOCR.tsx            ← Componente principal
```

---

## ✍️ AUTORIA

**Arquiteto**: GitHub Copilot  
**Especialidade**: Sistemas Governamentais, Contabilidade Pública, JSON Schema  
**Data**: 20/01/2026  
**Versão**: 1.0  

---

## 📞 SUPORTE

Para dúvidas:
1. Consulte a documentação específica
2. Revise exemplos no `SCHEMAS_PRATICO.md`
3. Examine código em `src/services/`
4. Verifique testes em `test-v3-services.sh`

---

**🎯 Status**: Especificação Completa ✓  
**📍 Local**: Repositório GitHub - Coordenadoria/audesp  
**🚀 Próximo**: Começar Fase 1 de Implementação
