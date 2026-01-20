
# 📚 DOCUMENTAÇÃO - AUDESP API SERVICE V2

## Integração Completa com AUDESP TCE-SP

**Versão**: 2.0.0  
**Data**: Janeiro 2026  
**Status**: ✅ Pronto para Produção  
**Conformidade**: OpenAPI 3.0 | LGPD | JSON Schema AUDESP

---

## 📋 SUMÁRIO

1. [Visão Geral](#visão-geral)
2. [Instalação e Setup](#instalação-e-setup)
3. [Autenticação](#autenticação)
4. [Fase IV - Licitações](#fase-iv)
5. [Fase V - Prestação de Contas](#fase-v)
6. [Consulta de Protocolos](#consulta)
7. [Tratamento de Erros](#erros)
8. [Auditoria](#auditoria)
9. [Configuração Avançada](#avançado)
10. [Checklist de Conformidade](#checklist)

---

## <a id="visão-geral"></a>1. VISÃO GERAL

### O que é?

`AudespApiServiceV2` é um módulo enterprise-grade para integração segura e robusta com as APIs do AUDESP (Tribunal de Contas do Estado de São Paulo).

### Características

✅ **Autenticação JWT** - Segura e rastreável  
✅ **Retry Automático** - Com backoff exponencial  
✅ **Circuit Breaker** - Proteção contra falhas cascata  
✅ **Validação de Schema** - Conforme oficial AUDESP  
✅ **Auditoria Completa** - Para conformidade LGPD/TCE  
✅ **Tratamento de Erros** - Com mapeamento por campo  
✅ **Suporte a Múltiplos Ambientes** - Piloto e Produção  
✅ **Logs Imutáveis** - Para rastreabilidade  

### Arquitetura

```
┌─────────────────────────────────────┐
│   Aplicação (React/TypeScript)      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   AudespApiServiceV2 (Main)         │
├─────────────────────────────────────┤
│ • Login/Logout                      │
│ • Envio Fase IV/V                   │
│ • Consulta de Protocolos            │
│ • Auditoria                         │
└────────┬────────┬─────────┬─────────┘
         │        │         │
    ┌────▼──┐ ┌───▼───┐ ┌───▼──────┐
    │ Auth  │ │ Error │ │ Audit    │
    └────┬──┘ └───┬───┘ └───┬──────┘
         │        │         │
    ┌────▼─────────▼─────────▼────┐
    │   Retry & Circuit Breaker    │
    └────┬────────────────────────┘
         │
    ┌────▼──────────────────────┐
    │   HTTP Client (Fetch)      │
    └────┬──────────────────────┘
         │
    ┌────▼────────────────────────────┐
    │ AUDESP API (Piloto/Produção)    │
    └─────────────────────────────────┘
```

---

## <a id="instalação-e-setup"></a>2. INSTALAÇÃO E SETUP

### Importar no seu projeto

```typescript
import AudespApiServiceV2 from '@/services/AudespApiServiceV2';
import { CredenciaisAudesp } from '@/services/types/audesp.types';
```

### Configurar na inicialização

```typescript
// App.tsx
import { useEffect } from 'react';
import AudespApiServiceV2 from '@/services/AudespApiServiceV2';

export function App() {
  useEffect(() => {
    // Configurar ambiente e timeout
    AudespApiServiceV2.configurar({
      ambiente: 'piloto', // ou 'producao'
      timeout: 30000,
      maxRetries: 3,
      enableAuditLog: true,
      validarSchemaAntes: true
    });
  }, []);

  return <YourApp />;
}
```

---

## <a id="autenticação"></a>3. AUTENTICAÇÃO

### Login

```typescript
const resposta = await AudespApiServiceV2.login({
  email: 'usuario@orgao.sp.gov.br',
  senha: 'senha_portal_audesp'
});

if (resposta.success) {
  console.log('Usuário:', resposta.data?.usuario?.nome);
  console.log('Token expira em:', resposta.data?.expire_in, 'segundos');
} else {
  console.error('Erro:', resposta.message);
}
```

### Verificar autenticação

```typescript
if (AudespApiServiceV2.estaAutenticado()) {
  const usuario = AudespApiServiceV2.obterUsuario();
  console.log('Logado como:', usuario?.nome);
} else {
  // Redirecionar para login
}
```

### Logout

```typescript
AudespApiServiceV2.logout();
// Limpa token e sessão
```

### Comportamento

- Token renovado **automaticamente** quando próximo do vencimento (< 5 min)
- Credenciais **nunca são logadas** em texto claro
- Sessão armazenada **seguramente** em sessionStorage + localStorage
- Expiração verificada **antes de cada requisição**

---

## <a id="fase-iv"></a>4. FASE IV - LICITAÇÕES E CONTRATOS

### 4.1 Enviar Edital

```typescript
const resposta = await AudespApiServiceV2.enviarEdital({
  cnpj_cpf_orgao: '14.946.601/0001-72',
  nome_orgao: 'Secretaria Municipal de Educação',
  cpf_cpf_responsavel: '123.456.789-10',
  email_responsavel: 'responsavel@orgao.sp.gov.br',
  data_transmissao: '2024-02-01',
  numero_edital: 'EDITAL-2024-001',
  ano_edital: 2024,
  data_abertura: '2024-02-15',
  valor_estimado: 100000.00,
  objeto: 'Contratação de serviços'
});

if (resposta.success) {
  const protocolo = resposta.data?.protocolo;
  console.log('Edital enviado! Protocolo:', protocolo);
}
```

### 4.2 Enviar Licitação

```typescript
const resposta = await AudespApiServiceV2.enviarLicitacao({
  cnpj_cpf_orgao: '14.946.601/0001-72',
  nome_orgao: 'Secretaria Municipal de Educação',
  cpf_cpf_responsavel: '123.456.789-10',
  email_responsavel: 'responsavel@orgao.sp.gov.br',
  data_transmissao: '2024-02-01',
  numero_licitacao: 'LICIT-2024-001',
  numero_processo: 'PROC-2024-001',
  data_licitacao: '2024-02-15',
  valor_total: 95000.00,
  quantidade_propostas: 3
});
```

### 4.3 Enviar Ata

```typescript
const resposta = await AudespApiServiceV2.enviarAta({
  // ... dados obrigatórios ...
  numero_ata: 'ATA-2024-001',
  numero_licitacao: 'LICIT-2024-001',
  data_ata: '2024-03-01',
  valor_ata: 95000.00,
  fornecedor: {
    cnpj: '12.345.678/0001-90',
    razao_social: 'Empresa Contratada LTDA'
  }
});
```

### 4.4 Enviar Ajuste

```typescript
const resposta = await AudespApiServiceV2.enviarAjuste({
  // ... dados obrigatórios ...
  numero_ajuste: 'AJUSTE-2024-001',
  numero_processo: 'PROC-2024-001',
  data_ajuste: '2024-04-01',
  valor_ajuste: 5000.00,
  motivo_ajuste: 'Acréscimo de 5% conforme cláusula de reajuste'
});
```

---

## <a id="fase-v"></a>5. FASE V - PRESTAÇÃO DE CONTAS

### 5.1 Convênio

```typescript
const resposta = await AudespApiServiceV2.enviarPrestacaoContasConvenio({
  cnpj_cpf_orgao: '14.946.601/0001-72',
  nome_orgao: 'Secretaria Municipal de Educação',
  periodo_referencia_inicio: '2024-01-01',
  periodo_referencia_fim: '2024-12-31',
  cpf_responsavel: '123.456.789-10',
  email_responsavel: 'responsavel@orgao.sp.gov.br',
  data_transmissao: '2024-12-31',
  numero_convenio: 'CONV-2024-001',
  concedente: 'Governo do Estado',
  valor_conveniado: 50000.00,
  valor_prestado: 50000.00,
  resumo_execucao: 'Execução conforme plano'
});
```

### 5.2 Contrato de Gestão

```typescript
const resposta = await AudespApiServiceV2.enviarPrestacaoContasContratoGestao({
  // ... dados base ...
  numero_contrato: 'CG-2024-001',
  valor_contratado: 100000.00,
  valor_executado: 95000.00,
  metas_atingidas: 95
});
```

### 5.3 Termo de Colaboração

```typescript
const resposta = await AudespApiServiceV2.enviarPrestacaoContasTermoColaboracao({
  // ... dados base ...
  numero_termo: 'TC-2024-001',
  valor_total: 30000.00,
  valor_executado: 30000.00
});
```

### 5.4 Termo de Fomento

```typescript
const resposta = await AudespApiServiceV2.enviarPrestacaoContasTermoFomento({
  // ... dados base ...
  numero_termo: 'TF-2024-001',
  valor_total: 25000.00,
  valor_executado: 25000.00
});
```

### 5.5 Termo de Parceria

```typescript
const resposta = await AudespApiServiceV2.enviarPrestacaoContasTermoParceria({
  // ... dados base ...
  numero_termo: 'TP-2024-001',
  valor_total: 40000.00,
  valor_executado: 40000.00
});
```

### 5.6 Declaração Negativa

```typescript
const resposta = await AudespApiServiceV2.enviarDeclaraNegativa({
  cnpj_cpf_orgao: '14.946.601/0001-72',
  nome_orgao: 'Secretaria Municipal de Educação',
  periodo_referencia_inicio: '2024-01-01',
  periodo_referencia_fim: '2024-12-31',
  cpf_responsavel: '123.456.789-10',
  email_responsavel: 'responsavel@orgao.sp.gov.br',
  data_transmissao: '2024-12-31',
  periodo_ano: 2024,
  motivo_negativa: 'Nenhum repasse recebido',
  justificativa: 'Órgão não recebeu recursos para execução'
});
```

---

## <a id="consulta"></a>6. CONSULTA DE PROTOCOLOS

### Consultar Protocolo

```typescript
// Consultar protocolo da Fase V (Prestação de Contas)
const resposta = await AudespApiServiceV2.consultarProtocolo(
  '202401010001', // Número do protocolo
  'f5'            // 'f4' para Fase IV, 'f5' para Fase V
);

if (resposta.success) {
  const protocolo = resposta.data?.protocolo;
  
  console.log('Status:', protocolo.status); // Recebido | Armazenado | Rejeitado
  console.log('Data/Hora:', protocolo.dataHora);
  console.log('Descrição:', protocolo.descricao);
  
  // Verificar se foi rejeitado
  if (protocolo.status === 'Rejeitado') {
    console.log('Motivos da rejeição:');
    protocolo.erros?.forEach(erro => {
      console.log('- ' + erro);
    });
  }
  
  // Ver histórico
  resposta.data?.historico.forEach(item => {
    console.log(`${item.data}: ${item.status}`);
  });
}
```

---

## <a id="erros"></a>7. TRATAMENTO DE ERROS

### Erros Comuns

```typescript
const resposta = await AudespApiServiceV2.login(credenciais);

if (!resposta.success) {
  switch (resposta.status) {
    case 400:
      // Dados inválidos
      console.error('Verifique os dados enviados');
      break;
    
    case 401:
      // Credenciais erradas
      console.error('Email ou senha incorretos');
      break;
    
    case 403:
      // Sem permissão
      console.error('Acesso negado');
      break;
    
    case 413:
      // Arquivo muito grande
      console.error('Arquivo PDF > 30MB');
      break;
    
    case 422:
      // Validação falhou
      console.error('Dados não validam contra schema');
      break;
    
    case 429:
      // Muitas requisições
      console.error('Tente novamente em alguns minutos');
      break;
    
    case 500:
    case 502:
    case 503:
      // Erro do servidor
      console.error('Servidor indisponível');
      break;
  }
}
```

### Erros de Validação por Campo

```typescript
const resposta = await AudespApiServiceV2.enviarPrestacaoContasConvenio(dados);

if (!resposta.success && resposta.data?.erros) {
  // Iterar sobre erros
  resposta.data.erros.forEach(erro => {
    console.log(`Campo: ${erro.mensagem}`);
    // Mostrar erro no campo do formulário
  });
}
```

### Tratamento com Retry

O serviço **automaticamente**:
- Retenta requisições com falhas temporárias (408, 429, 5xx)
- Aplica backoff exponencial (1s → 2s → 4s)
- Máximo de 3 tentativas (configurável)
- Abre circuit breaker após falhas repetidas

---

## <a id="auditoria"></a>8. AUDITORIA

### Obter Relatório

```typescript
const relatorio = AudespApiServiceV2.obterRelatorioAuditoria();

console.log('Total de operações:', relatorio.totalLogs);
console.log('Taxa de sucesso:', relatorio.taxaSucesso);
console.log('Usuários ativos:', relatorio.usuariosAtivos);
console.log('Atividades por tipo:', relatorio.atividades);
```

### Exportar Logs

```typescript
// Exportar em CSV
const csv = AudespApiServiceV2.exportarLogsCSV();
// Salvar arquivo: logs_auditoria.csv

// Exportar em JSON
const json = AudespApiServiceV2.exportarLogsJSON();
// Salvar arquivo: logs_auditoria.json
```

### Logs Registrados

Cada operação registra:
- **Timestamp** ISO 8601
- **Usuário** (email, nome, CPF)
- **Tipo** (LOGIN, ENVIO, CONSULTA, ERRO)
- **Endpoint** chamado
- **Status** HTTP
- **Protocolo** AUDESP (se aplicável)
- **Tempo de execução** em ms
- **Erros** (se houver)

---

## <a id="avançado"></a>9. CONFIGURAÇÃO AVANÇADA

### Variáveis de Ambiente

```bash
# .env.local

# AUDESP API
REACT_APP_AUDESP_URL=https://audesp-piloto.tce.sp.gov.br/api
REACT_APP_AUDESP_AMBIENTE=piloto

# Timeouts (ms)
REACT_APP_AUDESP_TIMEOUT=30000

# Retry
REACT_APP_AUDESP_MAX_RETRIES=3
REACT_APP_AUDESP_RETRY_DELAY=1000

# Audit
REACT_APP_AUDESP_ENABLE_AUDIT=true

# Validation
REACT_APP_AUDESP_VALIDATE_BEFORE_SEND=true
```

### Configuração Programática

```typescript
AudespApiServiceV2.configurar({
  ambiente: 'producao',
  urlBase: 'https://sistemas.tce.sp.gov.br/audesp/api',
  timeout: 45000,
  maxRetries: 5,
  retryDelayMs: 2000,
  retryBackoffFactor: 2,
  enableAuditLog: true,
  validarSchemaAntes: true
});
```

---

## <a id="checklist"></a>10. CHECKLIST DE CONFORMIDADE

### ✅ Autenticação
- [x] Suporta header `x-authorization`
- [x] Nunca loga senha em texto claro
- [x] Armazena token de forma segura
- [x] Renovação automática de token
- [x] Logout limpa dados completamente

### ✅ Envio
- [x] Valida JSON localmente antes de enviar
- [x] Suporta multipart/form-data
- [x] Valida tamanho de arquivos (máx 30MB)
- [x] Rastreia protocolo retornado
- [x] Exibe erros por campo do formulário

### ✅ Consulta
- [x] Consulta ambas fases (IV e V)
- [x] Mostra status (Recebido, Armazenado, Rejeitado)
- [x] Exibe histórico de status
- [x] Polling manual

### ✅ Tratamento de Erros
- [x] Parser de erros AUDESP
- [x] Mapeamento para campos
- [x] Mensagens amigáveis ao usuário
- [x] Dicas de correção automáticas
- [x] Rastreamento de protocolo em erro

### ✅ Retry & Resiliência
- [x] Retry automático com backoff exponencial
- [x] Circuit breaker para proteção
- [x] Timeout configurável
- [x] Tratamento de erros de conexão
- [x] Falha rápida para erros não-retentáveis

### ✅ Auditoria & Conformidade
- [x] Logs imutáveis
- [x] Rastreabilidade completa
- [x] Hash de dados sensíveis
- [x] Exportação em CSV/JSON
- [x] Relatório de atividades
- [x] Compatibilidade LGPD

### ✅ Ambientes
- [x] Suporte a piloto
- [x] Suporte a produção
- [x] Mudança entre ambientes
- [x] Configuração via variáveis

### ✅ Documentação
- [x] Exemplos de uso
- [x] Tipos TypeScript completos
- [x] Comentários inline
- [x] Este guia

---

## 📞 SUPORTE E TROUBLESHOOTING

### Login não funciona
1. Verificar credenciais no portal AUDESP
2. Testar com CURL: `curl -H "x-authorization: email:senha" https://api.audesp.tce.sp.gov.br/login`
3. Verificar se ambiente está correto (piloto vs produção)

### Envio rejeitado
1. Validar dados contra schema oficial
2. Verificar se todos os campos obrigatórios estão preenchidos
3. Ver logs detalhados no console
4. Exportar logs para análise

### Timeout
1. Aumentar configuração de `timeout`
2. Verificar velocidade de conexão
3. Tentar novamente (retry automático)

### Circuit breaker aberto
1. Aguardar 60 segundos (padrão)
2. Verificar status do servidor AUDESP
3. Ver eventos no console

---

**Desenvolvido com ❤️ para TCE-SP**  
**Versão 2.0.0 | Pronto para Produção**
