# 📚 Documentação Completa - AUDESP V3.0

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [API Cliente](#api-cliente)
4. [Validação](#validação)
5. [Autenticação](#autenticação)
6. [OCR](#ocr)
7. [Auditoria](#auditoria)
8. [Exemplos Práticos](#exemplos-práticos)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

### O que é?

Sistema web completo para **envio de Prestação de Contas de Convênios** ao AUDESP (Tribunal de Contas do Estado de São Paulo), com:

- ✅ Integração com API oficial AUDESP
- ✅ 16 seções de formulário interativo
- ✅ Validações empresariais avançadas
- ✅ OCR automático de documentos
- ✅ Sistema completo de auditoria
- ✅ Autenticação segura com token Bearer

### Tecnologias

- **Frontend**: React 18 + TypeScript
- **Validação**: AJV (JSON Schema)
- **OCR**: Tesseract.js
- **HTTP**: Axios
- **CSS**: Tailwind CSS
- **Estado**: React Hooks + localStorage

---

## Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────┐
│         Interface Web (React)                │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │      AudespecForm.tsx                │  │
│  │  - Menu Lateral (16 seções)          │  │
│  │  - Painel de Validação               │  │
│  │  - Editor JSON                       │  │
│  └──────────────────────────────────────┘  │
└──────────────┬───────────────────────────────┘
               │
               ├─────────────────────────────────┐
               │                                 │
        ┌──────▼────────┐            ┌──────────▼─────────┐
        │   Serviços    │            │  Componentes       │
        │               │            │  Auxiliares        │
        ├──────────────┤            ├────────────────────┤
        │ • Client API  │            │ • LoginComponent   │
        │ • Validator   │            │ • FormBuilder      │
        │ • Auth        │            │ • Dashboard        │
        │ • OCR         │            │ • Reports          │
        │ • Audit       │            │ • PDFExtractor     │
        └──────┬────────┘            └────────────────────┘
               │
               └────────────────┬──────────────────┐
                                │                  │
                         ┌──────▼──────┐   ┌─────▼────────┐
                         │ localStorage  │   │ AUDESP API   │
                         │ (Sessão/Logs) │   │ (Real)       │
                         └───────────────┘   └──────────────┘
```

---

## API Cliente

### Classe: AudespecClient

Gerencia todas as comunicações com a API AUDESP oficial.

#### Construtor

```typescript
const cliente = new AudespecClient(
  baseUrl?, // Padrão: https://sistemas.tce.sp.gov.br/audesp/api
  apiKey?   // Chave de API (se requerida)
);
```

#### Métodos de Autenticação

```typescript
// Login com email e senha
const resposta = await cliente.login(email, password);
// Response: { token: string, expire_in: number, token_type: 'bearer' }

// Verificar se está autenticado
const autenticado = cliente.isAuthenticated();

// Obter token atual
const token = cliente.getToken();
```

#### Métodos Fase IV (Licitações e Contratos)

```typescript
// Enviar edital com PDF
const resposta = await cliente.enviarEdital(editalJson, pdfFile?);

// Enviar licitação
const resposta = await cliente.enviarLicitacao(licitacaoJson);

// Enviar ata
const resposta = await cliente.enviarAta(ataJson);

// Enviar ajuste
const resposta = await cliente.enviarAjuste(ajusteJson);

// Response: { protocolo: string, timestamp: string, mensagens: string[] }
```

#### Métodos Fase V (Prestação de Contas)

```typescript
// Convênio
const resposta = await cliente.enviarPrestacaoContasConvenio(prestacaoJson);

// Contrato de Gestão
const resposta = await cliente.enviarPrestacaoContasContratoGestao(prestacaoJson);

// Termo de Colaboração
const resposta = await cliente.enviarPrestacaoContasTermoColaboracao(prestacaoJson);

// Termo de Fomento
const resposta = await cliente.enviarPrestacaoContasTermoFomento(prestacaoJson);

// Termo de Parceria
const resposta = await cliente.enviarPrestacaoContasTermoParceria(prestacaoJson);

// Declaração Negativa
const resposta = await cliente.enviarDeclaracaoNegativa(declaracaoJson);
```

#### Métodos de Consulta

```typescript
// Consultar protocolo Fase IV
const protocolo = await cliente.consultarProtocoloF4(numeroProtocolo);
// Response: { protocolo, data_hora, status, tipo, mensagens?, campos_invalidos? }

// Consultar protocolo Fase V
const protocolo = await cliente.consultarProtocoloF5(numeroProtocolo);
```

---

## Validação

### Classe: AudespecValidator

Valida dados contra schema oficial AUDESP e regras de negócio.

#### Validação Completa

```typescript
import AudespecValidator from './services/AudespecValidatorService';

const resultado = AudespecValidator.validarPrestacao(dados);

// Response: ValidationResult
{
  valido: boolean;                  // true/false
  erros: ValidationError[];         // Erros críticos
  alertas: ValidationError[];       // Avisos
  info: ValidationError[];          // Informações
  resumo: string;                   // Texto resumido
  percentual_preenchimento: number; // 0-100
}
```

#### Validação de Campo Individual

```typescript
const erros = AudespecValidator.validarCampo(
  'entidade_beneficiaria.cnpj',
  '12345678000195',
  dadosCompletos
);
```

#### Obter Status por Seção

```typescript
const status = AudespecValidator.obterStatusSecoes();
// Response:
// [
//   { secao: 'descricao', status: 'preenchido' },
//   { secao: 'entidade_beneficiaria', status: 'incompleto' },
//   { secao: 'vigencia', status: 'erro' }
// ]
```

#### Validações Incluídas

- ✅ CPF (11 dígitos + validação de dígito verificador)
- ✅ CNPJ (14 dígitos + validação de dígito verificador)
- ✅ Datas (início ≤ fim, não futuras)
- ✅ Valores (positivos, soma consistente)
- ✅ Campos obrigatórios
- ✅ Tipos de dados (string, number, date, etc.)
- ✅ Enums (valores pré-definidos)
- ✅ Comprimento mínimo/máximo

---

## Autenticação

### Classe: AuthenticationService

Gerencia sessões e tokens de autenticação.

#### Login

```typescript
import AuthenticationService from './services/AuthenticationService';

const sessao = await AuthenticationService.autenticar(
  'usuario@prefeitura.sp.gov.br',
  'senha_segura'
);

// Response: SessaoAudespec
{
  usuario: {
    email: string;
    nome: string;
    cpf: string;
    funcao: string;
    perfil: 'Operador' | 'Gestor' | 'Contador' | 'Auditor Interno' | 'Administrador';
    ativo: boolean;
    data_criacao: string;
  };
  token: string;
  expireIn: number;      // em segundos
  dataLogin: string;     // ISO 8601
}
```

#### Verificar Autenticação

```typescript
if (AuthenticationService.estaAutenticado()) {
  console.log('Sessão ativa');
} else {
  console.log('Sessão expirada');
}
```

#### Obter Sessão Atual

```typescript
const sessao = AuthenticationService.obterSessao();
// null se não autenticado ou expirado
```

#### Logout

```typescript
AuthenticationService.logout();
// Remove token e dados do localStorage
```

---

## OCR

### Classe: OcrService

Extrai dados inteligentemente de documentos (PDFs/Imagens).

#### Inicializar

```typescript
import OcrService from './services/OcrService';

await OcrService.inicializar();
// Baixa modelo de linguagem português
```

#### Processar Documento

```typescript
const arquivo = new File([...], 'documento.pdf', { type: 'application/pdf' });

const extracao = await OcrService.processarDocumento(arquivo);

// Response: ExtracaoPDF
{
  numero_documento?: string;    // "123456"
  datas?: string[];            // ["10/01/2024", "15/01/2024"]
  valores?: number[];          // [1000.00, 500.50]
  cpf_cnpj?: string[];         // ["12345678901", "12345678000195"]
  tipo_documento?: string;     // "Nota Fiscal Eletrônica"
  texto_completo: string;      // Texto extraído
}
```

#### Processar Múltiplos

```typescript
const arquivos = [...]; // Array de File
const extracts = await OcrService.processarMultiplos(arquivos);
```

#### Associar com Contrato

```typescript
const contrato = AudespecValidator.associarComContrato(extracao, contratos);

// Response:
{
  contrato?: { numero, valor_total, ... };
  confianca: number;  // 0.0 a 1.0
}
```

#### Finalizar

```typescript
await OcrService.finalizarOCR();
// Libera recursos
```

---

## Auditoria

### Classe: AuditoriaService

Registra e relata todas as ações no sistema.

#### Registrar Ação

```typescript
import AuditoriaService from './services/AuditoriaService';

AuditoriaService.registrarAcao(
  usuario,        // 'usuario@prefeitura.sp.gov.br'
  acao,           // 'Alteração', 'Envio', 'Consulta'
  secao,          // 'documentos_fiscais'
  descricao,      // 'Adicionou documento NF #12345'
  {
    antigos: {...},
    novos: {...}
  },
  'sucesso'       // 'sucesso' | 'erro' | 'aviso'
);
```

#### Obter Logs

```typescript
const logs = AuditoriaService.obterLogs({
  usuario: 'usuario@prefeitura.sp.gov.br',
  secao: 'documentos_fiscais',
  acao: 'Alteração',
  dataInicio: '2024-01-01',
  dataFim: '2024-01-31'
});

// Response: AuditoriaLog[]
// [
//   {
//     id: 'LOG-...',
//     timestamp: '2024-01-15T10:30:00Z',
//     usuario: 'user@...',
//     acao: 'Alteração',
//     secao: 'documentos_fiscais',
//     descricao: '...',
//     dados_antigos: {...},
//     dados_novos: {...},
//     status: 'sucesso'
//   }
// ]
```

#### Gerar Relatório

```typescript
const relatorio = AuditoriaService.gerarRelatorio('2024-01-01', '2024-01-31');

// Response: RelatorioAuditoria
{
  periodo_inicio: string;
  periodo_fim: string;
  total_operacoes: number;
  operacoes_por_usuario: [
    { usuario: string; count: number }
  ];
  operacoes_por_tipo: [
    { tipo: string; count: number }
  ];
  operacoes_com_erro: AuditoriaLog[];
}
```

#### Exportar

```typescript
// CSV
const csv = AuditoriaService.exportarCSV();

// JSON
const json = AuditoriaService.exportarJSON();
```

#### Limpeza

```typescript
// Remover logs com mais de 90 dias
const removidos = AuditoriaService.limparLogsAntigos(90);
```

---

## Exemplos Práticos

### Exemplo 1: Envio Completo

```typescript
async function enviarPrestacaoCompleta() {
  try {
    // 1. Autenticar
    const sessao = await AuthenticationService.autenticar(
      'prefeitura@sp.gov.br',
      'senha_segura'
    );
    console.log(`✅ Conectado como: ${sessao.usuario.nome}`);

    // 2. Preparar dados
    const prestacao = {
      descricao: {
        numero_siconv: '123456',
        modalidade: 'Convênio',
        instrumento_juridico: 'Decreto 123/2024',
        numero_processo_tce: '12345/2024',
        data_inicio: '2024-01-01',
        data_fim: '2024-12-31'
      },
      entidade_beneficiaria: {
        razao_social: 'Prefeitura de São Paulo',
        nome_fantasia: 'Prefeitura SP',
        cnpj: '34028316000152',
        tipo_entidade: 'Prefeitura',
        natureza_juridica: '1011',
        endereco: {
          logradouro: 'Av. Paulista',
          numero: '100',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01311100'
        },
        telefone: '1133258000',
        email: 'atendimento@prefeitura.sp.gov.br'
      },
      vigencia: {
        data_inicio: '2024-01-01',
        data_fim: '2024-12-31'
      },
      responsaveis: [
        {
          nome: 'João da Silva',
          cpf: '12345678901',
          cargo: 'Prefeito',
          funcao: 'Presidente',
          email: 'joao@prefeitura.sp.gov.br'
        }
      ],
      contratos: [
        {
          numero: 'CTR-001/2024',
          fornecedor_razao_social: 'Empresa X Ltda',
          fornecedor_cnpj: '12345678000195',
          objeto: 'Aquisição de materiais de escritório',
          data_inicio: '2024-01-15',
          data_fim: '2024-06-15',
          valor_total: 10000.00,
          modalidade_licitacao: 'Pregão'
        }
      ],
      documentos_fiscais: [
        {
          tipo: 'Nota Fiscal Eletrônica',
          numero: '000001',
          serie: '1',
          fornecedor_razao_social: 'Empresa X Ltda',
          fornecedor_cnpj: '12345678000195',
          data_emissao: '2024-01-20',
          valor_bruto: 500.00,
          valor_desconto: 0,
          valor_liquido: 500.00,
          natureza_despesa: 'Material de Consumo',
          contrato_numero: 'CTR-001/2024'
        }
      ],
      pagamentos: [
        {
          numero: 'PAG-001',
          documento_fiscal_numero: '000001',
          fornecedor_cnpj: '12345678000195',
          data_pagamento: '2024-01-25',
          valor: 500.00,
          forma_pagamento: 'Transferência Bancária',
          banco: '001',
          agencia: '1234',
          conta: '567890'
        }
      ],
      metadata: {
        versao_schema: '3.0',
        status: 'Pronto para envio'
      }
    };

    // 3. Validar
    const validacao = AudespecValidator.validarPrestacao(prestacao);
    console.log(`📊 Preenchimento: ${validacao.percentual_preenchimento}%`);

    if (!validacao.valido) {
      console.error('❌ Erros encontrados:');
      validacao.erros.forEach(erro => {
        console.error(`  ${erro.campo}: ${erro.mensagem}`);
        AuditoriaService.registrarAcao(
          'usuario@prefeitura.sp.gov.br',
          'Validação',
          'json_transmissao',
          `Erro de validação: ${erro.campo}`,
          {},
          'erro'
        );
      });
      return;
    }

    // 4. Enviar
    console.log('📤 Enviando prestação...');
    const cliente = new AudespecClient();
    const resposta = await cliente.enviarPrestacaoContasConvenio(prestacao);

    console.log(`✅ Enviado com sucesso!`);
    console.log(`   Protocolo: ${resposta.protocolo}`);
    console.log(`   Timestamp: ${resposta.timestamp}`);

    // 5. Registrar sucesso
    AuditoriaService.registrarAcao(
      'usuario@prefeitura.sp.gov.br',
      'Envio',
      'json_transmissao',
      `Prestação enviada com protocolo ${resposta.protocolo}`,
      { novos: resposta },
      'sucesso'
    );

    return resposta.protocolo;

  } catch (erro: any) {
    console.error('❌ Erro na operação:', erro);
    AuditoriaService.registrarAcao(
      'usuario@prefeitura.sp.gov.br',
      'Envio',
      'json_transmissao',
      `Erro ao enviar: ${erro.message}`,
      {},
      'erro'
    );
    throw erro;
  }
}
```

### Exemplo 2: Processar OCR de Documentos

```typescript
async function importarDocumentosComOCR(arquivos: File[]) {
  try {
    // 1. Inicializar OCR
    await OcrService.inicializar();
    console.log('✅ OCR inicializado');

    // 2. Processar cada arquivo
    const documentosExtraidos = [];

    for (const arquivo of arquivos) {
      console.log(`📄 Processando ${arquivo.name}...`);
      const extracao = await OcrService.processarDocumento(arquivo);

      console.log(`  Tipo: ${extracao.tipo_documento}`);
      console.log(`  CPF/CNPJ: ${extracao.cpf_cnpj?.join(', ')}`);
      console.log(`  Valores: ${extracao.valores?.join(', ')}`);
      console.log(`  Datas: ${extracao.datas?.join(', ')}`);

      documentosExtraidos.push({
        arquivo: arquivo.name,
        tipo: extracao.tipo_documento,
        numero: extracao.numero_documento,
        fornecedor_cnpj: extracao.cpf_cnpj?.[0],
        valor_bruto: extracao.valores?.[0],
        data_emissao: extracao.datas?.[0],
        texto_completo: extracao.texto_completo
      });
    }

    // 3. Limpar OCR
    await OcrService.finalizarOCR();

    return documentosExtraidos;

  } catch (erro) {
    console.error('❌ Erro no OCR:', erro);
    throw erro;
  }
}
```

---

## Troubleshooting

### Erro: "Sessão expirada"

**Causa**: Token expirou após N minutos
**Solução**:
```typescript
if (!AuthenticationService.estaAutenticado()) {
  const novaSessao = await AuthenticationService.autenticar(email, senha);
}
```

### Erro: "CPF inválido"

**Causa**: CPF não passa na validação de dígito verificador
**Solução**: Usar CPF válido ou corrigir dígitos

```typescript
// Validar antes de salvar
const erros = AudespecValidator.validarCampo('responsaveis[0].cpf', cpf);
if (erros.length > 0) {
  console.log(erros[0].mensagem);
}
```

### Erro: "Soma de pagamentos diferente"

**Causa**: Total de pagamentos ≠ Total de documentos
**Solução**: Revisar valores de documentos e pagamentos

```typescript
const totalDocumentos = documentos.reduce((acc, d) => acc + d.valor_liquido, 0);
const totalPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0);

console.log(`Diferença: R$ ${Math.abs(totalDocumentos - totalPagamentos)}`);
```

### OCR não reconhece valores

**Causa**: Imagem de baixa qualidade ou formato não esperado
**Solução**:
- Escanear com melhor resolução (≥300 DPI)
- Corrigir manualmente após OCR
- Usar arquivo PDF original em vez de imagem

### API AUDESP retorna "Protocolo duplicado"

**Causa**: Tentativa de enviar o mesmo documento duas vezes
**Solução**:
- Consultar protocolo antes de reenviar
- Usar número único para cada envio

---

## Referências

- [Manual AUDESP](https://www.tce.sp.gov.br/audesp)
- [API Documentação](https://sistemas.tce.sp.gov.br/audesp/api)
- [TCE-SP](https://www.tce.sp.gov.br)

---

**Data**: 20 de Janeiro de 2026
**Versão**: 3.0
**Status**: Production Ready ✅

