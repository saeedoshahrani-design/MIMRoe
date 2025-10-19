import React, { useState, useMemo, useEffect } from 'react';
import { Procedure, ProcedureStep } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import Card from '../Card';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '../icons/IconComponents';
import { useEmployeeContext } from '../../context/EmployeeContext';
import { departments } from '../../data/mockData';

interface ProcedureStepsTabProps {
    procedure: Procedure;
    updateProcedurePartial: (id: string, data: Partial<Omit<Procedure, 'id'>>) => Promise<void>;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

const getInitialStep = (): Omit<ProcedureStep, 'id'> => ({
    stepName: '',
    description: '',
    department: '',
    responsible: '',
    durationHours: 0,
    waitHours: 0,
    waitDays: 0,
    systemUsed: '',
});

const ProcedureStepsTab: React.FC<ProcedureStepsTabProps> = ({ procedure, updateProcedurePartial, setToast }) => {
    const { t, language } = useLocalization();
    const { employees } = useEmployeeContext();
    const [localSteps, setLocalSteps] = useState<ProcedureStep[]>(procedure.steps || []);
    const [editingStepId, setEditingStepId] = useState<string | null>(null);

    useEffect(() => {
        if (!editingStepId) {
            setLocalSteps(procedure.steps || []);
        }
    }, [procedure.steps, editingStepId]);

    const handleAddStep = () => {
        const newStep: ProcedureStep = {
            id: `step-${Date.now()}`,
            ...getInitialStep(),
        };
        setLocalSteps(prev => [...prev, newStep]);
        setEditingStepId(newStep.id);
    };

    const handleUpdateStep = (id: string, field: keyof ProcedureStep, value: string | number) => {
        setLocalSteps(prev => prev.map(step => step.id === id ? { ...step, [field]: value } : step));
    };

    const handleDeleteStep = async (id: string) => {
        const updatedSteps = localSteps.filter(step => step.id !== id);
        try {
            await updateProcedurePartial(procedure.id, { steps: updatedSteps });
            setLocalSteps(updatedSteps);
            setToast({ message: t('procedures.notifications.deleteSuccess'), type: 'success' });
        } catch (error) {
            console.error("Failed to delete step:", error);
            setToast({ message: 'Failed to delete step.', type: 'info' });
        }
    };
    
    const handleSaveStep = async () => {
        try {
            await updateProcedurePartial(procedure.id, { steps: localSteps });
            setEditingStepId(null);
            setToast({ message: t('procedures.notifications.updateSuccess'), type: 'success' });
        } catch (error) {
            console.error("Failed to save step:", error);
            setToast({ message: 'Failed to save step.', type: 'info' });
        }
    };

    const handleCancelEdit = (id: string) => {
        const originalStep = (procedure.steps || []).find(s => s.id === id);
        if (originalStep) {
            setLocalSteps(prev => prev.map(s => s.id === id ? originalStep : s));
        } else {
            setLocalSteps(prev => prev.filter(s => s.id !== id));
        }
        setEditingStepId(null);
    };
    
    const departmentOptions = useMemo(() => departments.map(d => d.name[language]), [language]);
    const responsibleOptions = useMemo(() => {
        const uniqueTitles = new Set(employees.map(e => e.title[language]));
        return Array.from(uniqueTitles);
    }, [employees, language]);
    
    const systemOptions = Object.values(t('procedures.details.steps.systems', {}) as Record<string, string>);

    const renderEditableRow = (step: ProcedureStep) => (
        <tr key={step.id} className="bg-natural-50 dark:bg-natural-800">
            <td className="p-2 align-top text-center">{localSteps.findIndex(s => s.id === step.id) + 1}</td>
            <td className="p-2 align-top"><input type="text" value={step.stepName} onChange={e => handleUpdateStep(step.id, 'stepName', e.target.value)} className="w-full bg-white dark:bg-natural-700 p-1 rounded" /></td>
            <td className="p-2 align-top"><textarea value={step.description} onChange={e => handleUpdateStep(step.id, 'description', e.target.value)} className="w-full bg-white dark:bg-natural-700 p-1 rounded" rows={2}></textarea></td>
            <td className="p-2 align-top"><input list="depts" value={step.department} onChange={e => handleUpdateStep(step.id, 'department', e.target.value)} className="w-full bg-white dark:bg-natural-700 p-1 rounded" placeholder={t('procedures.details.steps.orEnterCustom')} /></td>
            <td className="p-2 align-top"><input list="resps" value={step.responsible} onChange={e => handleUpdateStep(step.id, 'responsible', e.target.value)} className="w-full bg-white dark:bg-natural-700 p-1 rounded" placeholder={t('procedures.details.steps.orEnterCustom')} /></td>
            <td className="p-2 align-top"><input type="number" value={step.durationHours} onChange={e => handleUpdateStep(step.id, 'durationHours', Number(e.target.value))} className="w-20 bg-white dark:bg-natural-700 p-1 rounded" min="0" /></td>
            <td className="p-2 align-top">
                <div className="flex gap-1">
                    <input type="number" value={step.waitHours} onChange={e => handleUpdateStep(step.id, 'waitHours', Number(e.target.value))} className="w-16 bg-white dark:bg-natural-700 p-1 rounded" placeholder="hrs" min="0" />
                    <input type="number" value={step.waitDays} onChange={e => handleUpdateStep(step.id, 'waitDays', Number(e.target.value))} className="w-16 bg-white dark:bg-natural-700 p-1 rounded" placeholder="days" min="0" />
                </div>
            </td>
            <td className="p-2 align-top"><input list="systems" value={step.systemUsed} onChange={e => handleUpdateStep(step.id, 'systemUsed', e.target.value)} className="w-full bg-white dark:bg-natural-700 p-1 rounded" placeholder={t('procedures.details.steps.orEnterCustom')} /></td>
            <td className="p-2 align-top text-center">
                <div className="flex items-center justify-center gap-1">
                    <button onClick={handleSaveStep} className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full" title={t('save')}><CheckCircleIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleCancelEdit(step.id)} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" title={t('cancel')}><XCircleIcon className="w-5 h-5" /></button>
                </div>
            </td>
        </tr>
    );
    
    const renderViewRow = (step: ProcedureStep, index: number) => (
         <tr key={step.id} className="hover:bg-natural-50 dark:hover:bg-natural-800/50 group">
            <td className="p-3 text-center">{index + 1}</td>
            <td className="p-3 font-semibold">{step.stepName}</td>
            <td className="p-3 whitespace-pre-wrap">{step.description}</td>
            <td className="p-3">{step.department}</td>
            <td className="p-3">{step.responsible}</td>
            <td className="p-3 text-center">{step.durationHours}</td>
            <td className="p-3 text-center">{`${step.waitDays || 0}d ${step.waitHours || 0}h`}</td>
            <td className="p-3">{step.systemUsed}</td>
            <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingStepId(step.id)} className="p-1 text-natural-500 hover:text-dark-purple-600"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteStep(step.id)} className="p-1 text-natural-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );

