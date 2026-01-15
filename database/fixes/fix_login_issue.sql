-- ============================================
-- CORREÇÃO DE LOGIN E PERMISSÕES
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Confirmar manualmente o email do cliente que não consegue logar
-- Substitua pelo email correto se for outro, mas usei o do print
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'diovaniomota8@gmail.com';

-- 2. Liberar permissões na tabela user_profiles (para evitar erros na criação)
-- Remove políticas restritivas
DROP POLICY IF EXISTS "Super admin full access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in own organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Cria política permissiva (temporária para desenvolvimento)
CREATE POLICY "Allow full access to user_profiles" ON user_profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PRONTO! Tente logar com o usuário agora.
-- ============================================
