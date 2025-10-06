import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { TimelineTask, Challenge } from '../../types';
import { CloseIcon, PencilIcon, TrashIcon } from '../icons/IconComponents';
import { departments } from '../../data/mockData';
import { locales } from '../../i18n/locales';

type ManualTaskData = Omit<TimelineTask, 'id' | 'seq' | 'source'>;

interface ManualTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: ManualTaskData) => void;
    onDelete: (taskId: string) => void;
    taskToManage: TimelineTask | null;
}

const getInitialState = (): ManualTaskData => ({
    title: '',
    description: '',
    department: '',
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    actual_percent: 0,
    planned_percent_today: 0,
    status: 'جديد',
});

type Errors = { [key in keyof Pick<ManualTaskData, 'title' | 'end'>]?: string };

const ManualTaskModal: React.FC<ManualTaskModalProps> = ({ isOpen, onClose, onSave, onDelete, taskToManage }) => {
    const { t, language, formatDate } = useLocalization();
    const isEditMode = !!taskToManage;

    const [viewMode, setViewMode] = useState<'view' | 'edit'>(isEditMode ? 'view' : 'edit');
    const [formState, setFormState] = useState<ManualTaskData>(getInitialState());
    const [errors, setErrors] = useState<Errors>({});

    useEffect(() => {
        if (isOpen) {
            if (taskToManage) {
                setFormState({
                    title: taskToManage.title,
                    description: taskToManage.description || '',
                    department: taskToManage.department || '',
                    start: new Date(taskToManage.start).toISOString().split('T')[0],
                    end: new Date(taskToManage.end).toISOString().split('T')[0],
                    actual_percent: taskToManage.actual_percent,
                    planned_percent_today: taskToManage.planned_percent_today,
                    status: taskToManage.status,
                });
                setViewMode('view');
            } else {
                setFormState(getInitialState());
                setViewMode('edit');
            }
            setErrors({});
        }
    }, [isOpen, taskToManage]);

    const validate = (): boolean => {
        const newErrors: Errors = {};
        if (!formState.title.trim()) {
            newErrors.title = t('timeline.validation.nameRequired');
        }
        if (new Date(formState.end) < new Date(formState.start)) {
            newErrors.end = t('timeline.validation.endDateAfterStart');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: (name === 'actual_percent' || name === 'planned_percent_today') ? Number(value) : value,
        }));
    };

    if (!isOpen) return null;

    const modalTitle = isEditMode
        ? (viewMode === 'view' ? t('timeline.detailsModalTitle') : t('timeline.editModalTitle'))
        : t('timeline.addModalTitle');

    const statusOptions = Object.values(locales[language].challenges.statusOptions);
    const departmentOptions = departments.map(d => ({ value: d.name.ar, label: d.name[language] }));

    const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-natural-500 dark:text-natural-400">{label}</p>
            <p className="font-medium mt-1">{value || '-'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {viewMode === 'view' && taskToManage ? (
                    <div className="p-6 overflow-y-auto space-y-4">
                        <h3 className="text-xl font-bold">{taskToManage.title}</h3>
                        {taskToManage.description && <p className="whitespace-pre-wrap">{taskToManage.description}</p>}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-natural-200 dark:border-natural-700">
                            <DetailItem label={t('challenges.status')} value={taskToManage.status} />
                            <DetailItem label={t('challenges.modal.department')} value={taskToManage.department} />
                             <DetailItem label={t('challenges.actualProgress')} value={`${taskToManage.actual_percent}%`} />
                            <DetailItem label={t('challenges.startDate')} value={formatDate(taskToManage.start)} />
                            <DetailItem label={t('challenges.targetDate')} value={formatDate(taskToManage.end)} />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium">{t('timeline.taskName')} <span className="text-red-500">*</span></label>
                            <input type="text" name="title" id="title" value={formState.title} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md" />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium">{t('timeline.taskDescription')}</label>
                            <textarea name="description" id="description" value={formState.description} onChange={handleChange} rows={3} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium">{t('challenges.modal.department')}</label>
                                <select name="department" id="department" value={formState.department} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                    <option value="">{t('challenges.selectDepartment')}</option>
                                    {departmentOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium">{t('challenges.status')}</label>
                                <select name="status" id="status" value={formState.status} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md">
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start" className="block text-sm font-medium">{t('challenges.startDate')}</label>
                                <input type="date" name="start" id="start" value={formState.start as string} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                            </div>
                            <div>
                                <label htmlFor="end" className="block text-sm font-medium">{t('challenges.targetDate')}</label>
                                <input type="date" name="end" id="end" value={formState.end as string} onChange={handleChange} className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md"/>
                                {errors.end && <p className="text-red-500 text-xs mt-1">{errors.end}</p>}
                            </div>
                        </div>
                         <div>
                            <label htmlFor="actual_percent" className="block text-sm font-medium">{t('challenges.actualProgress')} (%)</label>
                            <input type="range" name="actual_percent" id="actual_percent" min="0" max="100" value={formState.actual_percent} onChange={handleChange} className="mt-1 w-full" />
                            <div className="text-center text-sm">{formState.actual_percent}%</div>
                        </div>
                    </form>
                )}

                <div className="flex justify-between items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg">
                    {isEditMode && viewMode === 'view' ? (
                        <div>
                            <button onClick={() => onDelete(taskToManage!.id)} type="button" className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ) : <div></div>}
                    <div className="flex gap-3">
                        <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-natural-700 dark:text-natural-200 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md hover:bg-natural-50 dark:hover:bg-natural-600">
                            {t('cancel')}
                        </button>
                        {viewMode === 'view' ? (
                             <button onClick={() => setViewMode('edit')} type="button" className="px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">
                                {t('edit')}
                            </button>
                        ) : (
                             <button onClick={handleSubmit} type="button" className="px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">
                                {t('save')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualTaskModal;