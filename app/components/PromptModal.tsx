'use client';
import { useState } from 'react';
import { AlertTriangle, X, Ban } from 'lucide-react';
import styles from './Modal.module.css';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    message: string;
    placeholder?: string;
    confirmText?: string;
}

export default function PromptModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    placeholder = '',
    confirmText = 'Confirmar'
}: PromptModalProps) {
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value);
            setValue('');
        }
    };

    const handleClose = () => {
        setValue('');
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className={`${styles.iconWrapper} ${styles.warning}`}>
                    <Ban size={48} />
                </div>

                <h2 className={styles.title}>{title}</h2>
                <p className={styles.message}>{message}</p>

                <div className={styles.inputWrapper}>
                    <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                        autoFocus
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button className="btn btn-secondary" onClick={handleClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={handleConfirm}
                        disabled={!value.trim()}
                    >
                        <Ban size={18} />
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
