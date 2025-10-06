import React, { useState, useMemo, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SearchIcon, OpportunitiesIcon } from '../components/icons/IconComponents';
import { Opportunity, OpportunityStatus, OpportunityPriority } from '../types';
import { departments } from '../data/mockData';
import PageTitle from '../components/PageTitle';
import { useOpportunities } from '../context/OpportunitiesContext';
import OpportunityCard from '../components/OpportunityCard';
import AddOpportunityModal from '../components/AddOpportunityModal';
import ConfirmationModal from '../components/ConfirmationModal';
import OpportunityDetailsModal from '../components/OpportunityDetailsModal';
import Toast from '../components/Toast';

const Opportunities: React.FC = () => {
    const { t, language } = useLocalization();
    const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<OpportunityStatus | 'all'>('all');
    const [selectedPriority, setSelectedPriority] = useState<OpportunityPriority | 'all'>('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
    const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
    const [opportunityToView, setOpportunityToView] = useState<Opportunity | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(op => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = op.title.toLowerCase().includes(searchLower) ||
                                  op.code.toLowerCase().includes(searchLower) ||
                                  op.proposedSolution.toLowerCase().includes(searchLower);

            const matchesStatus = selectedStatus === 'all' || op.status === selectedStatus;
            const matchesPriority = selectedPriority === 'all' || op.priority === selectedPriority;
            const matchesDepartment = selectedDepartment === 'all' || op.department === selectedDepartment;

            return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
        });
    }, [searchTerm, opportunities, selectedStatus, selectedPriority, selectedDepartment]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedPriority('all');
        setSelectedDepartment('all');
    };
    
    const handleSave = (data: Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
        if (data.id) {
            updateOpportunity(data.id, data);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
        } else {
            addOpportunity(data);
            setToast({ message: t('opportunities.notifications.addSuccess'), type: 'success' });
        }
        setIsAddModalOpen(false);
        setOpportunityToEdit(null);
    };

    const handleConfirmDelete = () => {
        if (!opportunityToDelete) return;
        deleteOpportunity(opportunityToDelete.id);
        setToast({ message: t('opportunities.notifications.deleteSuccess'), type: 'success' });
        setOpportunityToDelete(null);
    };

    const statusOptions = Object.entries(t('opportunities.statusOptions', {}));
    const priorityOptions = Object.entries(t('opportunities.priorityOptions', {}));

    return (
        <div className="space-y-6">
            <PageTitle />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <AddOpportunityModal 
                isOpen={isAddModalOpen || !!opportunityToEdit}
                onClose={() => { setIsAddModalOpen(false); setOpportunityToEdit(null); }}
                onSave={handleSave}
                opportunityToEdit={opportunityToEdit}
            />
            <ConfirmationModal
                isOpen={!!opportunityToDelete}
                onClose={() => setOpportunityToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('opportunities.deleteOpportunity')}
                message={t('opportunities.deleteOpportunityConfirm')}
            />
            {opportunityToView && <OpportunityDetailsModal
                isOpen={!!opportunityToView}
                opportunity={opportunityToView}
                onClose={() => setOpportunityToView(null)}
                onEdit={(op) => { setOpportunityToView(null); setOpportunityToEdit(op); }}
                onDelete={(op) => { setOpportunityToView(null); setOpportunityToDelete(op); }}
            />}

            <Card>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as any)} className="bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md focus:ring-dark-purple-500 focus:border-dark-purple-500">
                            <option value="all">{t('opportunities.status')}</option>
                            {statusOptions.map(([key, value]) => <option key={key} value={key}>{String(value)}</option>)}
                        </select>
                        <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value as any)} className="bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md focus:ring-dark-purple-500 focus:border-dark-purple-500">
                            <option value="all">{t('opportunities.priority')}</option>
                            {priorityOptions.map(([key, value]) => <option key={key} value={key}>{String(value)}</option>)}
                        </select>
                        <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="lg:col-span-2 bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md focus:ring-dark-purple-500 focus:border-dark-purple-500">
                            <option value="all">{t('opportunities.selectDepartment')}</option>
                            {departments.map(dept => <option key={dept.id} value={dept.name.ar}>{dept.name[language]}</option>)}
                        </select>
                    </div>
                     <div className="relative">
                        <input
                            type="text"
                            placeholder={t('search') + '...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-2 ps-10 pe-4 focus:ring-dark-purple-500 focus:border-dark-purple-500"
                        />
                        <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-natural-400" />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-natural-200 dark:border-natural-700">
                        <button onClick={clearAllFilters} className="text-sm text-dark-purple-600 dark:text-dark-purple-400 hover:underline">
                            {t('clearFilters')}
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700">
                            {t('opportunities.addOpportunity')}
                        </button>
                    </div>
                </div>
            </Card>

            <div>
                {filteredOpportunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {filteredOpportunities.map(op => 
                           <OpportunityCard 
                               key={op.id} 
                               opportunity={op}
                               onEdit={setOpportunityToEdit}
                               onDelete={setOpportunityToDelete}
                               onViewDetails={setOpportunityToView} 
                           />
                        )}
                    </div>
                ) : (
                    <Card>
                        <EmptyState 
                            icon={<OpportunitiesIcon className="h-12 w-12" />}
                            message={t('noResultsFilters')} 
                        />
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Opportunities;