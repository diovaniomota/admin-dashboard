-- ==============================================================================
-- CORREÇÃO DO ERRO DE VIOLAÇÃO DE SEGURANÇA (CROSS-TENANT)
-- ==============================================================================

-- 1. Primeiro, vamos descobrir o nome do trigger problemático e removê-lo
-- (Como não sabemos o nome exato, vamos remover triggers comuns de validação)
DROP TRIGGER IF EXISTS tr_check_os_client_tenant ON ordens_servico;
DROP TRIGGER IF EXISTS check_os_client_tenant ON ordens_servico;
DROP TRIGGER IF EXISTS validate_os_tenant ON ordens_servico;

-- 2. Criar uma função de validação ROBUSTA e SEGURA
CREATE OR REPLACE FUNCTION check_os_client_tenant()
RETURNS TRIGGER AS $$
DECLARE
    client_org UUID;
BEGIN
    -- Buscar a organização do cliente (usando SECURITY DEFINER para garantir acesso)
    SELECT organization_id INTO client_org
    FROM clients
    WHERE id = NEW.client_id;

    -- Se o cliente não existir, deixa passar (outra constraint vai pegar) ou bloqueia
    IF client_org IS NULL THEN
        RAISE EXCEPTION 'Cliente não encontrado (ID: %)', NEW.client_id;
    END IF;

    -- Comparação segura (convertendo ambos para TEXT para evitar erro de tipo)
    IF client_org::text <> NEW.empresa_id::text THEN
        RAISE EXCEPTION 'Security Violation: Client belongs to different tenant (Client Org: %, OS Org: %)', client_org, NEW.empresa_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER é crucial aqui!

-- 3. Recriar o trigger usando a nova função
CREATE TRIGGER tr_check_os_client_tenant
    BEFORE INSERT OR UPDATE ON ordens_servico
    FOR EACH ROW
    EXECUTE FUNCTION check_os_client_tenant();

-- 4. Garantir que as políticas RLS estão corretas
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Isolate ordens_servico by organization" ON ordens_servico;

CREATE POLICY "Isolate ordens_servico by organization" ON ordens_servico
    FOR ALL TO authenticated
    USING (empresa_id = auth.jwt() ->> 'organization_id' OR (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()))
    WITH CHECK (empresa_id = auth.jwt() ->> 'organization_id' OR (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()));
