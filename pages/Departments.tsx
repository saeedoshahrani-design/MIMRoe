import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import Card from '../components/Card.tsx';
import { Department, Challenge, Opportunity, Initiative, Employee, Procedure } from '../types.ts';
import { ChallengesIcon, OpportunitiesIcon, TeamIcon, ClipboardDocumentListIcon } from '../components/icons/IconComponents.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { departments as allDepartments } from '../data/mockData.ts';
import PageTitle from '../components/PageTitle.tsx';
import { useChallenges } from '../context/ChallengesContext.tsx';
import { useOpportunities } from '../context/OpportunitiesContext.tsx';
import { useDepartmentsData } from '../context/DepartmentsDataContext.tsx';
import TasksCard from '../components/departments/TasksCard.tsx';
import TargetsCard from '../components/departments/TargetsCard.tsx';
import ChallengeCard from '../components/challenges/ChallengeCard.tsx';
import OpportunityCard from '../components/OpportunityCard.tsx';
import AddChallengeModal from '../components/AddChallengeModal.tsx';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal.tsx';
import AddOpportunityModal from '../components/AddOpportunityModal.tsx';
import OpportunityDetailsModal from '../components/OpportunityDetailsModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import Toast from '../components/Toast.tsx';
import { useEmployeeContext } from '../context/EmployeeContext.tsx';
import EmployeeCard from '../components/activationTeam/EmployeeCard.tsx';
import EmployeeDetailsModal from '../components/activationTeam/EmployeeDetailsModal.tsx';
import { useProcedures, ProcedureFormData } from '../context/ProceduresContext.tsx';
import ProcedureCard from '../components/procedures/ProcedureCard.tsx';
import ProcedureDetailsModal from '../components/procedures/ProcedureDetailsModal.tsx';
import ProcedureFormModal from '../components/procedures/AddProcedureModal.tsx';


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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

