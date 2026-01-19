# 📐 ARQUITETURA DO SISTEMA AUDESP CONNECT

## DIAGRAMA DE COMPONENTES

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               App.tsx (Main Container)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                      │                    │            │
│         ▼                      ▼                    ▼            │
│   ┌─────────────┐      ┌──────────────┐   ┌────────────────┐   │
│   │  Sidebar    │      │  Dashboard   │   │  FormSections  │   │
│   │  (Nav)      │      │  (Overview)  │   │  (23 Sections) │   │
│   └─────────────┘      └──────────────┘   └────────────────┘   │
│                               │                    │            │
│                               ▼                    ▼            │
│                        ┌────────────────────────────────────┐   │
│                        │  Form Blocks (10 Componentes)     │   │
│                        ├────────────────────────────────────┤   │
│                        │ • HeaderBlocks (3 seções)         │   │
│                        │ • GeneralDataBlocks (3 seções)    │   │
│                        │ • FinanceBlocks (4 seções)        │   │
│                        │ • StandardArrayBlocks (5 seções)  │   │
│                        │ • HRBlocks (2 seções)             │   │
│                        │ • ActivityReportsBlock (1 seção)  │   │
│                        │ • AdjustmentBlocks (3 seções)     │   │
│                        │ • ReportBlocks (2 seções)         │   │
│                        │ • TransparencyBlock (1 seção)     │   │
│                        │ • FinalizationBlocks (2 seções)   │   │
│                        └────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
              │                    │
              ▼                    ▼
   ┌────────────────────┐ ┌─────────────────────┐
   │   STATE MANAGEMENT │ │   SERVICES LAYER    │
   │   (React Hooks)    │ │                     │
   │                    │ │ • authService.ts    │
   │ • formData         │ │ • validationSvc.ts  │
   │ • authToken        │ │ • transmissionSvc.ts
   │ • isLoggedIn       │ │ • fileService.ts    │
   │ • notifications    │ │ • dataSanitizer.ts  │
   │ • transmissionLog  │ │ • geminiService.ts  │
   │ • audespResult     │ │ • ocrService.ts     │
   └────────────────────┘ └─────────────────────┘
              │                    │
              └────────┬───────────┘
                       ▼
            ┌──────────────────────┐
            │  Types (types.ts)    │
            │  & Validation Schemas│
            │  • PrestacaoContas   │
            │  • TokenResponse     │
            │  • AudespResponse    │
            │  • 20+ Interfaces    │
            └──────────────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │   API Integration        │
            ├──────────────────────────┤
            │ • POST /login            │
            │ • POST /enviar-pc-*      │
            │ • Multipart FormData     │
            │ • JWT Bearer Auth        │
            └──────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  Audesp Piloto Backend  │
         │  https://audesp-       │
         │  piloto.tce.sp.gov.br  │
         └─────────────────────────┘
```

---

## FLUXO DE AUTENTICAÇÃO

```
┌─────────────────────────┐
│  User Login Form        │
│  email + senha          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ authService.login(email, senha)         │
├─────────────────────────────────────────┤
│ 1. POST /login                          │
│ 2. Header: x-authorization: email:pwd  │
│ 3. Content-Type: application/json       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Response: TokenResponse                 │
│ {                                       │
│   token: "JWT...",                      │
│   expire_in: timestamp,                 │
│   token_type: "bearer"                  │
│ }                                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ sessionStorage.setItem('audesp_token')  │
│ sessionStorage.setItem('audesp_expire') │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ App State Updated                       │
│ setAuthToken(token)                     │
│ setIsLoggedIn(true)                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Render Dashboard + FormSections         │
│ Token ready for transmission requests   │
└─────────────────────────────────────────┘
```

---

## FLUXO DE TRANSMISSÃO

```
┌──────────────────────────────────────┐
│ User Clica "TRANSMITIR"              │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Modal Abre com Log de Progresso      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ validatePrestacaoContas()            │
│ ├─ Validate by section               │
│ ├─ Cross-checks (Payment↔NF, etc)   │
│ └─ Returns array of errors          │
└────────────┬─────────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
   ERRORS        SUCCESS
     │              │
     ▼              ▼
  STOP        ┌────────────────────────┐
           │ Prepare JSON             │
           │ ├─ Sanitize data         │
           │ ├─ Type casting          │
           │ └─ Serialize to string   │
           └────────┬─────────────────┘
                    │
                    ▼
           ┌────────────────────────┐
           │ Create FormData        │
           │ append('documentoJSON')│
           │ as Blob                │
           └────────┬─────────────────┘
                    │
                    ▼
           ┌────────────────────────┐
           │ Determine Endpoint     │
           │ tipo_documento → route │
           └────────┬─────────────────┘
                    │
                    ▼
           ┌────────────────────────┐
           │ fetch(url, {           │
           │   method: POST         │
           │   headers: {           │
           │     Authorization:     │
           │       Bearer {token}   │
           │   },                   │
           │   body: formData       │
           │ })                     │
           └────────┬─────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ API Response             │
        │ {                        │
        │   protocolo: string      │
        │   status: enum           │
        │   erros?: array          │
        │ }                        │
        └────────┬─────────────────┘
                 │
         ┌───────┼───────┐
         ▼       ▼       ▼
      Recebido Rejeitado Armazenado
         ✅      ❌       ⚠️
         │       │       │
         └───────┼───────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │ Show Result Modal        │
        │ ├─ Protocolo             │
        │ ├─ Status                │
        │ └─ Erros (se houver)    │
        └─────────────────────────┘
