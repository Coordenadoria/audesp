# ✓ REGRAS DE VALIDAÇÃO E CONFORMIDADE

**Status**: Especificação de Regras de Negócio  
**Versão**: 1.0  
**Data**: 20/01/2026  

---

## 1. VALIDAÇÕES OBRIGATÓRIAS (JSON SCHEMA)

### Tipo de Dado
```
Verificação: Cada campo deve estar no tipo esperado

Regras Básicas:
✓ String: Sem valores null, máximo/mínimo caracteres
✓ Number: Sem valores null, range válido
✓ Integer: Sem decimais, range válido
✓ Boolean: true/false
✓ Date: Formato ISO 8601 (YYYY-MM-DD)
✓ Array: Mínimo/máximo de elementos
✓ Object: Todos campos obrigatórios presentes

Erro Padrão:
"Campo [nome_campo] deve ser do tipo [tipo]"

Exemplo:
  Campo: "valor_bruto"
  Esperado: number (decimal 10,2)
  Recebido: "1000,00" (string)
  └─ ERRO: "Valor bruto deve ser um número decimal"
```

### Enumerações
```
Verificação: Campo deve estar em lista pré-definida

Campos com Enum:
✓ tipo_documento → ["Prestação de Contas de Convênio"]
✓ tipo_documento_fiscal → ["NOTA_FISCAL", "RPS", "NFE", ...]
✓ forma_pagamento → ["BOLETO", "TRANSFERENCIA", "PIX", ...]
✓ situacao_pagamento → ["PAGAMENTOEFETIVADO", "NAOEFETIVADO", ...]
✓ situacao_contrato → ["ATIVO", "ENCERRADO", "RESCINDIDO", ...]

Erro Padrão:
"Campo [nome] deve ser um de: [valor1], [valor2], ..."

Exemplo:
  Campo: "forma_pagamento"
  Valor: "CARRIER_PIGEON"
  Valores válidos: ["BOLETO", "TRANSFERENCIA", "PIX", ...]
  └─ ERRO: "Forma de pagamento deve ser um de: BOLETO, TRANSFERENCIA, PIX, ..."
```

### Limites (Min/Max)
```
Verificação: Valores dentro de rangos permitidos

String:
✓ nome responsável: min=3, max=255
✓ número contrato: min=1, max=50
✓ descrição: min=10, max=1000

Number:
✓ municipio: min=1, max=9999
✓ entidade: min=1, max=99999
✓ valor_bruto: min=0, max=999999999.99
✓ ano: min=2000, max=2099

Array:
✓ responsáveis: min=1, max=20
✓ contratos: min=0, max=1000
✓ documentos_fiscais: min=0, max=10000
✓ pagamentos: min=0, max=10000

Erro Padrão:
"[Campo] deve estar entre [min] e [max]"

Exemplo:
  Campo: "municipio"
  Valor: 10000
  Min: 1, Max: 9999
  └─ ERRO: "Código do município deve estar entre 1 e 9999"
```

### Regex (Formatos Específicos)
```
Verificação: Dados aderem a padrão esperado

CPF:
  Padrão: 11 dígitos, validação módulo 11
  Regex: \d{3}\.\d{3}\.\d{3}-\d{2}
  Exemplo válido: "123.456.789-10"
  Exemplo inválido: "000.000.000-00" (bloqueado)

CNPJ:
  Padrão: 14 dígitos, validação módulo 11
  Regex: \d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}
  Exemplo válido: "12.345.678/0001-90"
  Exemplo inválido: "12.345.678/0001-00" (bloqueado)

Código Ajuste:
  Padrão: 15-19 dígitos
  Regex: ^\d{15,19}$
  Exemplo válido: "2024000000000001"
  Exemplo inválido: "2024-00000000-0001" (contém hífen)

Email:
  Padrão: RFC 5322 simplificado
  Regex: ^[^\s@]+@[^\s@]+\.[^\s@]+$
  Exemplo válido: "usuario@prefeitura.sp.gov.br"

Data:
  Padrão: YYYY-MM-DD
  Regex: ^\d{4}-\d{2}-\d{2}$
  Exemplo válido: "2024-12-31"
```

