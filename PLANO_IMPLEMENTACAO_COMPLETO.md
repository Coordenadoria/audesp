# 🎯 PLANO DE IMPLEMENTAÇÃO AUDESP V2.0 - SISTEMA COMPLETO DE PRESTAÇÃO DE CONTAS

**Status**: EM ANDAMENTO  
**Data**: Janeiro 2026  
**Versão**: 2.0 (Arquitetura Completa)

---

## 📋 VISÃO GERAL DO SISTEMA

Sistema web integrado para Prestação de Contas de Convênios com validação rigorosa conforme padrões AUDESP/TCE-SP, incluindo:

- ✅ Formulário hierárquico com 27+ seções
- ✅ Validação em tempo real com JSON Schema AUDESP v1.9
- ✅ Visualizador JSON interativo
- ✅ OCR inteligente e importação PDF
- ✅ Gerador de relatórios (PDF, Excel, XML)
- ✅ Transmissão WebService AUDESP
- ✅ Trilhas de auditoria e permissões
- ✅ Dashboard administrativo

---

## 🏗️ ARQUITETURA TÉCNICA

### Frontend Stack
```
React 18 + TypeScript
├── Tailwind CSS (UI)
├── Lucide React (Ícones)
├── Tesseract.js (OCR)
├── PDF.js (Visualização)
├── Google Gemini API (IA/OCR)
└── pdfkit + xlsx (Relatórios)
```

### Backend Stack
```
Node.js + Express (TypeScript)
├── TypeORM (Banco de dados)
├── PostgreSQL (Dados)
├── JWT + OAuth (Autenticação)
├── Winston (Logs)
└── Nodemailer (Emails)
```

### Integrações Externas
```
├── AUDESP WebService (Transmissão)
├── Google Gemini (OCR + IA)
├── Sistema TCE-SP (Validação)
└── APIs Municipais (CNPJ/CPF)
```

---

## 📊 FASES DE IMPLEMENTAÇÃO

### FASE 1: Fundação (1-2 semanas)
**Objetivo**: Criar a base estrutural com validação

#### 1.1 JSON Schema AUDESP v1.9 Completo
- [ ] Criar arquivo `audesp-schema-v1.9.json` com todas as definições
- [ ] Incluir regras condicionais (depende de campos)
- [ ] Máscaras e formatos (CPF, CNPJ, datas, moedas)
- [ ] Enumerações (tipos de documentos, códigos de município)
- [ ] Validações customizadas

**Arquivo**: `/src/schemas/audesp-schema-v1.9.json`

#### 1.2 Motor de Validação
- [ ] Criar classe `AUDESPValidator` com AJV
- [ ] Implementar validações customizadas
- [ ] Regras de negócio (pagamento ≤ documento, datas válidas)
- [ ] Caminhos de erro detalhados

**Arquivo**: `/src/services/AUDESPValidator.ts`

#### 1.3 Tipos TypeScript
- [ ] Expandir `types.ts` com todas as interfaces
- [ ] Tipos para cada seção do formulário
- [ ] Tipos para respostas de validação

**Arquivo**: `/src/types.ts`

---

### FASE 2: Formulário Avançado (2-3 semanas)
**Objetivo**: Interface completa e responsiva com validação em tempo real

#### 2.1 Sistema de Seções Dinâmicas
- [ ] Criar componente `SectionManager.tsx`
  - Renderização dinâmica de seções
  - Estado de expansão/colapso
  - Indicadores de progresso (✅/⚠️/❌)
- [ ] Menu lateral hierárquico navegável
- [ ] Atalhos para saltar para seção

**Arquivo**: `/src/components/SectionManager.tsx`

#### 2.2 Componentes de Campos
- [ ] `TextInput.tsx` - com máscara CPF/CNPJ/datas
- [ ] `MoneyInput.tsx` - formatação de valores
- [ ] `DateInput.tsx` - calendário e validação
- [ ] `SelectInput.tsx` - dropdowns com busca
- [ ] `ArrayInput.tsx` - adicionar/remover itens
- [ ] `ConditionalField.tsx` - mostrar se condição verdadeira

**Diretório**: `/src/components/fields/`

#### 2.3 Validação Instantânea
- [ ] Campo muda → Valida → Mostra feedback
- [ ] Tooltip com regras de validação
- [ ] Ícones: ✅ (válido), ⚠️ (alerta), ❌ (erro)
- [ ] Mensagens de erro contextualizadas

**Arquivo**: `/src/hooks/useFieldValidation.ts`

#### 2.4 Painel de Erros em Tempo Real
- [ ] Lista todos os erros com caminhos JSON
- [ ] Clicável para pular para campo
- [ ] Agrupado por seção
- [ ] Contador de erros

