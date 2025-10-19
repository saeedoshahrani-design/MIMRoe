import React, { useState, useEffect } from 'react';
import { InitiativeMember } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { CloseIcon } from '../icons/IconComponents';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; role: string; tasks: string; }) => void;
    memberToEdit: InitiativeMember | null;
}

const getInitialState = () => ({ name: '', role: '', tasks: '' });

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSave, memberToEdit }) => {
    const { t, language } = useLocalization();
    const isEditMode = !!memberToEdit;
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(isEditMode ? {
                name: memberToEdit.name?.[language] || '',
                role: memberToEdit.role?.[language] || '',
                tasks: memberToEdit.tasks?.[language] || '',
            } : getInitialState());
        }
    }, [isOpen, memberToEdit, language, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    const modalTitle = isEditMode ? t('initiatives.details.members.editTitle') : t('initiatives.details.members.addTitle');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">{t('initiatives.details.members.name')} <span className="text-red-500">*</span></label>
                        <input id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium mb-1">{t('initiatives.details.members.role')}</label>
                        <input id="role" name="role" value={formData.role} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="tasks" className="block text-sm font-medium mb-1">{t('initiatives.details.members.tasks')}</label>
                        <textarea id="tasks" name="tasks" value={formData.tasks} onChange={handleChange} rows={4} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md"></textarea>
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

export default AddMemberModal;