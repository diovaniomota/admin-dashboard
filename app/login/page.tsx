'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, LogIn, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError('Email ou senha incorretos');
                } else {
                    setError(authError.message);
                }
                setLoading(false);
                return;
            }

            if (data.user) {
                localStorage.setItem('adminUser', JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || 'Administrador'
                }));
                router.push('/');
            }
        } catch (error) {
            setError('Erro ao fazer login');
        }

        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <div className={styles.logoIcon}>A</div>
                    <h1>Admin Panel</h1>
                    <p>Acesso restrito para administradores</p>
                </div>

                {error && (
                    <div className={styles.errorAlert}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">
                            <Mail size={18} />
                            E-mail
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@sistema.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">
                            <Lock size={18} />
                            Senha
                        </label>
                        <div className={styles.passwordInput}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className={styles.togglePassword}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.loginButton}
                        disabled={loading}
                    >
                        <LogIn size={20} />
                        <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
