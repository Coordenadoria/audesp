# 📋 FORMULÁRIOS DETALHADOS - PRESTAÇÃO DE CONTAS v1.9

**Status**: Especificação de UI/UX  
**Versão**: 1.0  
**Data**: 20/01/2026  

---

## ÍNDICE DE FORMULÁRIOS

1. Descritor e Identificação
2. Responsáveis e Contatos
3. Contratos
4. Documentos Fiscais
5. Pagamentos
6. Disponibilidades
7. Receitas
8. Bens Patrimoniais
9. Relatórios e Declarações
10. Parecer Conclusivo

---

## 1. FORMULÁRIO: DESCRITOR E IDENTIFICAÇÃO

**Objetivo**: Registrar informações básicas da prestação de contas

**Tipo**: Painel (wizard passo 1)

### Campo 1.1: Tipo de Documento
```
Nome Técnico:    tipo_documento
Nome UI:         Tipo de Documento
Tipo:            String (enum)
Valores:         ["Prestação de Contas de Convênio"]
Obrigatório:     Sim
Readonly:        Sim (sempre "Prestação de Contas de Convênio")
Validação:       -
Exemplo:         "Prestação de Contas de Convênio"
Ajuda:           "Tipo de documento a ser submetido à AUDESP"
Erro:            "Tipo de documento é obrigatório"
```

### Campo 1.2: Código do Município
```
Nome Técnico:    descritor.municipio
Nome UI:         Município (Código IBGE)
Tipo:            Integer (1-9999)
Obrigatório:     Sim
Máscara:         Autocomplete com busca
Validação:
  • Deve ser número entre 1 e 9999
  • Deve existir na base IBGE
  • Máximo 4 dígitos
Exemplo:         7107 (São Paulo - SP)
Ajuda:           "Digite o código IBGE do município. Ex: 7107 para São Paulo"
Erro-Invalido:   "Município deve ser um número válido"
Erro-Naoexiste:  "Município não encontrado na base IBGE"
```

### Campo 1.3: Código da Entidade
```
Nome Técnico:    descritor.entidade
Nome UI:         Entidade Beneficiária (Código)
Tipo:            Integer (1-99999)
Obrigatório:     Sim
Máscara:         Autocomplete com busca
Validação:
  • Deve ser número entre 1 e 99999
  • Deve existir no CADESP
  • Máximo 5 dígitos
  • Vinculado ao município selecionado
Exemplo:         10048
Ajuda:           "Código da organização beneficiária do convênio"
Erro:            "Entidade não encontrada ou inválida"
```

### Campo 1.4: Ano de Referência
```
Nome Técnico:    descritor.ano
Nome UI:         Ano de Referência
Tipo:            Integer (2000-2099)
Obrigatório:     Sim
Máscara:         Spinner numérico ou select
Validação:
  • Entre 2000 e ano atual
  • Não pode ser ano futuro
  • 4 dígitos
Exemplo:         2024
Ajuda:           "Ano de referência da prestação de contas"
Erro:            "Ano deve estar entre 2000 e 2024"
Conversão:       Usuário vê: "2024", Sistema: 2024
```

### Campo 1.5: Mês de Referência
```
Nome Técnico:    descritor.mes
Nome UI:         Mês de Referência
Tipo:            Integer (1-12)
Obrigatório:     Sim
Máscara:         Select dropdown com nomes de meses
Validação:
  • Entre 1 e 12
  • Se ano = ano atual, mês ≤ mês atual
Exemplo:         12 (Dezembro)
Ajuda:           "Mês de fechamento da prestação de contas"
Erro:            "Mês deve estar entre 1 (Janeiro) e 12 (Dezembro)"
Conversão:       Usuário vê: "Dezembro", Sistema: 12
Opções:
  1 = Janeiro
  2 = Fevereiro
  3 = Março
  4 = Abril
  5 = Maio
  6 = Junho
  7 = Julho
  8 = Agosto
  9 = Setembro
  10 = Outubro
  11 = Novembro
  12 = Dezembro
```

