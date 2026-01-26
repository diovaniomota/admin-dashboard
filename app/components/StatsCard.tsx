import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
    iconBg?: string;
    iconColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon: Icon, iconBg, iconColor = 'white' }) => {
    return (
        <div className={`card ${styles.statCard}`}>
            <div
                className={styles.statIcon}
                style={{ background: iconBg }}
            >
                <Icon size={24} color={iconColor} />
            </div>
            <div className={styles.statInfo}>
                <span className={styles.statValue}>{value}</span>
                <span className={styles.statLabel}>{label}</span>
            </div>
        </div>
    );
};

export default StatsCard;
