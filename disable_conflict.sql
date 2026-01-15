-- ============================================
-- RESOLVER CONFLITO DE CADASTRO
-- Execute no Supabase SQL Editor
-- ============================================

-- O problema é que existe uma "Trigger" (Gatilho) automático que tenta criar uma empresa
-- sempre que um usuário é criado. Mas o Admin Dashboard já faz isso manualmente e melhor.
-- Esse gatilho está atrapalhando e causando erro.

-- Vamos remover o gatilho para deixar o Admin Dashboard assumir o controle total.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- PRONTO! 
-- Agora o Admin Dashboard vai conseguir criar os clientes sem interferência.
-- ============================================