### Campo 1.6: Código do Ajuste
```
Nome Técnico:    codigo_ajuste
Nome UI:         Código do Ajuste (Contrato)
Tipo:            String (15-19 dígitos)
Obrigatório:     Sim
Máscara:         Entrada livre, validada em tempo real
Validação:
  • Exatamente 15-19 caracteres numéricos
  • Primeira parte: ano (4 dígitos)
  • Deve estar vinculado a contrato ativo
  • Não pode haver 2 prestações com mesmo código
Exemplo:         "2024000000000001" (ano 2024 + sequencial)
Ajuda:           "Número identificador único do contrato/ajuste na AUDESP"
Erro-Tamanho:    "Código deve ter entre 15 e 19 dígitos"
Erro-Vinculo:    "Nenhum contrato ativo encontrado com este código"
Erro-Duplicado:  "Este código já possui prestação de contas registrada"
```

### Campo 1.7: É Retificação?
```
Nome Técnico:    retificacao
Nome UI:         Esta é uma retificação?
Tipo:            Boolean
Obrigatório:     Sim (padrão: false)
Controle:        Toggle/Checkbox
Validação:       -
Padrão:          false
Ajuda:           "Marque se esta é uma retificação de prestação anterior"
Lógica Condicional:
  Se retificacao = true:
    └─ Mostrar campo "Versão anterior"
       └─ Buscar prestações anteriores do mesmo código_ajuste
       └─ Permitir comparação com versão anterior
```

### Campo 1.8: Versão Anterior (Condicional)
```
Nome Técnico:    versao_anterior_id
Nome UI:         Qual prestação você está retificando?
Tipo:            Select (search)
Obrigatório:     Sim (se retificacao = true)
Validação:
  • Deve existir prestação anterior
  • Mesmo código_ajuste
  • Status = "ENVIADO"
Exemplo:         "v1.2024.001" (versão anterior)
Ajuda:           "Selecione a prestação anterior que você está corrigindo"
Erro:            "Nenhuma prestação anterior encontrada"
Lógica:
  Se selecionado:
    └─ Mostrar diferenças em painel ao lado
    └─ Permitir cópia de dados inalterados
```

### Campo 1.9: Data da Prestação
```
Nome Técnico:    prestacao_contas_entidade_beneficiaria.data_prestacao
Nome UI:         Data de Emissão
Tipo:            Date (YYYY-MM-DD)
Obrigatório:     Sim
Máscara:         DD/MM/YYYY com date picker
Validação:
  • Data ≤ hoje
  • Dia válido do mês
  • Consistente com ano/mês referência
Exemplo:         "2024-12-31"
Ajuda:           "Data em que a prestação foi preparada/assinada"
Erro:            "Data não pode ser no futuro"
```

---

## 2. FORMULÁRIO: RESPONSÁVEIS E CONTATOS

**Objetivo**: Registrar pessoas responsáveis pela prestação

**Tipo**: Repeating section (array)

### Seção 2.1: Responsáveis do Órgão Concessor

**Nome Técnico**: `responsaveis_membros_orgao_concessor`

```
Array: Sim (múltiplos responsáveis)
Mínimo: 1
Máximo: 20
Adicionar: Botão "Adicionar Responsável"
```

#### Campo 2.1.1: Nome do Responsável
```
Nome Técnico:    responsaveis_membros_orgao_concessor[n].nome
Nome UI:         Nome Completo
Tipo:            String (3-255 caracteres)
Obrigatório:     Sim
Validação:
  • Mínimo 3 caracteres
  • Máximo 255 caracteres
  • Não pode conter números exceto quando necessário
  • Formatação: Primeiro caractere maiúsculo
Exemplo:         "João Silva Saúde"
Ajuda:           "Nome completo do responsável"
Erro:            "Nome deve ter entre 3 e 255 caracteres"
```

#### Campo 2.1.2: CPF
```
Nome Técnico:    responsaveis_membros_orgao_concessor[n].cpf
Nome UI:         CPF
Tipo:            String (11 dígitos)
Obrigatório:     Sim
Máscara:         ###.###.###-## (máscarado visualmente)
Validação:
  • Exatamente 11 dígitos
  • Validação módulo 11 (dígito verificador)
  • Não pode ser CPF bloqueado (teste 000.000.000-00, etc)
Exemplo:         "12345678910" → Exibe "123.456.789-10"
Ajuda:           "CPF do responsável (11 dígitos)"
Erro-Tamanho:    "CPF deve ter exatamente 11 dígitos"
Erro-Invalido:   "CPF inválido (falhou validação de dígito verificador)"
Erro-Bloqueado:  "Este CPF está bloqueado no sistema"

Função Validação (pseudocódigo):
  validarCPF(cpf):
    remover máscara → "12345678910"
    se comprimento ≠ 11 → erro
    se todos dígitos iguais → erro
    calcular dígitos verificadores (módulo 11)
    se não bate → erro
    retorno: válido
```

