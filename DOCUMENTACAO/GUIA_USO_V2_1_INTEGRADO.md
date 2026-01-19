# 🚀 GUIA DE USO - AUDESP v2.1 INTEGRADO

## ✨ O QUE MUDOU?

Agora você tem **todas as funcionalidades integradas e visíveis** no sistema!

### ✅ Funcionalidades Disponíveis:

1. **🧪 Login Multi-Ambiente** 
   - Escolher entre Piloto (teste) ou Produção (dados reais)
   - Interface moderna com avisos de segurança
   - Memória de preferências

2. **📄 Processamento de PDFs com IA**
   - Upload de múltiplos PDFs (drag-and-drop)
   - Classificação automática com Claude 3.5 Sonnet
   - Sugestões de campos com nível de confiança
   - Preenchimento automático do formulário

3. **✓ Validação em Tempo Real**
   - Dashboard com estatísticas (erros, avisos, completude)
   - Detalhamento de erros por seção
   - Rastreamento em auditoria

4. **📋 13 APIs Implementadas**
   - Fase IV: Edital, Licitação, Ata, Ajuste
   - Fase V: Prestação de Contas (Convênio, Contrato, Termos, Declaração Negativa)
   - Todas com autenticação automática

---

## 🎯 COMO USAR

### 1️⃣ **Fazer Login**

