import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Opportunity, OpportunityStatus } from '../types';
import Card from './Card';
import { EyeIcon, PencilIcon, TrashIcon } from './icons/IconComponents';
import { getPriorityBadgeStyle } from '../utils/priority';
import { locales } from '../i18n/locales';

interface OpportunityCardProps {
    opportunity: Opportunity;
    onEdit: (opportunity: Opportunity) => void;
    onDelete: (opportunity: Opportunity) => void;
    onViewDetails: (opportunity: Opportunity) => void;
}

// ActionButton component copied from Challenges page for identical styling
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


// Updated getStatusChipStyle to match Challenge colors for consistency
const getStatusChipStyle = (status: OpportunityStatus) => {
    switch (status) {
        case 'Under Review': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'; // Match 'قيد المراجعة'
        case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'; // Match 'قيد المعالجة'
        case 'Implemented': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'; // Match 'مغلق'
        case 'On Hold': return 'bg-natural-100 text-natural-800 dark:bg-natural-700 dark:text-natural-200'; // Default gray
        default: return 'bg-natural-100 text-natural-800 dark:bg-natural-700 dark:text-natural-200';
    }
};

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onEdit, onDelete, onViewDetails }) => {
    const { t } = useLocalization();

    return (
        <Card className="border-bright-blue-500 dark:border-bright-blue-500">
            <div className="flex justify-between items-start gap-4">
                 <div className="flex-1 text-left rtl:text-right min-w-0">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-natural-900 dark:bg-yellow-400 dark:text-natural-900">
                            {opportunity.code}
                        </span>
                        <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${getPriorityBadgeStyle(opportunity.priority_category)}`}
                            title={t('challenges.priorityBadgeTooltip')}
                        >
                            {t(`challenges.priorityCategories.${opportunity.priority_category as keyof typeof locales.en.challenges.priorityCategories}`)}
                        </span>
                    </div>
                    <h3 className="font-bold text-lg text-natural-800 dark:text-natural-100 break-words">{opportunity.title}</h3>
                    <p className="text-sm font-medium text-natural-500 dark:text-natural-400 mt-1">{opportunity.department}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 space-y-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipStyle(opportunity.status)}`}>
                        {t(`opportunities.statusOptions.${opportunity.status}`)}
                    </span>
                </div>
            </div>
            <p className="mt-2 text-sm text-natural-600 dark:text-natural-300 line-clamp-2 break-words whitespace-pre-line">{opportunity.proposedSolution}</p>
            
            <div className="mt-4 border-t border-natural-200 dark:border-natural-700 pt-4">
                 <div className="w-full" aria-label={t('challenges.progress')}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-natural-800 dark:text-natural-100">{t('challenges.progress')}</span>
                    </div>
                    <div className="relative w-full">
                        <div className="relative w-full bg-natural-200 dark:bg-natural-700 rounded-full h-3 overflow-hidden" role="presentation">
                            <div
                                className="absolute top-0 start-0 h-full bg-bright-blue-600 transition-all duration-500"
                                style={{ width: `${opportunity.progress}%`, transitionProperty: 'width' }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-natural-500 dark:text-natural-400">
                        <span className="font-bold text-bright-blue-700 dark:text-bright-blue-300">{t('challenges.actualProgress')}: {opportunity.progress}%</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 border-t border-natural-200 dark:border-natural-700 pt-3 flex flex-wrap justify-end items-center text-sm gap-2">
                <div className="flex items-center">
                    <ActionButton
                        onClick={() => onViewDetails(opportunity)}
                        label={t('viewDetails')}
                        ariaLabel={`${t('viewDetails')} for ${opportunity.title}`}
                        icon={<EyeIcon className="h-5 w-5" />}
                        className="text-natural-500 hover:bg-natural-100 dark:hover:bg-natural-700 hover:text-dark-purple-600 dark:hover:text-dark-purple-400"
                    />
                    <ActionButton
                        onClick={() => onEdit(opportunity)}
                        label={t('edit')}
                        ariaLabel={`${t('edit')} for ${opportunity.title}`}
                        icon={<PencilIcon className="h-5 w-5" />}
                        className="text-natural-500 hover:bg-natural-100 dark:hover:bg-natural-700 hover:text-dark-purple-600 dark:hover:text-dark-purple-400"
                    />
                    <ActionButton
                        onClick={() => onDelete(opportunity)}
                        label={t('delete')}
                        ariaLabel={`${t('delete')} for ${opportunity.title}`}
                        icon={<TrashIcon className="h-5 w-5" />}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-400"
                    />
                </div>
            </div>
        </Card>
    );
};

export default OpportunityCard;