#### Campo 2.1.3: Cargo
```
Nome Técnico:    responsaveis_membros_orgao_concessor[n].cargo
Nome UI:         Cargo/Função
Tipo:            String (select)
Obrigatório:     Sim
Enum:
  - "Prefeito"
  - "Secretário"
  - "Gerente Administrativo"
  - "Contador"
  - "Tesoureiro"
  - "Outro"
Exemplo:         "Tesoureiro"
Ajuda:           "Selecione o cargo do responsável"
Erro:            "Cargo é obrigatório"
```

#### Campo 2.1.4: Email
```
Nome Técnico:    responsaveis_membros_orgao_concessor[n].email
Nome UI:         Email
Tipo:            String (email)
Obrigatório:     Não
Validação:
  • Formato válido de email
  • RFC 5322 simplificado
Exemplo:         "joao.silva@prefeitura.sp.gov.br"
Ajuda:           "Email para comunicação"
Erro:            "Email inválido"
```

#### Campo 2.1.5: Telefone
```
Nome Técnico:    responsaveis_membros_orgao_concessor[n].telefone
Nome UI:         Telefone
Tipo:            String (phone)
Obrigatório:     Não
Máscara:         (##) ####-#### ou (##) #####-####
Validação:
  • 10 ou 11 dígitos
  • DDD válido
Exemplo:         "(11) 3333-4444"
Ajuda:           "Telefone para contato"
Erro:            "Telefone deve ter 10 ou 11 dígitos"
```

#### Campo 2.1.6: Data de Nomeação
```
Nome Técnico:    responsaveis_membros_orgao_concessor[n].data_nomeacao
Nome UI:         Data de Nomeação
Tipo:            Date
Obrigatório:     Não
Máscara:         DD/MM/YYYY
Validação:
  • Deve ser no passado ou hoje
Exemplo:         "01/01/2024"
Ajuda:           "Data em que foi nomeado para o cargo"
```

#### Campo 2.1.7: Assinatura Digital
```
Nome Técnico:    responsaveis_membros_orgao_concessor[n].assinado
Nome UI:         Assinou Digitalmente?
Tipo:            Boolean
Obrigatório:     Não (padrão: false)
Controle:        Checkbox
Ajuda:           "Indique se já assinou digitalmente a prestação"
Lógica:
  Se assinar:
    └─ Integração com certificado digital (A1/A3)
    └─ Gerar hash do documento
    └─ Armazenar timestamp
    └─ Salvar certificado em base segura
```

---

## 3. FORMULÁRIO: CONTRATOS

**Objetivo**: Registrar contratos/ajustes associados à prestação

**Tipo**: Repeating section (array)

### Campos Principais do Contrato

```
Nome Técnico:    contratos[n]
Array:           Sim
Mínimo:          0
Máximo:          1000
```

#### Campo 3.1: ID Único do Contrato
```
Nome Técnico:    contratos[n].id
Nome UI:         (Gerado automaticamente)
Tipo:            UUID
Sistema:         Gerado pelo backend
Exemplo:         "550e8400-e29b-41d4-a716-446655440000"
```

#### Campo 3.2: Número do Contrato
```
Nome Técnico:    contratos[n].numero
Nome UI:         Número do Contrato
Tipo:            String (1-50 caracteres)
Obrigatório:     Sim
Validação:
  • Máximo 50 caracteres
  • Único dentro da prestação
Exemplo:         "2024/001" ou "TC-000001"
Ajuda:           "Número de identificação do contrato/ajuste"
Erro:            "Número de contrato é obrigatório e deve ser único"
```

#### Campo 3.3: Data de Celebração
```
Nome Técnico:    contratos[n].data_celebracao
Nome UI:         Data de Celebração
Tipo:            Date
Obrigatório:     Sim
Máscara:         DD/MM/YYYY
Validação:
  • Data válida
  • Data ≤ hoje
Exemplo:         "15/01/2024"
```

