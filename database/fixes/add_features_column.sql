-- Adicionar coluna enabled_features na tabela organizations
-- Execute no SQL Editor do Supabase

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS enabled_features TEXT[] DEFAULT ARRAY[
    'pdv', 'vendas', 'clientes', 'produtos', 'fornecedores', 'veiculos',
    'nfe', 'nfce', 'contas_receber', 'contas_pagar', 'fluxo_caixa',
    'relatorios', 'configuracoes', 'notificacoes'
];

-- Pronto! Agora a tabela suporta o gerenciamento de funcionalidades por cliente.
