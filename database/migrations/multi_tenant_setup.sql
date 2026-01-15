-- ============================================
-- CONFIGURAÇÃO MULTI-TENANT
-- Isolamento de dados por organização
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ========== PARTE 1: ATUALIZAR POLÍTICAS RLS EXISTENTES ==========

-- Remover políticas antigas (permissivas demais)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;

-- Política para organizations: Super Admin vê tudo, usuário comum vê só a sua
CREATE POLICY "Super admin full access to organizations" ON organizations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_super_admin = true)
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT
    TO authenticated
    USING (
        id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    );

-- Política para user_profiles: Super Admin vê tudo, usuário comum vê só da sua org
CREATE POLICY "Super admin full access to user_profiles" ON user_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.is_super_admin = true)
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.is_super_admin = true)
    );

CREATE POLICY "Users can view profiles in own organization" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ========== PARTE 2: TABELAS DE DADOS DO ERP ==========

-- Clientes para Nota Fiscal (diferente das organizations que são seus clientes SaaS)
CREATE TABLE IF NOT EXISTS clientes_nf (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cpf_cnpj VARCHAR(18) NOT NULL,
    inscricao_estadual VARCHAR(50),
    email VARCHAR(255),
    telefone VARCHAR(20),
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    cod_ibge VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ncm VARCHAR(10),
    cfop VARCHAR(10),
    unidade VARCHAR(10) DEFAULT 'UN',
    preco_venda DECIMAL(15,2) DEFAULT 0,
    preco_custo DECIMAL(15,2) DEFAULT 0,
    estoque_atual DECIMAL(15,3) DEFAULT 0,
    estoque_minimo DECIMAL(15,3) DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cpf_cnpj VARCHAR(18) NOT NULL,
    inscricao_estadual VARCHAR(50),
    email VARCHAR(255),
    telefone VARCHAR(20),
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFC-e (Nota Fiscal ao Consumidor Eletrônica)
CREATE TABLE IF NOT EXISTS nfce (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    serie VARCHAR(5) DEFAULT '1',
    chave_acesso VARCHAR(50),
    data_emissao TIMESTAMPTZ DEFAULT NOW(),
    cliente_id UUID REFERENCES clientes_nf(id),
    valor_total DECIMAL(15,2) NOT NULL,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    forma_pagamento VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, autorizada, cancelada, rejeitada
    xml TEXT,
    protocolo VARCHAR(50),
    motivo_rejeicao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da NFC-e
CREATE TABLE IF NOT EXISTS nfce_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nfce_id UUID NOT NULL REFERENCES nfce(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    descricao VARCHAR(255) NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    cfop VARCHAR(10),
    ncm VARCHAR(10)
);

-- NF-e (Nota Fiscal Eletrônica)
CREATE TABLE IF NOT EXISTS nfe (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    serie VARCHAR(5) DEFAULT '1',
    chave_acesso VARCHAR(50),
    natureza_operacao VARCHAR(100),
    data_emissao TIMESTAMPTZ DEFAULT NOW(),
    data_saida TIMESTAMPTZ,
    cliente_id UUID REFERENCES clientes_nf(id),
    valor_produtos DECIMAL(15,2) NOT NULL,
    valor_frete DECIMAL(15,2) DEFAULT 0,
    valor_seguro DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    xml TEXT,
    protocolo VARCHAR(50),
    motivo_rejeicao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da NF-e
CREATE TABLE IF NOT EXISTS nfe_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nfe_id UUID NOT NULL REFERENCES nfe(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    descricao VARCHAR(255) NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL,
    cfop VARCHAR(10),
    ncm VARCHAR(10)
);

-- ========== PARTE 3: HABILITAR RLS NAS NOVAS TABELAS ==========

ALTER TABLE clientes_nf ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfce ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfce_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfe_itens ENABLE ROW LEVEL SECURITY;

-- ========== PARTE 4: POLÍTICAS RLS PARA ISOLAMENTO ==========

-- Função auxiliar para verificar organização do usuário
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Função para verificar se é super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()),
        false
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Macro para criar políticas padrão em tabelas com organization_id
-- Aplicando para cada tabela:

-- clientes_nf
CREATE POLICY "Isolate clientes_nf by organization" ON clientes_nf
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- produtos
CREATE POLICY "Isolate produtos by organization" ON produtos
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- fornecedores
CREATE POLICY "Isolate fornecedores by organization" ON fornecedores
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- nfce
CREATE POLICY "Isolate nfce by organization" ON nfce
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- nfce_itens (herda da nfce via JOIN)
CREATE POLICY "Isolate nfce_itens by organization" ON nfce_itens
    FOR ALL TO authenticated
    USING (
        nfce_id IN (SELECT id FROM nfce WHERE organization_id = get_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        nfce_id IN (SELECT id FROM nfce WHERE organization_id = get_user_organization_id())
        OR is_super_admin()
    );

-- nfe
CREATE POLICY "Isolate nfe by organization" ON nfe
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- nfe_itens (herda da nfe via JOIN)
CREATE POLICY "Isolate nfe_itens by organization" ON nfe_itens
    FOR ALL TO authenticated
    USING (
        nfe_id IN (SELECT id FROM nfe WHERE organization_id = get_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        nfe_id IN (SELECT id FROM nfe WHERE organization_id = get_user_organization_id())
        OR is_super_admin()
    );

-- ========== PARTE 5: ÍNDICES PARA PERFORMANCE ==========

CREATE INDEX IF NOT EXISTS idx_clientes_nf_org ON clientes_nf(organization_id);
CREATE INDEX IF NOT EXISTS idx_produtos_org ON produtos(organization_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_org ON fornecedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_nfce_org ON nfce(organization_id);
CREATE INDEX IF NOT EXISTS idx_nfe_org ON nfe(organization_id);

-- ============================================
-- PRONTO! Isolamento multi-tenant configurado.
-- Cada organização só verá seus próprios dados.
-- Super Admins têm acesso total.
-- ============================================
