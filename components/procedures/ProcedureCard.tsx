import React from 'react';
import { Procedure } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import Card from '../Card';
import { PencilIcon, TrashIcon, ClockIcon, ComputerDesktopIcon, DocumentTextIcon } from '../icons/IconComponents';
import { departments } from '../../data/mockData';

interface ProcedureCardProps {
    procedure: Procedure;
    onViewDetails: (procedure: Procedure) => void;
    onEdit: (procedure: Procedure) => void;
    onDelete: (procedure: Procedure) => void;
}

const ProcedureCard: React.FC<ProcedureCardProps> = ({ procedure, onViewDetails, onEdit, onDelete }) => {
    const { t, language } = useLocalization();
    const departmentName = departments.find(d => d.id === procedure.departmentId)?.name[language] || procedure.departmentId;

    const eReadinessInfo = {
        'electronic': {
            text: t('procedures.electronic'),
            icon: <ComputerDesktopIcon className="w-4 h-4" />,
            className: 'text-green-700 dark:text-green-300',
        },
        'partially-electronic': {
            text: t('procedures.partiallyElectronic'),
            icon: <ComputerDesktopIcon className="w-4 h-4" />,
            className: 'text-yellow-700 dark:text-yellow-300',
        },
        'not-electronic': {
            text: t('procedures.notElectronic'),
            icon: <DocumentTextIcon className="w-4 h-4" />,
            className: 'text-red-700 dark:text-red-400',
        }
    }[procedure.eReadiness];


    return (
        <Card className="group relative flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-dark-purple-400 dark:hover:border-dark-purple-500">
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button onClick={(e) => { e.stopPropagation(); onEdit(procedure); }} className="p-1.5 rounded-full text-natural-500 hover:bg-natural-200 dark:hover:bg-natural-700" title={t('edit')}>
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(procedure); }} className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title={t('delete')}>
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            <div onClick={() => onViewDetails(procedure)} className="cursor-pointer flex-grow flex flex-col">
                <div className="flex justify-between items-start">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-natural-200 text-natural-700 dark:bg-natural-700 dark:text-natural-200 mb-2">
                        {procedure.code}
                    </span>
                </div>
                <h3 className="font-bold text-lg text-natural-800 dark:text-natural-100 break-words line-clamp-2">{procedure.title[language]}</h3>
                <p className="text-sm text-natural-500 dark:text-natural-400 mt-1 truncate">{departmentName}</p>
                <p className="text-sm text-natural-600 dark:text-natural-300 mt-2 line-clamp-3 flex-grow break-words whitespace-normal">{procedure.description[language]}</p>
                
                <div className="mt-4 pt-3 border-t border-natural-200 dark:border-natural-700 flex items-center justify-between text-xs text-natural-500 dark:text-natural-400">
                    {eReadinessInfo && (
                        <div className={`flex items-center gap-1.5 ${eReadinessInfo.className}`}>
                            {eReadinessInfo.icon}
                            <span className="font-semibold">{eReadinessInfo.text}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        <span>{procedure.durationDays ? `${procedure.durationDays} ${t('departments.targets.unitOptions.days')}` : '-'}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProcedureCard;