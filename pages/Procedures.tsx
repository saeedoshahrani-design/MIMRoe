import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import PageTitle from '../components/PageTitle.tsx';
import { useProcedures } from '../context/ProceduresContext.tsx';
import { Procedure, ProcedureStep } from '../types.ts';
import ProcedureCard from '../components/procedures/ProcedureCard.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { ClipboardDocumentListIcon, PlusIcon } from '../components/icons/IconComponents.tsx';
import ProcedureFormModal from '../components/procedures/AddProcedureModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import Toast from '../components/Toast.tsx';
import { ProcedureFormData } from '../context/ProceduresContext.tsx';
import ProcedureDetailView from '../components/procedures/ProcedureDetailView.tsx';
import AddProcedureChoiceModal from '../components/procedures/AddProcedureChoiceModal.tsx';
import AddProcedureFromTextModal from '../components/procedures/AddProcedureFromTextModal.tsx';
import { departments } from '../data/mockData.ts';
import { autoTranslate } from '../utils/localizationUtils.ts';

const Procedures: React.FC = () => {
    const { t, language } = useLocalization();
    const { procedures, addProcedure, updateProcedure, deleteProcedure, updateProcedurePartial } = useProcedures();
    
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
    const [procedureToEdit, setProcedureToEdit] = useState<Procedure | null>(null);
    const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [isManualFormOpen, setIsManualFormOpen] = useState(false);
    const [isAiFormOpen, setIsAiFormOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    
    useEffect(() => {
        if (selectedProcedure) {
            const updated = procedures.find(p => p.id === selectedProcedure.id);
            setSelectedProcedure(updated || null);
        }
    }, [procedures, selectedProcedure]);


    const handleEdit = (procedure: Procedure) => {
        setProcedureToEdit(procedure);
        setIsManualFormOpen(true);
    };

    const handleDeleteRequest = (procedure: Procedure) => {
        setProcedureToDelete(procedure);
    };

    const handleSaveManual = (data: ProcedureFormData) => {
        if (procedureToEdit) {
            updateProcedure(procedureToEdit.id, data, language);
            setToast({ message: t('procedures.notifications.updateSuccess'), type: 'success' });
        } else {
            addProcedure(data, language);
            setToast({ message: t('procedures.notifications.addSuccess'), type: 'success' });
        }
        setIsManualFormOpen(false);
        setProcedureToEdit(null);
    };
    
    const handleConfirmDelete = () => {
        if(procedureToDelete) {
            deleteProcedure(procedureToDelete.id);
            setToast({ message: t('procedures.notifications.deleteSuccess'), type: 'success' });
            if (selectedProcedure?.id === procedureToDelete.id) {
                setSelectedProcedure(null);
            }
            setProcedureToDelete(null);
        }
    };
    
    const handleCreationChoice = (choice: 'manual' | 'ai') => {
        setIsChoiceModalOpen(false);
        if (choice === 'manual') {
            setProcedureToEdit(null);
            setIsManualFormOpen(true);
        } else {
            setIsAiFormOpen(true);
        }
    };
    
    const handleAiSuccess = async (parsedData: any) => {
        try {
            const department = departments.find(d => d.name.ar === parsedData.departmentName || d.name.en === parsedData.departmentName);
            const initialData = {
                title: parsedData.title,
                description: parsedData.description,
                inputs: parsedData.inputs,
                outputs: parsedData.outputs,
                departmentId: department?.id || '',
                eReadiness: parsedData.eReadiness,
                linkedService: parsedData.linkedService,
                durationDays: parsedData.durationDays,
                policiesAndReferences: parsedData.policiesAndReferences,
                technicalSystems: parsedData.technicalSystems,
            };

            const newProcedureId = await addProcedure(initialData, language);
            
            const partialUpdate: Partial<Omit<Procedure, 'id'>> = {};

            if (parsedData.steps && parsedData.steps.length > 0) {
                partialUpdate.steps = parsedData.steps.map((step: Omit<ProcedureStep, 'id'>) => ({
                    ...step,
                    id: `step-${Date.now()}-${Math.random()}`
                }));
            }

            if (parsedData.definitions && parsedData.definitions.length > 0) {
                const otherLang = language === 'ar' ? 'en' : 'ar';
                partialUpdate.definitions = parsedData.definitions.map((def: { term: string, definition: string }) => ({
                    id: `def-${Date.now()}-${Math.random()}`,
                    term: { [language]: def.term, [otherLang]: autoTranslate(def.term, otherLang) },
                    definition: { [language]: def.definition, [otherLang]: autoTranslate(def.definition, otherLang) }
                }));
            }
    
            if (parsedData.formsUsed && parsedData.formsUsed.length > 0) {
                const otherLang = language === 'ar' ? 'en' : 'ar';
                partialUpdate.formsUsed = parsedData.formsUsed.map((formName: string) => ({
                    name: { [language]: formName, [otherLang]: autoTranslate(formName, otherLang) },
                    file: { name: 'Generated by AI', type: 'text/plain', content: '' } // Dummy file
                }));
            }

            if (Object.keys(partialUpdate).length > 0) {
                await updateProcedurePartial(newProcedureId, partialUpdate);
            }

            setToast({ message: t('procedures.notifications.aiAddSuccess'), type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: t('procedures.notifications.aiAddError'), type: 'info' });
        } finally {
            setIsAiFormOpen(false);
        }
    };


    if (selectedProcedure) {
        return (
             <div className="space-y-6">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <ProcedureDetailView
                    procedure={selectedProcedure}
                    onBack={() => setSelectedProcedure(null)}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    setToast={setToast}
                    updateProcedurePartial={updateProcedurePartial}
                />
                 <ProcedureFormModal
                    isOpen={isManualFormOpen && !!procedureToEdit}
                    onClose={() => { setIsManualFormOpen(false); setProcedureToEdit(null); }}
                    onSave={handleSaveManual}
                    procedureToEdit={procedureToEdit}
                />
                <ConfirmationModal
                    isOpen={!!procedureToDelete}
                    onClose={() => setProcedureToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title={t('procedures.deleteProcedure')}
                    message={t('procedures.deleteConfirm')}
                />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <PageTitle />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-end">
                <button 
                    onClick={() => setIsChoiceModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700"
                >
                    <PlusIcon className="w-4 h-4" />
                    {t('procedures.addProcedure')}
                </button>
            </div>
            
            {procedures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {procedures.map(procedure => (
                        <ProcedureCard
                            key={procedure.id}
                            procedure={procedure}
                            onViewDetails={setSelectedProcedure}
                        />
                    ))}
                </div>
            ) : (
                 <EmptyState
                    icon={<ClipboardDocumentListIcon className="h-12 w-12 text-natural-400" />}
                    message={t('procedures.noProcedures')}
                />
            )}
            
            <AddProcedureChoiceModal
                isOpen={isChoiceModalOpen}
                onClose={() => setIsChoiceModalOpen(false)}
                onSelect={handleCreationChoice}
            />

            <AddProcedureFromTextModal
                isOpen={isAiFormOpen}
                onClose={() => setIsAiFormOpen(false)}
                onComplete={handleAiSuccess}
            />

            <ProcedureFormModal
                isOpen={isManualFormOpen && !procedureToEdit}
                onClose={() => setIsManualFormOpen(false)}
                onSave={handleSaveManual}
                procedureToEdit={null}
            />
            
            <ConfirmationModal
                isOpen={!!procedureToDelete}
                onClose={() => setProcedureToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('procedures.deleteProcedure')}
                message={t('procedures.deleteConfirm')}
            />
        </div>
    );
};

export default Procedures;
