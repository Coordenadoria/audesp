# 📧 Guia: Login por Email - Audesp Connect

## ✨ Nova Funcionalidade: Login por Email

O Audesp Connect v2.1 agora suporta **duas formas de autenticação**:
- 💳 **CPF** - Autenticação tradicional usando CPF + Senha
- 📧 **Email** - Autenticação usando Email + Senha

## 🚀 Como Usar

### 1. Acessar a Tela de Login

```
┌─────────────────────────────────────────┐
│         Audesp Connect v2.0              │
│    Prestação de Contas                   │
└─────────────────────────────────────────┘
        │
        ├─ [💳 CPF]  [📧 Email]  ← Abas de Login
        │     │          │
        │     ✓          ✗ (padrão = CPF)
        │
        └─ Ambiente: 🧪 Piloto | 🚀 Produção
```

### 2. Selecionar o Tipo de Autenticação

#### Opção A: Login via CPF (Padrão)
```
┌─────────────────────────────────────────┐
│  💳 CPF                                  │
│  ────────────────────────────────────────│
│  [CPF:  _______________]                 │
│  [Senha: ••••••••]                       │
│  [Lembrar-me]                            │
│  [Entrar]                                │
└─────────────────────────────────────────┘
```

**Formato CPF:**
- 11 dígitos numéricos
- Aceita com ou sem formatação (123.456.789-00 ou 12345678900)
- Sistema automaticamente remove caracteres não numéricos

**Validação:**
```typescript
const cleanCpf = cpf.replace(/\D/g, ''); // Remove tudo que não é dígito
if (cleanCpf.length !== 11) {
  // Erro: "CPF deve conter 11 dígitos"
}
```

#### Opção B: Login via Email (Novo)
```
┌─────────────────────────────────────────┐
│  📧 Email                                │
│  ────────────────────────────────────────│
│  [Email: seu.email@exemplo.com]          │
│  [Senha: ••••••••]                       │
│  [Lembrar-me]                            │
│  [Entrar]                                │
└─────────────────────────────────────────┘
```

**Formato Email:**
- Deve ser um email válido
- Validação: `usuario@dominio.com`
- Regex utilizado: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Validação:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  // Erro: "Por favor, insira um email válido (exemplo: usuario@example.com)"
}
```

## 🔑 Fluxo de Autenticação

### Passo 1: Preparação das Credenciais

```typescript
// Login via CPF
const credentials = {
  cpf: "12345678900",
  email: undefined,
  password: "SenhaSegura@123"
};

// Login via Email
const credentials = {
  cpf: undefined,
  email: "usuario@dominio.com",
  password: "SenhaSegura@123"
};
```

### Passo 2: Construção do Header de Autenticação

O header é construído dinamicamente baseado no tipo de login:

```typescript
// Ambos os formatos são aceitos pela API Audesp:
// CPF: "12345678900:SenhaSegura@123"
// Email: "usuario@dominio.com:SenhaSegura@123"

const authHeader = `${loginIdentifier}:${credentials.password}`;
// onde loginIdentifier = cpf || email
```

### Passo 3: Envio da Requisição

```bash
POST /login HTTP/1.1
Host: audesp-piloto.tce.sp.gov.br
x-authorization: usuario@dominio.com:SenhaSegura@123
Content-Type: application/json
```

### Passo 4: Resposta do Servidor

```json
{
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "expireAt": 1704067200
}
```

## 📱 Experiência do Usuário

### Fluxo Completo

```
1. Acessa Audesp Connect
   ↓
2. Seleciona Ambiente (Piloto/Produção)
   ↓
3. Escolhe Tipo de Login
   ├─ 💳 CPF
   └─ 📧 Email
   ↓
4. Insere Credenciais
   ├─ CPF: 123.456.789-00
   └─ Senha: ••••••••
   ↓
5. Clica "Entrar"
   ↓
6. Sistema Valida:
   ├─ ✓ Formato correto
   ├─ ✓ Campos preenchidos
   └─ ✓ Requisição ao servidor
   ↓
7. Servidor Audesp:
   ├─ ✓ Credenciais válidas
   └─ → Token JWT gerado
   ↓
8. Sistema Armazena Token
   ├─ sessionStorage (sessão)
   ├─ localStorage (dados de login)
   └─ localStorage (preferências)
   ↓
