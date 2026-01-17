'use client';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, LogOut, Menu, X, Settings, MessageSquare, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/clientes', label: 'Clientes', icon: Building2 },
        { icon: MessageSquare, label: 'Chat Suporte', path: '/chat' },
        { path: '/configuracoes', label: 'Configurações', icon: Settings },
    ];

    useEffect(() => {
        if (pathname === '/chat') setUnreadCount(0);
    }, [pathname]);

    useEffect(() => {
        const channel = supabase
            .channel('sidebar_notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'ticket_messages',
                filter: 'sender_role=eq.client'
            }, () => {
                // Se não estiver na página de chat, incrementa
                // Usando window.location para garantir valor atual no callback (ou check pathname se deps permitir, mas closure...)
                if (window.location.pathname !== '/chat') {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        router.push('/login');
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>A</div>
                <div className={styles.logoText}>
                    <span>Admin</span>
                    <small>Painel de Controle</small>
                </div>
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item) => (
                    <a
                        key={item.path}
                        href={item.path}
                        className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} // Adicionado style flex
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </div>
                        {item.path === '/chat' && unreadCount > 0 && (
                            <span style={{
                                background: '#ef4444', color: 'white', borderRadius: '50%',
                                width: '20px', height: '20px', fontSize: '11px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </a>
                ))}
            </nav>

            <div className={styles.footer}>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
}
