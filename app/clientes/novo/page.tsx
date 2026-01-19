'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building2, User, Settings2, MapPin, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Modal from '../../components/Modal';
import FeaturesManager, { AVAILABLE_FEATURES } from '../../components/FeaturesManager';
import { formatCNPJ, formatPhone, cleanFormat } from '../../lib/formatters';
import styles from './novo.module.css';

// Force rebuild
export default function NovoClientePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchingCNPJ, setSearchingCNPJ] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('O cliente foi cadastrado com sucesso.');
    const [modalTitle, setModalTitle] = useState('Cliente Criado!');
    const [registerInFocus, setRegisterInFocus] = useState(true);

    const [enabledFeatures, setEnabledFeatures] = useState<string[]>(
        AVAILABLE_FEATURES.map(f => f.key)
    );

    const [formData, setFormData] = useState({
        // Dados da Empresa
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        email: '',
        phone: '',
        plan: 'basico',
        inscricao_estadual: '',
        cnae_principal: '',

        // Endereço
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        cod_ibge: '',

        // Dados do Admin da Empresa
        admin_name: '',
        admin_email: '',
        admin_password: ''
    });

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
        setLoading(true);
        setError('');

        try {
            // 1. Criar usuário admin no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.admin_email,
                password: formData.admin_password,
                options: {
                    data: {
                        name: formData.admin_name,
                        role: 'Administrador',
                        is_super_admin: false
                    }
                }
            });

            if (authError) {
                let msg = authError.message;
                if (msg.includes('User already registered')) {
                    msg = 'Este email já está cadastrado no sistema.';
                }
                setError('Erro ao criar usuário: ' + msg);
                setLoading(false);
                return;
            }

            // 2. Criar organização com todos os dados
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert([{
                    razao_social: formData.razao_social,
                    nome_fantasia: formData.nome_fantasia,
                    cnpj: formData.cnpj,
                    email: formData.email,
                    phone: formData.phone,
                    plan: formData.plan,
                    status: 'ativo',
                    admin_user_id: authData.user?.id,
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
                }])
                .select()
                .single();

            if (orgError) {
                setError('Erro ao criar organização: ' + orgError.message);
                setLoading(false);
                return;
            }

            // 3. Criar perfil do usuário (LEGADO: user_profiles)
            if (authData.user) {
                await supabase
                    .from('user_profiles')
                    .insert([{
                        id: authData.user.id,
                        name: formData.admin_name,
                        role: 'Administrador',
                        organization_id: orgData.id,
                        is_super_admin: false
                    }]);

                // 4. Criar perfil do usuário (NOVO: app_users) para acesso ao NextDashboard
                const { error: appUserError } = await supabase
                    .from('app_users')
                    .insert([{
                        auth_id: authData.user.id,
                        name: formData.admin_name,
                        role: 'admin',
                        organization_id: orgData.id,
                        empresa_id: orgData.id,
                        email: formData.admin_email
                    }]);

                if (appUserError) {
                    console.error('Erro ao criar app_users:', appUserError);
                    alert('Erro ao vincular usuário ao App: ' + appUserError.message);
                }
            }

            // 5. Criar empresa na Focus NFe (Integração) - Apenas se marcado
            if (registerInFocus) {
                try {
                    // @ts-ignore
                    const { createCompanyInFocus } = await import('../../actions/focus');
                    const focusResult = await createCompanyInFocus(formData);

                    if (!focusResult.success) {
                        console.error('Erro Focus NFe:', focusResult.error);
                        setModalMessage(`Cliente criado no banco, mas houve erro na Focus NFe: ${focusResult.error}`);
                        setModalTitle('Criado com Aviso');
                    } else if (focusResult.warning) {
                        setModalMessage(`Cliente criado no sistema! AVISO: ${focusResult.warning}`);
                        setModalTitle('Criado (Homologação)');
                    } else {
                        console.log('Empresa criada na Focus NFe com sucesso!', focusResult.data);
                        setModalMessage('Cliente cadastrado e sincronizado com a Focus NFe.');
                        setModalTitle('Cliente Criado!');
                    }
                } catch (focusErr) {
                    console.error('Erro ao chamar Focus NFe:', focusErr);
                    setModalMessage('Cliente criado, mas falha na comunicação com a Focus NFe.');
                    setModalTitle('Criado com Aviso');
                }
            } else {
                setModalMessage('Cliente cadastrado com sucesso (sem integração Focus habilitada).');
                setModalTitle('Cliente Criado!');
            }

            setShowModal(true);

        } catch (error) {
            setError('Erro ao criar cliente');
            console.error(error);
        }

        setLoading(false);
    };

    return (
        <div>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => {
                    if (step > 1) {
                        setStep(step - 1);
                    } else {
                        router.back();
                    }
                }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1>Novo Cliente</h1>
                    <p>Cadastrar uma nova empresa na plataforma</p>
                </div>
            </header>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <div className="card">
                        <h2 className={styles.sectionTitle}>
                            <Building2 size={22} />
                            Dados Cadastrais
                        </h2>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>CNPJ *</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        name="cnpj"
                                        value={formData.cnpj}
                                        onChange={handleChange}
                                        required
                                        maxLength={18}
                                        style={{ flex: 1 }}
                                        placeholder="00.000.000/0000-00"
                                    />
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
                                <input
                                    type="text"
                                    name="inscricao_estadual"
                                    value={formData.inscricao_estadual}
                                    onChange={handleChange}
                                />
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
                                <input name="cnae_principal" value={formData.cnae_principal} onChange={handleChange} placeholder="Descrição ou código" />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Telefone</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>

                        <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>
                            <MapPin size={22} />
                            Endereço
                        </h2>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>CEP</label>
                                <input name="cep" value={formData.cep} onChange={handleChange} onBlur={buscarCEP} maxLength={9} placeholder="00000-000" />
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

                        <div className={styles.actions}>
                            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Próximo</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="card">
                        <h2 className={styles.sectionTitle}>
                            <User size={22} />
                            Administrador e Plano
                        </h2>

                        <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                            <label>Plano Escolhido *</label>
                            <select name="plan" value={formData.plan} onChange={handleChange} required>
                                <option value="basico">Básico</option>
                                <option value="profissional">Profissional</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Nome do Admin *</label>
                                <input name="admin_name" value={formData.admin_name} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email de Acesso *</label>
                                <input type="email" name="admin_email" value={formData.admin_email} onChange={handleChange} required />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>Senha Inicial *</label>
                                <input type="password" name="admin_password" value={formData.admin_password} onChange={handleChange} minLength={6} required />
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                            <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Próximo</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="card">
                        <h2 className={styles.sectionTitle}>
                            <Settings2 size={22} />
                            Funcionalidades e Integrações
                        </h2>

                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Integração Fiscal</h3>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={registerInFocus}
                                    onChange={(e) => setRegisterInFocus(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <div>
                                    <span style={{ display: 'block', fontWeight: 500 }}>Cadastrar na Focus NFe</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Cria a empresa automaticamente na plataforma de emissão de notas.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <FeaturesManager enabledFeatures={enabledFeatures} onChange={setEnabledFeatures} />
                        <div className={styles.actions}>
                            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Voltar</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                <Save size={18} />
                                {loading ? 'Criando...' : 'Criar Cliente'}
                            </button>
                        </div>
                    </div>
                )}
            </form>

            <div className={styles.steps}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}><span>1</span> Empresa</div>
                <div className={styles.stepLine} />
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}><span>2</span> Admin</div>
                <div className={styles.stepLine} />
                <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}><span>3</span> Recursos</div>
            </div>

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); router.push('/clientes'); }} type="success" title={modalTitle} message={modalMessage} />

            <style jsx global>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
