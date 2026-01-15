-- ============================================
-- CORRIGIR POLÍTICAS RLS
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Remover políticas antigas (ignorar erros se não existirem)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow all" ON organizations;
DROP POLICY IF EXISTS "Allow all" ON user_profiles;

-- 2. Criar políticas simples sem recursão
CREATE POLICY "public_access_organizations" ON organizations
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "public_access_user_profiles" ON user_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Pronto! Recarregue a página.