---

## 2. VALIDAÇÕES CONTÁBEIS

### Equação Contábil Fundamental
```
Validação Crítica: Saldo Final deve ser consistente

Fórmula:
  Saldo_Inicial + Total_Receitas - Total_Despesas = Saldo_Final

Onde:
  • Saldo_Inicial = saldo em caixa + fundo fixo no início
  • Total_Receitas = ∑ (repasses + outras receitas)
  • Total_Despesas = ∑ (pagamentos)
  • Saldo_Final = saldo em caixa + fundo fixo no final

Erro (se não bate):
"Inconsistência contábil detectada. Diferença: R$ [valor]"

Exemplo:
  Saldo Inicial: R$ 1.000,00
  Receitas: R$ 10.000,00
  Despesas: R$ 9.500,00
  Saldo Final Esperado: R$ 1.500,00
  Saldo Final Informado: R$ 2.000,00
  └─ ERRO: "Inconsistência contábil. Diferença: R$ 500,00"
```

### Coerência Documento ↔ Pagamento
```
Validação: Pagamentos não devem exceder documentos

Regra:
  Para cada documento_fiscal[i]:
    ∑ (pagamentos vinculados a documento[i]) ≤ documento[i].valor_liquido

Erro (se violar):
"Soma de pagamentos (R$ [X]) não pode exceder valor do documento (R$ [Y])"

Lógica:
  Documento fiscal: R$ 1.000,00
  Pagamento 1: R$ 600,00
  Pagamento 2: R$ 450,00
  Total pago: R$ 1.050,00
  └─ ERRO: "Soma de pagamentos (R$ 1.050,00) não pode exceder R$ 1.000,00"
```

### Coerência Contrato ↔ Documento
```
Validação: Documentos devem respeitar vigência do contrato

Regra:
  Para cada documento_fiscal[i]:
    contrato[j].vigencia_inicio ≤ documento[i].data_emissão ≤ contrato[j].vigencia_fim

Erro (se violar):
"Data do documento [DD/MM/YYYY] fora da vigência do contrato ([início] a [fim])"

Exemplo:
  Contrato vigência: 01/01/2024 a 31/03/2024
  Documento emissão: 15/04/2024
  └─ ERRO: "Data do documento fora da vigência do contrato"
```

### Total Pagamentos ≤ Total Documentos
```
Validação: Despesas totais não devem exceder receitas totais

Regra:
  ∑ (pagamentos) ≤ ∑ (documentos_fiscais.valor_liquido)

Erro (se violar):
"Total de pagamentos (R$ [X]) não pode ser maior que total de documentos (R$ [Y])"

Alerta (se avisar):
"Cuidado: Você pagou menos que o total de documentos registrados"
```

### Datas Consistentes
```
Validação: Ordem cronológica e coerência de datas

Regras:
  ✓ data_celebracao ≤ data_emissao
  ✓ data_emissao ≤ data_pagamento
  ✓ vigencia_inicio < vigencia_fim
  ✓ Nenhuma data no futuro (relativamente à prestação)

Erro Padrão:
"Datas inconsistentes: [data1] deve ser menor que [data2]"

Exemplo:
  Data celebração: 15/01/2024
  Data emissão: 10/01/2024
  └─ ERRO: "Data de emissão não pode ser antes da data de celebração"
```

---

## 3. VALIDAÇÕES DE INTEGRIDADE REFERENCIAL

### Campos Obrigatórios Não Preenchidos
```
Verificação: Todos campos obrigatórios conforme JSON Schema

Campos Sempre Obrigatórios:
✓ descritor (completo com municipio, entidade, ano, mes)
✓ codigo_ajuste
✓ relacao_empregados (array, pode ser vazio mas deve existir)
✓ relacao_bens (objeto, pode estar vazio mas deve existir)
✓ contratos (array, pode ser vazio)
✓ documentos_fiscais (array, pode ser vazio)
✓ pagamentos (array, pode ser vazio)
✓ disponibilidades (object obrigatório)
✓ receitas (object obrigatório)
✓ ajustes_saldo (object)
... (total de 25 campos no nível raiz do schema)

Erro Padrão:
"Campo obrigatório não preenchido: [nome_campo]"

Exemplo:
  Campo: "responsaveis_membros_orgao_concessor"
  Valor: null/undefined
  └─ ERRO: "Campo obrigatório: Responsáveis do órgão concessor"
```

