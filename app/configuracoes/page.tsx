'use client';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Save, Bell, Shield, Mail } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const [settings, setSettings] = useState({
        systemName: 'Work ERP Admin',
        emailNotifications: true,
        maintenanceMode: false
    });

    const handleSave = () => {
        alert('Configurações salvas com sucesso!');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Configurações</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerencie as preferências do painel administrativo.</p>
            </header>

            {/* Aparência */}
            <section className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--info)' }}>
                        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Aparência</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                        <span style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>Tema do Sistema</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Alternar entre modo claro e escuro
                        </span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="btn"
                        style={{
                            background: theme === 'dark' ? '#334155' : '#e2e8f0',
                            color: theme === 'dark' ? 'white' : '#1a202c',
                            minWidth: '120px',
                            justifyContent: 'center'
                        }}
                    >
                        {theme === 'dark' ? (
                            <><Moon size={16} /> Escuro</>
                        ) : (
                            <><Sun size={16} /> Claro</>
                        )}
                    </button>
                </div>
            </section>

            {/* Configurações Gerais (Placeholder) */}
            <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)' }}>
                        <Shield size={20} />
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Geral</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ marginBottom: '8px', display: 'block' }}>Nome do Sistema</label>
                        <input
                            type="text"
                            value={settings.systemName}
                            onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                            <div>
                                <span style={{ display: 'block', fontWeight: 500 }}>Notificações por Email</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receber alertas de novos tickets</span>
                            </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: settings.emailNotifications ? 'var(--success)' : 'var(--text-muted)',
                                transition: '.4s', borderRadius: '34px'
                            }}></span>
                            <span style={{
                                position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px',
                                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                transform: settings.emailNotifications ? 'translateX(24px)' : 'translateX(0)'
                            }}></span>
                        </label>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

                    <button className="btn btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-end' }}>
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </section>
        </div>
    );
}
