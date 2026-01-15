'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MoreVertical, Edit, Ban, Trash2, CheckCircle, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Modal from '../components/Modal';
import PromptModal from '../components/PromptModal';
import styles from './clientes.module.css';

interface Organization {
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
}

export default function ClientesPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Toast states
    const [showToast, setShowToast] = useState(false);

    // Modal states
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [modalMessage, setModalMessage] = useState({ title: '', message: '' });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching clients:', error);
        } else {
            setClients(data || []);
        }
        setLoading(false);
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
            client.cnpj.includes(search) ||
            (client.codigo && client.codigo.toString().includes(search));
        const matchesStatus = statusFilter === 'todos' || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000); // Hide after 3s
    };

    const openBlockModal = (id: string) => {
        setSelectedClient(id);
        setShowBlockModal(true);
        setOpenMenu(null);
    };

    const handleBlock = async (reason: string) => {
        if (!selectedClient) return;

        const { error } = await supabase
            .from('organizations')
            .update({
                status: 'bloqueado',
                blocked_reason: reason,
                blocked_at: new Date().toISOString()
            })
            .eq('id', selectedClient);

        setShowBlockModal(false);

        if (!error) {
            setModalMessage({ title: 'Cliente Bloqueado!', message: 'O acesso do cliente foi bloqueado com sucesso. Ele não poderá mais acessar o sistema.' });
            setShowSuccessModal(true);
            fetchClients();
        }
        setSelectedClient(null);
    };

    const handleUnblock = async (id: string) => {
        const { error } = await supabase
            .from('organizations')
            .update({
                status: 'ativo',
                blocked_reason: null,
                blocked_at: null
            })
            .eq('id', id);

        if (!error) {
            setModalMessage({ title: 'Cliente Desbloqueado!', message: 'O acesso do cliente foi restaurado com sucesso.' });
            setShowSuccessModal(true);
            fetchClients();
        }
        setOpenMenu(null);
    };

    const openDeleteConfirm = (id: string) => {
        setSelectedClient(id);
        setShowDeleteModal(true);
        setOpenMenu(null);
    };

    const handleDelete = async () => {
        if (!selectedClient) return;

        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', selectedClient);

        setShowDeleteModal(false);

        if (!error) {
            setModalMessage({ title: 'Cliente Excluído!', message: 'O cliente foi removido permanentemente do sistema.' });
            setShowSuccessModal(true);
            fetchClients();
        }
        setSelectedClient(null);
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            ativo: 'badge-success',
            bloqueado: 'badge-danger'
        };
        return badges[status] || 'badge-secondary';
    };

    return (
        <div>
            {/* Toast Notification */}
            {showToast && (
                <div className={styles.toast}>
                    <CheckCircle size={20} color="#4ade80" />
                    <span>ID copiado para a área de transferência!</span>
                </div>
            )}

            <header className={styles.header}>
                <div>
                    <h1>Clientes</h1>
                    <p>Gerencie os clientes da plataforma</p>
                </div>
                <button className="btn btn-primary" onClick={() => router.push('/clientes/novo')}>
                    <Plus size={20} />
                    Novo Cliente
                </button>
            </header>

            {/* Filters */}
            <div className={`card ${styles.filters}`}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, ID ou CNPJ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="todos">Todos os status</option>
                    <option value="ativo">Ativos</option>
                    <option value="bloqueado">Bloqueados</option>
                </select>
            </div>

            {/* Table */}
            <div className="card">
                {loading ? (
                    <div className={styles.loading}>Carregando...</div>
                ) : filteredClients.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Nenhum cliente encontrado</p>
                        <button className="btn btn-primary" onClick={() => router.push('/clientes/novo')}>
                            <Plus size={18} />
                            Cadastrar primeiro cliente
                        </button>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>CNPJ</th>
                                <th>Plano</th>
                                <th>Status</th>
                                <th>Cadastro</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => {
                                const formattedId = client.codigo ? client.codigo.toString().padStart(2, '0') : '';
                                return (
                                    <tr key={client.id}>
                                        <td>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <strong>{client.nome_fantasia}</strong>
                                                    {formattedId && (
                                                        <span
                                                            className={styles.clientIdTag}
                                                            onClick={(e) => copyToClipboard(client.codigo?.toString() || '', e)}
                                                            title="Clique para copiar o ID"
                                                        >
                                                            #{formattedId}
                                                            <Copy size={10} style={{ marginLeft: '4px', display: 'inline' }} />
                                                        </span>
                                                    )}
                                                </div>
                                                <small style={{ display: 'block', color: 'var(--text-muted)' }}>{client.email}</small>
                                            </div>
                                        </td>
                                        <td>{client.cnpj}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{client.plan}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(client.status)}`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td>{new Date(client.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.menuBtn}
                                                    onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {openMenu === client.id && (
                                                    <div className={styles.dropdown}>
                                                        <button onClick={() => router.push(`/clientes/${client.id}`)}>
                                                            <Edit size={16} /> Editar
                                                        </button>
                                                        {client.status === 'bloqueado' ? (
                                                            <button onClick={() => handleUnblock(client.id)}>
                                                                <CheckCircle size={16} /> Desbloquear
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => openBlockModal(client.id)}>
                                                                <Ban size={16} /> Bloquear
                                                            </button>
                                                        )}
                                                        <button className={styles.deleteBtn} onClick={() => openDeleteConfirm(client.id)}>
                                                            <Trash2 size={16} /> Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Block Modal */}
            <PromptModal
                isOpen={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                onConfirm={handleBlock}
                title="Bloquear Cliente"
                message="Informe o motivo do bloqueio. O cliente não poderá mais acessar o sistema até ser desbloqueado."
                placeholder="Ex: Pagamento em atraso, uso indevido, etc."
                confirmText="Bloquear"
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                type="warning"
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
            />
            {showDeleteModal && (
                <div style={{ position: 'fixed', bottom: '30%', left: '50%', transform: 'translateX(-50%)', zIndex: 1001, display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                    <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
                </div>
            )}

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                type="success"
                title={modalMessage.title}
                message={modalMessage.message}
            />
        </div>
    );
}
