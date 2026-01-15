-- ============================================
-- REFORÇO DE SEGURANÇA MULTI-TENANT
-- Remove políticas antigas e garante isolamento
-- Execute no Supabase SQL Editor
-- ============================================

-- Função auxiliar para recriar políticas de forma limpa
DO $$
DECLARE
    tables text[] := ARRAY['clientes_nf', 'produtos', 'fornecedores', 'veiculos', 'vendas', 'vendas_itens', 'movimentacoes_estoque', 'contas_receber', 'contas_pagar', 'nfce', 'nfce_itens', 'nfe', 'nfe_itens', 'configuracoes'];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- 1. Habilitar RLS (caso não esteja)
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
        
        -- 2. Remover TODAS as políticas existentes da tabela para garantir que não haja "Allow All" sobrando
        -- Isso é radical mas necessário para garantir isolamento
        EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable update for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable delete for all users" ON %I', t);
        
        -- Remover políticas que nós mesmos criamos para recriar (evitar erros de duplicidade)
        EXECUTE format('DROP POLICY IF EXISTS "Isolate %I by organization" ON %I', t, t);
    END LOOP;
END $$;

-- ========== REAPLICAR POLÍTICAS DE ISOLAMENTO ==========

-- Agora recriar as políticas estritas para cada tabela

-- Cadastros
CREATE POLICY "Isolate clientes_nf by organization" ON clientes_nf FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate produtos by organization" ON produtos FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate fornecedores by organization" ON fornecedores FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate veiculos by organization" ON veiculos FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- Vendas / Financeiro
CREATE POLICY "Isolate vendas by organization" ON vendas FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate vendas_itens by organization" ON vendas_itens FOR ALL TO authenticated USING (venda_id IN (SELECT id FROM vendas WHERE organization_id = get_user_organization_id()) OR is_super_admin()) WITH CHECK (venda_id IN (SELECT id FROM vendas WHERE organization_id = get_user_organization_id()) OR is_super_admin());
CREATE POLICY "Isolate movimentacoes_estoque by organization" ON movimentacoes_estoque FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate contas_receber by organization" ON contas_receber FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate contas_pagar by organization" ON contas_pagar FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- Fiscal
CREATE POLICY "Isolate nfce by organization" ON nfce FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate nfce_itens by organization" ON nfce_itens FOR ALL TO authenticated USING (nfce_id IN (SELECT id FROM nfce WHERE organization_id = get_user_organization_id()) OR is_super_admin()) WITH CHECK (nfce_id IN (SELECT id FROM nfce WHERE organization_id = get_user_organization_id()) OR is_super_admin());
CREATE POLICY "Isolate nfe by organization" ON nfe FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());
CREATE POLICY "Isolate nfe_itens by organization" ON nfe_itens FOR ALL TO authenticated USING (nfe_id IN (SELECT id FROM nfe WHERE organization_id = get_user_organization_id()) OR is_super_admin()) WITH CHECK (nfe_id IN (SELECT id FROM nfe WHERE organization_id = get_user_organization_id()) OR is_super_admin());
CREATE POLICY "Isolate configuracoes by organization" ON configuracoes FOR ALL TO authenticated USING (organization_id = get_user_organization_id() OR is_super_admin()) WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- ============================================
-- PRONTO! Agora apenas dados da própria organização devem aparecer.
-- ============================================
