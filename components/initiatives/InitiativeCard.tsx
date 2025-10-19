import React from 'react';
import { StrategicInitiative } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import Card from '../Card';
// FIX: Changed CalendarIcon to CalendarDaysIcon
import { CalendarDaysIcon as CalendarIcon } from '../icons/IconComponents';

interface InitiativeCardProps {
    initiative: StrategicInitiative;
    onSelect: (initiative: StrategicInitiative) => void;
}

const InitiativeCard: React.FC<InitiativeCardProps> = ({ initiative, onSelect }) => {
    const { language, formatDate } = useLocalization();

    return (
        <Card 
            className="group relative flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-dark-purple-400 dark:hover:border-dark-purple-500 cursor-pointer"
            onClick={() => onSelect(initiative)}
        >
            <h3 className="font-bold text-lg text-natural-800 dark:text-natural-100 break-words line-clamp-2">{initiative.name[language]}</h3>
            <p className="text-sm text-natural-600 dark:text-natural-300 mt-2 line-clamp-3 flex-grow break-words whitespace-normal">{initiative.description[language]}</p>
            
            <div className="mt-4 pt-3 border-t border-natural-200 dark:border-natural-700 flex items-center justify-between text-xs text-natural-500 dark:text-natural-400">
                <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(initiative.startDate)}</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(initiative.endDate)}</span>
                </div>
            </div>
        </Card>
    );
};

export default InitiativeCard;