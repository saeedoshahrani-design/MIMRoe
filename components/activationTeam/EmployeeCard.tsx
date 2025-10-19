import React from 'react';
import { Employee } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import Card from '../Card';
import { UserCircleIcon, PencilIcon, TrashIcon } from '../icons/IconComponents';

interface EmployeeCardProps {
    employee: Employee;
    onViewDetails: (employee: Employee) => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onViewDetails, onEdit, onDelete }) => {
    const { t, language } = useLocalization();

    return (
        <Card className="flex flex-col items-center text-center p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative">
             <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                    onClick={() => onEdit(employee)} 
                    className="p-1.5 rounded-full text-natural-500 hover:bg-natural-200 dark:hover:bg-natural-700"
                    aria-label={t('team.editProfile')}
                    title={t('team.editProfile')}
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => onDelete(employee)}
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                    aria-label={t('team.deleteProfile')}
                    title={t('team.deleteProfile')}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="relative mb-4">
                {employee.avatar ? (
                    <img 
                        src={employee.avatar} 
                        alt={employee.name?.[language]} 
                        className="w-28 h-28 rounded-full object-cover border-4 border-natural-200 dark:border-natural-700"
                    />
                ) : (
                    <div className="w-28 h-28 rounded-full bg-natural-100 dark:bg-natural-700 flex items-center justify-center border-4 border-natural-200 dark:border-natural-700">
                        <UserCircleIcon className="w-20 h-20 text-natural-400 dark:text-natural-500" />
                    </div>
                )}
            </div>

            <h3 className="font-bold text-lg text-natural-800 dark:text-natural-100">{employee.name?.[language] || ''}</h3>
            <p className="text-sm text-natural-500 dark:text-natural-400 mb-4">{employee.title?.[language] || ''}</p>

            <button 
                onClick={() => onViewDetails(employee)}
                className="mt-auto w-full px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple-500 dark:focus:ring-offset-natural-800"
            >
                {t('team.viewProfile')}
            </button>
        </Card>
    );
};

export default EmployeeCard;