**Arquivo**: `/src/components/ErrorPanel.tsx`

---

### FASE 3: Visualizador JSON (1 semana)
**Objetivo**: Panel interativo de visualização e edição JSON

#### 3.1 Editor JSON em Tempo Real
- [ ] Componente `JSONViewer.tsx`
- [ ] Atualização sincronizada com formulário
- [ ] Destaque de erros em vermelho
- [ ] Busca dentro do JSON
- [ ] Copiar para clipboard

**Arquivo**: `/src/components/JSONViewer.tsx`

#### 3.2 Editor Manual JSON
- [ ] Permitir edição direta no JSON
- [ ] Sincronização bidirecional
- [ ] Validação de sintaxe em tempo real
- [ ] Sugestões automáticas

**Arquivo**: `/src/components/JSONEditor.tsx`

#### 3.3 Export JSON
- [ ] Botão "Copiar JSON"
- [ ] Botão "Download JSON"
- [ ] Botão "Compartilhar (QR Code)"

**Arquivo**: `/src/components/JSONExporter.tsx`

---

### FASE 4: OCR e Importação PDF (2-3 semanas)
**Objetivo**: Extração inteligente de documentos

#### 4.1 Módulo OCR
- [ ] Integração Tesseract.js (local)
- [ ] Integração Google Gemini (nuvem, mais preciso)
- [ ] Processamento paralelo de múltiplos PDFs
- [ ] Feedback de progresso

**Arquivo**: `/src/services/OCRService.ts`

#### 4.2 Classificador de Documentos
- [ ] Treinar/usar modelo para identificar tipo:
  - Nota Fiscal
  - Contrato
  - Comprovante de Pagamento
  - Recibo
  - Folha de Pagamento
- [ ] Usar Gemini Vision API

**Arquivo**: `/src/services/DocumentClassifier.ts`

#### 4.3 Extrator de Campos
- [ ] Identificar CNPJ/CPF
- [ ] Extrair datas (várias formatos)
- [ ] Extrair valores (com símbolo de moeda)
- [ ] Extrair números de documentos
- [ ] Extrair partes (empresa, fornecedor, etc)

**Arquivo**: `/src/services/FieldExtractor.ts`

#### 4.4 Relacionamento Inteligente
- [ ] Sugerir associação a contratos existentes
- [ ] Detectar duplicatas
- [ ] Alertar sobre divergências de valor
- [ ] Agrupar documentos relacionados

**Arquivo**: `/src/services/DocumentLinker.ts`

#### 4.5 Interface de Revisão Manual
- [ ] Componente `PDFReviewPanel.tsx`
- [ ] Preview do PDF extraído
- [ ] Campos editáveis com valores extraídos
- [ ] Confirmar/Corrigir antes de importar
- [ ] Histórico de extrações

**Arquivo**: `/src/components/PDFReviewPanel.tsx`

---

### FASE 5: Relatórios (1-2 semanas)
**Objetivo**: Geração de relatórios profissionais

#### 5.1 Gerador de Relatórios
- [ ] Classe `ReportGenerator.ts`
- [ ] Templates para cada tipo de relatório
- [ ] Dados agregados e resumidos

**Arquivo**: `/src/services/ReportGenerator.ts`

#### 5.2 Relatórios em PDF
- [ ] Demonstrativo de Execução Financeira
- [ ] Relação de Documentos Fiscais
- [ ] Relação de Pagamentos
- [ ] Conciliação de Saldos
- [ ] Relatório de Bens e Empregados
- [ ] Parecer Técnico

Usando: `pdfkit` ou `react-pdf`

**Arquivo**: `/src/services/PDFReporter.ts`

#### 5.3 Relatórios em Excel
- [ ] Usando biblioteca `xlsx`
- [ ] Formatação profissional
- [ ] Gráficos e resumos
- [ ] Filtros automáticos

**Arquivo**: `/src/services/ExcelReporter.ts`

#### 5.4 Relatórios em XML
- [ ] Formato compatível AUDESP
- [ ] Estrutura de dados normalizada

**Arquivo**: `/src/services/XMLReporter.ts`

---

### FASE 6: Validação Avançada (1 semana)
**Objetivo**: Regras de negócio rigorosas

#### 6.1 Motor de Regras de Negócio
- [ ] Classe `BusinessRulesEngine.ts`
- [ ] Validações complexas
  - Pagamento ≤ Documento Fiscal
  - Datas dentro do período de vigência
  - Códigos de município válidos
  - CPF/CNPJ válidos (algoritmo)
  - Campos obrigatórios conforme JSON Schema
