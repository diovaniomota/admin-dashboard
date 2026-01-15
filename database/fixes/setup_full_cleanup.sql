-- ============================================
-- EXCLUSÃO COMPLETA (HARD DELETE)
-- Limpa TUDO da empresa ao excluir: Dados + Usuários + Auth
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Garantir que todas as tabelas do ERP deletem seus dados se a organização for deletada
-- (Adicionando ON DELETE CASCADE nas Foreign Keys)

DO $$
DECLARE
    -- Lista de tabelas que dependem de organizations
    tables text[] := ARRAY[
        'clientes_nf', 'produtos', 'fornecedores', 'veiculos', 
        'vendas', 'movimentacoes_estoque', 
        'contas_receber', 'contas_pagar', 
        'nfce', 'nfe', 'configuracoes', 'user_profiles'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Tenta remover a FK existente (nome padrão ou customizado)
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I_organization_id_fkey', t, t);
        EXCEPTION WHEN OTHERS THEN NULL; END;
        
        -- Recria a FK com ON DELETE CASCADE
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE', t, t);
    END LOOP;
    
    -- Para tabelas filhas (itens de venda, itens de nota), o CASCADE deve ser no pai (venda/nota), 
    -- então se a venda for deletada (por causa da org), os itens somem. Já deve estar assim, mas é bom garantir.
END $$;


-- 2. Criar Trigger para deletar o usuário do AUTH quando o perfil for deletado
-- Isso é o "pulo do gato" para liberar o e-mail

CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Deleta o usuário da tabela de autenticação (auth.users)
    -- Isso requer permissões de superusuário, por isso a função será SECURITY DEFINER
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Quando um user_profile for deletado (o que acontece quando a org é deletada, graças ao passo 1),
-- essa trigger roda e deleta o login do Auth também.
DROP TRIGGER IF EXISTS on_profile_delete_remove_auth ON user_profiles;
CREATE TRIGGER on_profile_delete_remove_auth
    AFTER DELETE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();


-- ============================================
-- PRONTO!
-- Agora, quando você excluir uma empresa:
-- 1. A tabela 'organizations' apaga a linha.
-- 2. O CASCADE apaga todos os dados (vendas, produtos, etc) e os 'user_profiles'.
-- 3. O Trigger vê que o 'user_profile' sumiu e apaga o login do 'auth.users'.
-- Resultado: LIMPEZA TOTAL e email liberado!
-- ============================================
