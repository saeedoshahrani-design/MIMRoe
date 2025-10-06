import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Challenge } from '../types';
import { useAppContext } from '../context/AppContext';
import { locales } from '../i18n/locales';

interface AdherenceData {
    name: string;
    avgActual: number;
    avgPlanned: number;
    challenges: Challenge[];
}

interface TimelineAdherenceProps {
    data: AdherenceData[];
    onDepartmentClick: (department: AdherenceData) => void;
}

const TimelineAdherence: React.FC<TimelineAdherenceProps> = ({ data, onDepartmentClick }) => {
    const { t } = useLocalization();
    const { language } = useAppContext();
    const formatNumber = locales[language].formatNumber;
    
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-natural-400">{t('dashboard.charts.noData')}</div>;
    }

    return (
        <div className="space-y-4 overflow-y-auto h-full pr-2">
            {data.map(dept => (
                <div key={dept.name} onClick={() => onDepartmentClick(dept)} className="p-3 rounded-lg hover:bg-natural-100 dark:hover:bg-natural-700/50 cursor-pointer transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="text-sm font-semibold text-natural-800 dark:text-natural-100 truncate">{dept.name}</p>
                    </div>
                    <div className="relative h-3 w-full bg-natural-200 dark:bg-natural-700 rounded-full overflow-hidden">
                        <div className="absolute h-3 bg-dark-purple-300 dark:bg-dark-purple-800 rounded-full transition-all duration-500" style={{ width: `${dept.avgPlanned}%` }} />
                        <div className="absolute h-3 bg-mim-bright-blue rounded-full transition-all duration-500" style={{ width: `${dept.avgActual}%` }} />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs">
                        <span className="font-bold text-bright-blue-700 dark:text-bright-blue-300">{t('challenges.actualProgress')}: {formatNumber(dept.avgActual)}%</span>
                        <span className="font-bold text-dark-purple-700 dark:text-dark-purple-300">{t('challenges.plannedProgress')}: {formatNumber(dept.avgPlanned)}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TimelineAdherence;