#### Campo 3.4: Vigência Inicial
```
Nome Técnico:    contratos[n].vigencia_inicio
Nome UI:         Vigência - Data Inicial
Tipo:            Date
Obrigatório:     Sim
Máscara:         DD/MM/YYYY
Validação:
  • Data válida
  • vigencia_inicio ≥ data_celebracao
Exemplo:         "15/01/2024"
```

#### Campo 3.5: Vigência Final
```
Nome Técnico:    contratos[n].vigencia_fim
Nome UI:         Vigência - Data Final
Tipo:            Date
Obrigatório:     Sim
Máscara:         DD/MM/YYYY
Validação:
  • Data válida
  • vigencia_fim > vigencia_inicio
  • Alerta se vigencia_fim < hoje (contrato vencido)
Exemplo:         "31/12/2024"
Alerta:          "Este contrato venceu. Você tem certeza?"
```

#### Campo 3.6: Valor Total do Contrato
```
Nome Técnico:    contratos[n].valor_total
Nome UI:         Valor Total
Tipo:            Decimal (10,2)
Obrigatório:     Sim
Máscara:         R$ 1.234,56 (apresentação)
Validação:
  • Não negativo
  • Máximo 999.999.999,99
  • Deve ser > 0
Exemplo:         100000.00 (exibe "R$ 100.000,00")
Ajuda:           "Valor total contratado"
Erro:            "Valor deve ser positivo"
```

#### Campo 3.7: Objeto do Contrato
```
Nome Técnico:    contratos[n].objeto
Nome UI:         Objeto/Descrição
Tipo:            String (textarea, 10-1000 caracteres)
Obrigatório:     Sim
Validação:
  • Mínimo 10 caracteres
  • Máximo 1000 caracteres
Exemplo:         "Contratação de serviços de limpeza e manutenção..."
Ajuda:           "Descrição clara do que foi contratado"
```

#### Campo 3.8: Contratante (Órgão)
```
Nome Técnico:    contratos[n].contratante
Nome UI:         Contratante
Tipo:            String (enum)
Obrigatório:     Sim
Enum:
  - "Prefeitura Municipal"
  - "Secretaria de [...]"
  - "Autarquia"
  - "Fundação"
  - "Outro"
Exemplo:         "Prefeitura Municipal"
```

#### Campo 3.9: Contratado (Fornecedor)
```
Nome Técnico:    contratos[n].contratado_cnpj_cpf
Nome UI:         CNPJ/CPF do Fornecedor
Tipo:            String (11 ou 14 caracteres)
Obrigatório:     Sim
Máscara:         Detecta automaticamente:
                 CPF: ###.###.###-##
                 CNPJ: ##.###.###/####-##
Validação:
  • CPF ou CNPJ válido (módulo 11)
Exemplo:         "12.345.678/0001-90" (CNPJ)
Ajuda:           "CPF do fornecedor PF ou CNPJ da empresa PJ"
Erro:            "CPF ou CNPJ inválido"
```

#### Campo 3.10: Razão Social do Contratado
```
Nome Técnico:    contratos[n].contratado_nome
Nome UI:         Razão Social/Nome
Tipo:            String (3-255)
Obrigatório:     Sim
Validação:
  • Mínimo 3 caracteres
Exemplo:         "Empresa XYZ Serviços Ltda"
```

#### Campo 3.11: Situação do Contrato
```
Nome Técnico:    contratos[n].situacao
Nome UI:         Situação
Tipo:            Enum
Obrigatório:     Sim
Valores:
  - "ATIVO"
  - "ENCERRADO"
  - "RESCINDIDO"
  - "SUSPENSO"
Padrão:          "ATIVO"
Exemplo:         "ENCERRADO"
Lógica:
  Se data_fim < hoje:
    └─ Sugerir "ENCERRADO"
```

---

## 4. FORMULÁRIO: DOCUMENTOS FISCAIS

**Objetivo**: Registrar notas fiscais, RPS e outros documentos de despesa

**Tipo**: Repeating section (array) + Importação via PDF

### Campos Principais do Documento Fiscal

```
Nome Técnico:    documentos_fiscais[n]
Array:           Sim
Mínimo:          0
Máximo:          10000
Importação:      Via upload PDF + OCR
```