### Validação de CPF/CNPJ
```
Algoritmo de Validação (Módulo 11):

CPF (11 dígitos):
  1. Calcular primeiro dígito verificador
     Multiplicar posição 1-9 por sequência 10-2
     Resto da divisão por 11
     Se resto < 2 → dígito = 0, senão dígito = 11 - resto
  
  2. Calcular segundo dígito verificador
     Multiplicar posição 1-10 por sequência 11-2
     Resto da divisão por 11
     Se resto < 2 → dígito = 0, senão dígito = 11 - resto
  
  3. Comparar com dígitos originais
  
  4. Rejeitar se todos dígitos iguais (ex: 000.000.000-00)

CNPJ (14 dígitos):
  Lógica similar ao CPF com sequências diferentes

Erro (se inválido):
"CPF/CNPJ inválido: falhou validação de dígito verificador"

Bloqueados:
  CPF: 000.000.000-00, 111.111.111-11, ..., 999.999.999-99
  CNPJ: 00.000.000/0000-00, etc.
```

### Validação de Vínculo entre Tabelas
```
Verificação: Campos de referência devem apontar para registros existentes

Regras:
  ✓ documento_fiscal.contrato_id → deve existir em contratos[n].id
  ✓ pagamento.documento_fiscal_id → deve existir em documentos_fiscais[n].id
  ✓ codigo_ajuste → deve corresponder a contrato registrado
  ✓ municipio → deve existir em base IBGE
  ✓ entidade → deve existir em CADESP (atrelado ao municipio)

Erro (se referência quebrada):
"Campo [campo1] referencia registro inexistente em [campo2]"

Exemplo:
  Pagamento.documento_fiscal_id = "999"
  Documentos na prestação: ["1", "2", "3"]
  └─ ERRO: "Pagamento referencia documento inexistente"
```

---

## 4. ALERTAS (Warnings vs Errors)

### Erros Críticos (BLOQUEIAM envio)
```
✗ Campo obrigatório vazio
✗ Tipo de dado incorreto
✗ Valor fora de range permitido
✗ Data no futuro
✗ CPF/CNPJ inválido
✗ Inconsistência contábil
✗ Documento fiscal sem contrato associado
✗ Pagamento > valor documento fiscal
✗ Datas fora de ordem
```

### Avisos (PODEM PROSSEGUIR)
```
⚠ Contrato vencido (vigencia_fim < hoje)
⚠ Documento sem pagamento registrado
⚠ Pagamento parcial (valor < valor_documento)
⚠ Responsável com CPF duplicado
⚠ Saldo final muito diferente do esperado (> 5%)
⚠ Documentos fiscais sem descrição completa
⚠ Bens sem documentação
```

---

## 5. VALIDAÇÃO DE DOCUMENTAÇÃO

### Completude Obrigatória
```
Checklist antes de permitir envio:

Documentação Fiscal:
  ✓ Número do documento preenchido
  ✓ Data de emissão válida
  ✓ CNPJ/CPF fornecedor válido
  ✓ Valor bruto positivo
  ✓ Vinculado a contrato válido
  ✓ Situação de pagamento definida

Documentação de Pagamento:
  ✓ Data de pagamento preenchida
  ✓ Valor pago ≤ valor documento
  ✓ Forma de pagamento selecionada
  ✓ Comprovante anexado (arquivo)
  ✓ Vinculado a documento fiscal válido

Documentação de Contrato:
  ✓ Número identificador
  ✓ Datas (celebração, vigência)
  ✓ Valor total positivo
  ✓ Objeto descrito
  ✓ Contratante e contratado identificados
  ✓ Situação definida

Erro (se documentação incompleta):
"[N] item(ns) com documentação incompleta. Revise antes de enviar."
```

