import React, { useState, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Challenge } from '../types';
import { CloseIcon, SearchIcon } from './icons/IconComponents';
import { translateDepartment } from '../utils/localizationUtils';

interface DrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    challenges: Challenge[];
    onViewDetails: (challenge: Challenge) => void;
}

const DrilldownModal: React.FC<DrilldownModalProps> = ({ isOpen, onClose, title, challenges, onViewDetails }) => {
    const { t, language } = useLocalization();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChallenges = useMemo(() => {
        if (!searchTerm) return challenges;
        const lowerSearch = searchTerm.toLowerCase();
        return challenges.filter(c => 
            (c.code || '').toLowerCase().includes(lowerSearch) ||
            (c.title || '').toLowerCase().includes(lowerSearch)
        );
    }, [challenges, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{t('dashboard.drilldownTitle')}: <span className="text-dark-purple-600 dark:text-dark-purple-400">{title}</span></h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 border-b border-natural-200 dark:border-natural-700">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={`${t('search')}... (${challenges.length})`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-2 ps-10 pe-4 focus:ring-dark-purple-500 focus:border-dark-purple-500"
                        />
                        <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-natural-400" />
                    </div>
                </div>

                <div className="p-2 overflow-y-auto">
                    {filteredChallenges.length > 0 ? (
                        <ul className="divide-y divide-natural-200 dark:divide-natural-700">
                            {filteredChallenges.map(challenge => (
                                <li key={challenge.id} className="p-3 flex justify-between items-center hover:bg-natural-50 dark:hover:bg-natural-700/50 rounded-md">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-natural-800 dark:text-natural-100 break-words">
                                            <span className="text-xs font-mono bg-natural-200 dark:bg-natural-700 px-1.5 py-0.5 rounded mr-2">{challenge.code}</span>
                                            {challenge.title}
                                        </p>
                                        <p className="text-sm text-natural-500 dark:text-natural-400">{translateDepartment(challenge.department, language)}</p>
                                    </div>
                                    <button
                                        onClick={() => onViewDetails(challenge)}
                                        className="text-sm font-medium text-dark-purple-600 dark:text-dark-purple-400 hover:underline flex-shrink-0"
                                    >
                                        {t('viewDetails')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center p-8 text-natural-500">{t('noResults')}</p>
                    )}
                </div>

                <div className="flex justify-end items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-natural-700 dark:text-natural-200 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md hover:bg-natural-50 dark:hover:bg-natural-600">
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DrilldownModal;