#### Campo 4.1: Tipo de Documento
```
Nome Técnico:    documentos_fiscais[n].tipo
Nome UI:         Tipo de Documento
Tipo:            Enum
Obrigatório:     Sim
Valores:
  - "NOTA_FISCAL"
  - "RPS" (Recibo de Prestação de Serviço)
  - "CUPOM_FISCAL"
  - "CT_E" (Conhecimento de Transporte Eletrônico)
  - "NFE" (Nota Fiscal Eletrônica)
  - "RECIBO"
  - "OUTRO"
Exemplo:         "NOTA_FISCAL"
Sugestão OCR:    Se importado de PDF, sistema sugere tipo
```

#### Campo 4.2: Número do Documento
```
Nome Técnico:    documentos_fiscais[n].numero
Nome UI:         Número do Documento
Tipo:            String (1-50)
Obrigatório:     Sim
Validação:
  • Único dentro da prestação
Exemplo:         "001234567"
```

#### Campo 4.3: Série
```
Nome Técnico:    documentos_fiscais[n].serie
Nome UI:         Série
Tipo:            String (1-10)
Obrigatório:     Não
Exemplo:         "A" ou "RPA"
```

#### Campo 4.4: Data de Emissão
```
Nome Técnico:    documentos_fiscais[n].data_emissao
Nome UI:         Data de Emissão
Tipo:            Date
Obrigatório:     Sim
Máscara:         DD/MM/YYYY
Validação:
  • Dentro da vigência do contrato relacionado
  • Não futuro
  • Consistente com período da prestação
Exemplo:         "15/01/2024"
Erro-Vigencia:   "Data de emissão fora da vigência do contrato"
```

#### Campo 4.5: CNPJ/CPF do Fornecedor
```
Nome Técnico:    documentos_fiscais[n].fornecedor_cnpj_cpf
Nome UI:         CNPJ/CPF do Fornecedor
Tipo:            String (11 ou 14)
Obrigatório:     Sim
Máscara:         Detecta automaticamente
Validação:
  • Válido módulo 11
  • Extraído de PDF via OCR se disponível
Exemplo:         "12.345.678/0001-90"
```

#### Campo 4.6: Razão Social do Fornecedor
```
Nome Técnico:    documentos_fiscais[n].fornecedor_nome
Nome UI:         Razão Social/Nome
Tipo:            String
Obrigatório:     Sim
Exemplo:         "Empresa ABC Ltda"
```

#### Campo 4.7: Valor Bruto
```
Nome Técnico:    documentos_fiscais[n].valor_bruto
Nome UI:         Valor Bruto
Tipo:            Decimal (10,2)
Obrigatório:     Sim
Máscara:         R$ 1.234,56
Validação:
  • Não negativo
  • > 0
  • ≤ 999.999.999,99
Exemplo:         1000.00
```

#### Campo 4.8: Encargos/Desconto
```
Nome Técnico:    documentos_fiscais[n].encargos
Nome UI:         Encargos/Deduções
Tipo:            Decimal (10,2)
Obrigatório:     Não (padrão: 0)
Máscara:         R$ 1.234,56
Validação:
  • Não negativo
Exemplo:         150.00
Lógica:
  valor_liquido = valor_bruto - encargos
```

#### Campo 4.9: Valor Líquido
```
Nome Técnico:    documentos_fiscais[n].valor_liquido
Nome UI:         Valor Líquido (Calculado)
Tipo:            Decimal (10,2)
Sistema:         Calculado: valor_bruto - encargos
Readonly:        Sim
Máscara:         R$ 1.234,56
Exemplo:         850.00
```

#### Campo 4.10: Descrição do Serviço/Produto
```
Nome Técnico:    documentos_fiscais[n].descricao
Nome UI:         Descrição
Tipo:            String (textarea, 10-500)
Obrigatório:     Sim
Exemplo:         "Fornecimento de material de limpeza..."
```

#### Campo 4.11: Vínculo ao Contrato
```
Nome Técnico:    documentos_fiscais[n].contrato_id
Nome UI:         Contrato Associado
Tipo:            Select (search)
Obrigatório:     Sim (validação contábil)
Opções:          Lista de contratos da prestação
Validação:
  • Deve existir contrato na prestação
  • Data documento dentro vigência contrato
Erro:            "Este documento não pode ser associado: fora da vigência"
Sugestão OCR:    Se importado, sistema tenta vincular automaticamente
```

