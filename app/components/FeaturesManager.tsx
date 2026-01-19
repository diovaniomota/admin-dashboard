'use client';
import { useState } from 'react';
import {
    ShoppingCart, Package, FileText, DollarSign, Users, Truck,
    BarChart3, Settings, CreditCard, Bell, Calculator, Receipt
} from 'lucide-react';
import styles from './FeaturesManager.module.css';

interface Feature {
    key: string;
    label: string;
    description: string;
    icon: React.ElementType;
    category: string;
}

const AVAILABLE_FEATURES: Feature[] = [
    // Vendas
    { key: 'pdv', label: 'PDV', description: 'Ponto de Venda', icon: ShoppingCart, category: 'Vendas' },
    { key: 'caixa', label: 'Controle de Caixa', description: 'Abertura e Fechamento', icon: Calculator, category: 'Vendas' },
    { key: 'vendas', label: 'Vendas', description: 'Gestão de Vendas', icon: Receipt, category: 'Vendas' },
    { key: 'ordens_servico', label: 'Ordens de Serviço', description: 'Gestão de Serviços', icon: FileText, category: 'Vendas' },

    // Cadastros
    { key: 'clientes', label: 'Clientes', description: 'Cadastro de Clientes', icon: Users, category: 'Cadastros' },
    { key: 'produtos', label: 'Produtos/Estoque', description: 'Gestão de Estoque', icon: Package, category: 'Cadastros' },
    { key: 'fornecedores', label: 'Fornecedores', description: 'Cadastro de Fornecedores', icon: Truck, category: 'Cadastros' },
    { key: 'transportadoras', label: 'Transportadoras', description: 'Cadastro de Transportadoras', icon: Truck, category: 'Cadastros' },
    { key: 'veiculos', label: 'Veículos', description: 'Cadastro de Veículos', icon: Truck, category: 'Cadastros' },
    { key: 'compras', label: 'Compras', description: 'Entrada de Notas', icon: ShoppingCart, category: 'Cadastros' },

    // Fiscal
    { key: 'nfe', label: 'NF-e', description: 'Nota Fiscal Eletrônica', icon: FileText, category: 'Fiscal' },
    { key: 'nfce', label: 'NFC-e', description: 'Nota Fiscal Consumidor', icon: FileText, category: 'Fiscal' },

    // Financeiro
    { key: 'contas_receber', label: 'Contas a Receber', description: 'Gestão de Recebíveis', icon: DollarSign, category: 'Financeiro' },
    { key: 'contas_pagar', label: 'Contas a Pagar', description: 'Gestão de Pagamentos', icon: CreditCard, category: 'Financeiro' },
    { key: 'fluxo_caixa', label: 'Fluxo de Caixa', description: 'Controle Financeiro', icon: Calculator, category: 'Financeiro' },

    // Sistema
    { key: 'relatorios', label: 'Relatórios', description: 'Relatórios Gerenciais', icon: BarChart3, category: 'Sistema' },
    { key: 'configuracoes', label: 'Configurações', description: 'Configurações do Sistema', icon: Settings, category: 'Sistema' },
    { key: 'notificacoes', label: 'Notificações', description: 'Alertas e Notificações', icon: Bell, category: 'Sistema' },
];

interface FeaturesManagerProps {
    enabledFeatures: string[];
    onChange: (features: string[]) => void;
    readOnly?: boolean;
}

export default function FeaturesManager({ enabledFeatures, onChange, readOnly = false }: FeaturesManagerProps) {
    const categories = [...new Set(AVAILABLE_FEATURES.map(f => f.category))];

    const toggleFeature = (featureKey: string) => {
        if (readOnly) return;

        if (enabledFeatures.includes(featureKey)) {
            onChange(enabledFeatures.filter(f => f !== featureKey));
        } else {
            onChange([...enabledFeatures, featureKey]);
        }
    };

    const toggleAll = (enable: boolean) => {
        if (readOnly) return;
        onChange(enable ? AVAILABLE_FEATURES.map(f => f.key) : []);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Funcionalidades do Sistema</h3>
                {!readOnly && (
                    <div className={styles.actions}>
                        <button type="button" className={styles.selectAll} onClick={() => toggleAll(true)}>
                            Ativar Todos
                        </button>
                        <button type="button" className={styles.deselectAll} onClick={() => toggleAll(false)}>
                            Desativar Todos
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.summary}>
                <span className={styles.count}>
                    {enabledFeatures.length} de {AVAILABLE_FEATURES.length} funcionalidades ativas
                </span>
            </div>

            {categories.map(category => (
                <div key={category} className={styles.category}>
                    <h4 className={styles.categoryTitle}>{category}</h4>
                    <div className={styles.featuresGrid}>
                        {AVAILABLE_FEATURES.filter(f => f.category === category).map(feature => {
                            const isEnabled = enabledFeatures.includes(feature.key);
                            const Icon = feature.icon;

                            return (
                                <div
                                    key={feature.key}
                                    className={`${styles.featureCard} ${isEnabled ? styles.enabled : styles.disabled} ${readOnly ? styles.readOnly : ''}`}
                                    onClick={() => toggleFeature(feature.key)}
                                >
                                    <div className={styles.featureIcon}>
                                        <Icon size={20} />
                                    </div>
                                    <div className={styles.featureInfo}>
                                        <span className={styles.featureLabel}>{feature.label}</span>
                                        <span className={styles.featureDesc}>{feature.description}</span>
                                    </div>
                                    <div className={`${styles.toggle} ${isEnabled ? styles.toggleOn : ''}`}>
                                        <div className={styles.toggleKnob} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export { AVAILABLE_FEATURES };
