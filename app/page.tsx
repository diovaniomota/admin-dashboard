'use client';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Building2, Users, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import styles from './page.module.css';

interface Organization {
  id: string;
  nome_fantasia: string;
  status: string;
  plan: string;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    trial: 0,
    bloqueados: 0,
    vencidos: 0
  });
  const [recentClients, setRecentClients] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      setLoading(false);
      return;
    }

    const total = orgs?.length || 0;
    const ativos = orgs?.filter(o => o.status === 'ativo').length || 0;
    const trial = orgs?.filter(o => o.status === 'trial').length || 0;
    const bloqueados = orgs?.filter(o => o.status === 'bloqueado').length || 0;
    const vencidos = orgs?.filter(o => o.status === 'vencido').length || 0;

    setStats({ total, ativos, trial, bloqueados, vencidos });
    setRecentClients(orgs?.slice(0, 5) || []);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ativo: 'badge-success',
      trial: 'badge-info',
      bloqueado: 'badge-danger',
      vencido: 'badge-warning'
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        Carregando...
      </div>
    );
  }

  return (
    <div>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Visão geral dos clientes da plataforma</p>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Building2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total de Clientes</span>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.ativos}</span>
            <span className={styles.statLabel}>Ativos</span>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: 'var(--info)' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.trial}</span>
            <span className={styles.statLabel}>Em Trial</span>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.bloqueados}</span>
            <span className={styles.statLabel}>Bloqueados</span>
          </div>
        </div>
      </div>

      {/* Recent Clients */}
      <div className={`card ${styles.recentSection}`}>
        <div className={styles.sectionHeader}>
          <h2>Clientes Recentes</h2>
          <a href="/clientes" className="btn btn-secondary">
            Ver todos
          </a>
        </div>

        {recentClients.length === 0 ? (
          <p className={styles.emptyState}>Nenhum cliente cadastrado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.map((client) => (
                <tr key={client.id}>
                  <td><strong>{client.nome_fantasia}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{client.plan}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td>{new Date(client.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
