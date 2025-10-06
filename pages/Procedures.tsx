import React, { useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import PageTitle from '../components/PageTitle';
import { useProcedures } from '../context/ProceduresContext';
import { Procedure } from '../types';
import ProcedureCard from '../components/procedures/ProcedureCard';
import ProcedureDetailsModal from '../components/procedures/ProcedureDetailsModal';
import EmptyState from '../components/EmptyState';
import { ClipboardDocumentListIcon, PlusIcon } from '../components/icons/IconComponents';
import ProcedureFormModal from '../components/procedures/AddProcedureModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { ProcedureFormData } from '../context/ProceduresContext';

const Procedures: React.FC = () => {
    const { t, language } = useLocalization();
    const { procedures, addProcedure, updateProcedure, deleteProcedure } = useProcedures();
    
    const [procedureToView, setProcedureToView] = useState<Procedure | null>(null);
    const [procedureToEdit, setProcedureToEdit] = useState<Procedure | null>(null);
    const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const handleViewDetails = (procedure: Procedure) => {
        setProcedureToView(procedure);
    };

    const handleEdit = (procedure: Procedure) => {
        setProcedureToEdit(procedure);
    };

    const handleDeleteRequest = (procedure: Procedure) => {
        setProcedureToDelete(procedure);
    };

    const handleSave = (data: ProcedureFormData) => {
        if (procedureToEdit) {
            updateProcedure(procedureToEdit.id, data, language);
            setToast({ message: t('procedures.notifications.updateSuccess'), type: 'success' });
        } else {
            addProcedure(data, language);
            setToast({ message: t('procedures.notifications.addSuccess'), type: 'success' });
        }
        setIsAddModalOpen(false);
        setProcedureToEdit(null);
    };
    
    const handleConfirmDelete = () => {
        if(procedureToDelete) {
            deleteProcedure(procedureToDelete.id);
            setToast({ message: t('procedures.notifications.deleteSuccess'), type: 'success' });
            setProcedureToDelete(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <PageTitle />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-end">
                <button 
                    onClick={() => setIsAddModalOpen(true)}
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
                            onViewDetails={handleViewDetails}
                            onEdit={handleEdit}
                            onDelete={handleDeleteRequest}
                        />
                    ))}
                </div>
            ) : (
                 <EmptyState
                    icon={<ClipboardDocumentListIcon className="h-12 w-12 text-natural-400" />}
                    message={t('procedures.noProcedures')}
                />
            )}

            <ProcedureDetailsModal
                isOpen={!!procedureToView}
                onClose={() => setProcedureToView(null)}
                procedure={procedureToView}
                onEdit={(p) => { setProcedureToView(null); handleEdit(p); }}
                onDelete={(p) => { setProcedureToView(null); handleDeleteRequest(p); }}
            />
            
            <ProcedureFormModal
                isOpen={isAddModalOpen || !!procedureToEdit}
                onClose={() => { setIsAddModalOpen(false); setProcedureToEdit(null); }}
                onSave={handleSave}
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
};

export default Procedures;