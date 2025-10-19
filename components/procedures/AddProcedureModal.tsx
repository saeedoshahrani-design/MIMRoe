import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, useMemo } from 'react';
import { Procedure } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { CloseIcon, PlusIcon, TrashIcon } from '../icons/IconComponents';
import { departments } from '../../data/mockData';
import { ProcedureFormData } from '../../context/ProceduresContext';
import { useDepartmentsData } from '../../context/DepartmentsDataContext';

interface ProcedureFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (procedureData: ProcedureFormData) => void;
    procedureToEdit: Procedure | null;
}

type FormState = Omit<ProcedureFormData, 'formsUsed' | 'definitions' | 'kpis'>;

const getInitialState = (): FormState => ({
    title: '',
    description: '',
    inputs: '',
    outputs: '',
    policiesAndReferences: '',
    technicalSystems: '',
    departmentId: '',
    linkedService: '',
    durationDays: undefined,
    eReadiness: 'not-electronic',
    linkedTaskIds: [],
    linkedTargetIds: [],
});

const fileTypes = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

// An auto-growing textarea component to handle dynamic height adjustment.
interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = (props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [props.value]);

    return (
        <textarea
            {...props}
            ref={textareaRef}
            className={`${props.className || ''} resize-none overflow-hidden`}
        />
    );
};

