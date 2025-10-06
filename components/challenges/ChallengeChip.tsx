import React from 'react';
import { Challenge } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { BoltIcon } from '../icons/IconComponents';
import { locales } from '../../i18n/locales';

interface ChallengeChipProps {
    challenge: Challenge;
    onClick: (challenge: Challenge) => void;
}

const statusColorMap: Record<Challenge['status'], string> = {
    'جديد': 'bg-yellow-400',
    'قيد المعالجة': 'bg-blue-400',
    'قيد المراجعة': 'bg-orange-400',
    'مغلق': 'bg-green-500',
};

const ChallengeChip: React.FC<ChallengeChipProps> = ({ challenge, onClick }) => {
    const { t, language } = useLocalization();
    const statusDotColor = statusColorMap[challenge.status] || 'bg-natural-400';

    const effortLevel = t(`dashboard.matrix.levels.${challenge.effort === 'منخفض' ? 'low' : challenge.effort === 'متوسط' ? 'medium' : 'high'}`);
    const impactLevel = t(`dashboard.matrix.levels.${challenge.impact === 'منخفض' ? 'low' : challenge.impact === 'متوسط' ? 'medium' : 'high'}`);

    return (
        <div className="relative group">
            <button
                onClick={() => onClick(challenge)}
                className="relative flex items-center h-7 px-2.5 space-x-2 rtl:space-x-reverse bg-slate-800/90 dark:bg-slate-700/90 text-white font-mono text-sm rounded-full shadow-md hover:ring-2 hover:ring-bright-blue-500/60 focus:outline-none focus:ring-2 focus:ring-bright-blue-500/60 transition-all duration-200 transform hover:scale-105 active:scale-100"
            >
                <div className={`absolute -top-0.5 -right-0.5 rtl:-left-0.5 rtl:-right-auto h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${statusDotColor}`} title={challenge.status} />

                {challenge.priority_category === 'major_projects' && (
                    <BoltIcon className="w-3.5 h-3.5 text-yellow-300 opacity-80" />
                )}
                <span>{challenge.code}</span>
            </button>
            <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-natural-800 text-white text-xs text-left rtl:text-right rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
                role="tooltip"
            >
                <p className="font-bold text-sm mb-1 break-words">{language === 'ar' ? challenge.title_ar : challenge.title_en}</p>
                <p>{challenge.department}</p>
                <p>{t('challenges.status')}: <span className="font-semibold">{t(`dashboard.chartStatus.${challenge.status as keyof typeof locales.en.dashboard.chartStatus}`)}</span></p>
                <div className="mt-1 pt-1 border-t border-natural-600">
                    <p>{t('challenges.effort')}: {effortLevel}</p>
                    <p>{t('challenges.impact')}: {impactLevel}</p>
                </div>
            </div>
        </div>
    );
};

export default ChallengeChip;