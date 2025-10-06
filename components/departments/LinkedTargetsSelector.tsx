import React, { useState, useMemo, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useDepartmentsData } from '../../context/DepartmentsDataContext';
import { DepartmentTarget } from '../../types';
import { SearchIcon } from '../icons/IconComponents';

interface LinkedTargetsSelectorProps {
    departmentId: string | null;
    value: string[];
    onChange: (newValue: string[]) => void;
}

const LinkedTargetsSelector: React.FC<LinkedTargetsSelectorProps> = ({ departmentId, value, onChange }) => {
    const { t } = useLocalization();
    const { getDepartmentData } = useDepartmentsData();
    const [searchTerm, setSearchTerm] = useState('');

    const departmentTargets = useMemo(() => {
        if (!departmentId) return [];
        return getDepartmentData(departmentId).targets;
    }, [departmentId, getDepartmentData]);

    const filteredTargets = useMemo(() => {
        return departmentTargets.filter(target => 
            target.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [departmentTargets, searchTerm]);

    const handleCheckboxChange = (targetId: string) => {
        const newValue = value.includes(targetId)
            ? value.filter(id => id !== targetId)
            : [...value, targetId];
        onChange(newValue);
    };

    const handleSelectAll = () => {
        const allFilteredIds = filteredTargets.map(t => t.id);
        const newSelectedIds = [...new Set([...value, ...allFilteredIds])];
        onChange(newSelectedIds);
    };

    const handleDeselectAll = () => {
        const allFilteredIds = filteredTargets.map(t => t.id);
        const newSelectedIds = value.filter(id => !allFilteredIds.includes(id));
        onChange(newSelectedIds);
    };

    if (!departmentId) {
        return null; // Don't render if no department is selected
    }

    if (departmentTargets.length === 0) {
        return (
            <div>
                <label className="block text-sm font-medium text-natural-700 dark:text-natural-300">{t('challenges.modal.linkedTargets')}</label>
                <div className="mt-1 p-4 text-center text-sm text-natural-500 bg-natural-100 dark:bg-natural-700/50 rounded-md">
                    {t('challenges.modal.noTargetsForDept')}
                </div>
            </div>
        );
    }
    
    const allFilteredSelected = filteredTargets.length > 0 && filteredTargets.every(t => value.includes(t.id));

    return (
        <div>
            <label className="block text-sm font-medium text-natural-700 dark:text-natural-300">{t('challenges.modal.linkedTargets')}</label>
            <div className="mt-1 border border-natural-200 dark:border-natural-700 rounded-lg p-3 space-y-3 bg-natural-50 dark:bg-natural-900/50">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('challenges.modal.searchTargets')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-1.5 ps-8 pe-3 text-sm"
                    />
                    <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-2.5 h-4 w-4 text-natural-400" />
                </div>
                
                <div className="flex justify-end">
                     <button
                        type="button"
                        onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
                        className="text-xs font-semibold text-dark-purple-600 dark:text-dark-purple-400 hover:underline"
                    >
                        {allFilteredSelected ? t('challenges.modal.deselectAll') : t('challenges.modal.selectAll')}
                    </button>
                </div>

                <div className="max-h-48 overflow-y-auto pr-2 -mr-2 space-y-2">
                    {filteredTargets.map(target => (
                        <label key={target.id} htmlFor={`target-${target.id}`} className="flex items-center p-2 rounded-md hover:bg-natural-100 dark:hover:bg-natural-800 cursor-pointer">
                            <input
                                type="checkbox"
                                id={`target-${target.id}`}
                                checked={value.includes(target.id)}
                                onChange={() => handleCheckboxChange(target.id)}
                                className="h-4 w-4 rounded border-natural-300 text-dark-purple-600 focus:ring-dark-purple-500"
                            />
                            <span className="ms-3 text-sm text-natural-700 dark:text-natural-200">{target.name}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LinkedTargetsSelector;