---

## 6. VALIDAÇÃO DE CONFORMIDADE TCE-SP

### Conformidade com Lei de Transparência
```
Verificações:
  ✓ Dados identificáveis de beneficiários (CPF/CNPJ não mascarados)
  ✓ Valores de pagamento públicos
  ✓ Datas de execução registradas
  ✓ Justificativa para despesas > valor X

Erro (se violar):
"Dados violam requisitos de transparência TCE-SP"
```

### Conformidade com Instruções Normativas
```
Verificações:
  ✓ Contratação seguiu procedimentos licitação (quando obrigatório)
  ✓ Não há contratação de familiares proibidos
  ✓ Despesas dentro de categorias autorizadas
  ✓ Não há desvio de finalidade

Alerta (se suspeito):
"Possível desvio de finalidade detectado. Revise a descrição."
```

---

## 7. REGRAS DE VALIDAÇÃO - CÓDIGO EXEMPLO

```typescript
// Exemplo de implementação das regras

interface ValidacaoResultado {
  valido: boolean;
  erros: string[];
  avisos: string[];
  caminhoJSON: string[];
}

class ValidadorPrestacao {
  
  validarDescriptor(descritor: any): ValidacaoResultado {
    const erros: string[] = [];
    
    // Tipo de dado
    if (typeof descritor.municipio !== 'number') {
      erros.push("descritor.municipio: deve ser número");
    }
    
    // Range
    if (descritor.municipio < 1 || descritor.municipio > 9999) {
      erros.push("descritor.municipio: deve estar entre 1 e 9999");
    }
    
    // Validar ao lado
    if (!existeNoIBGE(descritor.municipio)) {
      erros.push("descritor.municipio: não encontrado no IBGE");
    }
    
    return { 
      valido: erros.length === 0, 
      erros,
      avisos: [],
      caminhoJSON: ['descritor']
    };
  }
  
  validarDocumentoFiscal(doc: any): ValidacaoResultado {
    const erros: string[] = [];
    const avisos: string[] = [];
    
    // Valor não pode exceder documento
    if (doc.valor_liquido > doc.valor_bruto) {
      erros.push(
        `documentos_fiscais[${doc.id}].valor_liquido: ` +
        `não pode exceder valor_bruto`
      );
    }
    
    // Alertar se sem contrato
    if (!doc.contrato_id) {
      avisos.push(
        `documentos_fiscais[${doc.id}]: ` +
        `sem contrato associado (aviso)`
      );
    }
    
    return {
      valido: erros.length === 0,
      erros,
      avisos,
      caminhoJSON: ['documentos_fiscais', doc.id]
    };
  }
  
  validarEquacaoContabil(prestacao: any): ValidacaoResultado {
    const {
      disponibilidades,
      receitas,
      pagamentos
    } = prestacao;
    
    const saldoInicial = (disponibilidades.saldos || [])
      .reduce((sum, s) => sum + s.valor, 0);
    
    const totalReceitas = Object.values(receitas || {})
      .reduce((sum, v: any) => sum + (v || 0), 0);
    
    const totalPagamentos = (pagamentos || [])
      .reduce((sum, p) => sum + p.valor, 0);
    
    const saldoEsperado = saldoInicial + totalReceitas - totalPagamentos;
    const saldoInformado = (disponibilidades.saldos || [])
      .reduce((sum, s) => sum + s.valor, 0); // fim
    
    if (Math.abs(saldoEsperado - saldoInformado) > 0.01) {
      return {
        valido: false,
        erros: [
          `Inconsistência contábil: saldo esperado R$ ${saldoEsperado.toFixed(2)}, ` +
          `informado R$ ${saldoInformado.toFixed(2)}`
        ],
        avisos: [],
        caminhoJSON: ['disponibilidades', 'receitas', 'pagamentos']
      };
    }
    
    return { valido: true, erros: [], avisos: [], caminhoJSON: [] };
  }
}
```

---

**Documento de Validação e Conformidade**  
**Coordenadoria / TCE-SP**  
**Versão 1.0 | 20/01/2026**
