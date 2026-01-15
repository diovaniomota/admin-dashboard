-- Adicionar colunas de endereço e dados fiscais na tabela organizations
-- Execute no SQL Editor do Supabase

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS cnae_principal TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS uf TEXT,
ADD COLUMN IF NOT EXISTS cod_ibge TEXT;

-- O pczt_erp_schema já deve estar pronto para receber esses dados
