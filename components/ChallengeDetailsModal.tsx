import React, { useEffect, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Challenge } from '../types';
import { CloseIcon } from './icons/IconComponents';
import UnifiedProgressBar from './UnifiedProgressBar';
import { calculateProgress } from '../utils/calculateProgress';
import { calculatePlannedProgress, getPerformanceStatus } from '../utils/calculatePlannedProgress';
import { locales } from '../i18n/locales';
import { useDepartmentsData } from '../context/DepartmentsDataContext';
import { departments } from '../data/mockData';
import PriorityBadge from './PriorityBadge';
import { translateChallengeField, translateDepartment } from '../utils/localizationUtils';

interface ChallengeDetailsModalProps {
    isOpen: boolean;
    challenge: Challenge | null;
    onClose: () => void;
    onEdit: (challenge: Challenge) => void;
    onDelete: (challenge: Challenge) => void;
    onDirectUpdate: (challenge: Challenge) => void;
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
        <div>{value || '-'}</div>
    </div>
);

const ChallengeDetailsModal: React.FC<ChallengeDetailsModalProps> = ({ isOpen, challenge, onClose, onEdit, onDelete, onDirectUpdate }) => {
    const { t, language, formatDate } = useLocalization();
    const { getDepartmentData } = useDepartmentsData();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const linkedTargets = useMemo(() => {
        if (!challenge?.linkedTargetIds || challenge.linkedTargetIds.length === 0) {
            return [];
        }
        const department = departments.find(d => d.name.ar === challenge.department);
        if (!department) return [];

        const departmentData = getDepartmentData(department.id);
        return departmentData.targets.filter(target => challenge.linkedTargetIds?.includes(target.id));

    }, [challenge, getDepartmentData]);

    if (!isOpen || !challenge) return null;

    const actualProgress = calculateProgress(challenge.activities);
    const plannedProgress = calculatePlannedProgress(challenge.start_date, challenge.target_date);
    const performanceStatus = getPerformanceStatus(actualProgress, plannedProgress);
    
    const handleActivityToggle = (activityIndex: number) => {
        if (!challenge) return;
        const updatedActivities = [...challenge.activities];
        updatedActivities[activityIndex] = {
            ...updatedActivities[activityIndex],
            is_completed: !updatedActivities[activityIndex].is_completed,
        };
        const updatedChallenge = {
            ...challenge,
            activities: updatedActivities,
            updated_at: new Date().toISOString(),
        };
        onDirectUpdate(updatedChallenge);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{t('challenges.detailsModal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-natural-900 dark:bg-yellow-400 dark:text-natural-900">
                                {challenge.code}
                            </span>
                             <PriorityBadge priorityCategory={challenge.priority_category} />
                        </div>
                        <h1 className="text-xl font-bold text-natural-800 dark:text-natural-100 break-words">{challenge.title}</h1>
                        <p className="text-sm font-medium text-natural-500 dark:text-natural-400 mt-1">{t('challenges.detailsModal.responsibleDepartment')}: <span className="font-semibold">{translateDepartment(challenge.department, language)}</span></p>
                    </div>

                    <DetailSection title={t('challenges.progress')}>
                        <UnifiedProgressBar
                            actualProgress={actualProgress}
                            plannedProgress={plannedProgress}
                            status={performanceStatus}
                            startDate={challenge.start_date}
                            targetDate={challenge.target_date}
                        />
                    </DetailSection>

                    <DetailSection title={t('challenges.modal.description')}>
                        <p className="whitespace-pre-wrap break-words max-h-40 overflow-y-auto pr-2">{challenge.description}</p>
                    </DetailSection>

                    <DetailSection title={t('challenges.detailsModal.summary')}>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label={t('challenges.category')} value={translateChallengeField('category', challenge.category, t)} />
                            <DetailItem label={t('challenges.status')} value={translateChallengeField('status', challenge.status, t)} />
                            <DetailItem label={t('challenges.modal.impact')} value={translateChallengeField('impact', challenge.impact, t)} />
                            <DetailItem label={t('challenges.modal.effort')} value={translateChallengeField('effort', challenge.effort, t)} />
                        </div>
                    </DetailSection>

                     <DetailSection title={t('challenges.detailsModal.dates')}>
                         <div className="grid grid-cols-2 gap-4">
                            <DetailItem label={t('challenges.startDate')} value={formatDate(challenge.start_date)} />
                            <DetailItem label={t('challenges.targetDate')} value={formatDate(challenge.target_date)} />
                        </div>
                    </DetailSection>
                    
                    {linkedTargets.length > 0 && (
                        <DetailSection title={t('challenges.detailsModal.linkedTargets')}>
                            <div className="flex flex-wrap gap-2">
                                {linkedTargets.map(target => (
                                    <span key={target.id} className="px-2.5 py-1 text-xs font-medium rounded-full bg-dark-purple-100 text-dark-purple-800 dark:bg-dark-purple-800 dark:text-dark-purple-100">
                                        {target.name}
                                    </span>
                                ))}
                            </div>
                        </DetailSection>
                    )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailSection title={t('challenges.modal.progress_notes')}>
                            <p className="whitespace-pre-wrap break-words">{challenge.progress_notes || '-'}</p>
                        </DetailSection>
                        <DetailSection title={t('challenges.modal.remediation_plan')}>
                            <p className="whitespace-pre-wrap break-words">{challenge.remediation_plan || '-'}</p>
                        </DetailSection>
                    </div>

                    <DetailSection title={t('challenges.modal.requirements_enablers')}>
                        <p className="whitespace-pre-wrap break-words">{challenge.requirements_enablers || '-'}</p>
                    </DetailSection>

                    <DetailSection title={t('challenges.modal.activities')}>
                        {challenge.activities && challenge.activities.length > 0 ? (
                             <ul className="space-y-2">
                                {challenge.activities.map((activity, index) => (
                                    <li key={index} className="flex items-center p-2 bg-natural-50 dark:bg-natural-700/50 rounded-md gap-3">
                                        <input
                                            type="checkbox"
                                            id={`detail-activityCompleted-${challenge.id}-${index}`}
                                            checked={activity.is_completed}
                                            onChange={() => handleActivityToggle(index)}
                                            aria-label={activity.is_completed ? t('challenges.modal.unmarkActivity') : t('challenges.modal.markActivityCompleted')}
                                            className="h-4 w-4 rounded border-gray-300 text-dark-purple-600 focus:ring-dark-purple-500 flex-shrink-0"
                                        />
                                        <label htmlFor={`detail-activityCompleted-${challenge.id}-${index}`} className={`flex-1 cursor-pointer transition-colors break-words ${activity.is_completed ? 'line-through text-natural-500' : ''}`}>{activity.description}</label>
                                        <span className="font-bold text-sm px-2 py-0.5 rounded-full bg-dark-purple-100 dark:bg-dark-purple-800 text-dark-purple-800 dark:text-dark-purple-200">
                                            {t('challenges.modal.activityWeight')}: {activity.weight}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-natural-500 dark:text-natural-400 italic">-</p>
                        )}
                    </DetailSection>
                    
                     <DetailSection title={t('challenges.detailsModal.systemInfo')}>
                         <div className="grid grid-cols-2 gap-4 text-xs">
                            <DetailItem label={t('challenges.detailsModal.createdAt')} value={formatDate(challenge.created_at)} />
                            <DetailItem label={t('challenges.detailsModal.lastUpdated')} value={formatDate(challenge.updated_at)} />
                        </div>
                    </DetailSection>
                </div>
                
                <div className="flex justify-end items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg space-x-3 rtl:space-x-reverse">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-natural-700 dark:text-natural-200 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md hover:bg-natural-50 dark:hover:bg-natural-600">
                        {t('close')}
                    </button>
                    <button onClick={() => onEdit(challenge)} type="button" className="px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 border border-transparent rounded-md shadow-sm hover:bg-dark-purple-700">
                        {t('edit')}
                    </button>
                    <button onClick={() => onDelete(challenge)} type="button" className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                        {t('delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChallengeDetailsModal;