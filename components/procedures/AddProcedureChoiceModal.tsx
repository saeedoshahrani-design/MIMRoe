import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { CloseIcon, PencilIcon, SparklesIcon } from '../icons/IconComponents';

interface AddProcedureChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (choice: 'manual' | 'ai') => void;
}

const AddProcedureChoiceModal: React.FC<AddProcedureChoiceModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { t } = useLocalization();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-natural-700">
                    <h2 className="text-lg font-bold">{t('procedures.addProcedureChoice.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => onSelect('manual')}
                        className="p-6 text-center border-2 border-natural-300 dark:border-natural-600 rounded-lg hover:border-dark-purple-500 hover:bg-dark-purple-50 dark:hover:bg-dark-purple-900/50 transition-all duration-200"
                    >
                        <PencilIcon className="w-12 h-12 mx-auto text-dark-purple-500" />
                        <h3 className="mt-4 font-bold text-lg">{t('procedures.addProcedureChoice.manual')}</h3>
                        <p className="mt-1 text-sm text-natural-500 dark:text-natural-400">{t('procedures.addProcedureChoice.manualDescription')}</p>
                    </button>
                    <button
                        onClick={() => onSelect('ai')}
                        className="p-6 text-center border-2 border-natural-300 dark:border-natural-600 rounded-lg hover:border-bright-blue-500 hover:bg-bright-blue-50 dark:hover:bg-bright-blue-900/50 transition-all duration-200"
                    >
                        <SparklesIcon className="w-12 h-12 mx-auto text-bright-blue-500" />
                        <h3 className="mt-4 font-bold text-lg">{t('procedures.addProcedureChoice.ai')}</h3>
                        <p className="mt-1 text-sm text-natural-500 dark:text-natural-400">{t('procedures.addProcedureChoice.aiDescription')}</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProcedureChoiceModal;