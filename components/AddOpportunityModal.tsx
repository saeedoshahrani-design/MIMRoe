import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Opportunity, OpportunityStatus, LocalizedString } from '../types';
import { departments } from '../data/mockData';
import { CloseIcon } from './icons/IconComponents';
import { useOpportunities } from '../context/OpportunitiesContext';
import { generateNextOpportunityCode } from '../utils/opportunityUtils';
import { computePriorityDetails, PriorityValue } from '../utils/priority';
import LinkedTargetsSelector from './departments/LinkedTargetsSelector';
import { locales } from '../i18n/locales';
import { autoTranslate } from '../utils/localizationUtils';

interface AddOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (opportunity: Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'> & { id?: string }) => void;
    opportunityToEdit: Opportunity | null;
}

const getInitialState = () => {
    const defaultPriority = computePriorityDetails('متوسط', 'متوسط');
    return {
        title: '',
        department: '',
        status: 'Under Review' as OpportunityStatus,
        impact: 'متوسط' as PriorityValue,
        effort: 'متوسط' as PriorityValue,
        priority: defaultPriority.legacyPriority,
        priority_category: defaultPriority.categoryKey,
        priority_score: defaultPriority.score,
        currentSituation: '',
        proposedSolution: '',
        progress: 0,
        owner: '',
        startDate: '',
        dueDate: '',
        notes: '',
        linkedTargetIds: [] as string[],
    };
};

type FormState = ReturnType<typeof getInitialState>;
type Errors = { [key in keyof Pick<FormState, 'title' | 'department'>]?: string };

