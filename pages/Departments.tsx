import React, { useState, useCallback, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import Card from '../components/Card';
import { Department, Challenge, Opportunity, Initiative, Employee, Procedure } from '../types';
import { ChallengesIcon, OpportunitiesIcon, TeamIcon, ClipboardDocumentListIcon } from '../components/icons/IconComponents';
import EmptyState from '../components/EmptyState';
import { departments as allDepartments } from '../data/mockData';
import PageTitle from '../components/PageTitle';
import { useChallenges } from '../context/ChallengesContext';
import { useOpportunities } from '../context/OpportunitiesContext';
import { useDepartmentsData } from '../context/DepartmentsDataContext';
import TasksCard from '../components/departments/TasksCard';
import TargetsCard from '../components/departments/TargetsCard';
import ChallengeCard from '../components/challenges/ChallengeCard';
import OpportunityCard from '../components/OpportunityCard';
import AddChallengeModal from '../components/AddChallengeModal';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal';
import AddOpportunityModal from '../components/AddOpportunityModal';
import OpportunityDetailsModal from '../components/OpportunityDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Toast from '../components/Toast';
import { useEmployeeContext } from '../context/EmployeeContext';
import EmployeeCard from '../components/activationTeam/EmployeeCard';
import EmployeeDetailsModal from '../components/activationTeam/EmployeeDetailsModal';
import { useProcedures, ProcedureFormData } from '../context/ProceduresContext';
import ProcedureCard from '../components/procedures/ProcedureCard';
import ProcedureDetailsModal from '../components/procedures/ProcedureDetailsModal';
import ProcedureFormModal from '../components/procedures/AddProcedureModal';


// Sub-components for the Detail View
interface DepartmentContentProps {
    onEdit: (item: Initiative) => void;
    onDelete: (item: Initiative) => void;
    onViewDetails: (item: Initiative) => void;
}

const DepartmentChallenges: React.FC<{ challenges: Challenge[] } & DepartmentContentProps> = ({ challenges, onEdit, onDelete, onViewDetails }) => {
    const { t } = useLocalization();

    if (challenges.length === 0) {
        return <EmptyState icon={<ChallengesIcon className="h-12 w-12"/>} message={t('challenges.noChallenges')} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map(c => (
                <ChallengeCard
                    key={c.id}
                    challenge={c}
                    onEdit={onEdit as (challenge: Challenge) => void}
                    onDelete={onDelete as (challenge: Challenge) => void}
                    onViewDetails={onViewDetails as (challenge: Challenge) => void}
                />
            ))}
        </div>
    );
};

const DepartmentOpportunities: React.FC<{ opportunities: Opportunity[] } & DepartmentContentProps> = ({ opportunities, onEdit, onDelete, onViewDetails }) => {
    const { t } = useLocalization();
     if (opportunities.length === 0) {
        return <EmptyState icon={<OpportunitiesIcon className="h-12 w-12"/>} message={t('opportunities.noOpportunitiesDept')} />;
    }
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map(o => (
                <OpportunityCard
                    key={o.id}
                    opportunity={o}
                    onEdit={onEdit as (opportunity: Opportunity) => void}
                    onDelete={onDelete as (opportunity: Opportunity) => void}
                    onViewDetails={onViewDetails as (opportunity: Opportunity) => void}
                />
             ))}
        </div>
    );
};