9. Navegação para Transmissão
```

## 🛡️ Segurança

### Armazenamento de Credenciais

**Nunca Armazenado:**
- ❌ Senhas em plaintext
- ❌ CPF/Email sem encriptação
- ❌ Histórico de tentativas falhas

**Armazenado com Segurança:**
```typescript
// sessionStorage (expires quando fecha browser)
sessionStorage.setItem('audesp_token', token);
sessionStorage.setItem('audesp_expire', expireAt);

// localStorage (opcional, se "Lembrar-me" marcado)
localStorage.setItem('audesp_last_environment', environment);
localStorage.setItem('audesp_last_login_type', loginType); // 'cpf' ou 'email'
localStorage.setItem('audesp_last_cpf', cpf); // Apenas CPF, não email por segurança
```

### Validações

| Campo | Validação | Exemplo |
|-------|-----------|---------|
| **CPF** | 11 dígitos | 123.456.789-00 |
| **Email** | Formato válido | usuario@dominio.com |
| **Senha** | Não vazio | (Min. 8 caracteres recomendado) |

## 🔄 Mudança entre Tipos de Login

Usuário pode alternar entre CPF e Email na mesma sessão:

```
Status: Não Autenticado
   ↓
[💳 CPF] [📧 Email] ← Clica na aba desejada
   ↓
Campos são limpos/resetados
   ↓
Novos dados são inseridos
   ↓
Login é executado com novo tipo
```

## ⚙️ Configuração para Desenvolvedores

### Interface TypeScript

```typescript
interface LoginCredentials {
  cpf?: string;        // Opcional se usando email
  email?: string;      // Opcional se usando CPF
  password: string;    // Obrigatório
}
```

### Serviço de Autenticação

```typescript
class EnhancedAuthService {
  static async login(credentials: LoginCredentials): Promise<AuthToken> {
    // Determina qual identificador usar
    const loginIdentifier = credentials.cpf || credentials.email;
    
    // Valida que pelo menos um foi fornecido
    if (!loginIdentifier) {
      throw new Error('CPF ou Email é obrigatório');
    }
    
    // Constrói header de autenticação
    const authHeader = `${loginIdentifier}:${credentials.password}`;
    
    // Envia para API Audesp
    // ... resto da lógica ...
  }
}
```

## 🐛 Troubleshooting

### Erro: "Email inválido"
**Causa:** Formato de email incorreto
**Solução:** Use formato `usuario@dominio.com`

### Erro: "CPF deve conter 11 dígitos"
**Causa:** CPF com número incorreto de dígitos
**Solução:** Verifique se o CPF tem 11 dígitos (com ou sem formatação)

### Erro: "Por favor, insira um CPF válido"
**Causa:** Campo de CPF vazio
**Solução:** Insira um CPF válido antes de clicar "Entrar"

### Erro: "Credencial fornecida não é válida" (401)
**Causa:** Credenciais incorretas ou usuário sem permissão
**Solução:** 
- Verifique CPF/Email e senha
- Certifique-se que usuário tem permissão de transmissão no Audesp
- Clique em "Fazer Login Novamente" para tentar com outro usuário

## 📊 Exemplos de Uso

### Exemplo 1: Login via CPF

```typescript
// Dados de entrada do usuário
const cpf = "123.456.789-00";
const password = "MinhaSenh@123";
const environment = "piloto";

// Sistema processa
const credentials = {
  cpf: "12345678900",
  email: undefined,
  password: "MinhaSenh@123"
};

// Envia ao servidor Audesp
// Header: x-authorization: 12345678900:MinhaSenh@123

// Sucesso! Token recebido
// Armazena em sessionStorage
// Usuário pode transmitir prestação de contas
```

### Exemplo 2: Login via Email

```typescript
// Dados de entrada do usuário
const email = "usuario@tce.sp.gov.br";
const password = "OutraSenha@456";
const environment = "producao";

// Sistema processa
const credentials = {
  cpf: undefined,
  email: "usuario@tce.sp.gov.br",
  password: "OutraSenha@456"
};

// Envia ao servidor Audesp
// Header: x-authorization: usuario@tce.sp.gov.br:OutraSenha@456

// Sucesso! Token recebido
// Armazena em sessionStorage
// Usuário pode transmitir prestação de contas
```

## 🔗 Referências Relacionadas

- [Guia Login CPF Tradicional](./GUIA_RESOLVER_ERRO_401.md)
- [Envio de Transmissão](./QUICK_START_TRANSMISSAO.md)
- [Tratamento de Erros](./COMO_RESOLVER_ERRO_401.md)
- [Documentação Completa](./DOCUMENTATION_INDEX.md)

---

**Versão:** 2.1 | **Data:** 2024 | **Status:** ✅ Produção
