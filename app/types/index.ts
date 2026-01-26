export interface Organization {
    id: string;
    codigo?: number;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    created_at: string;
    blocked_reason?: string;
    blocked_at?: string;
}

export type ClientStatus = 'ativo' | 'trial' | 'bloqueado' | 'vencido';