#### Campo 4.12: Situação do Pagamento
```
Nome Técnico:    documentos_fiscais[n].situacao_pagamento
Nome UI:         Situação
Tipo:            Enum
Obrigatório:     Sim
Valores:
  - "PAGAMENTOEFETIVADO" (pago)
  - "NAOEFETIVADO" (não pago)
  - "PARCIAL" (pago parcialmente)
  - "GLOSADO" (rejeitado)
Padrão:          "PAGAMENTOEFETIVADO"
Lógica:
  Se existe pagamento vinculado:
    └─ Mostrar link para pagamento
    └─ Exibir data e valor pagos
```

---

## 5. FORMULÁRIO: PAGAMENTOS

**Objetivo**: Registrar efetivamente pagamentos realizados

**Tipo**: Repeating section (array)

### Campos Principais do Pagamento

```
Nome Técnico:    pagamentos[n]
Array:           Sim
Mínimo:          0
Máximo:          10000
```

#### Campo 5.1: Número da Transação/Comprovante
```
Nome Técnico:    pagamentos[n].numero_transacao
Nome UI:         Número do Comprovante
Tipo:            String (1-50)
Obrigatório:     Sim
Validação:
  • Único na prestação
Exemplo:         "001ABC"
```

#### Campo 5.2: Data do Pagamento
```
Nome Técnico:    pagamentos[n].data_pagamento
Nome UI:         Data do Pagamento
Tipo:            Date
Obrigatório:     Sim
Máscara:         DD/MM/YYYY
Validação:
  • Data ≤ hoje
  • Dentro período da prestação
Exemplo:         "15/01/2024"
```

#### Campo 5.3: Forma de Pagamento
```
Nome Técnico:    pagamentos[n].forma_pagamento
Nome UI:         Forma de Pagamento
Tipo:            Enum
Obrigatório:     Sim
Valores:
  - "BOLETO"
  - "TRANSFERENCIA_BANCARIA"
  - "CHEQUE"
  - "DINHEIRO"
  - "PIX"
  - "CARTAO"
  - "OUTRO"
Exemplo:         "TRANSFERENCIA_BANCARIA"
```

#### Campo 5.4: Valor Pago
```
Nome Técnico:    pagamentos[n].valor
Nome UI:         Valor
Tipo:            Decimal (10,2)
Obrigatório:     Sim
Máscara:         R$ 1.234,56
Validação:
  • Não negativo
  • > 0
Exemplo:         850.00
Validação Contábil:
  valor_pago ≤ valor_documento_fiscal
  └─ Se não: ERRO "Pagamento > Documento"
```

#### Campo 5.5: Vínculo ao Documento Fiscal
```
Nome Técnico:    pagamentos[n].documento_fiscal_id
Nome UI:         Documento Associado
Tipo:            Select (search)
Obrigatório:     Sim (validação contábil)
Opções:          Documentos da prestação
Validação:
  • Documento deve existir
  • valor_pago ≤ valor_documento
Erro:            "Valor do pagamento não pode ser maior que o documento"
```

#### Campo 5.6: Comprovante de Pagamento
```
Nome Técnico:    pagamentos[n].comprovante_url
Nome UI:         Comprovante (Arquivo)
Tipo:            File upload
Obrigatório:     Sim
Máscara:         Aceita: PDF, JPEG, PNG
Tamanho Máx:     10MB
Validação:
  • Arquivo válido
  • Tamanho ≤ 10MB
Armazenamento:   AWS S3 / Cloud Storage
Encriptado:      Sim (AES-256)
```

#### Campo 5.7: Referência Bancária
```
Nome Técnico:    pagamentos[n].referencia_bancaria
Nome UI:         Referência/Código de Transação
Tipo:            String
Obrigatório:     Não
Exemplo:         "DOC12345678" ou "PIX-ABC123"
```

---

## PRÓXIMAS SEÇÕES (continuação documento)

Este documento contém as especificações dos 5 primeiros formulários.

**Próximas seções (a serem detalhadas similarmente)**:

6. Formulário: Disponibilidades
7. Formulário: Receitas
8. Formulário: Bens Patrimoniais
9. Formulário: Relatórios e Declarações
10. Formulário: Parecer Conclusivo

Cada um seguindo o mesmo padrão de documentação com:
- Tipo de dado
- Validações
- Máscaras
- Exemplos
- Mensagens de erro
- Lógica condicional
- Sugestões automáticas

---

**Documento de Especificação de Formulários**  
**Coordenadoria / TCE-SP**  
**Versão 1.0 | 20/01/2026**