- [ ] Alertas automáticos

**Arquivo**: `/src/services/BusinessRulesEngine.ts`

#### 6.2 Detector de Divergências
- [ ] Identificar inconsistências
- [ ] Gerar relatório de pendências
- [ ] Sugerir correções

**Arquivo**: `/src/services/DivergenceDetector.ts`

---

### FASE 7: Transmissão AUDESP (1-2 semanas)
**Objetivo**: Envio seguro ao Tribunal de Contas

#### 7.1 Cliente WebService AUDESP
- [ ] Classe `AUDESPWebService.ts`
- [ ] Autenticação com credenciais do órgão
- [ ] Serialização para formato AUDESP
- [ ] Tratamento de rejeições

**Arquivo**: `/src/services/AUDESPWebService.ts`

#### 7.2 Assinatura Digital
- [ ] Integração com certificado digital (A1/A3)
- [ ] Assinatura XML quando necessária
- [ ] Validação de certificado

**Arquivo**: `/src/services/DigitalSignatureService.ts`

#### 7.3 Histórico de Transmissões
- [ ] Registrar cada envio
- [ ] Armazenar recibos
- [ ] Permitir reenvio

**Arquivo**: `/src/components/TransmissionHistory.tsx`

---

### FASE 8: Segurança e Auditoria (1-2 semanas)
**Objetivo**: Trilhas de auditoria e controle de acesso

#### 8.1 Sistema de Autenticação
- [ ] JWT tokens
- [ ] OAuth2 com provedor municipal
- [ ] Renovação automática de tokens
- [ ] Logout seguro

**Arquivo**: `/src/services/AuthService.ts`

#### 8.2 Sistema de Permissões
- [ ] Roles: Operador, Gestor, Auditor, Administrador, Contador
- [ ] Matrix de permissões por função
- [ ] Proteção de rotas

**Arquivo**: `/src/services/RoleService.ts`

#### 8.3 Trilhas de Auditoria
- [ ] Registrar TODAS as ações de usuário
- [ ] Quem? Quando? O quê? Por quê?
- [ ] Imutável e assinado

**Arquivo**: `/src/services/AuditLogger.ts`

#### 8.4 Criptografia de Dados
- [ ] Dados sensíveis criptografados em repouso
- [ ] HTTPS para transmissões
- [ ] Tokens seguros

**Arquivo**: `/src/services/EncryptionService.ts`

---

### FASE 9: Dashboard Administrativo (1-2 semanas)
**Objetivo**: Panel de controle e análises

#### 9.1 Dashboard Principal
- [ ] Estatísticas de prestações
- [ ] Gráficos de conformidade
- [ ] Alertas críticos
- [ ] Atividades recentes

**Arquivo**: `/src/components/AdminDashboard.tsx`

#### 9.2 Gerenciamento de Usuários
- [ ] Listar usuários
- [ ] Criar/editar permissões
- [ ] Resetar senhas
- [ ] Ver histórico

**Arquivo**: `/src/components/UserManagement.tsx`

#### 9.3 Monitoramento de Transmissões
- [ ] Status de envios
- [ ] Taxa de sucesso
- [ ] Erros comuns
- [ ] Performance

**Arquivo**: `/src/components/TransmissionMonitoring.tsx`

---

### FASE 10: Testes e Deploy (1 semana)
**Objetivo**: Garantir qualidade e disponibilidade

#### 10.1 Testes Unitários
- [ ] Validador: 100% de cobertura
- [ ] Regras de negócio: casos extremos
- [ ] Extractores: PDFs reais

#### 10.2 Testes de Integração
- [ ] Fluxo completo de preenchimento
- [ ] Upload de PDF → JSON
- [ ] Transmissão AUDESP mock

#### 10.3 Testes de Segurança
- [ ] Validação de entrada
- [ ] CORS configurado
- [ ] SQL Injection (se houver SQL)
- [ ] XSS prevention

#### 10.4 Deploy em Produção
- [ ] Configurar variáveis de ambiente
- [ ] SSL/TLS
- [ ] Monitoramento
- [ ] Backup de dados

---

## 📁 ESTRUTURA DE DIRETÓRIOS (FINAL)

