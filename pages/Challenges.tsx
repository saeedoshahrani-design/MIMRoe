import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import Card from '../components/Card.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { SearchIcon, ChallengesIcon, PlusIcon } from '../components/icons/IconComponents.tsx';
import { Challenge, Opportunity, Initiative, OpportunityStatus } from '../types.ts';
import { departments } from '../data/mockData.ts';
import PageTitle from '../components/PageTitle.tsx';
import AddChallengeModal from '../components/AddChallengeModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal.tsx';
import Toast from '../components/Toast.tsx';
import { locales } from '../i18n/locales.ts';
import { useChallenges } from '../context/ChallengesContext.tsx';
import { useOpportunities } from '../context/OpportunitiesContext.tsx';
import OpportunityCard from '../components/OpportunityCard.tsx';
import AddOpportunityModal from '../components/AddOpportunityModal.tsx';
import OpportunityDetailsModal from '../components/OpportunityDetailsModal.tsx';
import ChallengeCard from '../components/challenges/ChallengeCard.tsx';


const Challenges: React.FC = () => {
    const { t, language } = useLocalization();
    const { challenges, addChallenge, updateChallenge, deleteChallenge, updateChallengeDirectly } = useChallenges();
    const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<'all' | 'challenge' | 'opportunity'>('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    
    // State for Challenge Modals
    const [isAddChallengeModalOpen, setIsAddChallengeModalOpen] = useState(false);
    const [challengeToEdit, setChallengeToEdit] = useState<Challenge | null>(null);
    const [challengeToView, setChallengeToView] = useState<Challenge | null>(null);

    // State for Opportunity Modals
    const [isAddOpportunityModalOpen, setIsAddOpportunityModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
    const [opportunityToView, setOpportunityToView] = useState<Opportunity | null>(null);
    
    // Unified state for deletion
    const [itemToDelete, setItemToDelete] = useState<Initiative | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const initiatives = useMemo<Initiative[]>(() => [...challenges, ...opportunities], [challenges, opportunities]);

    const statusFilterMap = useMemo(() => {
        const map = new Map<string, { challengeStatus: Challenge['status'] | null, opportunityStatus: OpportunityStatus | null }>();

        const challengeStatuses = t('challenges.statusOptions', {}) as Record<string, string>;
        const opportunityStatuses = t('opportunities.statusOptions', {}) as Record<OpportunityStatus, string>;

        // Add challenge statuses using their AR value as the canonical reference
        for (const key in challengeStatuses) {
            const label = challengeStatuses[key];
            const arStatusValue = locales.ar.challenges.statusOptions[key as keyof typeof locales.ar.challenges.statusOptions];
            map.set(label, { challengeStatus: arStatusValue as Challenge['status'], opportunityStatus: null });
        }

        // Add/merge opportunity statuses
        for (const key in opportunityStatuses) {
            const label = opportunityStatuses[key as OpportunityStatus];
            const existing = map.get(label);
            if (existing) {
                existing.opportunityStatus = key as OpportunityStatus;
            } else {
                map.set(label, { challengeStatus: null, opportunityStatus: key as OpportunityStatus });
            }
        }
        return map;
    }, [language, t]);

    const allStatusOptions = useMemo(() => Array.from(statusFilterMap.keys()), [statusFilterMap]);

    const filteredInitiatives = useMemo(() => {
        return initiatives.filter(item => {
            if (selectedType !== 'all' && item.type !== selectedType) {
                return false;
            }

            const searchLower = searchTerm.toLowerCase();
            
            let matchesSearch = false;
            if (searchTerm.trim()) {
                if (item.type === 'challenge') {
                    matchesSearch =
                        (item.title || '').toLowerCase().includes(searchLower) ||
                        (item.description || '').toLowerCase().includes(searchLower) ||
                        (item.code || '').toLowerCase().includes(searchLower);
                } else { // Opportunity
                    // Ensure item.title exists and is an object before accessing properties
                    const titleEn = (item.title && typeof item.title === 'object' && 'en' in item.title) ? item.title.en : '';
                    const titleAr = (item.title && typeof item.title === 'object' && 'ar' in item.title) ? item.title.ar : '';
                    const currentSituationEn = (item.currentSituation && typeof item.currentSituation === 'object' && 'en' in item.currentSituation) ? item.currentSituation.en : '';
                    const currentSituationAr = (item.currentSituation && typeof item.currentSituation === 'object' && 'ar' in item.currentSituation) ? item.currentSituation.ar : '';
                    const proposedSolutionEn = (item.proposedSolution && typeof item.proposedSolution === 'object' && 'en' in item.proposedSolution) ? item.proposedSolution.en : '';
                    const proposedSolutionAr = (item.proposedSolution && typeof item.proposedSolution === 'object' && 'ar' in item.proposedSolution) ? item.proposedSolution.ar : '';

                    matchesSearch =
                        (titleEn || '').toLowerCase().includes(searchLower) ||
                        (titleAr || '').toLowerCase().includes(searchLower) ||
                        (currentSituationEn || '').toLowerCase().includes(searchLower) ||
                        (currentSituationAr || '').toLowerCase().includes(searchLower) ||
                        (proposedSolutionEn || '').toLowerCase().includes(searchLower) ||
                        (proposedSolutionAr || '').toLowerCase().includes(searchLower) ||
                        (item.code || '').toLowerCase().includes(searchLower);
                }
            } else {
                matchesSearch = true;
            }


            let matchesStatus = true;
            if (selectedStatus !== 'all') {
                const matchKeys = statusFilterMap.get(selectedStatus);
                if (matchKeys) {
                    const isChallengeMatch = item.type === 'challenge' && item.status === matchKeys.challengeStatus;
                    const isOpportunityMatch = item.type === 'opportunity' && item.status === matchKeys.opportunityStatus;
                    matchesStatus = isChallengeMatch || isOpportunityMatch;
                } else {
                    matchesStatus = false;
                }
            }

            const matchesDepartment = selectedDepartment === 'all' || item.department === selectedDepartment;
            
            return matchesSearch && matchesStatus && matchesDepartment;
        });
    }, [searchTerm, initiatives, selectedType, selectedStatus, selectedDepartment, language, statusFilterMap]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedStatus('all');
        setSelectedDepartment('all');
    };

    // Challenge Handlers
    const handleSaveChallenge = useCallback((challengeData: Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'> & { id?: string }) => {
        const { id, ...saveData } = challengeData;
        if (id) {
            updateChallenge(id, saveData);
            setToast({ message: t('challenges.notifications.updateSuccess'), type: 'success' });
        } else {
            addChallenge(saveData);
            setToast({ message: t('challenges.notifications.addSuccess'), type: 'success' });
        }
        setIsAddChallengeModalOpen(false);
        setChallengeToEdit(null);
    }, [t, addChallenge, updateChallenge]);

    const handleDirectUpdateChallenge = useCallback((updatedChallenge: Challenge) => {
        updateChallengeDirectly(updatedChallenge);
        setChallengeToView(updatedChallenge);
    }, [updateChallengeDirectly]);

    // Opportunity Handlers
    const handleSaveOpportunity = useCallback((opportunityData: Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'> & { id?: string }) => {
        const { id, ...saveData } = opportunityData;
        if (id) {
            updateOpportunity(id, saveData);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
        } else {
            addOpportunity(saveData);
            setToast({ message: t('opportunities.notifications.addSuccess'), type: 'success' });
        }
        setIsAddOpportunityModalOpen(false);
        setOpportunityToEdit(null);
    }, [t, addOpportunity, updateOpportunity]);


    // Unified Deletion
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


    return (
        <div className="space-y-6">
            <PageTitle />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* --- MODALS --- */}
            <AddChallengeModal 
                isOpen={isAddChallengeModalOpen || !!challengeToEdit}
                onClose={() => { setIsAddChallengeModalOpen(false); setChallengeToEdit(null); }}
                onSave={handleSaveChallenge}
                challengeToEdit={challengeToEdit}
            />
             <AddOpportunityModal 
                isOpen={isAddOpportunityModalOpen || !!opportunityToEdit}
                onClose={() => { setIsAddOpportunityModalOpen(false); setOpportunityToEdit(null); }}
                onSave={handleSaveOpportunity}
                opportunityToEdit={opportunityToEdit}
            />
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t(itemToDelete?.type === 'challenge' ? 'challenges.deleteChallenge' : 'opportunities.deleteOpportunity')}
                message={t(itemToDelete?.type === 'challenge' ? 'challenges.deleteChallengeConfirm' : 'opportunities.deleteOpportunityConfirm')}
            />
            {challengeToView && <ChallengeDetailsModal
                isOpen={!!challengeToView}
                challenge={challengeToView}
                onClose={() => setChallengeToView(null)}
                onEdit={(challenge) => { setChallengeToView(null); setChallengeToEdit(challenge); }}
                onDelete={(challenge) => { setChallengeToView(null); setItemToDelete(challenge); }}
                onDirectUpdate={handleDirectUpdateChallenge}
            />}
            {opportunityToView && <OpportunityDetailsModal
                isOpen={!!opportunityToView}
                opportunity={opportunityToView}
                onClose={() => setOpportunityToView(null)}
                onEdit={(op) => { setOpportunityToView(null); setOpportunityToEdit(op); }}
                onDelete={(op) => { setOpportunityToView(null); setItemToDelete(op); }}
            />}

            <Card>
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <select value={selectedType} onChange={e => setSelectedType(e.target.value as any)} className="bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md focus:ring-dark-purple-500 focus:border-dark-purple-500">
                                <option value="all">{t('challenges.typeOptions.all')}</option>
                                <option value="challenge">{t('challenges.typeOptions.challenges')}</option>
                                <option value="opportunity">{t('challenges.typeOptions.opportunities')}</option>
                            </select>
                            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md focus:ring-dark-purple-500 focus:border-dark-purple-500">
                                <option value="all">{t('challenges.status')}</option>
                                {allStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md focus:ring-dark-purple-500 focus:border-dark-purple-500">
                                <option value="all">{t('challenges.selectDepartment')}</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.name.ar}>{dept.name[language]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('search') + '...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-2 ps-10 pe-4 focus:ring-dark-purple-500 focus:border-dark-purple-500"
                            />
                            <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-natural-400" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-natural-200 dark:border-natural-700">
                        <button onClick={clearAllFilters} className="text-sm text-dark-purple-600 dark:text-dark-purple-400 hover:underline">
                            {t('clearFilters')}
                        </button>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setIsAddOpportunityModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-natural-700 border border-dark-purple-600 text-dark-purple-600 dark:text-dark-purple-300 rounded-md text-sm font-medium hover:bg-dark-purple-50 dark:hover:bg-dark-purple-900/40">
                                <PlusIcon className="w-4 h-4" />
                                {t('challenges.addOpportunity')}
                            </button>
                            <button onClick={() => setIsAddChallengeModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700">
                                <PlusIcon className="w-4 h-4" />
                                {t('challenges.addChallenge')}
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <div>
                {filteredInitiatives.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {filteredInitiatives.map(item => {
                           if (item.type === 'challenge') {
                               return <ChallengeCard 
                                   key={item.id} 
                                   challenge={item}
                                   onEdit={setChallengeToEdit}
                                   onDelete={setItemToDelete}
                                   onViewDetails={setChallengeToView} 
                               />
                           }
                           if (item.type === 'opportunity') {
                               return <OpportunityCard 
                                   key={item.id}
                                   opportunity={item}
                                   onEdit={setOpportunityToEdit}
                                   onDelete={setItemToDelete}
                                   onViewDetails={setOpportunityToView}
                               />
                           }
                           return null;
                        })}
                    </div>
                ) : (
                    <Card>
                        <EmptyState 
                            icon={<ChallengesIcon className="h-12 w-12" />}
                            message={t('challenges.noMatchFilters')} 
                        />
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Challenges;