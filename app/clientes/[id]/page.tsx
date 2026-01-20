'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Building2, Ban, CheckCircle, Settings2, MapPin, Search, Loader2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Modal from '../../components/Modal';
import FeaturesManager, { AVAILABLE_FEATURES } from '../../components/FeaturesManager';
import { formatCNPJ, formatPhone, cleanFormat } from '../../lib/formatters';
import { syncCompanyToFocus } from '../../actions/focus';
import { updateUserAccess } from '../../actions/users';
import styles from '../novo/novo.module.css';

interface Organization {
    id: string;
    codigo: number;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    blocked_reason: string | null;
    enabled_features: string[];
    inscricao_estadual?: string;
    cnae_principal?: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cod_ibge?: string;
    created_at: string;
}

export default function EditClientePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchingCNPJ, setSearchingCNPJ] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'dados' | 'acesso' | 'funcionalidades'>('dados');
    const [modalConfig, setModalConfig] = useState({ type: 'success' as 'success' | 'error', title: '', message: '' });
    const [codigoCliente, setCodigoCliente] = useState<number | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [syncWithFocus, setSyncWithFocus] = useState(false);

    const [formData, setFormData] = useState({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        email: '',
        phone: '',
        plan: 'basico',
        status: 'ativo',
        inscricao_estadual: '',
        cnae_principal: '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        cod_ibge: '',
        admin_password: '' // New field for password update
    });

    const [enabledFeatures, setEnabledFeatures] = useState<string[]>(
        AVAILABLE_FEATURES.map(f => f.key)
    );

    useEffect(() => {
        if (id) {
            fetchClient();
        }
    }, [id]);

    const fetchClient = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching client:', error);
            setError('Cliente não encontrado');
        } else if (data) {
            setCodigoCliente(data.codigo);
            setFormData({
                razao_social: data.razao_social || '',
                nome_fantasia: data.nome_fantasia || '',
                cnpj: formatCNPJ(data.cnpj || ''),
                email: data.email || '',
                phone: formatPhone(data.phone || ''),
                plan: data.plan || 'basico',
                status: data.status || 'ativo',
                inscricao_estadual: data.inscricao_estadual || '',
                cnae_principal: data.cnae_principal || '',
                cep: data.cep || '',
                logradouro: data.logradouro || '',
                numero: data.numero || '',
                bairro: data.bairro || '',
                cidade: data.cidade || '',
                uf: data.uf || '',
                cod_ibge: data.cod_ibge || '',
                admin_password: ''
            });
            setEnabledFeatures(data.enabled_features || AVAILABLE_FEATURES.map(f => f.key));
        }
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = e.target.value;
        if (e.target.name === 'cnpj') value = formatCNPJ(value);
        if (e.target.name === 'phone') value = formatPhone(value);
        setFormData({ ...formData, [e.target.name]: value });
        setError('');
    };

    const buscarCNPJ = async () => {
        const cnpjClean = cleanFormat(formData.cnpj);
        if (cnpjClean.length !== 14) {
            setError('CNPJ inválido (deve ter 14 dígitos)');
            return;
        }

        setSearchingCNPJ(true);
        setError('');

        try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);
            const data = await res.json();

            if (res.ok) {
                setFormData(prev => ({
                    ...prev,
                    razao_social: data.razao_social,
                    nome_fantasia: data.nome_fantasia || data.razao_social,
                    cnae_principal: data.cnae_fiscal_descricao,
                    cep: data.cep,
                    logradouro: data.logradouro,
                    numero: data.numero,
                    bairro: data.bairro,
                    cidade: data.municipio,
                    uf: data.uf,
                    phone: formatPhone(data.ddd_telefone_1 || '')
                }));
            } else {
                setError('CNPJ não encontrado ou erro na busca.');
            }
        } catch (err) {
            console.error('Erro ao buscar CNPJ', err);
            setError('Erro ao buscar dados do CNPJ.');
        } finally {
            setSearchingCNPJ(false);
        }
    };

    const buscarCEP = async () => {
        const cepClean = cleanFormat(formData.cep);
        if (cepClean.length !== 8) return;
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    logradouro: data.logradouro,
                    bairro: data.bairro,
                    cidade: data.localidade,
                    uf: data.uf,
                    cod_ibge: data.ibge
                }));
            }
        } catch (err) {
            console.error('Erro ao buscar CEP', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        // 1. Update Organization Data
        const { error: orgError } = await supabase
            .from('organizations')
            .update({
                razao_social: formData.razao_social,
                nome_fantasia: formData.nome_fantasia,
                cnpj: formData.cnpj,
                email: formData.email,
                phone: formData.phone,
                plan: formData.plan,
                enabled_features: enabledFeatures,
                inscricao_estadual: formData.inscricao_estadual,
                cnae_principal: formData.cnae_principal,
                cep: formData.cep,
                logradouro: formData.logradouro,
                numero: formData.numero,
                bairro: formData.bairro,
                cidade: formData.cidade,
                uf: formData.uf,
                cod_ibge: formData.cod_ibge
            })
            .eq('id', id);

        if (orgError) {
            setError('Erro ao salvar organização: ' + orgError.message);
            setSaving(false);
            return;
        }

        // 2. Update User Access (Email/Password) via Server Action
        const accessResult = await updateUserAccess(id, formData.email, formData.admin_password);

        if (!accessResult.success) {
            // Non-fatal error for access update, but warn user
            console.error('Access Update Error:', accessResult.error);
            // We append this error to the modal config later or just show a warning
        }

        // 3. Sync with Focus NFe
        if (syncWithFocus) {
            syncCompanyToFocus(formData).then((syncResult: any) => {
                let message = `Dados salvos. Sincronização Focus: ${syncResult.success ? 'OK' : 'Falha (' + syncResult.error + ')'}.`;
                if (!accessResult.success) message += ` ERRO Acesso: ${accessResult.error}`;

                setModalConfig({
                    type: syncResult.success && accessResult.success ? 'success' : 'error',
                    title: syncResult.success ? 'Atualizado com Sucesso' : 'Salvo com Alertas',
                    message
                });
                setShowModal(true);
            });
        } else {
            let message = 'Os dados foram atualizados.';
            if (!accessResult.success) message += ` PORÉM houve erro ao atualizar senha/acesso: ${accessResult.error}`;

            setModalConfig({
                type: accessResult.success ? 'success' : 'error',
                title: accessResult.success ? 'Cliente Atualizado!' : 'Salvo com Erro de Acesso',
                message
            });
            setShowModal(true);
        }

        setSaving(false);
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Carregando...</div>;

    const formattedId = codigoCliente ? codigoCliente.toString().padStart(2, '0') : '--';

    return (
        <div>
            {showToast && (
                <div className={styles.toast}>
                    <CheckCircle size={20} color="#4ade80" />
                    <span>ID copiado!</span>
                </div>
            )}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1>Editar Cliente</h1>
                            <p style={{ margin: 0 }}>{formData.nome_fantasia}</p>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '4px'
                        }}>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ID do Cliente:</span>
                            <div
                                style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: '#334155',
                                    fontFamily: 'monospace',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    if (codigoCliente) {
                                        navigator.clipboard.writeText(codigoCliente.toString());
                                        setShowToast(true);
                                        setTimeout(() => setShowToast(false), 3000);
                                    }
                                }}
                                title="Clique para copiar"
                            >
                                {formattedId}
                                <Settings2 size={14} color="#94a3b8" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('dados')}
                    style={{
                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                        background: activeTab === 'dados' ? 'white' : 'transparent',
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: activeTab === 'dados' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    <Building2 size={18} />
                    Dados Cadastrais
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('acesso')}
                    style={{
                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                        background: activeTab === 'acesso' ? 'white' : 'transparent',
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: activeTab === 'acesso' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    <Lock size={18} />
                    Acesso
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('funcionalidades')}
                    style={{
                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                        background: activeTab === 'funcionalidades' ? 'white' : 'transparent',
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: activeTab === 'funcionalidades' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    <Settings2 size={18} />
                    Funcionalidades
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {activeTab === 'dados' && (
                    <div className="card">
                        <h2 className={styles.sectionTitle}>
                            <Building2 size={22} />
                            Dados da Empresa
                        </h2>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>CNPJ *</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input name="cnpj" value={formData.cnpj} onChange={handleChange} required style={{ flex: 1 }} />
                                    <button
                                        type="button"
                                        onClick={buscarCNPJ}
                                        disabled={searchingCNPJ}
                                        style={{
                                            padding: '0 12px',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'background 0.2s',
                                            minWidth: '44px'
                                        }}
                                        title="Buscar dados do CNPJ"
                                    >
                                        {searchingCNPJ ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Inscrição Estadual</label>
                                <input name="inscricao_estadual" value={formData.inscricao_estadual} onChange={handleChange} />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>Razão Social *</label>
                                <input name="razao_social" value={formData.razao_social} onChange={handleChange} required />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>Nome Fantasia *</label>
                                <input name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} required />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>CNAE Principal</label>
                                <input name="cnae_principal" value={formData.cnae_principal} onChange={handleChange} />
                            </div>

                            {/* Email e Phone removidos daqui se quiser focar apenas no 'Acesso', mas mantendo por compatibilidade visual se desejar. O usuário pediu ABA separada. */}
                            <div className={styles.formGroup}>
                                <label>Telefone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Plano</label>
                                <select name="plan" value={formData.plan} onChange={handleChange} required>
                                    <option value="basico">Básico</option>
                                    <option value="profissional">Profissional</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>

                        <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>
                            <MapPin size={22} />
                            Endereço
                        </h2>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>CEP</label>
                                <input name="cep" value={formData.cep} onChange={handleChange} onBlur={buscarCEP} maxLength={9} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Logradouro</label>
                                <input name="logradouro" value={formData.logradouro} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Número</label>
                                <input name="numero" value={formData.numero} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Bairro</label>
                                <input name="bairro" value={formData.bairro} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Cidade</label>
                                <input name="cidade" value={formData.cidade} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>UF</label>
                                <input name="uf" value={formData.uf} onChange={handleChange} maxLength={2} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Cód. IBGE</label>
                                <input name="cod_ibge" value={formData.cod_ibge} onChange={handleChange} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {formData.status === 'bloqueado' ? <Ban size={20} color="var(--danger)" /> : <CheckCircle size={20} color="var(--success)" />}
                            <div>
                                <strong>Status: </strong>
                                <span style={{ textTransform: 'capitalize', color: formData.status === 'bloqueado' ? 'var(--danger)' : 'var(--success)' }}>
                                    {formData.status}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'acesso' && (
                    <div className="card">
                        <h2 className={styles.sectionTitle}>
                            <Lock size={22} />
                            Credenciais de Acesso
                        </h2>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6">
                            <p className="text-sm text-slate-600">
                                Estas credenciais permitem que o administrador da empresa faça login no NextDashboard.
                                <br />
                                <strong>Nota:</strong> Alterar o e-mail aqui atualizará tanto o registro da empresa quanto o usuário de login.
                            </p>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>Email de Login *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="ex: admin@empresa.com"
                                />
                                <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                    Este email é usado para login e notificações.
                                </span>
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>Alterar Senha</label>
                                <input
                                    type="password"
                                    name="admin_password"
                                    value={formData.admin_password}
                                    onChange={handleChange}
                                    placeholder="Deixe em branco para manter a atual"
                                    minLength={6}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                    Mínimo de 6 caracteres. Preencha apenas se desejar redefinir a senha do usuário.
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'funcionalidades' && (
                    <div className="card">
                        <h2 className={styles.sectionTitle}>
                            <Settings2 size={22} />
                            Funcionalidades
                        </h2>
                        <FeaturesManager enabledFeatures={enabledFeatures} onChange={setEnabledFeatures} />
                    </div>
                )}

                <div className={styles.actions} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={syncWithFocus}
                            onChange={(e) => setSyncWithFocus(e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#475569' }}>Refletir alterações no Focus NFe (API)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            <Save size={18} />
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </form>

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); router.push('/clientes'); }} type={modalConfig.type} title={modalConfig.title} message={modalConfig.message} />
            <style jsx global>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
