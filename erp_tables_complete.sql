-- ============================================
-- TABELAS ADICIONAIS DO ERP
-- Veículos, Movimentações, Financeiro, Config
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ========== VEÍCULOS ==========
CREATE TABLE IF NOT EXISTS veiculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    placa VARCHAR(10) NOT NULL,
    modelo VARCHAR(100),
    marca VARCHAR(50),
    ano INTEGER,
    cor VARCHAR(30),
    chassi VARCHAR(50),
    renavam VARCHAR(20),
    tipo VARCHAR(50), -- carro, moto, caminhão, etc
    combustivel VARCHAR(30), -- gasolina, diesel, flex, elétrico
    km_atual DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PDV / MOVIMENTAÇÕES (VENDAS) ==========
CREATE TABLE IF NOT EXISTS vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    numero INTEGER,
    data_venda TIMESTAMPTZ DEFAULT NOW(),
    cliente_id UUID REFERENCES clientes_nf(id),
    vendedor_id UUID REFERENCES user_profiles(id),
    valor_produtos DECIMAL(15,2) NOT NULL DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_acrescimo DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    forma_pagamento VARCHAR(50), -- dinheiro, cartao_credito, cartao_debito, pix, boleto
    parcelas INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'finalizada', -- finalizada, cancelada, pendente
    observacoes TEXT,
    nfce_id UUID REFERENCES nfce(id),
    nfe_id UUID REFERENCES nfe(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da Venda
CREATE TABLE IF NOT EXISTS vendas_itens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    descricao VARCHAR(255) NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    valor_unitario DECIMAL(15,2) NOT NULL,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) NOT NULL
);

-- Movimentações de Estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id),
    tipo VARCHAR(20) NOT NULL, -- entrada, saida, ajuste
    quantidade DECIMAL(15,3) NOT NULL,
    motivo VARCHAR(100), -- venda, compra, devolucao, perda, ajuste_inventario
    documento_ref VARCHAR(100), -- referência a NF, venda, etc
    usuario_id UUID REFERENCES user_profiles(id),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== FINANCEIRO ==========

-- Contas a Receber
CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes_nf(id),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    valor_pago DECIMAL(15,2) DEFAULT 0,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50),
    numero_documento VARCHAR(50),
    parcela INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, pago, vencido, cancelado
    venda_id UUID REFERENCES vendas(id),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas a Pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES fornecedores(id),
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    valor_pago DECIMAL(15,2) DEFAULT 0,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50),
    numero_documento VARCHAR(50),
    parcela INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, pago, vencido, cancelado
    categoria VARCHAR(50), -- aluguel, salario, fornecedor, imposto, outros
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== CONFIGURAÇÕES DA ORGANIZAÇÃO ==========
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Dados Fiscais
    regime_tributario VARCHAR(50), -- simples_nacional, lucro_presumido, lucro_real
    inscricao_municipal VARCHAR(50),
    codigo_cnae VARCHAR(20),
    
    -- Certificado Digital
    certificado_validade DATE,
    certificado_tipo VARCHAR(20), -- A1, A3
    
    -- Série das Notas
    serie_nfce VARCHAR(5) DEFAULT '1',
    ultimo_numero_nfce INTEGER DEFAULT 0,
    serie_nfe VARCHAR(5) DEFAULT '1',
    ultimo_numero_nfe INTEGER DEFAULT 0,
    
    -- Configurações Gerais
    logo_url TEXT,
    cor_primaria VARCHAR(10) DEFAULT '#00B4D8',
    
    -- Integrações
    api_ibge_habilitado BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== HABILITAR RLS ==========
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- ========== POLÍTICAS RLS ==========

-- veiculos
CREATE POLICY "Isolate veiculos by organization" ON veiculos
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- vendas
CREATE POLICY "Isolate vendas by organization" ON vendas
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- vendas_itens
CREATE POLICY "Isolate vendas_itens by organization" ON vendas_itens
    FOR ALL TO authenticated
    USING (
        venda_id IN (SELECT id FROM vendas WHERE organization_id = get_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        venda_id IN (SELECT id FROM vendas WHERE organization_id = get_user_organization_id())
        OR is_super_admin()
    );

-- movimentacoes_estoque
CREATE POLICY "Isolate movimentacoes_estoque by organization" ON movimentacoes_estoque
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- contas_receber
CREATE POLICY "Isolate contas_receber by organization" ON contas_receber
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- contas_pagar
CREATE POLICY "Isolate contas_pagar by organization" ON contas_pagar
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- configuracoes
CREATE POLICY "Isolate configuracoes by organization" ON configuracoes
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() OR is_super_admin())
    WITH CHECK (organization_id = get_user_organization_id() OR is_super_admin());

-- ========== ÍNDICES ==========
CREATE INDEX IF NOT EXISTS idx_veiculos_org ON veiculos(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendas_org ON vendas(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_mov_estoque_org ON movimentacoes_estoque(organization_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_org ON contas_receber(organization_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_venc ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_org ON contas_pagar(organization_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_venc ON contas_pagar(data_vencimento);

-- ============================================
-- PRONTO! Todas as tabelas do ERP criadas.
-- ============================================
