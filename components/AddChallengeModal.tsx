import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Challenge, Activity } from '../types';
import { departments } from '../data/mockData';
import { CloseIcon } from './icons/IconComponents';
import { locales } from '../i18n/locales';
import UnifiedProgressBar from './UnifiedProgressBar';
import { calculateProgress } from '../utils/calculateProgress';
import { calculatePlannedProgress, getPerformanceStatus } from '../utils/calculatePlannedProgress';
import LinkedTargetsSelector from './departments/LinkedTargetsSelector';
import { useChallenges } from '../context/ChallengesContext';
import { generateNextChallengeCode } from '../utils/challengeUtils';
import { computePriorityDetails, PriorityValue } from '../utils/priority';

interface AddChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (challenge: Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'> & { id?: string }) => void;
    challengeToEdit: Challenge | null;
}

interface ActivityWithId extends Activity {
    id: string;
}

const getInitialState = () => {
    const defaultPriority = computePriorityDetails('متوسط', 'متوسط');
    return {
        code: '',
        title_ar: '',
        title_en: '',
        description: '',
        status: 'جديد' as Challenge['status'],
        priority: defaultPriority.legacyPriority,
        category: 'تشغيلي' as Challenge['category'],
        impact: 'متوسط' as Challenge['impact'],
        effort: 'متوسط' as Challenge['effort'],
        priority_category: defaultPriority.categoryKey,
        priority_score: defaultPriority.score,
        progress_notes: '',
        remediation_plan: '',
        requirements_enablers: '',
        activities: [] as ActivityWithId[],
        department: '',
        start_date: '',
        target_date: '',
        linkedTargetIds: [] as string[],
    };
};

type FormState = ReturnType<typeof getInitialState>;
type Errors = {
    [key in keyof Omit<FormState, 'code' | 'created_at' | 'updated_at' | 'priority' | 'priority_category' | 'priority_score'>]?: string | { [key: number]: { [key: string]: string } }
};


