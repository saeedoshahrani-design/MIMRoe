import React from 'react';
import { Opportunity } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { LightbulbIcon } from '../icons/IconComponents';

interface OpportunityChipProps {
    opportunity: Opportunity;
    onClick: (opportunity: Opportunity) => void;
}

const statusColorMap: Record<Opportunity['status'], string> = {
    'Under Review': 'bg-orange-400',
    'In Progress': 'bg-blue-400',
    'Implemented': 'bg-green-500',
    'On Hold': 'bg-slate-400',
};

const OpportunityChip: React.FC<OpportunityChipProps> = ({ opportunity, onClick }) => {
    const { t } = useLocalization();
    const statusDotColor = statusColorMap[opportunity.status] || 'bg-natural-400';

    const effortLevel = t(`dashboard.matrix.levels.${opportunity.effort === 'منخفض' ? 'low' : opportunity.effort === 'متوسط' ? 'medium' : 'high'}`);
    const impactLevel = t(`dashboard.matrix.levels.${opportunity.impact === 'منخفض' ? 'low' : opportunity.impact === 'متوسط' ? 'medium' : 'high'}`);

    return (
        <div className="relative group">
            <button
                onClick={() => onClick(opportunity)}
                className="relative flex items-center h-7 px-2.5 space-x-2 rtl:space-x-reverse bg-teal-800/90 dark:bg-teal-700/90 text-white font-mono text-sm rounded-full shadow-md hover:ring-2 hover:ring-bright-blue-500/60 focus:outline-none focus:ring-2 focus:ring-bright-blue-500/60 transition-all duration-200 transform hover:scale-105 active:scale-100"
            >
                <div className={`absolute -top-0.5 -right-0.5 rtl:-left-0.5 rtl:-right-auto h-2.5 w-2.5 rounded-full border-2 border-white dark:border-teal-800 ${statusDotColor}`} title={t(`opportunities.statusOptions.${opportunity.status}`)} />

                {opportunity.priority_category === 'major_projects' && (
                    <LightbulbIcon className="w-3.5 h-3.5 text-yellow-300 opacity-80" />
                )}
                <span>{opportunity.code}</span>
            </button>
            <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-natural-800 text-white text-xs text-left rtl:text-right rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
                role="tooltip"
            >
                <p className="font-bold text-sm mb-1 break-words">{opportunity.title}</p>
                <p>{opportunity.department}</p>
                <p>{t('challenges.status')}: <span className="font-semibold">{t(`opportunities.statusOptions.${opportunity.status}`)}</span></p>
                <div className="mt-1 pt-1 border-t border-natural-600">
                    <p>{t('challenges.effort')}: {effortLevel}</p>
                    <p>{t('challenges.impact')}: {impactLevel}</p>
                </div>
            </div>
        </div>
    );
};

export default OpportunityChip;