```

---

## ESTRUTURA DE TIPOS

```
PrestacaoContas (ROOT)
├── descritor: Descritor
│   ├── tipo_documento: enum[6]
│   ├── municipio: number
│   ├── entidade: number
│   ├── ano: number
│   └── mes: number (1-12)
│
├── codigo_ajuste: string
├── retificacao: boolean
│
├── relacao_empregados?: Empregado[]
│   ├── cpf: string (11 dig)
│   ├── data_admissao: date
│   ├── data_demissao?: date
│   ├── periodos_remuneracao?: {
│   │   ├── mes: number
│   │   ├── remuneracao_bruta: number
│   │   └── carga_horaria: number
│   │ }[]
│   └── ... (cbo, cns, salario)
│
├── relacao_bens?: RelacaoBens
│   ├── relacao_bens_moveis_adquiridos?: BemMovel[]
│   ├── relacao_bens_moveis_cedidos?: BemMovel[]
│   ├── relacao_bens_moveis_baixados?: BemMovel[]
│   ├── relacao_bens_imoveis_adquiridos?: BemImovel[]
│   ├── relacao_bens_imoveis_cedidos?: BemImovel[]
│   └── relacao_bens_imoveis_baixados?: BemImovel[]
│
├── contratos?: Contrato[]
│   ├── numero: string
│   ├── credor: Credor
│   ├── vigencia_data_inicial: date
│   ├── vigencia_data_final: date
│   ├── valor_montante: number
│   └── ... (objeto, natureza, criterio)
│
├── documentos_fiscais?: DocumentoFiscal[]
│   ├── numero: string
│   ├── credor: Credor
│   ├── data_emissao: date
│   ├── valor_bruto: number
│   └── ... (encargos, categoria, rateio)
│
├── pagamentos?: Pagamento[]
│   ├── identificacao_documento_fiscal: {numero, credor}
│   ├── pagamento_data: date
│   ├── pagamento_valor: number
│   ├── fonte_recurso_tipo: enum
│   └── ... (banco, agencia, conta)
│
├── disponibilidades?: Disponibilidades
│   ├── saldos: Saldo[]
│   │   ├── banco: number
│   │   ├── agencia: number
│   │   ├── conta: string
│   │   ├── saldo_bancario: number
│   │   └── saldo_contabil: number
│   └── saldo_fundo_fixo: number
│
├── receitas?: Receitas
│   ├── repasses_recebidos?: RepasseRecebido[]
│   ├── outras_receitas?: ItemFinanceiro[]
│   ├── recursos_proprios?: ItemFinanceiro[]
│   └── rendimentos: 3 categorias
│
├── ... (ajustes, glosas, empenhos, repasses)
│
├── relatorio_atividades?: RelatorioAtividades
│   └── programas: Programa[]
│
├── dados_gerais_entidade_beneficiaria?: DadosGerais
├── responsaveis_membros_orgao_concessor?: Responsaveis
├── declaracoes?: Declaracoes
├── relatorio_governamental_analise_execucao?: RelatorioGov
├── demonstracoes_contabeis?: DemonstracoesContabeis
├── transparencia?: Transparencia
├── parecer_conclusivo?: ParecerConclusivo
└── publicacoes_parecer_ata?: PublicacaoParecerAta[]
```

---

## MAPEAMENTO SEÇÕES → COMPONENTES

```
Seção 1  → HeaderBlocks (DescritorBlock)
Seção 2  → HeaderBlocks (CodigoAjusteBlock)
Seção 3  → HeaderBlocks (RetificacaoBlock)
Seção 4  → HRBlocks (EmployeesBlock)
Seção 5  → AdjustmentBlocks (AssetsBlock)
Seção 6  → StandardArrayBlocks (ContractArray)
Seção 7  → StandardArrayBlocks (InvoiceArray)
Seção 8  → StandardArrayBlocks (PaymentArray)
Seção 9  → FinanceBlocks (AvailabilityBlock)
Seção 10 → FinanceBlocks (IncomeBlock)
Seção 11 → FinanceBlocks (AdjustmentsBlock)
Seção 12 → HRBlocks (CededServersBlock) + FinanceBlocks (DiscountsBlock)
Seção 13 → AdjustmentBlocks (GlosesBlock + ReturnsBlock)
Seção 14 → GeneralDataBlocks (EntityDataBlock)
Seção 15 → GeneralDataBlocks (ResponsibleBlock)
Seção 16 → StandardArrayBlocks (CommitmentsArray)
Seção 17 → StandardArrayBlocks (TransfersArray)
Seção 18 → ActivityReportsBlock (ActivitiesBlock)
Seção 19 → ReportBlocks (GovernmentalBlock)
Seção 20 → TransparencyBlock (TransparencyRequirementsBlock)
Seção 21 → ReportBlocks (AccountsBlock)
Seção 22 → FinalizationBlocks (OpinionBlock)
Seção 23 → FinalizationBlocks (PublicationsBlock + DeclarationsBlock)
```

---

## PIPELINE DE VALIDAÇÃO

```
INPUT (Dados do Formulário)
    │
    ▼
