import React, { useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { Challenge } from '../../types';
import Card from '../Card';
import { EyeIcon, PencilIcon, TrashIcon } from '../icons/IconComponents';
import UnifiedProgressBar from '../UnifiedProgressBar';
import { calculateProgress } from '../../utils/calculateProgress';
import { calculatePlannedProgress, getPerformanceStatus } from '../../utils/calculatePlannedProgress';
import { getPriorityBadgeStyle } from '../../utils/priority';
import { locales } from '../../i18n/locales';

const getStatusChip = (status: Challenge['status']) => {
    switch (status) {
        case 'جديد': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'قيد المعالجة': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'قيد المراجعة': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case 'مغلق': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        default: return 'bg-natural-100 text-natural-800 dark:bg-natural-700 dark:text-natural-200';
    }
};

interface ActionButtonProps {
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    className?: string;
    ariaLabel: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, label, icon, className = '', ariaLabel }) => (
    <button
        onClick={onClick}
        title={label}
        aria-label={ariaLabel}
        className={`flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-md transition-colors duration-200 group ${className}`}
    >
        {icon}
        <span className="text-sm font-medium group-hover:block sm:hidden lg:block">{label}</span>
    </button>
);

interface ChallengeCardProps {
  challenge: Challenge;
  onEdit: (challenge: Challenge) => void;
  onDelete: (challenge: Challenge) => void;
  onViewDetails: (challenge: Challenge) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onEdit, onDelete, onViewDetails }) => {
    const { t, language } = useLocalization();
    
    const actualProgress = useMemo(() => calculateProgress(challenge.activities), [challenge.activities]);
    const plannedProgress = useMemo(() => calculatePlannedProgress(challenge.start_date, challenge.target_date), [challenge.start_date, challenge.target_date]);
    const performanceStatus = useMemo(() => getPerformanceStatus(actualProgress, plannedProgress), [actualProgress, plannedProgress]);
    
    return (
        <Card className="border-mim-dark-gray dark:border-mim-dark-gray">
            <div className="flex justify-between items-start gap-4">
                 <div className="flex-1 text-left rtl:text-right min-w-0">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-natural-900 dark:bg-yellow-400 dark:text-natural-900">
                            {challenge.code}
                        </span>
                        <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${getPriorityBadgeStyle(challenge.priority_category)}`}
                            title={t('challenges.priorityBadgeTooltip')}
                        >
                            {t(`challenges.priorityCategories.${challenge.priority_category as keyof typeof locales.en.challenges.priorityCategories}`)}
                        </span>
                    </div>
                    <h3 className="font-bold text-lg text-natural-800 dark:text-natural-100 break-words">{language === 'ar' ? challenge.title_ar : challenge.title_en}</h3>
                    <p className="text-sm font-medium text-natural-500 dark:text-natural-400 mt-1">{challenge.department}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 space-y-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(challenge.status)}`}>
                        {challenge.status}
                    </span>
                </div>
            </div>
            <p className="mt-2 text-sm text-natural-600 dark:text-natural-300 line-clamp-2 break-words whitespace-pre-line">{challenge.description}</p>
            
            <div className="mt-4 border-t border-natural-200 dark:border-natural-700 pt-4">
                <UnifiedProgressBar
                    actualProgress={actualProgress}
                    plannedProgress={plannedProgress}
                    status={performanceStatus}
                    startDate={challenge.start_date}
                    targetDate={challenge.target_date}
                />
            </div>

            <div className="mt-4 border-t border-natural-200 dark:border-natural-700 pt-3 flex flex-wrap justify-end items-center text-sm gap-2">
                <div className="flex items-center">
                    <ActionButton
                        onClick={() => onViewDetails(challenge)}
                        label={t('viewDetails')}
                        ariaLabel={`${t('viewDetails')} for ${language === 'ar' ? challenge.title_ar : challenge.title_en}`}
                        icon={<EyeIcon className="h-5 w-5" />}
                        className="text-natural-500 hover:bg-natural-100 dark:hover:bg-natural-700 hover:text-dark-purple-600 dark:hover:text-dark-purple-400"
                    />
                    <ActionButton
                        onClick={() => onEdit(challenge)}
                        label={t('edit')}
                        ariaLabel={`${t('edit')} for ${language === 'ar' ? challenge.title_ar : challenge.title_en}`}
                        icon={<PencilIcon className="h-5 w-5" />}
                        className="text-natural-500 hover:bg-natural-100 dark:hover:bg-natural-700 hover:text-dark-purple-600 dark:hover:text-dark-purple-400"
                    />
                    <ActionButton
                        onClick={() => onDelete(challenge)}
                        label={t('delete')}
                        ariaLabel={`${t('delete')} for ${language === 'ar' ? challenge.title_ar : challenge.title_en}`}
                        icon={<TrashIcon className="h-5 w-5" />}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-400"
                    />
                </div>
            </div>
        </Card>
    );
};

export default ChallengeCard;