const DepartmentTeam: React.FC<{ employees: Employee[], onViewDetails: (employee: Employee) => void, onEdit: (employee: Employee) => void, onDelete: (employee: Employee) => void }> = ({ employees, onViewDetails, onEdit, onDelete }) => {
    // FIX: complete component that was cut off, causing 'use' to be an error
    const { t } = useLocalization();

    if (employees.length === 0) {
        return <EmptyState icon={<TeamIcon className="h-12 w-12"/>} message={t('team.noEmployeesInDept')} />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

const DepartmentProcedures: React.FC<{ procedures: Procedure[], onViewProcedure: (proc: Procedure) => void }> = ({ procedures, onViewProcedure }) => {
    const { t } = useLocalization();

    if (procedures.length === 0) {
        return <EmptyState icon={<ClipboardDocumentListIcon className="h-12 w-12"/>} message={t('procedures.noProcedures')} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map(p => (
                <ProcedureCard
                    key={p.id}
                    procedure={p}
                    onViewDetails={onViewProcedure}
                />
            ))}
        </div>
    );
};

type DepartmentTab = 'about' | 'challenges' | 'opportunities' | 'team' | 'procedures';

const Departments: React.FC = () => {
    const { t, language } = useLocalization();
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DepartmentTab>('about');

    const { challenges, updateChallenge, deleteChallenge } = useChallenges();
    const { opportunities, updateOpportunity, deleteOpportunity } = useOpportunities();
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployeeContext();
    const { procedures, addProcedure, updateProcedure, deleteProcedure, updateProcedurePartial } = useProcedures();

    const { getDepartmentData, addTask, updateTask, deleteTask, reorderTasks, addTarget, updateTarget, deleteTarget, reorderTargets, toast, setToast } = useDepartmentsData();
    
    // State for modals
    const [itemToEdit, setItemToEdit] = useState<Initiative | null>(null);
    const [itemToView, setItemToView] = useState<Initiative | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Initiative | null>(null);
    const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [procedureToView, setProcedureToView] = useState<Procedure | null>(null);
    const [procedureToEdit, setProcedureToEdit] = useState<Procedure | null>(null);
    const { updateChallengeDirectly } = useChallenges();

    const selectedDepartment = useMemo(() => {
        return allDepartments.find(d => d.id === selectedDepartmentId) || null;
    }, [selectedDepartmentId]);

    const departmentNameAr = selectedDepartment?.name.ar;

    const filteredChallenges = useMemo(() => departmentNameAr ? challenges.filter(c => c.department === departmentNameAr) : [], [challenges, departmentNameAr]);
    const filteredOpportunities = useMemo(() => departmentNameAr ? opportunities.filter(o => o.department === departmentNameAr) : [], [opportunities, departmentNameAr]);
    const filteredEmployees = useMemo(() => selectedDepartment ? employees.filter(e => e.department.ar === departmentNameAr) : [], [employees, selectedDepartment, departmentNameAr]);
    const filteredProcedures = useMemo(() => selectedDepartment ? procedures.filter(p => p.departmentId === selectedDepartment.id) : [], [procedures, selectedDepartment]);

    const handleTabClick = (tab: DepartmentTab) => {
        setActiveTab(tab);
    };

    const handleSaveInitiative = (data: any) => {
        if (!itemToEdit) return;
        const { id, ...updateData } = data;
        if (itemToEdit.type === 'challenge') {
            updateChallenge(itemToEdit.id, updateData);
            setToast({ message: t('challenges.notifications.updateSuccess'), type: 'success' });
        } else {
            updateOpportunity(itemToEdit.id, updateData);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
        }
        setItemToEdit(null);
    };

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'challenge') {
            deleteChallenge(itemToDelete.id);
            setToast({ message: t('challenges.notifications.deleteSuccess'), type: 'success' });
        } else {
            deleteOpportunity(itemToDelete.id);
            setToast({ message: t('opportunities.notifications.deleteSuccess'), type: 'success' });
        }
        setItemToDelete(null);
    };
    
    const handleSaveEmployee = (empData: Employee) => {
        const { id, ...dataToSave } = empData;
        if (id && employeeToEdit) { // Edit mode
            updateEmployee(id, dataToSave);
            setToast({ message: t('team.details.notifications.updateSuccess'), type: 'success' });
        }
        setEmployeeToEdit(null);
    };
    
     const handleConfirmDeleteEmployee = () => {
        if (employeeToDelete) {
            deleteEmployee(employeeToDelete.id);
            setToast({ message: t('team.details.notifications.deleteSuccess'), type: 'success' });
            setEmployeeToDelete(null);
        }
    };
    
    const handleSaveProcedure = (procData: ProcedureFormData) => {
        if (procedureToEdit) {
            updateProcedure(procedureToEdit.id, procData, language);
            setToast({ message: t('procedures.notifications.updateSuccess'), type: 'success' });
            setProcedureToEdit(null);
        }
    };


    const renderContent = () => {
        if (!selectedDepartmentId) {
            return (
                <Card>
                    <EmptyState message={t('departments.selectDepartment')} />
                </Card>
            );
        }

        switch (activeTab) {
            case 'about':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TasksCard departmentId={selectedDepartmentId} tasks={getDepartmentData(selectedDepartmentId).tasks} onAddTask={(data) => addTask(selectedDepartmentId, data)} onUpdateTask={(id, data) => updateTask(selectedDepartmentId, id, data)} onDeleteTask={(id) => deleteTask(selectedDepartmentId, id)} onReorderTasks={(d, t) => reorderTasks(selectedDepartmentId, d, t)} setToast={setToast} procedures={procedures.filter(p => p.departmentId === selectedDepartmentId)} onViewProcedure={setProcedureToView} />
                        <TargetsCard departmentId={selectedDepartmentId} targets={getDepartmentData(selectedDepartmentId).targets} onAddTarget={(data) => addTarget(selectedDepartmentId, data)} onUpdateTarget={(id, data) => updateTarget(selectedDepartmentId, id, data)} onDeleteTarget={(id) => deleteTarget(selectedDepartmentId, id)} onReorderTargets={(d, t) => reorderTargets(selectedDepartmentId, d, t)} setToast={setToast} procedures={procedures.filter(p => p.departmentId === selectedDepartmentId)} onViewProcedure={setProcedureToView} />
                    </div>
                );
            case 'challenges':
                return <DepartmentChallenges challenges={filteredChallenges} onEdit={setItemToEdit} onDelete={setItemToDelete} onViewDetails={setItemToView} />;
            case 'opportunities':
                return <DepartmentOpportunities opportunities={filteredOpportunities} onEdit={setItemToEdit} onDelete={setItemToDelete} onViewDetails={setItemToView} />;
            case 'team':
                return <DepartmentTeam employees={filteredEmployees} onViewDetails={setEmployeeToView} onEdit={setEmployeeToEdit} onDelete={setEmployeeToDelete} />;
            case 'procedures':
                 return <DepartmentProcedures procedures={filteredProcedures} onViewProcedure={setProcedureToView} />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'about', label: t('departments.about'), icon: null },
        { id: 'challenges', label: t('departments.departmentChallenges'), icon: <ChallengesIcon className="w-5 h-5" /> },
        { id: 'opportunities', label: t('departments.departmentOpportunities'), icon: <OpportunitiesIcon className="w-5 h-5" /> },
        { id: 'team', label: t('departments.departmentTeam'), icon: <TeamIcon className="w-5 h-5" /> },
        { id: 'procedures', label: t('departments.departmentProcedures'), icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="space-y-6">
            <PageTitle />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Modals */}
            {itemToView?.type === 'challenge' && <ChallengeDetailsModal isOpen={!!itemToView} challenge={itemToView as Challenge} onClose={() => setItemToView(null)} onEdit={setItemToEdit} onDelete={setItemToDelete} onDirectUpdate={(c) => updateChallengeDirectly(c)} />}
            {itemToEdit?.type === 'challenge' && <AddChallengeModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSaveInitiative} challengeToEdit={itemToEdit as Challenge} />}
            {itemToView?.type === 'opportunity' && <OpportunityDetailsModal isOpen={!!itemToView} opportunity={itemToView as Opportunity} onClose={() => setItemToView(null)} onEdit={setItemToEdit} onDelete={setItemToDelete} />}
            {itemToEdit?.type === 'opportunity' && <AddOpportunityModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSaveInitiative} opportunityToEdit={itemToEdit as Opportunity} />}
            <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} title={t('delete')} message={t('deleteConfirmation')} />
            
            <EmployeeDetailsModal isOpen={!!employeeToView || !!employeeToEdit} onClose={() => { setEmployeeToView(null); setEmployeeToEdit(null); }} employee={employeeToView || employeeToEdit} initialMode={employeeToEdit ? 'edit' : 'view'} onSave={handleSaveEmployee} onDelete={setEmployeeToDelete} />
            <ConfirmationModal isOpen={!!employeeToDelete} onClose={() => setEmployeeToDelete(null)} onConfirm={handleConfirmDeleteEmployee} title={t('team.deleteProfile')} message={t('team.deleteConfirm', { name: employeeToDelete?.name[language] || '' })} />
            
            <ProcedureDetailsModal isOpen={!!procedureToView} onClose={() => setProcedureToView(null)} procedure={procedureToView} onEdit={setProcedureToEdit} onDelete={(p) => deleteProcedure(p.id)} />
            <ProcedureFormModal isOpen={!!procedureToEdit} onClose={() => setProcedureToEdit(null)} onSave={handleSaveProcedure} procedureToEdit={procedureToEdit} />

            <Card>
                <select onChange={e => setSelectedDepartmentId(e.target.value)} value={selectedDepartmentId || ''} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border-natural-300 dark:border-natural-600">
                    <option value="">{t('departments.selectDepartment')}</option>
                    {allDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name[language]}</option>
                    ))}
                </select>
            </Card>

            {selectedDepartmentId && (
                <div className="border-b border-natural-200 dark:border-natural-700">
                    <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Department Tabs">
                        {tabs.map(tab => (
                             <button key={tab.id} onClick={() => handleTabClick(tab.id as DepartmentTab)} className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === tab.id ? 'border-dark-purple-500 text-dark-purple-600 dark:text-dark-purple-400' : 'border-transparent text-natural-500 hover:text-natural-700'}`}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            {renderContent()}
        </div>
    );
};
export default Departments;