interface FormFieldProps {
    label: string;
    name: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, name, required = false, error, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-natural-700 dark:text-natural-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">{children}</div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);


const AddChallengeModal: React.FC<AddChallengeModalProps> = ({ isOpen, onClose, onSave, challengeToEdit }) => {
    const { t, language } = useLocalization();
    const { challenges } = useChallenges();
    const isEditMode = !!challengeToEdit;
    
    const [formState, setFormState] = useState(getInitialState());
    const [errors, setErrors] = useState<Errors>({});

    const actualProgress = useMemo(() => calculateProgress(formState.activities), [formState.activities]);
    const plannedProgress = useMemo(() => calculatePlannedProgress(formState.start_date, formState.target_date), [formState.start_date, formState.target_date]);
    const performanceStatus = useMemo(() => getPerformanceStatus(actualProgress, plannedProgress), [actualProgress, plannedProgress]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormState(prev => {
            const newState = { ...prev };
            let shouldUpdatePriority = false;

            switch (name) {
                case 'status':
                    newState.status = value as Challenge['status'];
                    break;
                case 'category':
                    newState.category = value as Challenge['category'];
                    break;
                case 'impact':
                    newState.impact = value as Challenge['impact'];
                    shouldUpdatePriority = true;
                    break;
                case 'effort':
                    newState.effort = value as Challenge['effort'];
                    shouldUpdatePriority = true;
                    break;
                case 'department':
                    newState.department = value;
                    if (prev.department !== value) {
                        newState.linkedTargetIds = [];
                    }
                    break;
                default:
                    (newState as any)[name] = value;
                    break;
            }

            if (shouldUpdatePriority) {
                const { categoryKey, score, legacyPriority } = computePriorityDetails(newState.effort, newState.impact);
                newState.priority_category = categoryKey;
                newState.priority_score = score;
                newState.priority = legacyPriority;
            }

            return newState;
        });
    };

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && challengeToEdit) {
                 setFormState({
                    code: challengeToEdit.code,
                    title_ar: challengeToEdit.title_ar,
                    title_en: challengeToEdit.title_en,
                    description: challengeToEdit.description,
                    status: challengeToEdit.status,
                    priority: challengeToEdit.priority,
                    category: challengeToEdit.category,
                    impact: challengeToEdit.impact,
                    effort: challengeToEdit.effort,
                    priority_category: challengeToEdit.priority_category,
                    priority_score: challengeToEdit.priority_score,
                    progress_notes: challengeToEdit.progress_notes,
                    remediation_plan: challengeToEdit.remediation_plan,
                    requirements_enablers: challengeToEdit.requirements_enablers,
                    department: challengeToEdit.department,
                    start_date: challengeToEdit.start_date,
                    target_date: challengeToEdit.target_date,
                    activities: challengeToEdit.activities.map((act, i) => ({...act, id: `act-${i}-${Date.now()}`})),
                    linkedTargetIds: challengeToEdit.linkedTargetIds || [],
                 });
            } else {
                setFormState({ ...getInitialState(), code: generateNextChallengeCode(challenges) });
            }
            setErrors({});
        }
    }, [isOpen, challengeToEdit, isEditMode, challenges, t]);

    const validate = (): boolean => {
        const newErrors: Errors = {};
        const requiredFields: (keyof Omit<FormState, 'code' | 'created_at' | 'updated_at' | 'priority' | 'priority_category' | 'priority_score'>)[] = ['title_ar', 'title_en', 'description', 'status', 'category', 'impact', 'effort', 'department', 'start_date', 'target_date'];
        
        requiredFields.forEach(field => {
            if (!formState[field as keyof typeof formState]) {
                newErrors[field as keyof Errors] = t('challenges.modal.validation.required');
            }
        });

        if (formState.start_date && formState.target_date && formState.start_date > formState.target_date) {
            newErrors.target_date = t('challenges.modal.validation.invalidDates');
        }
        
        const activityErrors: { [key: number]: { [key: string]: string } } = {};
        formState.activities.forEach((activity, index) => {
            if (!activity.description) {
                if (!activityErrors[index]) activityErrors[index] = {};
                activityErrors[index].description = t('challenges.modal.validation.required');
            }
            if (!activity.weight || activity.weight < 1 || activity.weight > 5) {
                if (!activityErrors[index]) activityErrors[index] = {};
                activityErrors[index].weight = t('challenges.modal.validation.weightRange');
            }
        });
        if (Object.keys(activityErrors).length > 0) {
            newErrors.activities = activityErrors;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const { code, ...restOfForm } = formState;
            const challengeData = {
                ...restOfForm,
                activities: restOfForm.activities.map(({ id, ...rest }) => rest)
            };
            onSave({ ...challengeData, id: challengeToEdit?.id });
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newErrors: Errors = { ...errors };

        if (!value && ['title_ar', 'title_en', 'description', 'department', 'start_date', 'target_date', 'effort', 'impact'].includes(name)) {
            newErrors[name as keyof Errors] = t('challenges.modal.validation.required');
        } else {
            delete newErrors[name as keyof Errors];
        }

        if (name === 'start_date' || name === 'target_date') {
            const startDate = name === 'start_date' ? value : formState.start_date;
            const targetDate = name === 'target_date' ? value : formState.target_date;
            if (startDate && targetDate && startDate > targetDate) {
                newErrors.target_date = t('challenges.modal.validation.invalidDates');
            } else if (errors.target_date === t('challenges.modal.validation.invalidDates')) {
                 delete newErrors.target_date;
            }
        }
        setErrors(newErrors);
    };

    const handleActivityChange = (id: string, field: keyof Activity, value: string | number | boolean) => {
        setFormState(prev => ({
            ...prev,
            activities: prev.activities.map(activity => {
                if (activity.id === id) {
                    let updatedValue: string | number | boolean = value;
                    if (field === 'weight') {
                         updatedValue = Number(value) as Activity['weight'];
                    }
                    return { ...activity, [field]: updatedValue };
                }
                return activity;
            })
        }));
    };
    
    const addActivity = () => {
        setFormState(prev => ({
            ...prev,
            activities: [...prev.activities, { id: `act-${Date.now()}`, description: '', weight: 1, is_completed: false}]
        }));
    };

    const removeActivity = (id: string) => {
        setFormState(prev => ({
            ...prev,
            activities: prev.activities.filter((act) => act.id !== id)
        }));
    };

    if (!isOpen) return null;

    const getError = (field: keyof FormState): string | undefined => {
        const error = errors[field as keyof Errors];
        return typeof error === 'string' ? error : undefined;
    };
    
    const statusOptions = Object.values(locales[language].challenges.statusOptions);
    const categoryOptions = Object.values(locales[language].challenges.categoryOptions);
    const impactOptions = Object.entries(locales[language].challenges.impactOptions).map(([key, value]) => ({ key: Object.values(locales.ar.challenges.impactOptions)[Object.keys(locales.en.challenges.impactOptions).indexOf(key)], value }));
    const effortOptions = Object.entries(locales[language].challenges.effortOptions).map(([key, value]) => ({ key: Object.values(locales.ar.challenges.effortOptions)[Object.keys(locales.en.challenges.effortOptions).indexOf(key)], value }));
    const modalTitle = isEditMode ? t('challenges.modal.editTitle') : t('challenges.modal.addTitle');

    const selectedDepartmentId = departments.find(d => d.name.ar === formState.department)?.id || null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <FormField label={t('challenges.modal.challengeCode')} name="code">
                            <input type="text" id="code" name="code" value={formState.code} readOnly disabled className="w-full bg-natural-100 dark:bg-natural-900 border-natural-300 dark:border-natural-600 rounded-md cursor-not-allowed"/>
                        </FormField>
                        <FormField label={t('challenges.modal.title_ar')} name="title_ar" required error={getError('title_ar')}>
                             <input type="text" id="title_ar" name="title_ar" value={formState.title_ar} onChange={handleChange} onBlur={handleBlur} dir="rtl" className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"/>
                        </FormField>
                         <FormField label={t('challenges.modal.title_en')} name="title_en" required error={getError('title_en')}>
                             <input type="text" id="title_en" name="title_en" value={formState.title_en} onChange={handleChange} onBlur={handleBlur} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"/>
                        </FormField>
                    </div>

                    <FormField label={t('challenges.modal.description')} name="description" required error={getError('description')}>
                        <textarea id="description" name="description" value={formState.description} onChange={handleChange} onBlur={handleBlur} rows={3} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"></textarea>
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label={t('challenges.modal.department')} name="department" required error={getError('department')}>
                            <select id="department" name="department" value={formState.department} onChange={handleChange} onBlur={handleBlur} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                <option value="">{t('challenges.selectDepartment')}</option>
                                {departments.map(d => <option key={d.id} value={d.name.ar}>{d.name[language]}</option>)}
                            </select>
                        </FormField>
                        <FormField label={t('challenges.status')} name="status" required error={getError('status')}>
                            <select id="status" name="status" value={formState.status} onChange={handleChange} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        <FormField label={t('challenges.category')} name="category" required error={getError('category')}>
                           <select id="category" name="category" value={formState.category} onChange={handleChange} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                               {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                    </div>

                    <LinkedTargetsSelector
                        departmentId={selectedDepartmentId}
                        value={formState.linkedTargetIds}
                        onChange={(ids) => setFormState(prev => ({...prev, linkedTargetIds: ids}))}
                    />

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField label={t('challenges.modal.effort')} name="effort" required error={getError('effort')}>
                            <select id="effort" name="effort" value={formState.effort} onChange={handleChange} onBlur={handleBlur} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                               {effortOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
                            </select>
                        </FormField>
                         <FormField label={t('challenges.modal.impact')} name="impact" required error={getError('impact')}>
                            <select id="impact" name="impact" value={formState.impact} onChange={handleChange} onBlur={handleBlur} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                               {impactOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
                            </select>
                        </FormField>
                         <FormField label={t('challenges.modal.calculatedPriority')} name="priority_category">
                             <div className="group relative">
                                <div 
                                    aria-readonly="true"
                                    className="flex items-center justify-between w-full px-3 py-2 bg-natural-100 dark:bg-natural-900 border border-natural-300 dark:border-natural-600 rounded-md cursor-not-allowed text-sm font-semibold text-natural-700 dark:text-natural-300"
                                >
                                    <span>
                                        {t(`challenges.priorityCategories.${formState.priority_category as keyof typeof locales.en.challenges.priorityCategories}`)}
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-natural-200 dark:bg-natural-700 text-natural-600 dark:text-natural-400">
                                        {t('challenges.modal.auto')}
                                    </span>
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-natural-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                    {t('challenges.modal.priorityTooltip')}
                                </div>
                            </div>
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={t('challenges.modal.progress_notes')} name="progress_notes" error={getError('progress_notes')}>
                            <textarea id="progress_notes" name="progress_notes" value={formState.progress_notes} onChange={handleChange} onBlur={handleBlur} rows={3} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"></textarea>
                        </FormField>
                         <FormField label={t('challenges.modal.remediation_plan')} name="remediation_plan" error={getError('remediation_plan')}>
                            <textarea id="remediation_plan" name="remediation_plan" value={formState.remediation_plan} onChange={handleChange} onBlur={handleBlur} rows={3} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"></textarea>
                        </FormField>
                    </div>
                    <FormField label={t('challenges.modal.requirements_enablers')} name="requirements_enablers" error={getError('requirements_enablers')}>
                        <textarea id="requirements_enablers" name="requirements_enablers" value={formState.requirements_enablers} onChange={handleChange} onBlur={handleBlur} rows={3} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md break-words"></textarea>
                    </FormField>

                    {/* Dynamic Activities */}
                    <div>
                        <h3 className="text-sm font-medium text-natural-700 dark:text-natural-300 mb-2">{t('challenges.modal.activities')}</h3>
                        
                         <div className="my-3 p-3 bg-natural-100 dark:bg-natural-700/50 rounded-md">
                            <UnifiedProgressBar
                                actualProgress={actualProgress}
                                plannedProgress={plannedProgress}
                                status={performanceStatus}
                                startDate={formState.start_date}
                                targetDate={formState.target_date}
                            />
                        </div>

                        <div className="mt-2 space-y-3">
                            {formState.activities.map((activity, index) => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-md border-natural-200 dark:border-natural-700">
                                    <div className="flex-shrink-0 pt-7">
                                        <input
                                            type="checkbox"
                                            id={`activityCompleted-${activity.id}`}
                                            checked={activity.is_completed}
                                            onChange={(e) => handleActivityChange(activity.id, 'is_completed', e.target.checked)}
                                            aria-label={activity.is_completed ? t('challenges.modal.unmarkActivity') : t('challenges.modal.markActivityCompleted')}
                                            className="h-4 w-4 rounded border-gray-300 text-dark-purple-600 focus:ring-dark-purple-500"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col sm:flex-row gap-3 rtl:sm:flex-row-reverse">
                                        <div className="flex-1">
                                            <label htmlFor={`activityDescription-${activity.id}`} className="block text-xs font-medium text-natural-600 dark:text-natural-400 mb-1">{t('challenges.modal.activityDescription')}</label>
                                            <input 
                                                type="text" 
                                                id={`activityDescription-${activity.id}`} 
                                                placeholder={t('challenges.modal.activityDescription')} 
                                                value={activity.description} 
                                                onChange={(e) => handleActivityChange(activity.id, 'description', e.target.value)} 
                                                className={`w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md text-sm p-2 transition-colors break-words ${activity.is_completed ? 'line-through text-natural-500' : ''}`}
                                            />
                                            {(errors.activities as any)?.[index]?.description && <p className="text-red-500 text-xs mt-1">{(errors.activities as any)[index].description}</p>}
                                        </div>
                                        <div className="w-full sm:w-40">
                                            <label htmlFor={`activityWeight-${activity.id}`} className="block text-xs font-medium text-natural-600 dark:text-natural-400 mb-1">{t('challenges.modal.activityWeightLabel')}</label>
                                            <select id={`activityWeight-${activity.id}`} value={activity.weight} onChange={(e) => handleActivityChange(activity.id, 'weight', e.target.value)} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md text-sm p-2">
                                                <option value={1}>1</option>
                                                <option value={2}>2</option>
                                                <option value={3}>3</option>
                                                <option value={4}>4</option>
                                                <option value={5}>5</option>
                                            </select>
                                            {(errors.activities as any)?.[index]?.weight && <p className="text-red-500 text-xs mt-1">{(errors.activities as any)[index].weight}</p>}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeActivity(activity.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md mt-[22px]">
                                        <span className="sr-only">{t('challenges.modal.remove')}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                         <button type="button" onClick={addActivity} className="mt-2 px-3 py-1 text-sm text-dark-purple-600 dark:text-dark-purple-400 border border-dashed border-dark-purple-400 rounded-md hover:bg-dark-purple-50 dark:hover:bg-dark-purple-900/50">
                            + {t('challenges.modal.addActivity')}
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={t('challenges.startDate')} name="start_date" required error={getError('start_date')}>
                             <input type="date" id="start_date" name="start_date" value={formState.start_date} onChange={handleChange} onBlur={handleBlur} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                        </FormField>
                         <FormField label={t('challenges.targetDate')} name="target_date" required error={getError('target_date')}>
                             <input type="date" id="target_date" name="target_date" value={formState.target_date} onChange={handleChange} onBlur={handleBlur} className="w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                        </FormField>
                    </div>

                </form>

                <div className="flex justify-end items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-natural-700 dark:text-natural-200 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md hover:bg-natural-50 dark:hover:bg-natural-600">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSubmit} type="button" className="ms-3 px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 border border-transparent rounded-md shadow-sm hover:bg-dark-purple-700">
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddChallengeModal;