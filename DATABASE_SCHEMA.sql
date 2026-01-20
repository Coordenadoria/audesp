-- Migration: CreateUsersTable
-- Version: 001
-- Date: 2025-01-20

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletado_em TIMESTAMP NULL,
  
  -- Índices
  created_at_idx: ON(criado_em),
  email_idx: ON(email),
  cpf_idx: ON(cpf)
);

-- Migration: CreateSessionsTable
-- Version: 002

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255),
  
  -- Datas
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expira_em TIMESTAMP NOT NULL,
  refresh_expira_em TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT fk_sessions_user 
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Índices
  user_idx: ON(user_id),
  expira_idx: ON(expira_em)
);

-- Migration: CreatePrestacoeTable
-- Version: 003

CREATE TABLE IF NOT EXISTS prestacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Status e versioning
  status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
  versao INTEGER NOT NULL DEFAULT 1,
  
  -- Dados principais (JSON para flexibilidade)
  descritor JSONB NOT NULL,
  responsaveis JSONB DEFAULT '[]'::jsonb,
  contratos JSONB DEFAULT '[]'::jsonb,
  documentos_fiscais JSONB DEFAULT '[]'::jsonb,
  pagamentos JSONB DEFAULT '[]'::jsonb,
  disponibilidades JSONB DEFAULT '[]'::jsonb,
  receitas JSONB DEFAULT '[]'::jsonb,
  bens JSONB DEFAULT '[]'::jsonb,
  declaracoes JSONB DEFAULT '[]'::jsonb,
  parecer JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  competencia DATE NOT NULL,
  saldo_inicial DECIMAL(15,2),
  saldo_final DECIMAL(15,2),
  
  -- Validação
  erros_validacao JSONB DEFAULT '[]'::jsonb,
  avisos_validacao JSONB DEFAULT '[]'::jsonb,
  validado_em TIMESTAMP NULL,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enviado_em TIMESTAMP NULL,
  deletado_em TIMESTAMP NULL,
  
  -- Foreign Key
  CONSTRAINT fk_prestacoes_user 
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Índices
  user_idx: ON(user_id),
  status_idx: ON(status),
  competencia_idx: ON(competencia),
  atualizado_idx: ON(atualizado_em),
  validado_idx: ON(validado_em)
);

-- Migration: CreateAuditoriaTable
-- Version: 004

CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prestacao_id UUID,
  
  -- Ação
  acao VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, VALIDATE, EXPORT, LOGIN, etc
  descricao TEXT,
  
  -- Dados
  dados_antigos JSONB,
  dados_novos JSONB,
  
  -- Metadados
  endereco_ip VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_auditoria_user 
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_auditoria_prestacao 
    FOREIGN KEY(prestacao_id) REFERENCES prestacoes(id) ON DELETE SET NULL,
  
  -- Índices
  user_idx: ON(user_id),
  prestacao_idx: ON(prestacao_id),
  acao_idx: ON(acao),
  criado_idx: ON(criado_em)
);

-- Migration: CreateValidacaoHistoricoTable
-- Version: 005

CREATE TABLE IF NOT EXISTS validacao_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL,
  versao INTEGER NOT NULL,
  
  -- Resultado
  valido BOOLEAN NOT NULL,
  erros JSONB DEFAULT '[]'::jsonb,
  avisos JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT fk_validacao_prestacao 
    FOREIGN KEY(prestacao_id) REFERENCES prestacoes(id) ON DELETE CASCADE,
  
  -- Índices
  prestacao_idx: ON(prestacao_id),
  versao_idx: ON(versao),
  valido_idx: ON(valido)
);

-- Migration: CreateVersoeTable
-- Version: 006

CREATE TABLE IF NOT EXISTS prestacao_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL,
  versao INTEGER NOT NULL,
  
  -- Dados completos da versão
  dados JSONB NOT NULL,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT fk_versoes_prestacao 
    FOREIGN KEY(prestacao_id) REFERENCES prestacoes(id) ON DELETE CASCADE,
  
  -- Índices
  prestacao_versao_unique: UNIQUE(prestacao_id, versao),
  prestacao_idx: ON(prestacao_id)
);

-- Migration: CreateJsonExportHistoricoTable
-- Version: 007

CREATE TABLE IF NOT EXISTS json_export_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL,
  versao_prestacao INTEGER NOT NULL,
  
  -- JSON exportado
  json_v19 JSONB NOT NULL,
  
  -- Status do envio
  enviado BOOLEAN DEFAULT false,
  data_envio TIMESTAMP NULL,
  protocolo_audesp VARCHAR(50) NULL,
  resposta_audesp JSONB NULL,
  
  -- Timestamps
  gerado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT fk_export_prestacao 
    FOREIGN KEY(prestacao_id) REFERENCES prestacoes(id) ON DELETE CASCADE,
  
  -- Índices
  prestacao_idx: ON(prestacao_id),
  enviado_idx: ON(enviado),
  gerado_idx: ON(gerado_em)
);

-- Migration: CreateApiKeysTable (para futuro uso de integração)
-- Version: 008

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Chave
  chave_hash VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  
  -- Permissões
  permissoes JSONB DEFAULT '["read"]'::jsonb,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_uso TIMESTAMP NULL,
  expira_em TIMESTAMP NULL,
  
  -- Foreign Key
  CONSTRAINT fk_apikeys_user 
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Índices
  user_idx: ON(user_id),
  ativo_idx: ON(ativo)
);

-- Índices Full Text (para busca)
CREATE INDEX IF NOT EXISTS prestacoes_search_idx 
  ON prestacoes USING GIN (
    to_tsvector('portuguese', descritor->>'numero')
  );

-- Views úteis para relatórios

CREATE OR REPLACE VIEW prestacoes_resumo AS
SELECT 
  p.id,
  p.user_id,
  u.email as usuario_email,
  u.nome as usuario_nome,
  p.status,
  p.versao,
  p.competencia,
  p.criado_em,
  p.atualizado_em,
  p.validado_em,
  p.enviado_em,
  -- Contadores
  jsonb_array_length(p.responsaveis) as qtd_responsaveis,
  jsonb_array_length(p.contratos) as qtd_contratos,
  jsonb_array_length(p.documentos_fiscais) as qtd_documentos,
  jsonb_array_length(p.pagamentos) as qtd_pagamentos,
  -- Valores
  COALESCE(p.saldo_inicial, 0) as saldo_inicial,
  COALESCE(p.saldo_final, 0) as saldo_final
FROM prestacoes p
JOIN users u ON p.user_id = u.id
WHERE p.deletado_em IS NULL;

CREATE OR REPLACE VIEW usuario_estatisticas AS
SELECT 
  u.id,
  u.email,
  u.nome,
  COUNT(DISTINCT p.id) as total_prestacoes,
  SUM(CASE WHEN p.status = 'rascunho' THEN 1 ELSE 0 END) as prestacoes_rascunho,
  SUM(CASE WHEN p.status = 'validado' THEN 1 ELSE 0 END) as prestacoes_validadas,
  SUM(CASE WHEN p.status = 'enviado' THEN 1 ELSE 0 END) as prestacoes_enviadas,
  COUNT(DISTINCT a.id) as total_operacoes,
  MAX(a.criado_em) as ultima_operacao,
  u.criado_em
FROM users u
LEFT JOIN prestacoes p ON u.id = p.user_id AND p.deletado_em IS NULL
LEFT JOIN auditoria a ON u.id = a.user_id
WHERE u.deletado_em IS NULL
GROUP BY u.id, u.email, u.nome, u.criado_em;

-- Triggers para atualizar timestamps

CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prestacoes_update_atualizado_em
  BEFORE UPDATE ON prestacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER users_update_atualizado_em
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- Função para soft delete

CREATE OR REPLACE FUNCTION soft_delete_prestacao(prestacao_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prestacoes SET deletado_em = CURRENT_TIMESTAMP
  WHERE id = prestacao_id AND deletado_em IS NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET deletado_em = CURRENT_TIMESTAMP
  WHERE id = user_id AND deletado_em IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Constraints de negócio

-- Validar status válidos
ALTER TABLE prestacoes
ADD CONSTRAINT prestacoes_status_check
CHECK (status IN ('rascunho', 'validado', 'enviado', 'rejeitado'));

-- Validar que saldo_final = saldo_inicial + receitas - despesas
-- (será feito em aplicação, mas podemos adicionar trigger se necessário)

-- Grant permissions (exemplo para aplicação)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO audesp_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO audesp_app;