const ProcedureFormModal: React.FC<ProcedureFormModalProps> = ({ isOpen, onClose, onSave, procedureToEdit }) => {
    const { t, language } = useLocalization();
    const isEditMode = !!procedureToEdit;
    const { getDepartmentData } = useDepartmentsData();
    
    const [formData, setFormData] = useState<FormState>(getInitialState());
    const [forms, setForms] = useState<ProcedureFormData['formsUsed']>([]);
    const [definitions, setDefinitions] = useState<ProcedureFormData['definitions']>([]);
    
    const [errors, setErrors] = useState<{ title?: string; departmentId?: string; durationDays?: string; forms?: { [key: number]: { name?: string, file?: string } } }>({});

    const resetAndClose = useCallback(() => {
        setFormData(getInitialState());
        setForms([]);
        setDefinitions([]);
        setErrors({});
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            if (procedureToEdit) {
                setFormData({
                    title: procedureToEdit.title[language],
                    description: procedureToEdit.description[language],
                    inputs: procedureToEdit.inputs?.[language] || '',
                    outputs: procedureToEdit.outputs?.[language] || '',
                    policiesAndReferences: procedureToEdit.policiesAndReferences?.[language] || '',
                    technicalSystems: procedureToEdit.technicalSystems?.[language] || '',
                    departmentId: procedureToEdit.departmentId,
                    linkedService: procedureToEdit.linkedService?.[language] || '',
                    durationDays: procedureToEdit.durationDays,
                    eReadiness: procedureToEdit.eReadiness,
                    linkedTaskIds: procedureToEdit.linkedTaskIds || [],
                    linkedTargetIds: procedureToEdit.linkedTargetIds || [],
                });
                setForms(procedureToEdit.formsUsed?.map((f, i) => ({ id: i, name: f.name[language], file: null, existingFile: f.file })) || []);
                setDefinitions(procedureToEdit.definitions?.map(d => ({ id: d.id, term: d.term[language], definition: d.definition[language] })) || []);
            } else {
                setFormData(getInitialState());
                setForms([]);
                setDefinitions([]);
            }
            setErrors({});
        }
    }, [isOpen, procedureToEdit, language]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let processedValue: any = value;
        if (name === 'durationDays') {
            processedValue = value === '' ? undefined : parseInt(value, 10);
        }
        setFormData(prev => {
            const newState = { ...prev, [name]: processedValue };
            if (name === 'departmentId' && prev.departmentId !== value) {
                newState.linkedTaskIds = []; // Reset linked tasks when department changes
                newState.linkedTargetIds = []; // Reset linked targets when department changes
            }
            return newState;
        });
    };

    // FormsUsed Handlers
    const addForm = () => setForms(prev => [...prev, { id: Date.now(), name: '', file: null }]);
    const removeForm = (id: number) => setForms(prev => prev.filter(f => f.id !== id));
    const handleFormNameChange = (id: number, name: string) => setForms(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    const handleFileChange = (id: number, file: File | null) => setForms(prev => prev.map(f => f.id === id ? { ...f, file } : f));
    
    // Definitions Handlers
    const addDefinition = () => setDefinitions(prev => [...prev, { id: `def-${Date.now()}`, term: '', definition: '' }]);
    const removeDefinition = (id: string) => setDefinitions(prev => prev.filter(d => d.id !== id));
    const handleDefinitionChange = (id: string, field: 'term' | 'definition', value: string) => {
        setDefinitions(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const departmentData = useMemo(() => {
        if (!formData.departmentId) return { tasks: [], targets: [] };
        return getDepartmentData(formData.departmentId);
    }, [formData.departmentId, getDepartmentData]);

    const handleLinkedTaskChange = (taskId: string) => {
        setFormData(prev => {
            const newIds = prev.linkedTaskIds.includes(taskId)
                ? prev.linkedTaskIds.filter(id => id !== taskId)
                : [...prev.linkedTaskIds, taskId];
            return { ...prev, linkedTaskIds: newIds };
        });
    };

    const handleLinkedTargetChange = (targetId: string) => {
        setFormData(prev => {
            const newIds = prev.linkedTargetIds.includes(targetId)
                ? prev.linkedTargetIds.filter(id => id !== targetId)
                : [...prev.linkedTargetIds, targetId];
            return { ...prev, linkedTargetIds: newIds };
        });
    };

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!formData.title.trim()) newErrors.title = t('procedures.validation.nameRequired');
        if (!formData.departmentId) newErrors.departmentId = t('procedures.validation.departmentRequired');
        if (formData.durationDays !== undefined && (isNaN(formData.durationDays) || formData.durationDays < 0)) newErrors.durationDays = "Must be a positive number.";
        
        const formErrors: { [key: number]: { name?: string, file?: string } } = {};
        forms.forEach(form => {
            if (!form.name.trim()) {
                if (!formErrors[form.id]) formErrors[form.id] = {};
                formErrors[form.id].name = t('challenges.modal.validation.required');
            }
            if (!form.file && !form.existingFile) {
                 if (!formErrors[form.id]) formErrors[form.id] = {};
                formErrors[form.id].file = t('challenges.modal.validation.required');
            }
        });
        if (Object.keys(formErrors).length > 0) newErrors.forms = formErrors;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            // Preserve existing KPIs if in edit mode, as they are now managed separately.
            const existingKpis = procedureToEdit?.kpis?.map(k => ({
                id: k.id,
                name: k.name[language],
                target: k.target[language],
                description: k.description[language]
            })) || [];
            onSave({ ...formData, formsUsed: forms, definitions, kpis: existingKpis });
        }
    };
    
    if (!isOpen) return null;

    const modalTitle = isEditMode ? t('procedures.editProcedure') : t('procedures.addProcedure');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={resetAndClose}>
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={resetAndClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2 mb-3">Basic Information</h3>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">{t('procedures.procedureName')} <span className="text-red-500">*</span></label>
                        <input id="title" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                     <div>
                        <label htmlFor="departmentId" className="block text-sm font-medium mb-1">{t('procedures.owningDepartment')} <span className="text-red-500">*</span></label>
                        <select id="departmentId" name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600">
                            <option value="">{t('challenges.selectDepartment')}</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name[language]}</option>)}
                        </select>
                        {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
                    </div>
                    
                    {departmentData.tasks.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('procedures.linkedTasks')}</label>
                            <div className="mt-1 border border-natural-200 dark:border-natural-700 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                {departmentData.tasks.map(task => (
                                    <label key={task.id} htmlFor={`task-${task.id}`} className="flex items-center p-2 rounded-md hover:bg-natural-100 dark:hover:bg-natural-800 cursor-pointer">
                                        <input type="checkbox" id={`task-${task.id}`} checked={formData.linkedTaskIds.includes(task.id)} onChange={() => handleLinkedTaskChange(task.id)} className="h-4 w-4 rounded border-natural-300 text-dark-purple-600 focus:ring-dark-purple-500" />
                                        <span className="ms-3 text-sm text-natural-700 dark:text-natural-200">{task.description}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {departmentData.targets.length > 0 && (
                         <div>
                            <label className="block text-sm font-medium mb-1">{t('procedures.linkedTargets')}</label>
                            <div className="mt-1 border border-natural-200 dark:border-natural-700 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                {departmentData.targets.map(target => (
                                    <label key={target.id} htmlFor={`target-${target.id}`} className="flex items-center p-2 rounded-md hover:bg-natural-100 dark:hover:bg-natural-800 cursor-pointer">
                                        <input type="checkbox" id={`target-${target.id}`} checked={formData.linkedTargetIds.includes(target.id)} onChange={() => handleLinkedTargetChange(target.id)} className="h-4 w-4 rounded border-natural-300 text-dark-purple-600 focus:ring-dark-purple-500" />
                                        <span className="ms-3 text-sm text-natural-700 dark:text-natural-200">{target.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                     <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">{t('procedures.description')}</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                    <div>
                        <label htmlFor="inputs" className="block text-sm font-medium mb-1">{t('procedures.inputs')}</label>
                        <textarea id="inputs" name="inputs" value={formData.inputs} onChange={handleChange} rows={3} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                    <div>
                        <label htmlFor="outputs" className="block text-sm font-medium mb-1">{t('procedures.outputs')}</label>
                        <textarea id="outputs" name="outputs" value={formData.outputs} onChange={handleChange} rows={3} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="durationDays" className="block text-sm font-medium mb-1">{t('procedures.duration')} ({t('departments.targets.unitOptions.days')})</label>
                            <input id="durationDays" name="durationDays" type="number" min="0" value={formData.durationDays ?? ''} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" />
                            {errors.durationDays && <p className="text-red-500 text-xs mt-1">{errors.durationDays}</p>}
                        </div>
                        <div>
                           <label htmlFor="linkedService" className="block text-sm font-medium mb-1">{t('procedures.relatedService')}</label>
                            <input id="linkedService" name="linkedService" value={formData.linkedService} onChange={handleChange} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" />
                        </div>
                    </div>
                    
                    <h3 className="text-base font-semibold border-b pb-2 mb-3 pt-4">Details</h3>
                    <div>
                        <label htmlFor="policiesAndReferences" className="block text-sm font-medium mb-1">{t('procedures.policiesAndReferences')}</label>
                        <textarea id="policiesAndReferences" name="policiesAndReferences" value={formData.policiesAndReferences || ''} onChange={handleChange} rows={3} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                    <div>
                        <label htmlFor="technicalSystems" className="block text-sm font-medium mb-1">{t('procedures.technicalSystems')}</label>
                        <textarea id="technicalSystems" name="technicalSystems" value={formData.technicalSystems || ''} onChange={handleChange} rows={3} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">{t('procedures.eReadiness')}</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {Object.entries(t('procedures.eReadinessOptions')).map(([key, value]) => (
                                <div key={key} className="flex items-center">
                                    <input type="radio" id={`eReadiness-${key}`} name="eReadiness" value={key} checked={formData.eReadiness === key} onChange={handleChange} className="h-4 w-4 text-dark-purple-600 focus:ring-dark-purple-500 border-natural-300" />
                                    <label htmlFor={`eReadiness-${key}`} className="ms-2 text-sm text-natural-700 dark:text-natural-200">{value as string}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Forms Used */}
                    <div className="pt-2">
                        <h3 className="text-sm font-semibold mb-2">{t('procedures.formsUsed')}</h3>
                        <div className="space-y-3">
                            {forms.map((form) => (
                                <div key={form.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-md dark:border-natural-700 items-end">
                                    <div>
                                        <label htmlFor={`formName-${form.id}`} className="block text-xs font-medium mb-1">{t('procedures.formName')}</label>
                                        <input id={`formName-${form.id}`} value={form.name} onChange={(e) => handleFormNameChange(form.id, e.target.value)} className="w-full p-2 text-sm bg-white dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"/>
                                        {errors.forms?.[form.id]?.name && <p className="text-red-500 text-xs mt-1">{errors.forms[form.id].name}</p>}
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow">
                                            <label htmlFor={`formFile-${form.id}`} className="block text-xs font-medium mb-1">{t('procedures.formFile')}</label>
                                            <input type="file" id={`formFile-${form.id}`} onChange={(e) => handleFileChange(form.id, e.target.files ? e.target.files[0] : null)} className="w-full text-xs text-natural-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-purple-100 file:text-dark-purple-700 hover:file:bg-dark-purple-200" accept={fileTypes} />
                                            {form.existingFile && !form.file && <div className="text-xs text-natural-500 mt-1 truncate">Current: {form.existingFile.name}</div>}
                                            {errors.forms?.[form.id]?.file && <p className="text-red-500 text-xs mt-1">{errors.forms[form.id].file}</p>}
                                        </div>
                                        <button type="button" onClick={() => removeForm(form.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addForm} className="mt-2 text-sm font-semibold text-dark-purple-600 dark:text-dark-purple-400 hover:underline flex items-center gap-1"><PlusIcon className="w-4 h-4"/>{t('procedures.addForm')}</button>
                    </div>

                    {/* Definitions */}
                    <div className="pt-2">
                         <h3 className="text-sm font-semibold mb-2">{t('procedures.definitions')}</h3>
                         <div className="space-y-3">
                            {definitions.map(def => (
                                <div key={def.id} className="flex items-start gap-2 p-3 border rounded-md dark:border-natural-700">
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor={`term-${def.id}`} className="block text-xs font-medium mb-1">{t('procedures.term')}</label>
                                            <AutoGrowTextarea id={`term-${def.id}`} value={def.term} onChange={e => handleDefinitionChange(def.id, 'term', e.target.value)} rows={1} className="w-full p-2 text-sm bg-white dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"/>
                                        </div>
                                        <div>
                                            <label htmlFor={`definition-${def.id}`} className="block text-xs font-medium mb-1">{t('procedures.definition')}</label>
                                            <AutoGrowTextarea id={`definition-${def.id}`} value={def.definition} onChange={e => handleDefinitionChange(def.id, 'definition', e.target.value)} rows={1} className="w-full p-2 text-sm bg-white dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"/>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeDefinition(def.id)} className="mt-6 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                         </div>
                         <button type="button" onClick={addDefinition} className="mt-2 text-sm font-semibold text-dark-purple-600 dark:text-dark-purple-400 hover:underline flex items-center gap-1"><PlusIcon className="w-4 h-4"/>{t('procedures.addDefinition')}</button>
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 mt-auto border-t dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50">
                    <button onClick={resetAndClose} className="px-4 py-2 text-sm rounded-md">{t('cancel')}</button>
                    <button onClick={handleSubmit} className="ms-3 px-4 py-2 text-sm text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default ProcedureFormModal;