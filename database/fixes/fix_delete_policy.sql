-- ============================================
-- CORRIGIR CONSTRAINT DE FOREIGN KEY
-- Permite deletar organizações com usuários
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Remover a constraint antiga
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_organization_id_fkey;

-- 2. Recriar com ON DELETE CASCADE
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE CASCADE;

-- ============================================
-- PRONTO! Agora ao deletar uma organização,
-- os user_profiles serão deletados junto.
-- ============================================
