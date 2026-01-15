-- ============================================
-- CRIAR TABELAS PARA O SISTEMA SAAS
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Tabela de Organizações (Clientes do ERP)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    plan VARCHAR(50) DEFAULT 'basico',
    status VARCHAR(50) DEFAULT 'trial',
    admin_user_id UUID,
    blocked_reason TEXT,
    blocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'Usuario',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança para organizations
CREATE POLICY "Allow all for authenticated users" ON organizations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Políticas de segurança para user_profiles
CREATE POLICY "Allow all for authenticated users" ON user_profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON organizations(cnpj);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);

-- ============================================
-- PRONTO! Agora as tabelas estão criadas
-- ============================================
