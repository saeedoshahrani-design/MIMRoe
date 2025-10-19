import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { ChangeLogEntry } from '../../types';
import { CloseIcon } from '../icons/IconComponents';

interface ManualChangeLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ChangeLogEntry, 'id' | 'isManual'>) => void;
    entryToEdit: ChangeLogEntry | null;
}

type FormData = Omit<ChangeLogEntry, 'id' | 'isManual'>;

const getInitialState = (): FormData => ({
    type: 'edit',
    element: 'card',
    description: '',
    timestamp: new Date().toISOString().split('T')[0],
});

const ManualChangeLogModal: React.FC<ManualChangeLogModalProps> = ({ isOpen, onClose, onSave, entryToEdit }) => {
    const { t } = useLocalization();
    const isEditMode = !!entryToEdit;
    const [formData, setFormData] = useState<FormData>(getInitialState());

    useEffect(() => {
        if (isOpen) {
            if (entryToEdit) {
                setFormData({
                    type: entryToEdit.type,
                    element: entryToEdit.element,
                    description: entryToEdit.description,
                    timestamp: new Date(entryToEdit.timestamp).toISOString().split('T')[0],
                });
            } else {
                setFormData(getInitialState());
            }
        }
    }, [isOpen, entryToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.description.trim()) {
            const date = new Date(formData.timestamp);
            // Combine date with current time to maintain time part of ISO string
            const now = new Date();
            date.setUTCHours(now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
            
            onSave({ ...formData, timestamp: date.toISOString() });
        }
    };

    if (!isOpen) return null;

    const modalTitle = isEditMode ? t('procedures.changeLog.manualModal.editTitle') : t('procedures.changeLog.manualModal.addTitle');
    const typeOptions = Object.entries(t('procedures.changeLog.types', {}) as Record<string, string>);
    const elementOptions = Object.entries(t('procedures.changeLog.elements', {}) as Record<string, string>);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium mb-1">{t('procedures.changeLog.headers.type')}</label>
                            <select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md">
                                {typeOptions.map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="element" className="block text-sm font-medium mb-1">{t('procedures.changeLog.headers.element')}</label>
                            <select id="element" name="element" value={formData.element} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md">
                                {elementOptions.map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">{t('procedures.changeLog.headers.description')} <span className="text-red-500">*</span></label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="timestamp" className="block text-sm font-medium mb-1">{t('procedures.changeLog.headers.date')}</label>
                        <input type="date" id="timestamp" name="timestamp" value={formData.timestamp} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md" />
                    </div>
                </form>
                <div className="flex justify-end p-4 border-t dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-md">{t('cancel')}</button>
                    <button onClick={handleSubmit} className="ms-3 px-4 py-2 text-sm text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default ManualChangeLogModal;
