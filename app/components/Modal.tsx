'use client';
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export default function Modal({ isOpen, onClose, type = 'success', title, message }: ModalProps) {
    if (!isOpen) return null;

    const icons = {
        success: <CheckCircle size={48} />,
        error: <AlertTriangle size={48} />,
        warning: <AlertTriangle size={48} />,
        info: <Info size={48} />
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={`${styles.iconWrapper} ${styles[type]}`}>
                    {icons[type]}
                </div>

                <h2 className={styles.title}>{title}</h2>
                <p className={styles.message}>{message}</p>

                <button className={`btn btn-primary ${styles.okBtn}`} onClick={onClose}>
                    OK
                </button>
            </div>
        </div>
    );
}
