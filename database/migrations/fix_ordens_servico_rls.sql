-- ============================================
-- RLS POLICIES PARA TABELA ORDENS_SERVICO
-- ============================================

-- Habilitar RLS na tabela ordens_servico (caso não esteja)
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Isolate ordens_servico by organization" ON ordens_servico;
DROP POLICY IF EXISTS "Allow all operations on ordens_servico" ON ordens_servico;

-- Criar policy de isolamento por organização
CREATE POLICY "Isolate ordens_servico by organization" ON ordens_servico
    FOR ALL TO authenticated
    USING (empresa_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (empresa_id = get_user_organization_id() OR is_super_admin());

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_empresa ON ordens_servico(empresa_id);

-- ============================================
-- VERIFICAR FOREIGN KEY CONSTRAINTS
-- ============================================

-- Verificar se existe constraint entre ordens_servico.client_id e clients.id
-- Se existir, garantir que ela valida o tenant também

-- Adicionar RLS na tabela clients se não existir (para garantir)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Isolate clients by organization" ON clients;

-- Criar policy de isolamento para clients
CREATE POLICY "Isolate clients by organization" ON clients
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);

-- ============================================
-- VERIFICAR SE EXISTE TRIGGER DE VALIDAÇÃO
-- ============================================

-- Verificar se existe trigger que valida cross-tenant
-- Se existir, podemos precisar ajustá-lo ou removê-lo

-- Listar todas as constraints e triggers da tabela ordens_servico
\dt+ ordens_servico
\d ordens_servico

-- Verificar triggers existentes
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'ordens_servico'::regclass;

-- ============================================
-- PRONTO! Isolamento configurado
-- ============================================