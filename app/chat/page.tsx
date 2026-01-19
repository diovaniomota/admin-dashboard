'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, User, CheckCircle, MessageSquare, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import styles from './chat.module.css';

interface Ticket {
    id: string;
    organization_id: string;
    status: string;
    created_at: string;
    organization: { nome_fantasia: string };
    last_message?: string;
    unread_count?: number;
}

interface Message {
    id: string;
    sender_role: 'admin' | 'client';
    content: string;
    created_at: string;
}

export default function ChatPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // New State for Reopen/Create Features
    const [organizations, setOrganizations] = useState<{ id: string, nome_fantasia: string }[]>([]);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState('');

    // Initial Load & Realtime Tickets
    useEffect(() => {
        fetchTickets();

        const channel = supabase
            .channel('tickets_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
                fetchTickets();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages' }, () => {
                fetchTickets(); // Refresh counts on new message
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Load Messages when Ticket Selected
    useEffect(() => {
        if (!selectedTicket) return;

        fetchMessages(selectedTicket.id);

        const channel = supabase
            .channel(`messages_${selectedTicket.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'ticket_messages',
                filter: `ticket_id=eq.${selectedTicket.id}`
            }, (payload: any) => {
                setMessages(prev => [...prev, payload.new as Message]);
                // Mark read automatically if open?
                if (payload.new.sender_role === 'client') {
                    supabase.from('ticket_messages').update({ read: true }).eq('id', payload.new.id).then();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedTicket]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch Organizations for New Ticket
    useEffect(() => {
        const fetchOrgs = async () => {
            const { data } = await supabase.from('organizations').select('id, nome_fantasia').order('nome_fantasia');
            if (data) setOrganizations(data);
        };
        fetchOrgs();
    }, []);

    const fetchTickets = async () => {
        const { data: ticketsData, error } = await supabase
            .from('support_tickets')
            .select('*, organization:organizations(nome_fantasia)')
            .order('updated_at', { ascending: false });

        if (ticketsData) {
            try {
                const { data: unreadData } = await supabase
                    .from('ticket_messages')
                    .select('ticket_id')
                    .eq('read', false)
                    .eq('sender_role', 'client');

                const counts: Record<string, number> = {};
                if (unreadData) {
                    unreadData.forEach((m: any) => {
                        counts[m.ticket_id] = (counts[m.ticket_id] || 0) + 1;
                    });
                }

                const ticketsWithCount = ticketsData.map(t => ({
                    ...t,
                    unread_count: counts[t.id] || 0
                }));
                setTickets(ticketsWithCount);
            } catch (e) {
                console.warn("Unread count feature unavailable (missing 'read' column?)", e);
                setTickets(ticketsData);
            }
        }
        setLoading(false);
    };

    const fetchMessages = async (ticketId: string) => {
        const { data } = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const handleSelectTicket = async (ticket: Ticket) => {
        setSelectedTicket(ticket);
        if (ticket.unread_count && ticket.unread_count > 0) {
            await supabase.from('ticket_messages')
                .update({ read: true })
                .eq('ticket_id', ticket.id)
                .eq('sender_role', 'client');

            // Update local
            setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, unread_count: 0 } : t));
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedTicket) return;

        const content = inputText.trim();
        setInputText('');

        await supabase.from('ticket_messages').insert([{
            ticket_id: selectedTicket.id,
            sender_role: 'admin',
            content,
            read: true
        }]);

        // Update ticket updated_at
        await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
    };

    const handleCloseTicket = () => {
        if (!selectedTicket) return;
        setShowCloseModal(true);
    };

    const confirmCloseTicket = async () => {
        if (!selectedTicket) return;
        setShowCloseModal(false);

        await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', selectedTicket.id);

        await supabase.from('ticket_messages').insert([{
            ticket_id: selectedTicket.id,
            sender_role: 'admin',
            content: 'Atendimento encerrado pelo suporte.'
        }]);

        setSelectedTicket(null);
        fetchTickets();
    };

    const handleReopenTicket = async () => {
        if (!selectedTicket) return;

        await supabase.from('support_tickets')
            .update({ status: 'open', updated_at: new Date().toISOString() })
            .eq('id', selectedTicket.id);

        await supabase.from('ticket_messages').insert([{
            ticket_id: selectedTicket.id,
            sender_role: 'admin',
            content: '🔄 Atendimento reaberto pelo suporte.'
        }]);

        // Refresh local state immediately for better UX
        setSelectedTicket(prev => prev ? { ...prev, status: 'open' } : null);
        fetchTickets();
    };

    const handleCreateTicket = async () => {
        if (!selectedOrgId) return;

        // Check if ANY ticket exists (Open OR Closed)
        const { data: existing } = await supabase
            .from('support_tickets')
            .select('*, organization:organizations(nome_fantasia)')
            .eq('organization_id', selectedOrgId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (existing) {
            if (existing.status === 'open') {
                // Already open, just switch to it
                setSelectedTicket(existing);
                setShowNewTicketModal(false);
            } else {
                // Closed, reopen it
                await supabase.from('support_tickets')
                    .update({ status: 'open', updated_at: new Date().toISOString() })
                    .eq('id', existing.id);

                await supabase.from('ticket_messages').insert([{
                    ticket_id: existing.id,
                    sender_role: 'admin',
                    content: '🔄 Atendimento reaberto pelo suporte.'
                }]);

                const reopenedTicket = { ...existing, status: 'open', updated_at: new Date().toISOString() };
                setSelectedTicket(reopenedTicket as Ticket);
                setShowNewTicketModal(false);
                fetchTickets();
            }
            return;
        }

        const { data: newTicket, error } = await supabase
            .from('support_tickets')
            .insert([{ organization_id: selectedOrgId, status: 'open' }])
            .select('*, organization:organizations(nome_fantasia)')
            .single();

        if (error) {
            console.error('Error creating ticket:', error);
            return;
        }

        setShowNewTicketModal(false);
        setTickets(prev => [newTicket, ...prev]);
        setSelectedTicket(newTicket);

        // Send initial message
        await supabase.from('ticket_messages').insert([{
            ticket_id: newTicket.id,
            sender_role: 'admin',
            content: 'Olá! O suporte iniciou este atendimento.'
        }]);
    };

    return (
        <div className={styles.container}>
            {/* Ticket List */}
            <div className={styles.ticketList}>
                <div className={styles.listHeader}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>Atendimentos</span>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                            onClick={() => setShowNewTicketModal(true)}
                        >
                            + Novo
                        </button>
                    </div>
                </div>
                <div className={styles.listContent}>
                    {tickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className={`${styles.ticketItem} ${selectedTicket?.id === ticket.id ? styles.active : ''} ${ticket.status === 'closed' ? styles.closed : ''}`}
                            onClick={() => handleSelectTicket(ticket)}
                            style={{ opacity: ticket.status === 'closed' ? 0.7 : 1 }}
                        >
                            <div className={styles.ticketHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className={styles.clientName}>{ticket.organization?.nome_fantasia || 'Cliente Desconhecido'}</span>
                                    {ticket.unread_count && ticket.unread_count > 0 ? (
                                        <span style={{
                                            background: '#ef4444', color: 'white', borderRadius: '50%',
                                            width: '18px', height: '18px', fontSize: '10px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                        }}>
                                            {ticket.unread_count}
                                        </span>
                                    ) : null}
                                </div>
                                {ticket.status === 'open' && <span className={`${styles.badge} ${styles.badgeOpen}`}>Aberto</span>}
                                {ticket.status === 'closed' && <span className={`${styles.badge} ${styles.badgeClosed}`}>Fechado</span>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span className={styles.lastMessage} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clique para ver mensagens</span>
                                <span className={styles.ticketTime} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {tickets.length === 0 && !loading && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Nenhum chamado iniciado.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedTicket ? (
                <div className={styles.chatArea}>
                    <div className={styles.chatHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '50%', color: '#3b82f6' }}>
                                <User size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedTicket.organization?.nome_fantasia}</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {selectedTicket.organization_id.slice(0, 8)}</span>
                            </div>
                        </div>
                        {selectedTicket.status === 'open' ? (
                            <button className="btn btn-outline-danger" onClick={handleCloseTicket} style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '6px', cursor: 'pointer' }}>
                                <CheckCircle size={16} /> Encerrar
                            </button>
                        ) : (
                            <button className="btn btn-outline-primary" onClick={handleReopenTicket} style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer' }}>
                                <Clock size={16} /> Reabrir
                            </button>
                        )}
                    </div>

                    <div className={styles.messagesArea}>
                        {messages.map(msg => (
                            <div key={msg.id} className={`${styles.messageBubble} ${styles[msg.sender_role]}`}>
                                {msg.content}
                                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {selectedTicket.status === 'open' ? (
                        <div className={styles.inputArea}>
                            <input
                                className={styles.input}
                                placeholder="Digite sua resposta..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button className={styles.sendBtn} onClick={handleSendMessage} disabled={!inputText.trim()}>
                                <Send size={18} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', background: 'var(--bg-body)', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span>Este atendimento foi encerrado.</span>
                            <button onClick={handleReopenTicket} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}>
                                Reabrir conversa
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Selecione um atendimento para visualizar</p>
                </div>
            )}

            {/* Custom Modal */}
            {showCloseModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', padding: '24px', borderRadius: '16px',
                        width: '400px', maxWidth: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '1px solid var(--border-color)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                                <CheckCircle size={24} />
                            </div>
                            <button onClick={() => setShowCloseModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Encerrar Atendimento?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5', fontSize: '0.95rem' }}>
                            Tem certeza que deseja encerrar este ticket? O histórico será mantido, mas o cliente não poderá mais responder neste chamado.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowCloseModal(false)}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                    background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmCloseTicket}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 500,
                                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.4)'
                                }}
                            >
                                Encerrar Atendimento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Ticket Modal */}
            {showNewTicketModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', padding: '24px', borderRadius: '16px',
                        width: '400px', maxWidth: '90%',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text-primary)' }}>Iniciar Novo Atendimento</h3>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Selecione o Cliente:</label>
                        <select
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '20px', background: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            value={selectedOrgId}
                            onChange={(e) => setSelectedOrgId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.nome_fantasia}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowNewTicketModal(false)} className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}>Cancelar</button>
                            <button onClick={handleCreateTicket} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer' }} disabled={!selectedOrgId}>Iniciar Chat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
