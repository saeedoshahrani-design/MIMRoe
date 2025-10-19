import React, { useState, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import PageTitle from '../components/PageTitle.tsx';
import { useEmployeeContext } from '../context/EmployeeContext.tsx';
import { Employee } from '../types.ts';
import EmployeeCard from '../components/activationTeam/EmployeeCard.tsx';
import EmployeeDetailsModal from '../components/activationTeam/EmployeeDetailsModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import Toast from '../components/Toast.tsx';
import { PlusIcon } from '../components/icons/IconComponents.tsx';

type ModalState = {
    employee: Employee | null;
    mode: 'view' | 'edit';
}

const ActivationTeam: React.FC = () => {
    const { t, language } = useLocalization();
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployeeContext();
    const [modalState, setModalState] = useState<ModalState>({ employee: null, mode: 'view' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const sortedEmployees = useMemo(() => {
        return [...employees].sort((a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
    }, [employees]);

    const handleViewDetails = (employee: Employee) => {
        setIsAddModalOpen(false);
        setModalState({ employee, mode: 'view' });
    };

    const handleEdit = (employee: Employee) => {
        setIsAddModalOpen(false);
        setModalState({ employee, mode: 'edit' });
    };
    
    const handleDeleteRequest = (employee: Employee) => {
        setEmployeeToDelete(employee);
    };

    const handleOpenAddModal = () => {
        setModalState({ employee: null, mode: 'view' });
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalState({ employee: null, mode: 'view' });
        setIsAddModalOpen(false);
    };

    const handleSave = (employeeData: Employee) => {
        const { id, ...dataToSave } = employeeData;
        if (id) { // Edit mode: An ID exists.
            updateEmployee(id, dataToSave);
            setToast({ message: t('team.details.notifications.updateSuccess'), type: 'success' });
        } else { // Add mode: ID is an empty string.
            addEmployee(dataToSave);
            setToast({ message: t('team.details.notifications.addSuccess'), type: 'success' });
        }
        handleCloseModal();
    };

    const handleConfirmDelete = () => {
        if (employeeToDelete) {
            deleteEmployee(employeeToDelete.id);
            setToast({ message: t('team.details.notifications.deleteSuccess'), type: 'success' });
            setEmployeeToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageTitle />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-end">
                <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700"
                >
                    <PlusIcon className="w-4 h-4" />
                    {t('team.addEmployee')}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedEmployees.map(employee => (
                    <EmployeeCard 
                        key={employee.id} 
                        employee={employee}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                    />
                ))}
            </div>

            <EmployeeDetailsModal
                isOpen={!!modalState.employee || isAddModalOpen}
                onClose={handleCloseModal}
                employee={modalState.employee}
                initialMode={modalState.employee ? modalState.mode : 'edit'}
                onSave={handleSave}
                onDelete={handleDeleteRequest}
            />

            <ConfirmationModal
                isOpen={!!employeeToDelete}
                onClose={() => setEmployeeToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('team.deleteProfile')}
                message={t('team.deleteConfirm', { name: employeeToDelete?.name[language] || '' })}
            />
        </div>
    );
};

export default ActivationTeam;