┌─────────────────────────────────────┐
│ validatePrestacaoContas()           │
│ ├─ Itera por 23 seções             │
│ ├─ validateSection(id, data)       │
│ ├─ Retorna array de erros string   │
│ └─ Se vazio = válido               │
└────────────┬────────────────────────┘
             │
             ├─ CPF: válida 11 dígitos
             ├─ CNPJ: válida 14 dígitos
             ├─ Datas: parseDate + range
             ├─ Números: > 0 se obrigatório
             ├─ Enums: value in [lista]
             └─ ...
             │
             ▼
┌─────────────────────────────────────┐
│ validateConsistency()               │
│ ├─ Cross-check seções              │
│ ├─ Saldo final validação           │
│ ├─ Datas coerentes                 │
│ └─ Referências existem             │
└────────────┬────────────────────────┘
             │
             ├─ Payment.date >= Invoice.date
             ├─ Invoice exists for Payment
             ├─ Contract.final >= initial
             ├─ Total Receitas === sum()
             ├─ Total Despesas === sum()
             └─ ...
             │
             ▼
┌─────────────────────────────────────┐
│ RESULTADO: VALID ou INVALID         │
│ ├─ VALID: pronto para transmissão  │
│ └─ INVALID: retorna erros          │
└─────────────────────────────────────┘
```

---

## ARQUITETURA DE CAMADAS

```
┌──────────────────────────────────────┐
│    UI LAYER (React Components)       │
│ • Dashboard  • Sidebar               │
│ • FormBlocks • Modals                │
└─────────────┬──────────────────────┘
              │
┌─────────────▼──────────────────────┐
│ STATE MANAGEMENT (React Hooks)     │
│ • useState • useEffect              │
│ • useRef • useMemo • useContext    │
└─────────────┬──────────────────────┘
              │
┌─────────────▼──────────────────────┐
│ SERVICES LAYER (Business Logic)    │
│ • authService (JWT)                │
│ • validationService (AJV)          │
│ • transmissionService (API)        │
│ • fileService (Import/Export)      │
│ • dataSanitizer (Data cleanup)     │
│ • geminiService (OCR)              │
└─────────────┬──────────────────────┘
              │
┌─────────────▼──────────────────────┐
│ TYPES LAYER (TypeScript)           │
│ • Interfaces • Enums               │
│ • Initial Data • Schemas           │
└─────────────┬──────────────────────┘
              │
┌─────────────▼──────────────────────┐
│ API INTEGRATION (Fetch)            │
│ • Audesp Backend                   │
│ • Gemini API (OCR)                 │
└──────────────────────────────────────┘
```

---

**Versão:** 1.9.1  
**Última Atualização:** 15/01/2026  
**Documentação Gerada:** Análise Técnica Completa
