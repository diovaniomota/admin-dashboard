-- ============================================
-- LIMPEZA DE USUÁRIO PARA RECADASTRO
-- Execute no Supabase SQL Editor
-- ============================================

-- Deletar o usuário que ficou "preso" no Auth
-- Isso permite que você cadastre ele novamente na tela de "Novo Cliente"
DELETE FROM auth.users WHERE email = 'diovaniomota8@gmail.com';

-- Opcional: Se quiser limpar a organização vinculada (se souber o nome)
-- DELETE FROM organizations WHERE email = '...'; 
-- Mas apenas deletar o usuário já resolve o erro "User already registered"

-- ============================================
-- Agora você pode tentar criar o cliente novamente!
-- ============================================
