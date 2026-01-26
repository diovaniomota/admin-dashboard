import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Organization } from '../types';

export function useClients() {
    const [clients, setClients] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: sbError } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false });

            if (sbError) throw sbError;
            setClients(data || []);
        } catch (err: any) {
            console.error('Error fetching clients:', err);
            setError(err.message || 'Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    return { clients, loading, error, refreshClients: fetchClients };
}
