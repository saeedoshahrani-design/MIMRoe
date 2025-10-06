import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { DepartmentTarget, TargetUnit } from '../../types';
import { CloseIcon } from '../icons/IconComponents';

interface TargetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (targetData: Omit<DepartmentTarget, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => void;
    departmentId: string;
}

const getInitialState = () => ({
    name: '',
    description: '',
    unit: 'percentage' as TargetUnit,
    baseline: 0,
    current: 0,
    target: 100,
    dueDate: null,
});

type FormState = ReturnType<typeof getInitialState>;
type Errors = { [key in keyof FormState]?: string };

const TargetFormModal: React.FC<TargetFormModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useLocalization();
    const [formState, setFormState] = useState(getInitialState());
    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFormState(getInitialState());
            setErrors({});
            setIsLoading(false);
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const validate = (): boolean => {
        const newErrors: Errors = {};
        if (!formState.name.trim()) {
            newErrors.name = t('departments.targets.validation.nameRequired');
        } else if (formState.name.trim().length < 3 || formState.name.trim().length > 100) {
            newErrors.name = t('departments.targets.validation.nameLength');
        }
        if (Number(formState.target) <= Number(formState.baseline)) {
            newErrors.target = t('departments.targets.validation.baselineLessThanTarget');
        }
        if (Number(formState.current) < Number(formState.baseline)) {
            newErrors.current = t('departments.targets.validation.currentGteBaseline');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setIsLoading(true);
            setTimeout(() => {
                onSave({
                    ...formState,
                    baseline: Number(formState.baseline),
                    current: Number(formState.current),
                    target: Number(formState.target),
                });
            }, 500);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    const unitOptions = Object.entries(t('departments.targets.unitOptions', {}) as Record<string, string>);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{t('departments.targets.addModalTitle')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">{t('departments.targets.targetName')} <span className="text-red-500">*</span></label>
                        <input ref={nameInputRef} type="text" name="name" id="name" value={formState.name} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"/>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium">{t('departments.targets.description')}</label>
                        <textarea name="description" id="description" value={formState.description} onChange={handleChange} rows={2} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"></textarea>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="baseline" className="block text-sm font-medium">{t('departments.targets.baseline')}</label>
                            <input type="number" name="baseline" id="baseline" value={formState.baseline} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                        </div>
                         <div>
                            <label htmlFor="current" className="block text-sm font-medium">{t('departments.targets.current')}</label>
                            <input type="number" name="current" id="current" value={formState.current} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                            {errors.current && <p className="text-red-500 text-xs mt-1">{errors.current}</p>}
                        </div>
                         <div>
                            <label htmlFor="target" className="block text-sm font-medium">{t('departments.targets.target')}</label>
                            <input type="number" name="target" id="target" value={formState.target} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                            {errors.target && <p className="text-red-500 text-xs mt-1">{errors.target}</p>}
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium">{t('departments.targets.unit')}</label>
                            <select name="unit" id="unit" value={formState.unit} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                {unitOptions.map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                        </div>
                        <div>
                           <label htmlFor="dueDate" className="block text-sm font-medium">{t('departments.targets.dueDate')}</label>
                            <input type="date" name="dueDate" id="dueDate" value={formState.dueDate || ''} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium rounded-md">{t('cancel')}</button>
                    <button onClick={handleSubmit} type="submit" disabled={isLoading} className="ms-3 px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700 disabled:bg-natural-400">
                        {isLoading ? '...' : t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TargetFormModal;