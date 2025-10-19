


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Challenge, DashboardFilters, PerformanceStatus } from '../types';
import { departments } from '../data/mockData';
import { getPerformanceStatus } from '../utils/calculatePlannedProgress';
import { getDefaultFilters } from '../utils/dashboardUtils';
// FIX: Changed CalendarIcon to CalendarDaysIcon to match the exported component name.
import { SearchIcon, ChevronDownIcon, CalendarDaysIcon as CalendarIcon } from './icons/IconComponents';

interface FilterBarProps {
    initialFilters: DashboardFilters;
    onApply: (filters: DashboardFilters) => void;
    resultsCount: number;
}

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

const MultiSelectDropdown: React.FC<{
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
    selectedText: (count: number) => string;
}> = ({ options, selected, onChange, placeholder, selectedText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(dropdownRef, () => setIsOpen(false));

    const filteredOptions = useMemo(() => 
        options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase())),
        [options, searchTerm]
    );

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const displayValue = selected.length > 0 ? selectedText(selected.length) : placeholder;

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left rtl:text-right bg-white dark:bg-natural-800 border border-natural-300 dark:border-natural-600 rounded-md shadow-sm px-3 py-2 text-sm">
                <span className="truncate">{displayValue}</span>
                <ChevronDownIcon className={`h-5 w-5 text-natural-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-natural-800 shadow-lg border border-natural-200 dark:border-natural-700 rounded-md max-h-60 flex flex-col">
                    <div className="p-2 border-b border-natural-200 dark:border-natural-700">
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full text-sm bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md px-2 py-1.5" />
                    </div>
                    <ul className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.map(option => (
                            <li key={option.value} onClick={() => handleSelect(option.value)} className="text-sm px-2 py-1.5 rounded-md cursor-pointer hover:bg-natural-100 dark:hover:bg-natural-700 flex items-center">
                                <input type="checkbox" checked={selected.includes(option.value)} readOnly className="h-4 w-4 rounded border-gray-300 text-dark-purple-600 focus:ring-dark-purple-500 mr-2 rtl:mr-0 rtl:ml-2" />
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const FilterBar: React.FC<FilterBarProps> = ({ initialFilters, onApply, resultsCount }) => {
    const { t, language } = useLocalization();
    const [stagedFilters, setStagedFilters] = useState<DashboardFilters>(initialFilters);

    useEffect(() => {
        setStagedFilters(initialFilters);
    }, [initialFilters]);

    const handleApply = () => {
        onApply(stagedFilters);
    };

    const handleClear = () => {
        const defaultFilters = getDefaultFilters();
        setStagedFilters(defaultFilters);
        onApply(defaultFilters);
    };

    const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
        setStagedFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const statusOptions: { value: Challenge['status']; label: string }[] = [
        { value: 'جديد', label: t('dashboard.chartStatus.جديد') },
        { value: 'قيد المعالجة', label: t('dashboard.chartStatus.قيد المعالجة') },
        { value: 'قيد المراجعة', label: t('dashboard.chartStatus.قيد المراجعة') },
        { value: 'مغلق', label: t('dashboard.chartStatus.مغلق') },
    ];
    
    const performanceOptions: { value: PerformanceStatus; label: string }[] = [
        { value: 'ahead', label: t('challenges.performanceStatus.ahead') },
        { value: 'onTrack', label: t('challenges.performanceStatus.onTrack') },
        { value: 'behind', label: t('challenges.performanceStatus.behind') },
    ];

    const getTimeRangeLabel = (range: '30' | '90' | 'all' | 'custom') => {
        if (range === 'custom') return t('dashboard.filters.customRange');
        if (range === 'all') return t('dashboard.allTime');
        return t(`dashboard.last${range}days`);
    };

    return (
        <div className="sticky top-[65px] z-20">
            <div className="bg-white/80 dark:bg-natural-800/80 backdrop-blur-sm p-4 border-b border-natural-200 dark:border-natural-700 shadow-sm rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                    {/* Time Range */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-natural-600 dark:text-natural-300">{t('dashboard.filters.timeRange')}</label>
                        <div className="flex bg-natural-100 dark:bg-natural-900 p-1 rounded-md">
                            {(['30', '90', 'all', 'custom'] as const).map(range => (
                                <button key={range} onClick={() => updateFilter('timeRange', range)} className={`flex-1 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${stagedFilters.timeRange === range ? 'bg-white dark:bg-natural-700 text-dark-purple-600 dark:text-dark-purple-300 shadow-sm' : 'text-natural-500 hover:bg-white/50 dark:hover:bg-natural-700/50'}`}>
                                    {getTimeRangeLabel(range)}
                                </button>
                            ))}
                        </div>
                        {stagedFilters.timeRange === 'custom' && (
                            <div className="flex items-center gap-2 pt-2">
                                <div className="relative flex-1">
                                    <input type="date" value={stagedFilters.customDateRange.start || ''} onChange={e => updateFilter('customDateRange', {...stagedFilters.customDateRange, start: e.target.value})} className="w-full text-xs p-1.5 pl-7 bg-white dark:bg-natural-800 border border-natural-300 dark:border-natural-600 rounded-md" />
                                    <CalendarIcon className="absolute top-1/2 -translate-y-1/2 left-1.5 h-4 w-4 text-natural-400" />
                                </div>
                                <span className="text-xs text-natural-500">-</span>
                                <div className="relative flex-1">
                                    <input type="date" value={stagedFilters.customDateRange.end || ''} onChange={e => updateFilter('customDateRange', {...stagedFilters.customDateRange, end: e.target.value})} className="w-full text-xs p-1.5 pl-7 bg-white dark:bg-natural-800 border border-natural-300 dark:border-natural-600 rounded-md" />
                                     <CalendarIcon className="absolute top-1/2 -translate-y-1/2 left-1.5 h-4 w-4 text-natural-400" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Department */}
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-natural-600 dark:text-natural-300">{t('dashboard.filters.department')}</label>
                        <MultiSelectDropdown 
                            options={departments.map(d => ({ value: d.name.ar, label: d.name[language] }))}
                            selected={stagedFilters.selectedDepartments}
                            onChange={(val) => updateFilter('selectedDepartments', val)}
                            placeholder={t('dashboard.filters.allSelected')}
                            selectedText={(count) => t('dashboard.filters.departmentsSelected', { count })}
                        />
                    </div>
                    
                    {/* Status */}
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-natural-600 dark:text-natural-300">{t('dashboard.filters.status')}</label>
                        <div className="flex flex-wrap gap-1.5">
                            {statusOptions.map(opt => (
                                <button key={opt.value} onClick={() => {
                                    const newStatuses = stagedFilters.selectedStatuses.includes(opt.value) 
                                        ? stagedFilters.selectedStatuses.filter(s => s !== opt.value)
                                        : [...stagedFilters.selectedStatuses, opt.value];
                                    updateFilter('selectedStatuses', newStatuses);
                                }} className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${stagedFilters.selectedStatuses.includes(opt.value) ? 'bg-dark-purple-500 text-white border-transparent' : 'bg-white dark:bg-natural-800 border-natural-300 dark:border-natural-600 text-natural-700 dark:text-natural-200 hover:bg-natural-50 dark:hover:bg-natural-700'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Performance */}
                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-natural-600 dark:text-natural-300">{t('dashboard.filters.performance')}</label>
                        <div className="flex flex-wrap gap-1.5">
                             {performanceOptions.map(opt => (
                                <button key={opt.value} onClick={() => {
                                    const newPerformances = stagedFilters.selectedPerformance.includes(opt.value) 
                                        ? stagedFilters.selectedPerformance.filter(s => s !== opt.value)
                                        : [...stagedFilters.selectedPerformance, opt.value];
                                    updateFilter('selectedPerformance', newPerformances);
                                }} className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${stagedFilters.selectedPerformance.includes(opt.value) ? 'bg-dark-purple-500 text-white border-transparent' : 'bg-white dark:bg-natural-800 border-natural-300 dark:border-natural-600 text-natural-700 dark:text-natural-200 hover:bg-natural-50 dark:hover:bg-natural-700'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search & Actions */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-natural-600 dark:text-natural-300">{t('search')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('dashboard.filters.searchPlaceholder')}
                                value={stagedFilters.searchTerm}
                                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                                className="w-full text-sm bg-white dark:bg-natural-800 border-natural-300 dark:border-natural-600 rounded-md py-2 pl-9 pr-3 shadow-sm"
                            />
                            <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-2.5 h-5 w-5 text-natural-400" />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                             <button onClick={handleClear} className="text-sm text-dark-purple-600 dark:text-dark-purple-400 hover:underline">
                                {t('dashboard.filters.clear')}
                            </button>
                            <button onClick={handleApply} className="px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-semibold hover:bg-dark-purple-700 shadow-sm">
                                {t('dashboard.filters.apply')}
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-natural-500 dark:text-natural-400 mt-3">{t('dashboard.filters.results', { count: resultsCount })}</p>
            </div>
        </div>
    );
};