Ao abrir o sistema (http://localhost:3000):

```
┌─────────────────────────────────────────┐
│     🧪 PILOTO    vs    🚀 PRODUÇÃO     │
│  (Azul para Teste)  (Vermelho para Real) │
│                                         │
│  Email: seu-email@instituicao.org.br   │
│  Senha: ****                            │
│                                         │
│  ☑ Lembrar minha escolha                │
│  ☑ Mostrar Senha                        │
│                                         │
│      [ACESSAR AMBIENTE]                │
└─────────────────────────────────────────┘
```

**Nota:** Sistema automaticamente seleciona **Piloto** para testes. Use Produção apenas com dados reais!

---

### 2️⃣ **Navegar no Dashboard**

Após login, você verá **3 abas principais:**

```
┌─────────────────────────────────────────────────────────┐
│  📋 Formulário  │  📄 PDFs (IA)  │  ✓ Validação          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Conteúdo da aba selecionada]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### **Aba 1: 📋 Formulário**
- Formulário tradicional com todos os campos
- Preenchimento manual ou automático
- Salvamento em rascunho automático

#### **Aba 2: 📄 PDFs (IA)**
- **Drag-and-drop de arquivos PDF**
- Processamento automático com Claude 3.5
- Sugestões aparecem automaticamente
- Botão "Aplicar Sugestão" para preencher campos

Exemplo de uso:
```
1. Arraste seus PDFs aqui
2. Sistema classifica automaticamente (Edital, Licitação, etc.)
3. Campos sugeridos aparecem com confiança (85%, 92%, etc.)
4. Clique "Aplicar" para preencher o formulário
```

#### **Aba 3: ✓ Validação**
- Resumo de erros e avisos
- Barra de progresso de completude
- Detalhamento por seção
- Status em tempo real

```
┌──────────────────────────────────┐
│         VALIDAÇÃO DO FORMULÁRIO  │
├──────────────────────────────────┤
│  Erros:      5 ❌                 │
│  Avisos:     2 ⚠️                 │
│  Completude: 78% █████████░      │
│  Status:     ⏳ Incompleto       │
└──────────────────────────────────┘

📋 Seções com Erro:
  └─ Dados Gerais: 2 erros
  └─ Recursos Humanos: 3 erros
```

---

## 💡 DICAS DE USO

### ✅ Fluxo Recomendado:

1. **Iniciar com Aba de PDFs**
   - Prepare seus documentos
   - Deixe a IA extrair dados automaticamente
   - Revise as sugestões

2. **Ir para Aba Formulário**
   - Campos já estarão pré-preenchidos
   - Revise e complemente manualmente
   - Corrija qualquer erro de extração

3. **Validar na Aba de Validação**
   - Verifique se há erros pendentes
   - Corrija os campos indicados
   - Repita até atingir 100% de completude

4. **Enviar para Audesp**
   - Clique "Transmitir" na barra lateral
   - Sistema envia para API
   - Protocolo é gerado automaticamente

---

## 🎨 VISUAL INTUITIVO

### Header do Sistema:
```
┌─────────────────────────────────────────────────┐
│  Prestação de Contas                            │
│  Audesp Fase V - 🧪 Piloto | usuario@email.com │
│                                                 │
│  [● Piloto (Teste)]  [SAIR]                    │
└─────────────────────────────────────────────────┘
```

### Notificações em Tempo Real:
```
✓ Campo preenchido automaticamente!      (Verde)
⚠ Aviso: Este campo pode ter erro        (Amarelo)
❌ Erro: Este campo é obrigatório        (Vermelho)
ℹ Rascunho salvo no navegador            (Azul)
```

---

## 🤖 COMO FUNCIONA A IA

### Processamento de PDFs (Claude 3.5 Sonnet):

```
1. Você envia um PDF
   ↓
2. Sistema extrai texto (PDFjs)
   ↓
3. Claude classifica o documento
   📌 "Este é um Edital"
   ↓
4. Claude extrai campos estruturados
   {
     "numero_edital": "001/2024",
     "data_publicacao": "2024-01-16",
     "valor_estimado": "R$ 150.000,00"
   }
   ↓
5. Sistema calcula confiança (0-100%)
   ↓
6. Usuário revisa e aplica sugestões
```

### Fallback (Sem IA):
Se as chaves de IA não estiverem configuradas, o sistema usa:
- Regex avançado para extração local
- Classificação por palavras-chave
- 100% funcional, sem dependências externas

---

## ⚙️ CONFIGURAÇÃO (OPCIONAL)

### Para ativar Claude 3.5 Sonnet:

**1. Obter chaves:**
```bash
# Visite: https://console.anthropic.com/
# Crie uma conta e gere sua API key
```

**2. Configurar no `.env.local`:**
```bash
REACT_APP_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

**3. Reiniciar servidor:**
```bash
npm start
```

### Testar se está funcionando:
- Vá para aba "PDFs (IA)"
- Envie um PDF
- Se ver "Claude 3.5 Sonnet" nos logs → ✅ Ativo!
- Se ver "Usando modelo local" → ℹ️ Fallback ativo (normal sem chave)

---

## 📊 EXEMPLOS DE SAÍDA

### Exemplo 1: PDF de Edital
```
Input:  📄 edital_2024_001.pdf (2.3 MB)

Output:
┌─────────────────────────────────┐
│ Classificação: EDITAL ✓         │
│ Confiança: 98%                  │
├─────────────────────────────────┤
│ Campos Extraídos:               │
│                                 │
│ numero_edital: 001/2024         │
│ Confiança: 95%  [Aplicar]       │
│                                 │
│ ano_fiscal: 2024                │
│ Confiança: 92%  [Aplicar]       │
│                                 │
│ valor_estimado: R$ 150.000,00   │
│ Confiança: 89%  [Aplicar]       │
└─────────────────────────────────┘
```

### Exemplo 2: Validação Completa
```
Prestação de Contas - 100% Completa

Status: ✅ PRONTO PARA ENVIO

Estatísticas:
  • Erros: 0
  • Avisos: 0  
  • Completude: 100% ███████████████

Seções Validadas:
  ✓ Dados Gerais (15/15 campos)
  ✓ Recursos Humanos (8/8 campos)
  ✓ Recursos Financeiros (12/12 campos)
  ✓ Imóveis e Bens (6/6 campos)
  ✓ Licitações (5/5 campos)

[TRANSMITIR PARA AUDESP]
```

---

## 🔒 SEGURANÇA

### ✅ Implementado:

1. **Autenticação JWT**
   - Token gerado no login
   - Expiração automática
   - Renovação transparente

2. **Ambiente Seguro**
   - Avisos para Produção (vermelho)
   - Confirmação de ações críticas
   - Logout automático por inatividade

3. **Dados Protegidos**
   - HTTPS em produção
   - Headers de autenticação automáticos
   - Validação no cliente e servidor

### ⚠️ Importante:

```
🚀 PRODUÇÃO (Vermelho)
   ↓
   Use APENAS com dados reais
   Cuidado com informações sensíveis
   Sempre verificar ambiente antes de enviar

🧪 PILOTO (Azul)
   ↓
   Use para testes e desenvolvimento
   Dados não são considerados oficiais
   Seguro para aprender o sistema
```

---

## 🆘 TROUBLESHOOTING

### Problema: "Não vejo as abas"
**Solução:**
```
1. Verifique se fez login (deve estar azul "Piloto" ou vermelho "Produção")
2. Clique na aba "Formulário" - as outras abas aparecem
3. Atualize a página (F5)
```

### Problema: "PDFs não processam"
**Solução:**
```
1. Verifique se os PDFs são válidos
2. Tente com um PDF simples primeiro
3. Se vir "modelo local" → IA desativada (ainda funciona sem chave)
4. Adicione chave ANTHROPIC no .env.local se quiser melhor resultado
```

### Problema: "Validação diz erro em campo"
**Solução:**
```
1. Vá para aba "Validação"
2. Expanda "Detalhes de Erros"
3. Veja qual campo falta preencher
4. Volte para aba "Formulário" e preencha
```

### Problema: "Não consigo fazer login"
**Solução:**
```
1. Verifique email/senha (case-sensitive)
2. Certifique-se que escolheu o ambiente correto
3. Verifique se o servidor está rodando (npm start)
4. Limpe cookies: DevTools → Application → Clear Site Data
```

---

## 📞 PRÓXIMOS PASSOS

1. ✅ **Login está funcionando?** → Teste fazer login
2. ✅ **PDFs processam?** → Envie um PDF para testar
3. ✅ **Validação funciona?** → Preencha alguns campos e veja validação
4. ✅ **Tudo certo?** → Prepare dados reais e use Produção

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes técnicos, consulte:
- `GUIA_VERSAO_2_1.md` - APIs e configuração
- `RESUMO_IMPLEMENTACAO_V2_1.md` - Sumário de features
- `src/components/EnhancedLoginComponent.tsx` - Código do login
- `src/components/BatchPDFImporter.tsx` - Código do importador
- `src/components/ValidationDashboard.tsx` - Código da validação

---

**Versão:** 2.1 Integrado  
**Status:** ✅ Em Produção  
**Última Atualização:** 16 de Janeiro de 2026  
**Desenvolvido por:** Audesp Team

🎉 **Aproveite o sistema!**