    return (
        <Card>
            <datalist id="depts">{departmentOptions.map(opt => <option key={opt} value={opt} />)}</datalist>
            <datalist id="resps">{responsibleOptions.map(opt => <option key={opt} value={opt} />)}</datalist>
            <datalist id="systems">{systemOptions.map(opt => <option key={opt} value={opt} />)}</datalist>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-natural-600 dark:text-natural-300">
                    <thead className="text-xs text-natural-700 dark:text-natural-200 uppercase bg-natural-100 dark:bg-natural-800">
                        <tr>
                            <th className="p-3 w-12">{t('procedures.details.steps.stepNum')}</th>
                            <th className="p-3 min-w-[150px]">{t('procedures.details.steps.stepName')}</th>
                            <th className="p-3 min-w-[250px]">{t('procedures.details.steps.description')}</th>
                            <th className="p-3 min-w-[150px]">{t('procedures.details.steps.department')}</th>
                            <th className="p-3 min-w-[150px]">{t('procedures.details.steps.responsible')}</th>
                            <th className="p-3 min-w-[100px]">{t('procedures.details.steps.duration')}</th>
                            <th className="p-3 min-w-[180px]">{t('procedures.details.steps.waitTime')}</th>
                            <th className="p-3 min-w-[150px]">{t('procedures.details.steps.systemUsed')}</th>
                            <th className="p-3 w-20"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {localSteps.map((step, index) => editingStepId === step.id ? renderEditableRow(step) : renderViewRow(step, index))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-natural-700 flex justify-between items-center">
                 <button onClick={handleAddStep} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-natural-700 border border-dark-purple-600 text-dark-purple-600 dark:text-dark-purple-300 rounded-md text-sm font-medium hover:bg-dark-purple-50 dark:hover:bg-dark-purple-900/40">
                    <PlusIcon className="w-4 h-4" />
                    {t('procedures.details.steps.addStep')}
                </button>
            </div>
        </Card>
    );
};

export default ProcedureStepsTab;