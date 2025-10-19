import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import PageTitle from '../components/PageTitle.tsx';
import { useInitiatives, InitiativeFormData } from '../context/InitiativesContext.tsx';
import { StrategicInitiative } from '../types.ts';
import InitiativeCard from '../components/initiatives/InitiativeCard.tsx';
import AddInitiativeModal from '../components/initiatives/AddInitiativeModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { PlusIcon, SparklesIcon } from '../components/icons/IconComponents.tsx';
import Toast from '../components/Toast.tsx';
import InitiativeDetailView from '../components/initiatives/InitiativeDetailView.tsx';

const InitiativesPage: React.FC = () => {
    const { t, language } = useLocalization();
    const { initiatives, addInitiative, deleteInitiative } = useInitiatives();

    const [selectedInitiative, setSelectedInitiative] = useState<StrategicInitiative | null>(null);
    const [initiativeToEdit, setInitiativeToEdit] = useState<StrategicInitiative | null>(null);
    const [initiativeToDelete, setInitiativeToDelete] = useState<StrategicInitiative | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    
    // When an initiative is updated in the context, update the selected one to reflect changes
    useEffect(() => {
        if (selectedInitiative) {
            const updated = initiatives.find(i => i.id === selectedInitiative.id);
            setSelectedInitiative(updated || null);
        }
    }, [initiatives, selectedInitiative]);

    const handleSave = (data: InitiativeFormData) => {
        // This save is only for adding, editing is handled inside the detail view
        addInitiative(data, language);
        setToast({ message: t('initiatives.notifications.addSuccess'), type: 'success' });
        setIsAddModalOpen(false);
    };

    const handleConfirmDelete = () => {
        if (initiativeToDelete) {
            deleteInitiative(initiativeToDelete.id);
            setToast({ message: t('initiatives.notifications.deleteSuccess'), type: 'success' });
            if(selectedInitiative?.id === initiativeToDelete.id) {
                setSelectedInitiative(null);
            }
            setInitiativeToDelete(null);
        }
    };

    if (selectedInitiative) {
        return (
            <InitiativeDetailView
                initiative={selectedInitiative}
                onBack={() => setSelectedInitiative(null)}
                setToast={setToast}
            />
        );
    }
    
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
                    {t('initiatives.addInitiative')}
                </button>
            </div>

            {initiatives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initiatives.map(initiative => (
                        <InitiativeCard
                            key={initiative.id}
                            initiative={initiative}
                            onSelect={setSelectedInitiative}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<SparklesIcon className="w-12 h-12 text-natural-400" />}
                    message={t('initiatives.noInitiatives')}
                />
            )}
            
            <AddInitiativeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSave}
                initiativeToEdit={null} // This modal is now only for adding
            />
            
            <ConfirmationModal
                isOpen={!!initiativeToDelete}
                onClose={() => setInitiativeToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('initiatives.deleteInitiative')}
                message={t('initiatives.deleteConfirm')}
            />
        </div>
    );
};

export default InitiativesPage;