```
/src
├── components/
│   ├── fields/
│   │   ├── TextInput.tsx
│   │   ├── MoneyInput.tsx
│   │   ├── DateInput.tsx
│   │   ├── SelectInput.tsx
│   │   ├── ArrayInput.tsx
│   │   └── ConditionalField.tsx
│   ├── SectionManager.tsx
│   ├── JSONViewer.tsx
│   ├── JSONEditor.tsx
│   ├── ErrorPanel.tsx
│   ├── PDFReviewPanel.tsx
│   ├── TransmissionHistory.tsx
│   ├── AdminDashboard.tsx
│   ├── UserManagement.tsx
│   ├── TransmissionMonitoring.tsx
│   └── PrestacaoContasForm.tsx
├── services/
│   ├── AUDESPValidator.ts
│   ├── OCRService.ts
│   ├── DocumentClassifier.ts
│   ├── FieldExtractor.ts
│   ├── DocumentLinker.ts
│   ├── ReportGenerator.ts
│   ├── PDFReporter.ts
│   ├── ExcelReporter.ts
│   ├── XMLReporter.ts
│   ├── BusinessRulesEngine.ts
│   ├── DivergenceDetector.ts
│   ├── AUDESPWebService.ts
│   ├── DigitalSignatureService.ts
│   ├── AuthService.ts
│   ├── RoleService.ts
│   ├── AuditLogger.ts
│   └── EncryptionService.ts
├── hooks/
│   ├── useFieldValidation.ts
│   ├── useFormState.ts
│   ├── useAuth.ts
│   └── useAudit.ts
├── schemas/
│   ├── audesp-schema-v1.9.json
│   └── municipios.json
└── types.ts
```

---

## 🎯 PRIORIDADES

### P0 (Crítico - Começar AGORA)
1. JSON Schema AUDESP v1.9 completo
2. Motor de validação com AJV
3. Componentes de campos com validação instantânea
4. Salvar/carregar formulário

### P1 (Alto - Próximas 2 semanas)
1. Visualizador JSON
2. Painel de erros
3. OCR básico (Tesseract)
4. Importação PDF

### P2 (Médio - Próximas 4 semanas)
1. Relatórios (PDF/Excel)
2. Transmissão AUDESP
3. Sistema de permissões
4. Dashboard admin

### P3 (Baixo - Polimento)
1. Testes unitários
2. Otimizações de performance
3. UI refinements
4. Documentação

---

## 🔗 REFERÊNCIAS E RECURSOS

### Documentação Oficial
- Manual Prestação de Contas AUDESP
- JSON Schema Draft 7 (https://json-schema.org/)
- API TCE-SP

### Bibliotecas Recomendadas
```json
{
  "ajv": "^8.12.0",
  "ajv-formats": "^2.1.1",
  "tesseract.js": "^7.0.0",
  "pdfjs-dist": "^5.4.530",
  "@google/generative-ai": "^0.3.0",
  "xlsx": "^0.18.5",
  "pdfkit": "^0.13.0",
  "crypto-js": "^4.1.1",
  "jsonwebtoken": "^9.1.0"
}
```

### Ferramentas
- Postman (testar API AUDESP)
- VS Code JSON Schema validation
- Docker (PostgreSQL local)

---

## 📈 INDICADORES DE SUCESSO

- ✅ 0 erros de validação em PDFs reais
- ✅ 95%+ de taxa de OCR correto
- ✅ 100% conformidade com JSON Schema AUDESP
- ✅ < 2s para validação de formulário completo
- ✅ Zero rejeições por erro de formato na transmissão
- ✅ Auditoria completa de todas as ações
- ✅ 99.9% uptime em produção

---

## ⏱️ CRONOGRAMA ESTIMADO

| Fase | Duração | Data Início | Data Fim |
|------|---------|-------------|----------|
| 1. Fundação | 1-2 sem | Jan 20 | Jan 31 |
| 2. Formulário | 2-3 sem | Fev 1 | Fev 14 |
| 3. JSON Viewer | 1 sem | Fev 15 | Fev 21 |
| 4. OCR/PDF | 2-3 sem | Fev 22 | Mar 7 |
| 5. Relatórios | 1-2 sem | Mar 8 | Mar 21 |
| 6. Validação Avançada | 1 sem | Mar 22 | Mar 28 |
| 7. Transmissão AUDESP | 1-2 sem | Mar 29 | Abr 11 |
| 8. Segurança | 1-2 sem | Abr 12 | Abr 25 |
| 9. Admin Dashboard | 1-2 sem | Abr 26 | Maio 9 |
| 10. Testes/Deploy | 1 sem | Maio 10 | Maio 16 |
| **TOTAL** | **~15 semanas** | **Jan 20** | **Maio 16** |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Revisar este plano com stakeholders
2. ⏳ Começar FASE 1 (JSON Schema)
3. ⏳ Expandir tipos TypeScript
4. ⏳ Implementar validador
5. ⏳ Criar componentes de campos

---

**Documento preparado para implementação imediata**
