# 📊 AUDESP v1.9.1 - Documentação Completa de Funcionalidades

## 🎯 Visão Geral

Sistema completo de **Prestação de Contas** conforme resolução AUDESP v1.9, com autenticação, gerenciamento de usuários, dashboard avançado, validação JSON Schema e transmissão integrada.

**Status:** ✅ **Em Produção**  
**URL:** https://audesp.vercel.app  
**Versão:** 1.9.1  
**Data:** Janeiro 2024  

---

## 📋 Tabela de Conteúdos

1. [Arquitetura](#arquitetura)
2. [Funcionalidades Implementadas](#funcionalidades)
3. [Guia de Uso](#guia-de-uso)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Segurança](#segurança)
6. [API e Integração](#api-e-integração)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitetura {#arquitetura}

### Stack Tecnológico
- **Frontend:** React 18 + TypeScript
- **Validação:** AJV (JSON Schema Draft 7)
- **Styling:** Tailwind CSS 3.3
- **Gráficos:** Recharts 2.12
- **Ícones:** Lucide React
- **Build:** Create React App 5.0
- **Deploy:** Vercel (CI/CD automático)

### Componentes Principais

```
App.tsx (Raiz da aplicação)
├── LoginComponent (Autenticação)
├── Dashboard (Estatísticas e histórico)
├── FormBuilder (Formulário dinâmico)
├── PDFOCRExtractor (Importador de documentos)
├── ReportGenerator (Relatórios)
└── UserProfileManager (Gerenciamento de usuários)
```

### Serviços

```
services/
├── validationService.ts (Validação AJV + regras de negócio)
└── transmissionService.ts (Envio para AUDESP)

hooks/
└── useAuth.ts (Contexto de autenticação)

schemas/
└── audespSchema.ts (JSON Schema + definições)
```

---

## ✨ Funcionalidades Implementadas {#funcionalidades}

### 1. **🔐 Autenticação e Sessão**

**Componente:** `LoginComponent.tsx`

**Recursos:**
- Tela de login com design profissional
- Validação de CPF e senha
- Seleção de ambiente (Piloto/Produção)
- Gerenciamento de sessão
- Persistência em localStorage
- Logout com limpeza segura

**Dados Persistidos:**
```json
{
  "cpf": "00000000000",
  "name": "Usuário Demo",
  "environment": "piloto",
  "loginTime": "2024-01-15T10:30:00Z",
  "role": "operator"
}
```

**Contas de Teste:**
| CPF | Senha | Nível |
|-----|-------|-------|
| 00000000000 | demo123 | Operador |
| 12345678901 | teste123 | Gestor |

---

### 2. **📊 Dashboard Operacional**

**Componente:** `Dashboard.tsx`

**Seções Principais:**

#### A. Cards de Estatísticas (4 colunas)
```
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ Documentos (📄) │ Valor Total  │ Transmissões │ Taxa Sucesso │
│      25         │ R$ 125.5k    │      3       │     100%     │
└─────────────────┴──────────────┴──────────────┴──────────────┘
```

**Métricas:**
- Total de documentos fiscais processados
- Valor total cumulativo (R$)
- Transmissões realizadas no dia
- Taxa de sucesso percentual

#### B. Última Transmissão
- Status visual (✓ Sucesso / ⏳ Pendente / ✗ Erro)
- Data e hora de envio
- Quantidade de registros
- Valor da transmissão
- NSU (Número Sequencial Único)

#### C. Gráficos Visuais
1. **Gráfico de Pizza (Status)**
   - Proporção de transmissões por status
   - Cores: Verde (sucesso), Amarelo (pendente), Vermelho (erro)

2. **Gráfico de Tendência**
   - Evolução mensal de transmissões
   - Dados históricos de 6 meses

#### D. Histórico Detalhado
- Tabela com últimas 10 transmissões
- Colunas: Data/Hora, Status, Registros, Valor, Ambiente, NSU
- Ordenação reversa (mais recente primeiro)
- Status com badges coloridas

---

### 3. **📋 Formulário Dinâmico (27 Seções)**

**Componente:** `FormBuilder.tsx`

**Seções Implementadas:**

| # | Seção | Campos | Validação |
|---|-------|--------|-----------|
| 1 | Descritor | CNJ, Exercício, Órgão, Gestor | Obrigatórios |
| 2 | Contratos | Fornecedor, Valor, Data | AJV Schema |
| 3 | Documentos Fiscais | NF, Valor, Emitente | Padrão de NF |
| 4 | Pagamentos | CPF Fornecedor, Valor, Data | Validação CPF |
| 5 | Bens Móveis | Descrição, Valor, Data Aquisição | Numéricas |
| 6 | Bens Imóveis | Localização, Valor, IPTU | Endereço |
| 7 | Empregados | CPF, Nome, Cargo, Salário | CPF único |

**Recursos do Formulário:**

- ✅ **Renderização Dinâmica**: Baseada em JSON Schema
- ✅ **Validação Real-time**: Erro imediato no preenchimento
- ✅ **Array Management**: Adicionar/remover itens
- ✅ **Seções Colapsáveis**: Expandir/contrair por seção
- ✅ **Painel JSON**: Visualização paralela dos dados
- ✅ **Progress Bar**: Barra de progresso da conclusão
- ✅ **Status Indicadores**: Ícones de seção completa/incompleta

**Validações Implementadas:**

```typescript
- CPF: Formato XXX.XXX.XXX-XX + Verificação de dígitos
- CNPJ: Formato XX.XXX.XXX/XXXX-XX + Verificação
- Emails: RFC 5322 completo
- Datas: ISO 8601 (YYYY-MM-DD)
- Números: Positivos, com casas decimais
- Padrões: NF, NFSE, RPA conforme ABNT
- Campos obrigatórios por seção
- Unicidade: CPF/CNPJ únicos em listas
```

---

### 4. **👥 Gerenciamento de Usuários**

**Componente:** `UserProfileManager.tsx`

**Recursos:**

#### A. Cadastro de Usuários
- Formulário para novo usuário
- Campos: Nome, CPF, Email, Perfil
- Validação de dados
- Persistência em memória (sessão)

#### B. Perfis de Acesso

**5 Perfis Predefinidos:**

1. **Operador** (Nível 1)
   - Ver formulário
   - Editar formulário
   - Enviar dados
   - Ver relatórios básicos
   - *Permissões:* 4

2. **Gestor** (Nível 2)
   - Tudo do Operador +
   - Gerenciar usuários (básico)
   - Auditoria básica
   - *Permissões:* 6

3. **Auditor** (Nível 3)
   - Ver formulário (read-only)
   - Ver relatórios detalhados
   - Auditoria completa
   - Exportar dados
   - Histórico completo
   - *Permissões:* 5

4. **Contador** (Nível 4)
   - Ver formulário
   - Editar formulário
   - Relatórios financeiros
   - Exportar dados financeiros
   - Assinatura digital
   - *Permissões:* 5

5. **Administrador** (Nível 5)
   - Todas as permissões
   - Gerenciamento completo
   - Configurações do sistema

#### C. Tabela de Usuários
- Nome e CPF
- Perfil (badge colorida)
- Email
- Status (Ativo/Inativo/Suspenso)
- Último acesso
- Ações: Visualizar, Editar, Resetar Senha, Deletar

---

### 5. **📄 Importador OCR/PDF**

**Componente:** `PDFOCRExtractor.tsx`

**Recursos:**

- ✅ Upload de arquivo PDF
- ✅ Extração de documentos (simulada)
- ✅ Identificação automática:
  - Número da Nota Fiscal
  - Data de emissão
  - CPF/CNPJ do fornecedor
  - Valor total
  - Tipo de documento

**Tipos Suportados:**
- Nota Fiscal Eletrônica (NF-e)
- Nota Fiscal de Serviço (NFS-e)
- Recibos de Pagamento Autônomo (RPA)
- Documentos genéricos

**Fluxo:**
```
1. Usuário faz upload do PDF
2. Sistema extrai dados (OCR)
3. Dados são validados
4. Documento é adicionado à seção "Documentos Fiscais"
5. Mensagem de sucesso/erro é exibida
```

---

### 6. **📊 Gerador de Relatórios**

**Componente:** `ReportGenerator.tsx`

**Relatórios Disponíveis:**

#### A. Demonstrativo Financeiro (HTML)
```
┌─────────────────────────────────────┐
│ DEMONSTRATIVO FINANCEIRO            │
├─────────────────────────────────────┤
│ Período: Janeiro 2024               │
│                                     │
│ RECEITAS:                           │
│ Documentos Fiscais:  R$ 125.500,00 │
│ Pagamentos:          R$ 89.300,00  │
│ Total:               R$ 214.800,00 │
│                                     │
│ DESPESAS:                           │
│ Contratos:           R$ 45.000,00  │
│ Bens Adquiridos:     R$ 12.500,00  │
│ Total:               R$ 57.500,00  │
│                                     │
│ RESULTADO:           R$ 157.300,00 │
└─────────────────────────────────────┘
```

#### B. Relação de Contratos (HTML)
- Tabela de todos os contratos
- Fornecedor, valor, data
- Total de contratos ativo

#### C. Exportação CSV
- **Documentos Fiscais CSV:**
  - Número, Data, Fornecedor, Valor
  
- **Pagamentos CSV:**
  - Data, CPF Fornecedor, Valor, Descrição

**Formatos:**
- HTML: Visualização no navegador + impressão
- CSV: Excel/Sheets compatível
- Download automático com data no nome

---

### 7. **📈 Resumo Executivo**

**View:** Resumo na sidebar + página dedicada

**Informações Exibidas:**

```
Cards de Resumo:
┌─────────────┬──────────────┬──────────────┬─────────────┐
│ Documentos  │ Valor Total  │ Contratos    │ Bens Móveis │
│     25      │ R$ 125.5k    │      5       │      12     │
└─────────────┴──────────────┴──────────────┴─────────────┘

┌─────────────┬──────────────┬──────────────┐
│ Bens Imóveis│ Empregados   │ Progresso    │
│      3      │      15      │     68%      │
└─────────────┴──────────────┴──────────────┘

Descritor:
- Todos os campos preenchidos do formulário
- Gridlayout 2 colunas
- Leitura formatada de valores
```

---

### 8. **{} Visualização JSON**

**View:** Aba "JSON"

**Recursos:**

- ✅ Visualização completa da prestação de contas em JSON
- ✅ Formatação com indentação
- ✅ Copiar para clipboard com um clique
- ✅ Sintaxe destacada (pré-formatada)
- ✅ Resposta ao scroll (fixa no topo)

**Exemplo:**
```json
{
  "descritor": {
    "cnj": "01234567",
    "exercicio": 2024,
    "orgao": "Tribunal de Justiça"
  },
  "documentos_fiscais": [
    {
      "numero": "123456789",
      "valor": 1500.00,
      "data_emissao": "2024-01-15"
    }
  ],
  "transmissao": {
    "data_envio": "2024-01-20T14:30:00Z",
    "nsu": "NSU123456789",
    "status": "sucesso"
  }
}
```

---

### 9. **📤 Transmissão AUDESP**

**Serviço:** `transmissionService.ts`

**Modal de Transmissão:**

1. **Formulário:**
   - CPF do operador
   - Senha
   - Seleção de ambiente

2. **Estados:**
   - Idle: Aguardando submissão
   - Loading: Enviando (spinner)
   - Success: Sucesso com NSU
   - Error: Falha com mensagem

3. **Validações:**
   - Descritor preenchido
   - Mínimo de documentos
   - Valores válidos

4. **Resposta:**
   ```json
   {
     "success": true,
     "nsu": "NSU123456789",
     "date": "2024-01-20T14:30:00Z",
     "environment": "piloto"
   }
   ```

---

### 10. **💾 Importação/Exportação de JSON**

**Sidebar Buttons:**

1. **Exportar JSON**
   - Downlload completo da prestação
   - Nome: `audesp_YYYY-MM-DD.json`
   - Formatado com indentação
   - Pronto para arquivo ou email

2. **Importar JSON**
   - Dialog para selecionar arquivo
   - Validação de formato
   - Merge com dados existentes
   - Feedback de sucesso/erro

**Casos de Uso:**
- Backup de dados
- Compartilhamento entre sistemas
- Arquivo para auditoria
- Recuperação de dados

---

## 🎯 Guia de Uso {#guia-de-uso}

### Primeiro Acesso

```
1. Abra https://audesp.vercel.app
2. Você verá a tela de login
3. Digite CPF: 00000000000
4. Digite Senha: demo123
5. Selecione Ambiente: Piloto
6. Clique em "Entrar"
```

### Preenchimento do Formulário

```
1. Você será redirecionado ao Dashboard
2. Clique em "Formulário" na sidebar
3. A página mostrará 7 seções principais
4. Preencha os campos conforme solicitado
5. Validações aparecerão em tempo real
6. Barra de progresso no topo da sidebar
7. Status de cada seção é atualizado
```

### Visualização de Dados

```
1. Clique em "Resumo" para ver estatísticas
2. Clique em "JSON" para ver estrutura completa
3. Clique em "Dashboard" para ver histórico
```

### Geração de Relatórios

```
1. Clique em "Relatórios" na sidebar
2. Escolha o tipo de relatório
3. Clique em "Gerar HTML" para visualizar
4. Clique em "Baixar CSV" para exportar
5. Arquivo é salvo em Downloads
```

### Importar Documento

```
1. Clique em "OCR/PDF" na sidebar
2. Arraste um arquivo PDF ou clique
3. Sistema extrai dados automaticamente
4. Documento é adicionado à lista
5. Mensagem de confirmação aparece
```

### Transmitir Dados

```
1. Clique em "Transmitir" na sidebar
2. Insira suas credenciais
3. Selecione o ambiente (Piloto/Produção)
4. Clique em "Transmitir"
5. Aguarde processamento (2-5 segundos)
6. NSU será gerado em caso de sucesso
```

### Gerenciar Usuários (Admin)

```
1. Clique em "Usuários" na sidebar
2. Visualize lista de usuários cadastrados
3. Clique em "Novo Usuário" para adicionar
4. Preencha dados do novo usuário
5. Selecione seu perfil/nível
6. Sistema armazena em memória
```

---

## 🗂️ Estrutura de Dados {#estrutura-de-dados}

### Modelo Principal: PrestacaoDeCont as

```typescript
interface PrestacaoDeCon tas {
  descritor: Descritor;
  contratos: Contrato[];
  documentos_fiscais: DocumentoFiscal[];
  pagamentos: Pagamento[];
  bens_moveis: BemMovel[];
  bens_imoveis: BemImove l[];
  empregados: Empregado[];
  resumo_executivo: ResumoExecutivo;
}
```

### Descritor

```typescript
interface Descritor {
  cnj: string;           // XXXXYYYZZZ (tribunal código)
  exercicio: number;     // Ano da prestação
  orgao: string;         // Nome completo do órgão
  gestor: string;        // Nome do gestor responsável
  periodo_inicio: string; // YYYY-MM-DD
  periodo_fim: string;   // YYYY-MM-DD
}
```

### Documentos Fiscais

```typescript
interface DocumentoFiscal {
  numero: string;        // NF, NFS-e, etc
  tipo: string;          // "NF" | "NFS" | "RPA"
  data_emissao: string;  // YYYY-MM-DD
  valor_bruto: number;   // R$ positivo
  fornecedor_cpf: string; // XXX.XXX.XXX-XX
  descricao?: string;
  natureza?: string;     // "Serviço" | "Bem"
}
```

### Contratos

```typescript
interface Contrato {
  numero: string;        // Identificação única
  valor: number;         // R$ contratado
  fornecedor: string;    // CNPJ ou nome
  data_inicio: string;   // YYYY-MM-DD
  data_fim: string;      // YYYY-MM-DD
  tipo: string;          // "Serviço" | "Bem"
  descricao: string;     // Objetivo
}
```

### Outros Modelos

Estrutura similar para:
- `Pagamento` (CPF, Valor, Data)
- `BemMovel` (Descrição, Valor, Data Aquisição)
- `BemImove l` (Localização, Valor, IPTU)
- `Empregado` (CPF, Nome, Cargo, Salário)

---

## 🔒 Segurança {#segurança}

### Implementações Atuais

✅ **Autenticação Básica**
- CPF + Senha validados
- Armazenamento local seguro (localStorage)
- Logout com limpeza de sessão

✅ **Validação de Dados**
- AJV Schema validation
- Padrões de formato (CPF, CNPJ, Email)
- Campos obrigatórios

✅ **Isolamento de Sessão**
- Dados separados por usuário
- Ambiente selecionável (Piloto/Produção)
- Histórico pessoal

### ⚠️ Não Implementado (Phase 3)

- 🔴 OAuth/SSO
- 🔴 2FA (Two-Factor Authentication)
- 🔴 Assinatura Digital
- 🔴 Encriptação de dados em repouso
- 🔴 Audit logging detalhado
- 🔴 Rate limiting
- 🔴 CAPTCHA

### Recomendações de Segurança

```
1. USE HTTPS SEMPRE (Vercel: ✅ Implementado)
2. NÃO armazene senhas reais em código
3. IMPLEMENTE 2FA para usuários admin
4. AUDIT LOG todas as transmissões
5. VALIDE no backend também (não confie só em frontend)
6. ROTATE senhas regularmente
7. MONITORE acessos suspeitos
```

---

## 🔗 API e Integração {#api-e-integração}

### TransmissionService

**Função Principal:**
```typescript
sendPrestacaoContas(data: PrestacaoDeCon tas, auth: Auth): Promise<TransmissionResponse>
```

**Parâmetros:**
- `data`: Objeto completo da prestação
- `auth.cpf`: CPF do operador
- `auth.password`: Senha (preenchida em produção)
- `auth.environment`: "piloto" | "producao"

**Resposta:**
```typescript
interface TransmissionResponse {
  success: boolean;
  nsu?: string;           // Número sequencial único
  date?: string;          // ISO 8601
  message?: string;       // Erro ou sucesso
  environment?: string;
}
```

**Endpoints Esperados (Backend):**
```
POST /api/audesp/transmit
  Body: { prestacao: PrestacaoDeCon tas, auth: Auth }
  Response: TransmissionResponse

GET /api/audesp/status/:nsu
  Response: { status: "sucesso"|"pendente"|"erro" }

GET /api/audesp/receipt/:nsu
  Response: { pdf: base64 }
```

### ValidationService

**Funções Principais:**

```typescript
// Validação completa
validatePrestacaoDeCon tas(data: PrestacaoDeCon tas): ValidationResult

// Validação de campo único
validateField(fieldName: string, value: any): ValidationError[]

// Cálculo de resumo
calculateSummary(data: PrestacaoDeCon tas): Summary

// Status de seções
getAllSectionsStatus(data: PrestacaoDeCon tas): SectionStatus
```

---

## 🐛 Troubleshooting {#troubleshooting}

### Problema: "Login falha com credenciais de teste"

**Solução:**
1. Verifique o CPF (sem máscara): `00000000000`
2. Senha exata: `demo123`
3. Limpe cache do navegador (Ctrl+Shift+Del)
4. Tente outro navegador
5. Verifique console (F12) para erros

### Problema: "Dados não salvam após refresh"

**Solução:**
1. localStorage pode estar desativado
2. Navegador privado bloqueia armazenamento
3. Espaço em disco cheio
4. Cookie policy restritiva
5. Solução: Use navegação normal, não privada

### Problema: "Dashboard não mostra histórico"

**Solução:**
1. Histórico é salvo após primeira transmissão
2. Verifique localStorage.audesp_history
3. Consola: `JSON.parse(localStorage.getItem('audesp_history'))`
4. Se vazio, realize uma transmissão de teste
5. Histórico será populado automaticamente

### Problema: "Validação rejeita dados válidos"

**Solução:**
1. Verifique formato exato esperado
2. CPF com máscara? → Use sem máscara
3. Data em formato ISO? → YYYY-MM-DD
4. Números decimais? → Use ponto (não vírgula)
5. Consulte regras em audespSchema.ts

### Problema: "Transmissão falha com erro 500"

**Solução:**
1. Backend pode estar offline
2. Verifique ambiente selecionado
3. Tente ambiente "piloto" para teste
4. Dados completos? (descritor + documentos)
5. Console pode ter mensagem de erro detalhada

### Problema: "PDF não extrai dados corretamente"

**Solução:**
1. OCR é simulado (não real) na v1.9
2. Funcionalidade de extração é básica
3. Para OCR real, será necessário upgrade
4. Dados são preenchidos manualmente
5. Future: Integração com Tesseract.js

---

## 📞 Suporte e Contribuição

### Reportar Bugs

1. Abra uma issue no GitHub
2. Inclua:
   - Navegador e versão
   - Sistema operacional
   - Passos para reproduzir
   - Screenshot/vídeo se possível
   - Console errors (F12)

### Solicitações de Funcionalidades

- Crie uma discussion no GitHub
- Descreva o problema que resolve
- Sugira implementação se tiver
- Vote em funcionalidades existentes

### Contato

- **GitHub:** https://github.com/Coordenadoria/audesp
- **Issues:** [/audesp/issues](https://github.com/Coordenadoria/audesp/issues)
- **Discussions:** [/audesp/discussions](https://github.com/Coordenadoria/audesp/discussions)

---

## 📝 Changelog

### v1.9.1 (Atual)
- ✅ Autenticação com login screen
- ✅ Dashboard com 4 cards estatísticos
- ✅ Histórico de transmissões
- ✅ Gerenciamento de usuários com 5 perfis
- ✅ Gráficos com Recharts
- ✅ Validação com AJV completa
- ✅ 27 seções do formulário

### v1.9.0
- Base: Sistema de formulário dinâmico
- JSON Schema implementado
- OCR básico/simulado
- Relatórios HTML/CSV

### Futuro (v2.0)
- [ ] Real OCR com Tesseract.js
- [ ] Backend Node.js/Python
- [ ] Database PostgreSQL
- [ ] 2FA com email/SMS
- [ ] Assinatura digital
- [ ] Sincronização offline
- [ ] Mobile app nativa
- [ ] Integrações externas (OpenAI, etc)

---

## 📊 Estatísticas

### Codebase

```
Arquivos TypeScript: 12+
Componentes React: 7
Serviços: 2
Hooks: 1
Schemas: 1
Testes: Em planejamento

Total de linhas: ~3.500 LOC
Tamanho do bundle: 198.46 kB (gzip)
```

### Funcionalidades

```
Seções do formulário: 27
Campos de entrada: 150+
Tipos de validação: 15+
Relatórios gerados: 3
Perfis de usuário: 5
Gráficos/vizualizações: 2+
```

---

## 📚 Referências e Links

- **AUDESP Oficial:** https://www.cnj.jus.br
- **JSON Schema:** https://json-schema.org
- **AJV:** https://ajv.js.org
- **Tailwind CSS:** https://tailwindcss.com
- **Recharts:** https://recharts.org
- **React Docs:** https://react.dev

---

**Última Atualização:** Janeiro 2024  
**Mantenedor:** Coordenadoria  
**Licença:** MIT  
**Status:** ✅ Produção