const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({ isOpen, onClose, onSave, opportunityToEdit }) => {
    const { t, language } = useLocalization();
    const { opportunities } = useOpportunities();
    const isEditMode = !!opportunityToEdit;
    
    const [formState, setFormState] = useState(getInitialState());
    const [errors, setErrors] = useState<Errors>({});

    const updateCalculatedPriority = useCallback((effort: PriorityValue, impact: PriorityValue) => {
        const { categoryKey, score, legacyPriority } = computePriorityDetails(effort, impact);
        setFormState(prev => ({
            ...prev,
            priority_category: categoryKey,
            priority_score: score,
            priority: legacyPriority,
        }));
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && opportunityToEdit) {
                setFormState({
                    title: opportunityToEdit.title?.[language] || '',
                    department: opportunityToEdit.department,
                    status: opportunityToEdit.status,
                    impact: opportunityToEdit.impact,
                    effort: opportunityToEdit.effort,
                    priority: opportunityToEdit.priority,
                    priority_category: opportunityToEdit.priority_category,
                    priority_score: opportunityToEdit.priority_score,
                    currentSituation: opportunityToEdit.currentSituation?.[language] || '',
                    proposedSolution: opportunityToEdit.proposedSolution?.[language] || '',
                    progress: opportunityToEdit.progress,
                    owner: opportunityToEdit.owner?.[language] || '',
                    startDate: opportunityToEdit.startDate || '',
                    dueDate: opportunityToEdit.dueDate || '',
                    notes: opportunityToEdit.notes || '',
                    linkedTargetIds: opportunityToEdit.linkedTargetIds || [],
                });
            } else {
                setFormState(getInitialState());
            }
            setErrors({});
        }
    }, [isOpen, opportunityToEdit, isEditMode, language]);

    const validate = (): boolean => {
        const newErrors: Errors = {};
        if (!formState.title.trim()) newErrors.title = t('opportunities.modal.validation.titleRequired');
        if (!formState.department.trim()) newErrors.department = t('opportunities.modal.validation.departmentRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const otherLang = language === 'ar' ? 'en' : 'ar';
            const createLocalizedString = (currentText: string, existing?: LocalizedString): LocalizedString => {
                const newLocalizedString: LocalizedString = {
                    ar: existing?.ar || '',
                    en: existing?.en || '',
                };
                newLocalizedString[language] = currentText;
                
                if (!newLocalizedString[otherLang] || autoTranslate(existing?.[language] || '', otherLang) === newLocalizedString[otherLang]) {
                    newLocalizedString[otherLang] = autoTranslate(currentText, otherLang);
                }
                return newLocalizedString;
            };

            const opportunityData = {
                ...formState,
                title: createLocalizedString(formState.title, opportunityToEdit?.title),
                currentSituation: createLocalizedString(formState.currentSituation, opportunityToEdit?.currentSituation),
                proposedSolution: createLocalizedString(formState.proposedSolution, opportunityToEdit?.proposedSolution),
                owner: createLocalizedString(formState.owner, opportunityToEdit?.owner),
            };

            onSave({ ...opportunityData, id: opportunityToEdit?.id });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => {
            const newState = { ...prev, [name]: name === 'progress' ? Number(value) : value };
            if (name === 'department' && prev.department !== value) {
                newState.linkedTargetIds = [];
            }
            return newState;
        });
        
        if (name === 'effort' || name === 'impact') {
            const newEffort = name === 'effort' ? value : formState.effort;
            const newImpact = name === 'impact' ? value : formState.impact;
            updateCalculatedPriority(newEffort as PriorityValue, newImpact as PriorityValue);
        }
    };

    if (!isOpen) return null;

    const modalTitle = isEditMode ? t('opportunities.modal.editTitle') : t('opportunities.modal.addTitle');
    const code = isEditMode ? opportunityToEdit.code : generateNextOpportunityCode(opportunities);
    const selectedDepartmentId = departments.find(d => d.name.ar === formState.department)?.id || null;
    
    // FIX: Cast `value` to string to prevent 'unknown' type errors.
    const impactOptions = Object.entries(locales[language].challenges.impactOptions).map(([key, value]) => ({ key: (Object.values(locales.ar.challenges.impactOptions) as string[])[Object.keys(locales.en.challenges.impactOptions).indexOf(key)], value: value as string }));
    // FIX: Cast `value` to string to prevent 'unknown' type errors.
    const effortOptions = Object.entries(locales[language].challenges.effortOptions).map(([key, value]) => ({ key: (Object.values(locales.ar.challenges.effortOptions) as string[])[Object.keys(locales.en.challenges.effortOptions).indexOf(key)], value: value as string }));

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium">{t('opportunities.modal.opportunityCode')}</label>
                            <input type="text" value={code} readOnly disabled className="mt-1 w-full bg-natural-100 dark:bg-natural-900 border-natural-300 dark:border-natural-600 rounded-md cursor-not-allowed"/>
                        </div>
                        <div className="md:col-span-3">
                            <label htmlFor="title" className="block text-sm font-medium">{t('opportunities.modal.opportunityTitle')} <span className="text-red-500">*</span></label>
                            <input type="text" name="title" id="title" value={formState.title} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"/>
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium">{t('opportunities.modal.responsibleDepartment')} <span className="text-red-500">*</span></label>
                            <select name="department" id="department" value={formState.department} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                <option value="">{t('challenges.selectDepartment')}</option>
                                {departments.map(d => <option key={d.id} value={d.name.ar}>{d.name[language]}</option>)}
                            </select>
                            {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium">{t('opportunities.status')}</label>
                            <select name="status" id="status" value={formState.status} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                {/* FIX: Cast the result of t() to a record to prevent 'unknown' type errors. */}
                                {Object.keys(t('opportunities.statusOptions', {}) as Record<string, string>).map(key => <option key={key} value={key}>{t(`opportunities.statusOptions.${key}`)}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="currentSituation" className="block text-sm font-medium">{t('opportunities.modal.currentSituation')}</label>
                        <textarea name="currentSituation" id="currentSituation" value={formState.currentSituation} onChange={handleChange} rows={3} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"></textarea>
                    </div>
                     <div>
                        <label htmlFor="proposedSolution" className="block text-sm font-medium">{t('opportunities.modal.proposedSolution')}</label>
                        <textarea name="proposedSolution" id="proposedSolution" value={formState.proposedSolution} onChange={handleChange} rows={3} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"></textarea>
                    </div>
                    <LinkedTargetsSelector
                        departmentId={selectedDepartmentId}
                        value={formState.linkedTargetIds}
                        onChange={(ids) => setFormState(prev => ({...prev, linkedTargetIds: ids}))}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="effort" className="block text-sm font-medium">{t('challenges.modal.effort')}</label>
                            <select name="effort" id="effort" value={formState.effort} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                {effortOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="impact" className="block text-sm font-medium">{t('challenges.modal.impact')}</label>
                            <select name="impact" id="impact" value={formState.impact} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                {impactOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium">{t('challenges.modal.calculatedPriority')}</label>
                             <div className="group relative mt-1">
                                <div 
                                    aria-readonly="true"
                                    className="flex items-center justify-between w-full px-3 py-2 bg-natural-100 dark:bg-natural-900 border border-natural-300 dark:border-natural-600 rounded-md cursor-not-allowed text-sm font-semibold text-natural-700 dark:text-natural-300"
                                >
                                    <span>
                                        {/* FIX: Explicitly cast to string to prevent implicit symbol conversion error. */}
                                        {t(`challenges.priorityCategories.${String(formState.priority_category)}`)}
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-natural-200 dark:bg-natural-700 text-natural-600 dark:text-natural-400">
                                        {t('challenges.modal.auto')}
                                    </span>
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-natural-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                    {t('challenges.modal.priorityTooltip')}
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="owner" className="block text-sm font-medium">{t('opportunities.modal.owner')}</label>
                            <input type="text" name="owner" id="owner" value={formState.owner} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                        </div>
                        <div>
                           <label htmlFor="startDate" className="block text-sm font-medium">{t('opportunities.modal.startDate')}</label>
                            <input type="date" name="startDate" id="startDate" value={formState.startDate} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                        </div>
                        <div>
                           <label htmlFor="dueDate" className="block text-sm font-medium">{t('opportunities.modal.dueDate')}</label>
                            <input type="date" name="dueDate" id="dueDate" value={formState.dueDate} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end items-center p-4 mt-auto border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium rounded-md">{t('cancel')}</button>
                    <button onClick={handleSubmit} type="submit" className="ms-3 px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default AddOpportunityModal;