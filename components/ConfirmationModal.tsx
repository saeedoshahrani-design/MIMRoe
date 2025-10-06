import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { CloseIcon } from './icons/IconComponents';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const { t } = useLocalization();

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
            aria-labelledby="confirmation-title"
        >
            <div 
                className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-md flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 id="confirmation-title" className="text-lg font-bold text-natural-800 dark:text-natural-100">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6 text-natural-500" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-natural-600 dark:text-natural-300">{message}</p>
                </div>

                <div className="flex justify-end items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg space-x-3 rtl:space-x-reverse">
                    <button 
                        onClick={onClose} 
                        type="button" 
                        className="px-4 py-2 text-sm font-medium text-natural-700 dark:text-natural-200 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md hover:bg-natural-50 dark:hover:bg-natural-600"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        type="button" 
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
                    >
                        {t('delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
