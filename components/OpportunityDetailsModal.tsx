
import React, { useEffect, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Opportunity } from '../types';
import { CloseIcon } from './icons/IconComponents';
import { useDepartmentsData } from '../context/DepartmentsDataContext';
import { departments } from '../data/mockData';
import { getPriorityBadgeStyle } from '../utils/priority';
import { locales } from '../i18n/locales';
import PriorityBadge from './PriorityBadge';
import { translateChallengeField, translateDepartment } from '../utils/localizationUtils';

interface OpportunityDetailsModalProps {
    isOpen: boolean;
    opportunity: Opportunity | null;
    onClose: () => void;
    onEdit: (opportunity: Opportunity) => void;
    onDelete: (opportunity: Opportunity) => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={className}>
        <h3 className="text-sm font-bold text-natural-500 dark:text-natural-400 uppercase tracking-wider border-b border-natural-200 dark:border-natural-700 pb-1 mb-3">
            {title}
        </h3>
        <div className="text-natural-700 dark:text-natural-200 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-natural-500 dark:text-natural-400">{label}</p>
        <div className="font-medium">{value || '-'}</div>
    </div>
);

const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({ isOpen, opportunity, onClose, onEdit, onDelete }) => {
    const { t, language, formatDate } = useLocalization();
    const { getDepartmentData } = useDepartmentsData();
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    const linkedTargets = useMemo(() => {
        if (!opportunity?.linkedTargetIds || opportunity.linkedTargetIds.length === 0) return [];
        const department = departments.find(d => d.name.ar === opportunity.department);
        if (!department) return [];
        const departmentData = getDepartmentData(department.id);
        return departmentData.targets.filter(target => opportunity.linkedTargetIds?.includes(target.id));
    }, [opportunity, getDepartmentData]);

    if (!isOpen || !opportunity) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{t('opportunities.modal.detailsTitle')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                            <span className="text-xs font-mono bg-natural-200 dark:bg-natural-700 px-2 py-1 rounded">{opportunity.code}</span>
                            <PriorityBadge priorityCategory={opportunity.priority_category} />
                        </div>
                        <h1 className="text-xl font-bold text-natural-800 dark:text-natural-100 break-words">{opportunity.title[language]}</h1>
                    </div>
                    <DetailSection title={t('challenges.detailsModal.summary')}>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label={t('opportunities.modal.responsibleDepartment')} value={translateDepartment(opportunity.department, language)} />
                            <DetailItem label={t('opportunities.status')} value={t(`opportunities.statusOptions.${opportunity.status}`)} />
                            <DetailItem label={t('opportunities.modal.progress')} value={`${opportunity.progress}%`} />
                        </div>
                    </DetailSection>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailSection title={t('opportunities.modal.currentSituation')}>
                            <p className="whitespace-pre-wrap break-words">{opportunity.currentSituation[language]}</p>
                        </DetailSection>
                        <DetailSection title={t('opportunities.modal.proposedSolution')}>
                            <p className="whitespace-pre-wrap break-words">{opportunity.proposedSolution[language]}</p>
                        </DetailSection>
                    </div>
                    
                    <DetailSection title={t('challenges.detailsModal.summary')}>
                         <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                            <DetailItem label={t('challenges.modal.impact')} value={translateChallengeField('impact', opportunity.impact, t)} />
                            <DetailItem label={t('challenges.modal.effort')} value={translateChallengeField('effort', opportunity.effort, t)} />
                        </div>
                    </DetailSection>

                    {linkedTargets.length > 0 && (
                        <DetailSection title={t('challenges.modal.linkedTargets')}>
                            <div className="flex flex-wrap gap-2">
                                {linkedTargets.map(target => (
                                    <span key={target.id} className="px-2.5 py-1 text-xs font-medium rounded-full bg-dark-purple-100 text-dark-purple-800 dark:bg-dark-purple-800 dark:text-dark-purple-100">
                                        {target.name}
                                    </span>
                                ))}
                            </div>
                        </DetailSection>
                    )}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DetailSection title={t('opportunities.modal.owner')}>
                            <p>{opportunity.owner?.[language] || '-'}</p>
                        </DetailSection>
                        <DetailSection title={t('challenges.detailsModal.dates')}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <DetailItem label={t('opportunities.modal.startDate')} value={formatDate(opportunity.startDate)} />
                                <DetailItem label={t('opportunities.modal.dueDate')} value={formatDate(opportunity.dueDate)} />
                            </div>
                        </DetailSection>
                    </div>
                     <DetailSection title={t('opportunities.modal.notes')}>
                        <p className="whitespace-pre-wrap max-h-24 overflow-y-auto break-words">{opportunity.notes || '-'}</p>
                    </DetailSection>
                </div>
                <div className="flex justify-end items-center p-4 mt-auto border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg space-x-3 rtl:space-x-reverse">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium rounded-md">{t('close')}</button>
                    <button onClick={() => onEdit(opportunity)} type="button" className="px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">{t('edit')}</button>
                    <button onClick={() => onDelete(opportunity)} type="button" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">{t('delete')}</button>
                </div>
            </div>
        </div>
    );
};

export default OpportunityDetailsModal;