const DepartmentTeamTab: React.FC<{ 
    employees: Employee[]; 
    onViewDetails: (employee: Employee) => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
}> = ({ employees, onViewDetails, onEdit, onDelete }) => {
    const { t } = useLocalization();
    if (employees.length === 0) {
        return <EmptyState icon={<TeamIcon className="h-12 w-12"/>} message={t('team.noEmployeesInDept')} />;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map(e => (
                <EmployeeCard
                    key={e.id}
                    employee={e}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

const DepartmentProceduresTab: React.FC<{
    procedures: Procedure[];
    onViewDetails: (procedure: Procedure) => void;
    onEdit: (procedure: Procedure) => void;
    onDelete: (procedure: Procedure) => void;
}> = ({ procedures, onViewDetails, onEdit, onDelete }) => {
    const { t } = useLocalization();
    if (procedures.length === 0) {
        return <EmptyState icon={<ClipboardDocumentListIcon className="h-12 w-12" />} message={t('procedures.noProcedures')} />;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map(p => (
                <ProcedureCard
                    key={p.id}
                    procedure={p}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};


const AboutDepartmentTab: React.FC<{ departmentId: string }> = ({ departmentId }) => {
    const {
        getDepartmentData,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        addTarget,
        updateTarget,
        deleteTarget,
        reorderTargets,
        setToast,
    } = useDepartmentsData();

    const departmentData = getDepartmentData(departmentId);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <TasksCard
                departmentId={departmentId}
                tasks={departmentData.tasks}
                onAddTask={(data) => addTask(departmentId, data)}
                onUpdateTask={(taskId, data) => updateTask(departmentId, taskId, data)}
                onDeleteTask={(taskId) => deleteTask(departmentId, taskId)}
                onReorderTasks={(draggedId, targetId) => reorderTasks(departmentId, draggedId, targetId)}
                setToast={setToast}
            />
            <TargetsCard
                departmentId={departmentId}
                targets={departmentData.targets}
                onAddTarget={(data) => addTarget(departmentId, data)}
                onUpdateTarget={(targetId, data) => updateTarget(departmentId, targetId, data)}
                onDeleteTarget={(targetId) => deleteTarget(departmentId, targetId)}
                onReorderTargets={(draggedId, targetId) => reorderTargets(departmentId, draggedId, targetId)}
                setToast={setToast}
            />
        </div>
    );
};


const Departments: React.FC = () => {
    const { t, language } = useLocalization();
    const { challenges: allChallenges, addChallenge, updateChallenge, deleteChallenge, updateChallengeDirectly } = useChallenges();
    const { opportunities: allOpportunities, addOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
    const { employees: allEmployees, updateEmployee, deleteEmployee } = useEmployeeContext();
    const { procedures: allProcedures, addProcedure, updateProcedure, deleteProcedure } = useProcedures();
    
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [activeTab, setActiveTab] = useState<'about' | 'challenges' | 'opportunities' | 'team' | 'procedures'>('about');
    
    // State for initiative modals
    const [itemToEdit, setItemToEdit] = useState<Initiative | null>(null);
    const [itemToView, setItemToView] = useState<Initiative | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Initiative | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
    
    // State for employee modals
    type EmployeeModalState = { employee: Employee | null; mode: 'view' | 'edit'; };
    const [employeeModalState, setEmployeeModalState] = useState<EmployeeModalState>({ employee: null, mode: 'view' });
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

    // State for procedure modals
    const [procedureToEdit, setProcedureToEdit] = useState<Procedure | null>(null);
    const [procedureToView, setProcedureToView] = useState<Procedure | null>(null);
    const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);


    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Initiative Handlers
    const handleSaveChallenge = useCallback((challengeData: Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'> & { id?: string }) => {
        if (challengeData.id) {
            updateChallenge(challengeData.id, challengeData);
            setToast({ message: t('challenges.notifications.updateSuccess'), type: 'success' });
        } else {
            addChallenge(challengeData);
            setToast({ message: t('challenges.notifications.addSuccess'), type: 'success' });
        }
        setItemToEdit(null);
    }, [t, addChallenge, updateChallenge]);

    const handleSaveOpportunity = useCallback((opportunityData: Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'> & { id?: string }) => {
        if (opportunityData.id) {
            updateOpportunity(opportunityData.id, opportunityData);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
        } else {
            addOpportunity(opportunityData);
            setToast({ message: t('opportunities.notifications.addSuccess'), type: 'success' });
        }
        setItemToEdit(null);
    }, [t, addOpportunity, updateOpportunity]);
    
    const handleConfirmDelete = useCallback(() => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'challenge') {
            deleteChallenge(itemToDelete.id);
            setToast({ message: t('challenges.notifications.deleteSuccess'), type: 'success' });
        } else {
            deleteOpportunity(itemToDelete.id);
            setToast({ message: t('opportunities.notifications.deleteSuccess'), type: 'success' });
        }
        setItemToDelete(null);
    }, [itemToDelete, t, deleteChallenge, deleteOpportunity]);
    
    const handleDirectUpdateChallenge = useCallback((updatedChallenge: Challenge) => {
        updateChallengeDirectly(updatedChallenge);
        setItemToView(updatedChallenge);
    }, [updateChallengeDirectly]);

    const handleEdit = (item: Initiative) => {
        setItemToView(null);
        setItemToEdit(item);
    };
    
    // Employee Handlers
    const handleViewEmployee = (employee: Employee) => setEmployeeModalState({ employee, mode: 'view' });
    const handleEditEmployee = (employee: Employee) => setEmployeeModalState({ employee, mode: 'edit' });
    const handleDeleteEmployeeRequest = (employee: Employee) => setEmployeeToDelete(employee);
    const handleCloseEmployeeModal = () => setEmployeeModalState({ employee: null, mode: 'view' });

    const handleSaveEmployee = (updatedEmployee: Employee) => {
        updateEmployee(updatedEmployee.id, updatedEmployee);
        setToast({ message: t('team.details.notifications.updateSuccess'), type: 'success' });
        handleCloseEmployeeModal();
    };

    const handleConfirmDeleteEmployee = () => {
        if (employeeToDelete) {
            deleteEmployee(employeeToDelete.id);
            setToast({ message: t('team.details.notifications.deleteSuccess'), type: 'success' });
            setEmployeeToDelete(null);
        }
    };

    // Procedure Handlers
    const handleSaveProcedure = useCallback((data: ProcedureFormData) => {
        if (procedureToEdit) {
            updateProcedure(procedureToEdit.id, data, language);
            setToast({ message: t('procedures.notifications.updateSuccess'), type: 'success' });
        } else {
            addProcedure(data, language);
            setToast({ message: t('procedures.notifications.addSuccess'), type: 'success' });
        }
        setProcedureToEdit(null);
    }, [procedureToEdit, language, t, addProcedure, updateProcedure]);
    
    const handleConfirmDeleteProcedure = useCallback(() => {
        if (procedureToDelete) {
            deleteProcedure(procedureToDelete.id);
            setToast({ message: t('procedures.notifications.deleteSuccess'), type: 'success' });
            setProcedureToDelete(null);
        }
    }, [procedureToDelete, t, deleteProcedure]);


    const departments = allDepartments;
    
    // DETAIL VIEW
    if (selectedDepartment) {
        const departmentChallenges = allChallenges.filter(c => c.department === selectedDepartment.name.ar);
        const departmentOpportunities = allOpportunities.filter(o => o.department === selectedDepartment.name.ar);
        const departmentEmployees = allEmployees.filter(e => e.department.ar === selectedDepartment.name.ar);
        const departmentProcedures = allProcedures.filter(p => p.departmentId === selectedDepartment.id);

        const tabs = [
            { id: 'about', label: t('departments.about') },
            { id: 'challenges', label: t('departments.departmentChallenges') },
            { id: 'opportunities', label: t('departments.departmentOpportunities') },
            { id: 'team', label: t('departments.departmentTeam') },
            { id: 'procedures', label: t('departments.departmentProcedures') },
        ];

        return (
             <div className="space-y-4">
                <PageTitle />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                
                {/* Initiative Modals */}
                {itemToEdit?.type === 'challenge' && <AddChallengeModal 
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    onSave={handleSaveChallenge}
                    challengeToEdit={itemToEdit}
                />}
                {itemToEdit?.type === 'opportunity' && <AddOpportunityModal 
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    onSave={handleSaveOpportunity}
                    opportunityToEdit={itemToEdit}
                />}
                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title={t(itemToDelete?.type === 'challenge' ? 'challenges.deleteChallenge' : 'opportunities.deleteOpportunity')}
                    message={t(itemToDelete?.type === 'challenge' ? 'challenges.deleteChallengeConfirm' : 'opportunities.deleteOpportunityConfirm')}
                />
                {itemToView?.type === 'challenge' && <ChallengeDetailsModal
                    isOpen={!!itemToView}
                    challenge={itemToView}
                    onClose={() => setItemToView(null)}
                    onEdit={handleEdit}
                    onDelete={setItemToDelete}
                    onDirectUpdate={handleDirectUpdateChallenge}
                />}
                {itemToView?.type === 'opportunity' && <OpportunityDetailsModal
                    isOpen={!!itemToView}
                    opportunity={itemToView}
                    onClose={() => setItemToView(null)}
                    onEdit={handleEdit}
                    onDelete={setItemToDelete}
                />}

                {/* Employee Modals */}
                 <EmployeeDetailsModal
                    isOpen={!!employeeModalState.employee}
                    onClose={handleCloseEmployeeModal}
                    employee={employeeModalState.employee}
                    initialMode={employeeModalState.mode}
                    onSave={handleSaveEmployee}
                    onDelete={handleDeleteEmployeeRequest}
                />
                <ConfirmationModal
                    isOpen={!!employeeToDelete}
                    onClose={() => setEmployeeToDelete(null)}
                    onConfirm={handleConfirmDeleteEmployee}
                    title={t('team.deleteProfile')}
                    message={t('team.deleteConfirm', { name: employeeToDelete?.name[language as 'ar' | 'en'] || '' })}
                />

                {/* Procedure Modals */}
                <ProcedureDetailsModal
                    isOpen={!!procedureToView}
                    onClose={() => setProcedureToView(null)}
                    procedure={procedureToView}
                    onEdit={(p) => { setProcedureToView(null); setProcedureToEdit(p); }}
                    onDelete={(p) => { setProcedureToView(null); setProcedureToDelete(p); }}
                />
                <ProcedureFormModal
                    isOpen={!!procedureToEdit}
                    onClose={() => setProcedureToEdit(null)}
                    onSave={handleSaveProcedure}
                    procedureToEdit={procedureToEdit}
                />
                <ConfirmationModal
                    isOpen={!!procedureToDelete}
                    onClose={() => setProcedureToDelete(null)}
                    onConfirm={handleConfirmDeleteProcedure}
                    title={t('procedures.deleteProcedure')}
                    message={t('procedures.deleteConfirm')}
                />


                <div className="flex items-center text-sm text-natural-500 dark:text-natural-400">
                     <button onClick={() => setSelectedDepartment(null)} className="hover:underline">{t('nav.departments')}</button>
                     <span className="mx-2 rtl:rotate-180">/</span>
                     <span className="font-medium text-natural-700 dark:text-natural-200">{selectedDepartment.name[language]}</span>
                </div>
                
                <div className="border-b border-natural-200 dark:border-natural-700">
                    <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'border-dark-purple-500 text-dark-purple-600 dark:text-dark-purple-400'
                                        : 'border-transparent text-natural-500 hover:text-natural-700 hover:border-natural-300 dark:hover:text-natural-200 dark:hover:border-natural-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="pt-4">
                    {activeTab === 'about' && <AboutDepartmentTab departmentId={selectedDepartment.id} />}
                    {activeTab === 'challenges' && <DepartmentChallenges challenges={departmentChallenges} onEdit={setItemToEdit} onDelete={setItemToDelete} onViewDetails={setItemToView} />}
                    {activeTab === 'opportunities' && <DepartmentOpportunities opportunities={departmentOpportunities} onEdit={setItemToEdit} onDelete={setItemToDelete} onViewDetails={setItemToView} />}
                    {activeTab === 'team' && <DepartmentTeamTab employees={departmentEmployees} onViewDetails={handleViewEmployee} onEdit={handleEditEmployee} onDelete={handleDeleteEmployeeRequest} />}
                    {activeTab === 'procedures' && <DepartmentProceduresTab procedures={departmentProcedures} onViewDetails={setProcedureToView} onEdit={setProcedureToEdit} onDelete={setProcedureToDelete} />}
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="space-y-6">
            <PageTitle />
            <Card>
                <p className="mt-1 text-sm text-natural-500 dark:text-natural-400">{t('departments.selectDepartment')}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map(dept => (
                    <div key={dept.id} onClick={() => setSelectedDepartment(dept)} className="cursor-pointer group">
                        <Card className="h-full group-hover:shadow-lg group-hover:border-dark-purple-400 dark:group-hover:border-dark-purple-500 transition-all duration-200">
                            <h3 className="font-bold text-lg text-natural-800 dark:text-natural-100">{dept.name[language]}</h3>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Departments;