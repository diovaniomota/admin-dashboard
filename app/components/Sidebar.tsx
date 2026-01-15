'use client';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/clientes', label: 'Clientes', icon: Building2 },
    ];

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
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
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
