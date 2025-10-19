import React, { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { StrategicInitiative } from '../../types';
import { CloseIcon } from '../icons/IconComponents';
import { InitiativeFormData } from '../../context/InitiativesContext';
import { departments } from '../../data/mockData';

interface AddInitiativeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: InitiativeFormData) => void;
    initiativeToEdit: StrategicInitiative | null;
}

const getInitialState = (): InitiativeFormData => ({
    name: '',
    description: '',
    owner: '',
    associatedDepartments: [],
    otherAssociatedDepartments: '',
    outcomes: '',
    strategicAlignment: '',
    startDate: '',
    endDate: '',
});

type Errors = { [key in keyof Pick<InitiativeFormData, 'name' | 'startDate' | 'endDate'>]?: string };

const AddInitiativeModal: React.FC<AddInitiativeModalProps> = ({ isOpen, onClose, onSave, initiativeToEdit }) => {
    const { t, language } = useLocalization();
    const isEditMode = !!initiativeToEdit;

    const [formData, setFormData] = useState<InitiativeFormData>(getInitialState());
    const [isOtherDeptSelected, setIsOtherDeptSelected] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && initiativeToEdit) {
                const otherDepts = initiativeToEdit.otherAssociatedDepartments?.[language] || '';
                setFormData({
                    name: initiativeToEdit.name[language],
                    description: initiativeToEdit.description[language],
                    owner: initiativeToEdit.owner[language],
                    associatedDepartments: initiativeToEdit.associatedDepartments,
                    otherAssociatedDepartments: otherDepts,
                    outcomes: initiativeToEdit.outcomes[language],
                    strategicAlignment: initiativeToEdit.strategicAlignment[language],
                    startDate: initiativeToEdit.startDate,
                    endDate: initiativeToEdit.endDate,
                });
                setIsOtherDeptSelected(!!otherDepts);
            } else {
                setFormData(getInitialState());
                setIsOtherDeptSelected(false);
            }
            setErrors({});
        }
    }, [isOpen, initiativeToEdit, language, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDepartmentsChange = (deptName: string) => {
        setFormData(prev => {
            const newDepts = prev.associatedDepartments.includes(deptName)
                ? prev.associatedDepartments.filter(d => d !== deptName)
                : [...prev.associatedDepartments, deptName];
            return { ...prev, associatedDepartments: newDepts };
        });
    };

    const validate = (): boolean => {
        const newErrors: Errors = {};
        if (!formData.name.trim()) {
            newErrors.name = t('initiatives.modal.validation.nameRequired');
        }
        if (!formData.startDate) {
            newErrors.startDate = t('challenges.modal.validation.required');
        }
        if (!formData.endDate) {
            newErrors.endDate = t('challenges.modal.validation.required');
        }
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = t('initiatives.modal.validation.datesInvalid');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({
                ...formData,
                otherAssociatedDepartments: isOtherDeptSelected ? formData.otherAssociatedDepartments : ''
            });
        }
    };

    if (!isOpen) return null;

    const modalTitle = isEditMode ? t('initiatives.modal.editTitle') : t('initiatives.modal.addTitle');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">{t('initiatives.modal.name')} <span className="text-red-500">*</span></label>
                        <input id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                        <label htmlFor="owner" className="block text-sm font-medium mb-1">{t('initiatives.modal.owner')}</label>
                        <input id="owner" name="owner" value={formData.owner} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">{t('initiatives.modal.description')}</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('initiatives.modal.associatedDepartments')}</label>
                        <div className="p-2 border rounded-md max-h-48 overflow-y-auto bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600">
                            {departments.map(dept => (
                                <label key={dept.id} className="flex items-center space-x-2 rtl:space-x-reverse p-1 rounded hover:bg-natural-200 dark:hover:bg-natural-600">
                                    <input type="checkbox" checked={formData.associatedDepartments.includes(dept.name.ar)} onChange={() => handleDepartmentsChange(dept.name.ar)} />
                                    <span>{dept.name[language]}</span>
                                </label>
                            ))}
                            <label className="flex items-center space-x-2 rtl:space-x-reverse p-1 rounded font-semibold text-dark-purple-600 dark:text-dark-purple-300">
                                <input
                                    type="checkbox"
                                    checked={isOtherDeptSelected}
                                    onChange={() => setIsOtherDeptSelected(!isOtherDeptSelected)}
                                />
                                <span>{t('initiatives.modal.other')}</span>
                            </label>
                            {isOtherDeptSelected && (
                                <textarea
                                    name="otherAssociatedDepartments"
                                    value={formData.otherAssociatedDepartments}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder={t('initiatives.modal.otherDepartmentsPlaceholder')}
                                    className="mt-2 w-full p-2 bg-white dark:bg-natural-600 rounded-md"
                                />
                            )}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="outcomes" className="block text-sm font-medium mb-1">{t('initiatives.modal.outcomes')}</label>
                        <textarea id="outcomes" name="outcomes" value={formData.outcomes} onChange={handleChange} rows={3} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                    <div>
                        <label htmlFor="strategicAlignment" className="block text-sm font-medium mb-1">{t('initiatives.modal.strategicAlignment')}</label>
                        <textarea id="strategicAlignment" name="strategicAlignment" value={formData.strategicAlignment} onChange={handleChange} rows={3} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium mb-1">{t('initiatives.modal.startDate')} <span className="text-red-500">*</span></label>
                            <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" />
                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium mb-1">{t('initiatives.modal.endDate')} <span className="text-red-500">*</span></label>
                            <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" />
                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                        </div>
                    </div>
                </form>
                 <div className="flex justify-end items-center p-4 mt-auto border-t dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-md">{t('cancel')}</button>
                    <button onClick={handleSubmit} className="ms-3 px-4 py-2 text-sm text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default AddInitiativeModal;