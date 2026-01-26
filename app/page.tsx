'use client';
import { useClients } from './hooks/useClients';
import StatsCard from './components/StatsCard';
import { Building2, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import styles from './page.module.css';

export default function Dashboard() {
  const { clients, loading } = useClients();

  const stats = {
    total: clients.length,
    ativos: clients.filter(c => c.status === 'ativo').length,
    trial: clients.filter(c => c.status === 'trial').length,
    bloqueados: clients.filter(c => c.status === 'bloqueado').length,
  };

  const recentClients = clients.slice(0, 5);

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
        <StatsCard
          label="Total de Clientes"
          value={stats.total}
          icon={Building2}
          iconBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <StatsCard
          label="Ativos"
          value={stats.ativos}
          icon={TrendingUp}
          iconBg="var(--success)"
        />
        <StatsCard
          label="Em Trial"
          value={stats.trial}
          icon={Users}
          iconBg="var(--info)"
        />
        <StatsCard
          label="Bloqueados"
          value={stats.bloqueados}
          icon={AlertTriangle}
          iconBg="var(--danger)"
        />
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
