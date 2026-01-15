-- ============================================
-- EXCLUSÃO COMPLETA (ATUALIZADO)
-- Inclui correção para tabela 'app_users'
-- Execute no Supabase SQL Editor
-- ============================================

DO $$
DECLARE
    -- Lista de tabelas atualizada
    tables text[] := ARRAY[
        'clientes_nf', 'produtos', 'fornecedores', 'veiculos', 
        'vendas', 'movimentacoes_estoque', 
        'contas_receber', 'contas_pagar', 
        'nfce', 'nfe', 'configuracoes', 'user_profiles',
        'app_users' -- Adicionada tabela faltante
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Tenta remover a FK existente
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I_organization_id_fkey', t, t);
        EXCEPTION WHEN OTHERS THEN NULL; END;
        
        -- Recria a FK com ON DELETE CASCADE
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE', t, t);
    END LOOP;
END $$;

-- Mantém a trigger para deletar do Auth (reaplicando só pra garantir)
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_delete_remove_auth ON user_profiles;
CREATE TRIGGER on_profile_delete_remove_auth
    AFTER DELETE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();

-- ============================================
-- PRONTO! Tente excluir novamente.
-- ============================================
