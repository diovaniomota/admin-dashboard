-- ============================================
-- LIMPEZA FORÇADA DE USUÁRIO
-- Execute no Supabase SQL Editor
-- ============================================

-- Garante a remoção do usuário 'diovaniomota8@gmail.com'
-- O ILIKE garante que encontre mesmo se tiver letras maiúsculas/minúsculas
DELETE FROM auth.users WHERE email ILIKE 'diovaniomota8@gmail.com';

-- Verifica se sobrou algo nas identidades (normalmente deleta em cascata, mas por garantia)
DELETE FROM auth.identities WHERE email ILIKE 'diovaniomota8@gmail.com';

-- ============================================
-- Agora o email está livre para ser cadastrado novamente!
-- ============================================
