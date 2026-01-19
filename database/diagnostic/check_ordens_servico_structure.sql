-- ============================================
-- DIAGNOSTICO: VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================

-- Verificar estrutura da tabela ordens_servico
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ordens_servico' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela clients
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Verificar foreign keys da tabela ordens_servico
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'ordens_servico';

-- Verificar se existe trigger na tabela ordens_servico
SELECT 
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'ordens_servico';

-- Verificar RLS policies existentes
SELECT 
    polname as policy_name,
    polcmd as command,
    polqual as using_expression,
    polwithcheck as check_expression
FROM pg_policy 
WHERE polrelid = 'ordens_servico'::regclass;

-- Verificar RLS policies da tabela clients
SELECT 
    polname as policy_name,
    polcmd as command,
    polqual as using_expression,
    polwithcheck as check_expression
FROM pg_policy 
WHERE polrelid = 'clients'::regclass;

-- Verificar se RLS está habilitado nas tabelas
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname IN ('ordens_servico', 'clients');

-- ============================================
-- PRONTO! Diagnóstico completo
-- ============================================