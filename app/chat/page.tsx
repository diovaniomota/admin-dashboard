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

    const fetchTickets = async () => {
        const { data: ticketsData, error } = await supabase
            .from('support_tickets')
            .select('*, organization:organizations(nome_fantasia)')
            .order('updated_at', { ascending: false });

        if (ticketsData) {
            try {
                // Count unread messages (assuming column 'read' exists)
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
            read: true // Admin messages are read by definition? Or client needs to read? 
            // 'read' is for Recipient? Usually 'read' flag tracks 'has recipient seen it'. 
            // Admin sent -> Client needs to read. Client sent -> Admin needs to read.
            // Simplified: 'read' = Admin has read it. Client notifications uses session/local for now?
            // Actually, for Admin Side cards, we care about 'client' messages.
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

        // Send system message? Optional.
        await supabase.from('ticket_messages').insert([{
            ticket_id: selectedTicket.id,
            sender_role: 'admin',
            content: 'Atendimento encerrado pelo suporte.'
        }]);

        setSelectedTicket(null);
        fetchTickets();
    };

    return (
        <div className={styles.container}>
            {/* Ticket List */}
            <div className={styles.ticketList}>
                <div className={styles.listHeader}>
                    <span>Atendimentos</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tickets.filter(t => t.status === 'open').length} abertos</span>
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
                                    {ticket.unread_count > 0 && (
                                        <span style={{
                                            background: '#ef4444', color: 'white', borderRadius: '50%',
                                            width: '18px', height: '18px', fontSize: '10px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                        }}>
                                            {ticket.unread_count}
                                        </span>
                                    )}
                                </div>
                                {ticket.status === 'open' && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Aberto</span>}
                                {ticket.status === 'closed' && <span className="badge badge-secondary" style={{ fontSize: '0.6rem' }}>Fechado</span>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span className={styles.lastMessage}>Clique para ver mensagens</span>
                                <span className={styles.ticketTime}>
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
                        {selectedTicket.status === 'open' && (
                            <button className="btn btn-outline-danger" onClick={handleCloseTicket} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                <CheckCircle size={16} /> Encerrar
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
                        <div style={{ padding: '1rem', background: '#f8fafc', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                            Este atendimento foi encerrado.
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
        </div>
    );
}
