import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import PageTitle from '../components/PageTitle.tsx';
import Card from '../components/Card.tsx';
import { ChallengesIcon, LightbulbIcon, SearchIcon, SparklesIcon, CalendarDaysIcon, MatrixIcon } from '../components/icons/IconComponents.tsx';
import { Challenge, Opportunity, OpportunityDashboardFilters, OpportunityStatus, Initiative, StrategicInitiative, InitiativeDashboardFilters, PerformanceStatus } from '../types.ts';
import { locales } from '../i18n/locales.ts';
import { DepartmentsComparisonChart, SummaryDonutChart, CategoricalTooltip, CustomizedXAxisTick } from '../components/charts/Charts.tsx';
import TimelineAdherence from '../components/TimelineAdherence.tsx';
import { prepareDepartmentsComparisonData, prepareTimelineAdherenceData, prepareStatusDistributionData, prepareCategoryDistributionData } from '../utils/dashboardUtils.ts';
import DrilldownModal from '../components/DrilldownModal.tsx';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal.tsx';
import EmptyState from '../components/EmptyState.tsx';
import UnifiedPriorityMatrix from '../components/challenges/PriorityMatrix.tsx';
import SummaryKpiCard from '../components/SummaryKpiCard.tsx';
import KpiCard from '../components/KpiCard.tsx';
import { STATUS_DONUT_COLORS, CATEGORY_DONUT_COLORS, OPPORTUNITY_STATUS_DONUT_COLORS, OPPORTUNITY_STATUS_COLORS, STATUS_COLORS, INITIATIVE_STATUS_DONUT_COLORS } from '../utils/chartUtils.ts';
import { useOpportunities } from '../context/OpportunitiesContext.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Label } from 'recharts';
import { useChartTheme } from '../utils/chartUtils.ts';
import { departments } from '../data/mockData.ts';
import { getDefaultOpportunityFilters, filterOpportunities, calculateOpportunityKpis, prepareOpportunityStatusDistributionData, prepareOpportunityDepartmentDistributionData } from '../utils/opportunityDashboardUtils.ts';
import OpportunityCard from '../components/OpportunityCard.tsx';
import AddOpportunityModal from '../components/AddOpportunityModal.tsx';
import OpportunityDetailsModal from '../components/OpportunityDetailsModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import AddChallengeModal from '../components/AddChallengeModal.tsx';
import { useChallenges } from '../context/ChallengesContext.tsx';
import Toast from '../components/Toast.tsx';
import { useInitiatives } from '../context/InitiativesContext.tsx';
import { calculateInitiativeKpis, prepareInitiativesByDepartmentData, prepareInitiativeAdherenceData, getDefaultInitiativeFilters, filterInitiatives, prepareInitiativeStatusDistributionData, prepareTaskStatusByInitiativeData } from '../utils/initiativeDashboardUtils.ts';
import { translateDepartment } from '../utils/localizationUtils.ts';

type DashboardTab = 'priorityMatrix' | 'challenges' | 'opportunities' | 'initiatives';

// Helper to use an outside click to close dropdowns
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

const InitiativesDashboard = () => {
    const { initiatives } = useInitiatives();
    const { t, language } = useLocalization();
    const { isRtl, formatNumber, ...themeStyles } = useChartTheme();

    const [filters, setFilters] = useState<InitiativeDashboardFilters>(getDefaultInitiativeFilters());
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    useClickOutside(searchRef, () => setIsSearchDropdownOpen(false));

    const filteredInitiatives = useMemo(() => filterInitiatives(initiatives, filters), [initiatives, filters]);
    const kpis = useMemo(() => calculateInitiativeKpis(filteredInitiatives), [filteredInitiatives]);
    const departmentData = useMemo(() => prepareInitiativesByDepartmentData(filteredInitiatives, departments, language), [filteredInitiatives, language]);
    const adherenceData = useMemo(() => prepareInitiativeAdherenceData(filteredInitiatives, language), [filteredInitiatives, language]);
    const initiativeStatusData = useMemo(() => prepareInitiativeStatusDistributionData(filteredInitiatives, t), [filteredInitiatives, t]);
    const taskStatusData = useMemo(() => prepareTaskStatusByInitiativeData(filteredInitiatives, language), [filteredInitiatives, language]);
    const taskStatusKeys = useMemo(() => Object.keys(locales.ar.dashboard.chartStatus), []);

    const searchDropdownInitiatives = useMemo(() => {
        if (!filters.searchTerm) {
            return initiatives; // Show all if search is empty
        }
        const lowerSearch = filters.searchTerm.toLowerCase();
        return initiatives.filter(init => 
            init.name[language].toLowerCase().includes(lowerSearch)
        );
    }, [initiatives, filters.searchTerm, language]);


    const InitiativeAdherenceList: React.FC<{ data: typeof adherenceData }> = ({ data }) => {
        if (data.length === 0) {
            return <div className="flex items-center justify-center h-full text-natural-400">{t('dashboard.charts.noData')}</div>;
        }
    
        return (
            <div className="space-y-4 overflow-y-auto h-full pr-2">
                {data.map(item => (
                    <div key={item.name} className="p-3 rounded-lg hover:bg-natural-100 dark:hover:bg-natural-700/50 cursor-pointer transition-colors">
                        <p className="text-sm font-semibold text-natural-800 dark:text-natural-100 truncate">{item.name}</p>
                        <div className="text-xs text-natural-500 dark:text-natural-400 mb-1.5">{`${t('dashboard.initiatives.open')}: ${item.openTaskCount} / ${item.taskCount} ${t('dashboard.initiatives.tasks')}`}</div>
                        <div className="relative h-3 w-full bg-natural-200 dark:bg-natural-700 rounded-full overflow-hidden">
                            <div className="absolute h-3 bg-dark-purple-300 dark:bg-dark-purple-800 rounded-full transition-all duration-500" style={{ width: `${item.avgPlanned}%` }} />
                            <div className="absolute h-3 bg-mim-bright-blue rounded-full transition-all duration-500" style={{ width: `${item.avgActual}%` }} />
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs">
                            <span className="font-bold text-bright-blue-700 dark:text-bright-blue-300">{t('challenges.actualProgress')}: {formatNumber(item.avgActual)}%</span>
                            <span className="font-bold text-dark-purple-700 dark:text-dark-purple-300">{t('challenges.plannedProgress')}: {formatNumber(item.avgPlanned)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    const performanceOptions: { value: PerformanceStatus; label: string }[] = [
        { value: 'ahead', label: t('challenges.performanceStatus.ahead') },
        { value: 'onTrack', label: t('challenges.performanceStatus.onTrack') },
        { value: 'behind', label: t('challenges.performanceStatus.behind') },
    ];


    return (
        <div className="animate-fade-in space-y-6">
             <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div ref={searchRef} className="relative col-span-1 md:col-span-2">
                         <label htmlFor="init-search" className="block text-xs font-medium text-natural-500 dark:text-natural-400 mb-1">{t('search')}</label>
                        <input
                            type="text"
                            id="init-search"
                            value={filters.searchTerm}
                            onChange={e => {
                                setFilters({...filters, searchTerm: e.target.value});
                                setIsSearchDropdownOpen(true);
                            }}
                            onFocus={() => setIsSearchDropdownOpen(true)}
                            placeholder={t('dashboard.initiatives.filters.searchPlaceholder')}
                            className="w-full bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-2 ps-10 pe-4 focus:ring-dark-purple-500 focus:border-dark-purple-500"
                            autoComplete="off"
                        />
                        <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-natural-400 mt-2.5"/>
                        {isSearchDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-natural-800 shadow-lg border dark:border-natural-700 rounded-md max-h-60 overflow-y-auto">
                                {searchDropdownInitiatives.length > 0 ? (
                                    searchDropdownInitiatives.map(init => (
                                        <button
                                            key={init.id}
                                            onClick={() => {
                                                setFilters({...filters, searchTerm: init.name[language]});
                                                setIsSearchDropdownOpen(false);
                                            }}
                                            className="w-full text-left rtl:text-right px-4 py-2 text-sm text-natural-700 dark:text-natural-200 hover:bg-natural-100 dark:hover:bg-natural-700"
                                        >
                                            {init.name[language]}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-natural-500">{t('noResults')}</div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <label className="block text-xs font-medium text-natural-500 dark:text-natural-400 mb-1">{t('dashboard.filters.performance')}</label>
                        <div className="flex flex-wrap gap-1.5">
                            {performanceOptions.map(opt => (
                                <button key={opt.value} onClick={() => {
                                    const newPerf = filters.selectedPerformance.includes(opt.value) 
                                        ? filters.selectedPerformance.filter(s => s !== opt.value)
                                        : [...filters.selectedPerformance, opt.value];
                                    setFilters(prev => ({...prev, selectedPerformance: newPerf}));
                                }} className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${filters.selectedPerformance.includes(opt.value) ? 'bg-dark-purple-500 text-white border-transparent' : 'bg-white dark:bg-natural-800 border-natural-300 dark:border-natural-600 text-natural-700 dark:text-natural-200 hover:bg-natural-50 dark:hover:bg-natural-700'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setFilters(getDefaultInitiativeFilters())} className="text-sm text-dark-purple-600 dark:text-dark-purple-400 hover:underline">{t('clearFilters')}</button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard title={t('dashboard.initiatives.total')} value={kpis.totalInitiatives} />
                <KpiCard title={t('dashboard.initiatives.avgProgress')} value={`${kpis.avgProgress}%`} />
                <KpiCard title={t('dashboard.initiatives.totalTasks')} value={kpis.totalTasks} />
                <KpiCard title={t('dashboard.initiatives.openTasks')} value={kpis.openTasks} />
                <KpiCard title={t('dashboard.initiatives.closedTasks')} value={kpis.closedTasks} />
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-[480px] flex flex-col">
                    <SummaryDonutChart title={t('dashboard.initiatives.statusDistribution')} data={initiativeStatusData} colors={INITIATIVE_STATUS_DONUT_COLORS} />
                </Card>
                <Card className="h-[480px] flex flex-col">
                    <h3 className="font-bold text-md text-natural-800 dark:text-natural-100 px-4 pt-2 text-center">{t('dashboard.initiatives.taskStatusByInitiative')}</h3>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={taskStatusData} 
                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            >
                                <CartesianGrid strokeDasharray="2 3" stroke={themeStyles.grid.stroke} vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={<CustomizedXAxisTick fill={themeStyles.tick.fill} />}
                                    height={80}
                                    interval={0} 
                                    stroke={themeStyles.tick.fill}
                                    tickMargin={5}
                                />
                                <YAxis 
                                    type="number" 
                                    tick={{...themeStyles.tick, textAnchor: isRtl ? 'start' : 'end'}}
                                    stroke={themeStyles.tick.fill} 
                                    orientation={isRtl ? 'right' : 'left'}
                                    allowDecimals={false}
                                >
                                    <Label value={t('dashboard.initiatives.taskCount')} angle={-90} position={isRtl ? 'insideRight' : 'insideLeft'} style={{ textAnchor: 'middle', ...themeStyles.label }} offset={isRtl ? -10 : 0} />
                                </YAxis>
                                <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} contentStyle={themeStyles.tooltip} />
                                {taskStatusKeys.map(status => (
                                    <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status]} name={t(`dashboard.chartStatus.${status}`)} barSize={24} radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey={status} position="center" fill="#fff" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
                                    </Bar>
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-1 h-[480px] flex flex-col">
                     <h3 className="font-bold text-md text-natural-800 dark:text-natural-100 px-4 pt-2 text-center">{t('dashboard.initiatives.initiativesByDept')}</h3>
                     <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={departmentData} margin={{ top: 20, right: isRtl ? 10 : 30, left: isRtl ? 30 : 20, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="2 3" stroke={themeStyles.grid.stroke} />
                                <XAxis dataKey="name" tick={<CustomizedXAxisTick fill={themeStyles.tick.fill} />} stroke={themeStyles.tick.fill} height={50} interval={0} reversed={isRtl} tickMargin={12}>
                                    <Label value={t('dashboard.axis.departments')} offset={-25} position="insideBottom" {...themeStyles.label} />
                                </XAxis>
                                <YAxis tickFormatter={formatNumber} tick={{...themeStyles.tick, textAnchor: isRtl ? 'start' : 'end'}} stroke={themeStyles.tick.fill} allowDecimals={false} orientation={isRtl ? 'right' : 'left'}>
                                     <Label value={t('dashboard.axis.count')} angle={-90} offset={isRtl ? -20 : 0} position={isRtl ? 'insideRight' : 'insideLeft'} style={{ textAnchor: 'middle', ...themeStyles.label }} />
                                </YAxis>
                                <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} contentStyle={themeStyles.tooltip} />
                                <Bar dataKey="count" name={t('dashboard.axis.count')} barSize={24} radius={[4, 4, 0, 0]}>
                                    {departmentData.map((_entry, index) => <Cell key={`cell-${index}`} fill={'#a855f7'} fillOpacity={(index % 2) * 0.3 + 0.7} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                 <Card className="h-[480px]">
                    <h3 className="font-bold text-md mb-4 text-natural-800 dark:text-natural-100">{t('dashboard.initiatives.adherence')}</h3>
                    <InitiativeAdherenceList data={adherenceData} />
                </Card>
            </div>
        </div>
    );
};


const OpportunitiesDashboard = () => {
    const { t, language, formatDate } = useLocalization();
    const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
    const [filters, setFilters] = useState<OpportunityDashboardFilters>(getDefaultOpportunityFilters());
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
    const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
    const [opportunityToView, setOpportunityToView] = useState<Opportunity | null>(null);
    
    const filteredOpportunities = useMemo(() => filterOpportunities(opportunities, filters), [opportunities, filters]);
    const kpis = useMemo(() => calculateOpportunityKpis(filteredOpportunities), [filteredOpportunities]);
    const statusData = useMemo(() => prepareOpportunityStatusDistributionData(filteredOpportunities, t), [filteredOpportunities, t]);
    const departmentData = useMemo(() => prepareOpportunityDepartmentDistributionData(filteredOpportunities, language), [filteredOpportunities, language]);
    
    const { isRtl, ...themeStyles } = useChartTheme();
    
    const [hoveredDept, setHoveredDept] = useState<string | null>(null);
    const allOpportunityStatuses = useMemo(() => Object.keys(OPPORTUNITY_STATUS_COLORS) as OpportunityStatus[], []);
    const [activeLegend, setActiveLegend] = useState<string[]>(allOpportunityStatuses);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const legendFormatter = (value: string) => {
        return t(`opportunities.statusOptions.${value}`);
    };

    const handleLegendClick = (dataKey: string) => {
        if (activeLegend.includes(dataKey)) {
            setActiveLegend(activeLegend.filter(i => i !== dataKey));
        } else {
            setActiveLegend([...activeLegend, dataKey]);
        }
    };

    const LegendPill: React.FC<{ dataKey: string, color: string }> = ({ dataKey, color }) => {
        const isActive = activeLegend.includes(dataKey);
        return (
             <button
                onClick={() => handleLegendClick(dataKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                    isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                }`}
             >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}/>
                <span>{legendFormatter(dataKey)}</span>
            </button>
        );
    };
    const topStatus = allOpportunityStatuses[allOpportunityStatuses.length - 1];


    const handleSaveOpportunity = (data: Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'> & { id?: string }) => {
        const { id, ...saveData } = data;
        if (id) {
            updateOpportunity(id, saveData);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
        } else {
            addOpportunity(saveData);
            setToast({ message: t('opportunities.notifications.addSuccess'), type: 'success' });
        }
        setIsAddModalOpen(false);
        setOpportunityToEdit(null);
    };
    const handleConfirmDelete = () => {
        if (!opportunityToDelete) return;
        deleteOpportunity(opportunityToDelete.id);
        setToast({ message: t('opportunities.notifications.deleteSuccess'), type: 'success' });
        setOpportunityToDelete(null);
    };
    const handleOpenAddModal = () => {
        setOpportunityToEdit(null);
        setIsAddModalOpen(true);
    };

    const statusOptions = Object.keys(t('opportunities.statusOptions', {})) as OpportunityStatus[];
    
    return (
        <div className="animate-fade-in space-y-6">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
             {/* Modals */}
            <AddOpportunityModal 
                isOpen={isAddModalOpen || !!opportunityToEdit}
                onClose={() => { setIsAddModalOpen(false); setOpportunityToEdit(null); }}
                onSave={handleSaveOpportunity}
                opportunityToEdit={opportunityToEdit}
            />
            <ConfirmationModal
                isOpen={!!opportunityToDelete}
                onClose={() => setOpportunityToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('opportunities.deleteOpportunity')}
                message={t('opportunities.deleteOpportunityConfirm')}
            />
            {opportunityToView && <OpportunityDetailsModal
                isOpen={!!opportunityToView}
                opportunity={opportunityToView}
                onClose={() => setOpportunityToView(null)}
                onEdit={(op) => { setOpportunityToView(null); setOpportunityToEdit(op); }}
                onDelete={(op) => { setOpportunityToView(null); setOpportunityToDelete(op); }}
            />}

            {/* Filter Bar */}
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="relative col-span-1 md:col-span-2">
                         <label htmlFor="opp-search" className="block text-xs font-medium text-natural-500 dark:text-natural-400 mb-1">{t('search')}</label>
                        <input type="text" id="opp-search" value={filters.searchTerm} onChange={e => setFilters({...filters, searchTerm: e.target.value})} placeholder={t('search') + '...'} className="w-full bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-2 ps-10 pe-4 focus:ring-dark-purple-500 focus:border-dark-purple-500"/>
                        <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-natural-400 mt-2.5"/>
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label htmlFor="opp-status" className="block text-xs font-medium text-natural-500 dark:text-natural-400 mb-1">{t('opportunities.status')}</label>
                        <select id="opp-status" value={filters.selectedStatuses[0] || 'all'} onChange={e => setFilters({...filters, selectedStatuses: e.target.value === 'all' ? [] : [e.target.value as OpportunityStatus]})} className="w-full bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md focus:ring-dark-purple-500 focus:border-dark-purple-500">
                            <option value="all">{t('challenges.typeOptions.all')}</option>
                            {statusOptions.map(s => <option key={s} value={s}>{t(`opportunities.statusOptions.${s}`)}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setFilters(getDefaultOpportunityFilters())} className="text-sm text-dark-purple-600 dark:text-dark-purple-400 hover:underline">{t('clearFilters')}</button>
                        <button onClick={handleOpenAddModal} className="px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700">{t('opportunities.addOpportunity')}</button>
                    </div>
                </div>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard title={t('dashboard.opportunities.total')} value={kpis.total} />
                <KpiCard title={t('dashboard.opportunities.underReview')} value={kpis.underReview} />
                <KpiCard title={t('dashboard.opportunities.inProgress')} value={kpis.inProgress} />
                <KpiCard title={t('dashboard.opportunities.implemented')} value={kpis.implemented} />
                <KpiCard title={t('dashboard.opportunities.avgProgress')} value={`${kpis.avgProgress}%`} />
                <KpiCard title={t('dashboard.opportunities.nearestDueDate')} value={formatDate(kpis.nearestDueDate?.toISOString())} />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-2 h-[480px] flex flex-col">
                    <SummaryDonutChart title={t('dashboard.opportunities.statusDistribution')} data={statusData} colors={OPPORTUNITY_STATUS_DONUT_COLORS} isLoading={false} />
                </Card>
                <Card className="lg:col-span-3 h-[480px] flex flex-col">
                     <h3 className="font-bold text-md text-natural-800 dark:text-natural-100 px-4 pt-2 text-center">{t('dashboard.opportunities.departmentDistribution')}</h3>
                    <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 my-3 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
                        {allOpportunityStatuses.map(status => (
                            <LegendPill key={status} dataKey={status} color={OPPORTUNITY_STATUS_COLORS[status]} />
                        ))}
                    </div>
                     <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart 
                                data={departmentData} 
                                margin={{ top: 20, right: isRtl ? 10 : 30, left: isRtl ? 30 : 0, bottom: 30 }}
                                onMouseMove={(state) => {
                                    if (state.isTooltipActive) {
                                        setHoveredDept(state.activePayload?.[0].payload.name);
                                    } else {
                                        setHoveredDept(null);
                                    }
                                }}
                                onMouseLeave={() => setHoveredDept(null)}
                            >
                                <CartesianGrid strokeDasharray="2 3" stroke={themeStyles.grid.stroke} vertical={true} horizontal={true} />
                                <XAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={<CustomizedXAxisTick fill={themeStyles.tick.fill} />}
                                    stroke={themeStyles.tick.fill} 
                                    height={50}
                                    interval={0}
                                    reversed={isRtl}
                                    tickMargin={12}
                                >
                                    <Label value={t('dashboard.axis.departments')} offset={-25} position="insideBottom" {...themeStyles.label} />
                                </XAxis>
                                <YAxis 
                                    type="number" 
                                    tickFormatter={themeStyles.formatNumber}
                                    tick={{...themeStyles.tick, textAnchor: isRtl ? 'start' : 'end'}} 
                                    stroke={themeStyles.tick.fill} 
                                    allowDecimals={false} 
                                    orientation={isRtl ? 'right' : 'left'}
                                >
                                    <Label value={t('dashboard.axis.count')} angle={-90} offset={isRtl ? -20 : 15} position={isRtl ? 'insideRight' : 'insideLeft'} style={{ textAnchor: 'middle', fontWeight: 600, ...themeStyles.label }} />
                                </YAxis>
                                <Tooltip content={<CategoricalTooltip formatNumber={themeStyles.formatNumber} isRtl={isRtl} legendFormatter={legendFormatter} />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                                {allOpportunityStatuses.map((status) => (
                                    <Bar 
                                        key={status} 
                                        dataKey={status} 
                                        stackId="a"
                                        barSize={24}
                                        name={status}
                                        hide={!activeLegend.includes(status)}
                                    >
                                        {departmentData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`}
                                                fill={OPPORTUNITY_STATUS_COLORS[status]}
                                                fillOpacity={hoveredDept && hoveredDept !== entry.name ? 0.3 : 1}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        ))}
                                        {status === topStatus && (
                                             <LabelList 
                                                dataKey="total"
                                                position="top"
                                                formatter={(value: number) => value > 0 ? themeStyles.formatNumber(value) : ''}
                                                style={{ fontSize: 10, fill: themeStyles.label.fill, fontWeight: 500 }}
                                                offset={4}
                                            />
                                        )}
                                    </Bar>
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    )
};

const TabContent: React.FC<{ 
    activeTab: DashboardTab, 
    challenges: Challenge[], 
    opportunities: Opportunity[],
    onViewItem: (item: Initiative) => void,
    onDrilldown: (title: string, challenges: Challenge[]) => void
}> = ({ activeTab, challenges, opportunities, onViewItem, onDrilldown }) => {
    const { t, language } = useLocalization();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);
    
    // Chart data memos
    const departmentsComparisonData = useMemo(() => prepareDepartmentsComparisonData(challenges), [challenges]);
    const timelineAdherenceData = useMemo(() => prepareTimelineAdherenceData(challenges), [challenges]);
    const statusDistributionData = useMemo(() => prepareStatusDistributionData(challenges, t), [challenges, t, language]);
    const categoryDistributionData = useMemo(() => prepareCategoryDistributionData(challenges, t), [challenges, t, language]);
    const totalChallenges = useMemo(() => challenges.length, [challenges]);

    const handleDepartmentSegmentClick = (payload: { department: string, status: string }) => {
        const filtered = challenges.filter(c => c.department === payload.department && c.status === payload.status);
        const statusLabel = t(`dashboard.chartStatus.${String(payload.status as keyof typeof locales.en.dashboard.chartStatus)}`);
        onDrilldown(`${payload.department} - ${statusLabel}`, filtered);
    };

    const handleTimelineClick = (deptData: { name: string, challenges: Challenge[] }) => {
        onDrilldown(`${deptData.name} - ${t('challenges.title')}`, deptData.challenges);
    };

    switch (activeTab) {
        case 'priorityMatrix':
            return (
                <Card>
                    <UnifiedPriorityMatrix
                        challenges={challenges}
                        opportunities={opportunities}
                        onChallengeClick={(c) => onViewItem(c)}
                        onOpportunityClick={(o) => onViewItem(o)}
                    />
                </Card>
            );
        case 'challenges':
            return (
                <div className="animate-fade-in space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-1">
                            <SummaryKpiCard 
                                title={t('dashboard.totalChallenges')}
                                value={locales[language].formatNumber(totalChallenges)}
                                subtitle={t('dashboard.filters.allSelected')}
                            />
                        </div>
                        <Card className="lg:col-span-2 h-80 flex flex-col">
                            <SummaryDonutChart 
                                title={t('challenges.status')}
                                data={statusDistributionData}
                                colors={STATUS_DONUT_COLORS}
                                isLoading={isLoading}
                            />
                        </Card>
                        <Card className="lg:col-span-2 h-80 flex flex-col">
                             <SummaryDonutChart 
                                title={t('challenges.category')}
                                data={categoryDistributionData}
                                colors={CATEGORY_DONUT_COLORS}
                                isLoading={isLoading}
                            />
                        </Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 h-[480px] flex flex-col">
                             <h3 className="font-bold text-md text-natural-800 dark:text-natural-100 px-4 pt-2">{t('dashboard.charts.departmentsComparison')}</h3>
                             <div className="flex-grow">
                                <DepartmentsComparisonChart 
                                    data={departmentsComparisonData} 
                                    onSegmentClick={handleDepartmentSegmentClick}
                                    isLoading={isLoading}
                                />
                             </div>
                        </Card>
                         <Card className="h-[480px]">
                            <h3 className="font-bold text-md mb-4 text-natural-800 dark:text-natural-100">{t('dashboard.charts.plannedVsActual')}</h3>
                            <TimelineAdherence data={timelineAdherenceData} onDepartmentClick={handleTimelineClick} />
                        </Card>
                    </div>
                </div>
            );
        case 'opportunities':
             return <OpportunitiesDashboard />;
        case 'initiatives':
             return <InitiativesDashboard />;
    }
    return null;
};


const Dashboard: React.FC = () => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<DashboardTab>('priorityMatrix');
    const { challenges } = useChallenges();
    const { opportunities, updateOpportunity } = useOpportunities();
    const { updateChallenge } = useChallenges();

    const [drilldown, setDrilldown] = useState<{ title: string; challenges: Challenge[] } | null>(null);
    const [itemToView, setItemToView] = useState<Initiative | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Initiative | null>(null);
    const [justEditedItemId, setJustEditedItemId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    
    // This effect ensures that when an item is edited, the detail view re-opens with the fresh data.
    useEffect(() => {
        if (justEditedItemId) {
            const allItems: Initiative[] = [...challenges, ...opportunities];
            const updatedItem = allItems.find(item => item.id === justEditedItemId);
            if (updatedItem) {
                setItemToView(updatedItem);
            }
            setJustEditedItemId(null); // Reset the flag
        }
    }, [justEditedItemId, challenges, opportunities]);


    const handleEdit = (item: Initiative) => {
        setItemToEdit(item);
    };

    const handleSave = (data: (Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'> | Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'>) & { id?: string }) => {
        if (!itemToEdit) return;

        const { id, ...updateData } = data;

        if (itemToEdit.type === 'challenge') {
            updateChallenge(itemToEdit.id, updateData as Partial<Challenge>);
            setToast({ message: t('challenges.notifications.updateSuccess'), type: 'success' });
        } else if (itemToEdit.type === 'opportunity') {
            updateOpportunity(itemToEdit.id, updateData as Partial<Opportunity>);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
        }
        
        const editedId = itemToEdit.id;
        setItemToEdit(null); // Close edit modal
        setItemToView(null); // Close current details modal to prevent stale data flash
        setJustEditedItemId(editedId); // Signal to useEffect to reopen with fresh data
    };

    const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
        { id: 'priorityMatrix', label: t('dashboard.tabs.priorityMatrix'), icon: <MatrixIcon className="h-5 w-5" /> },
        { id: 'challenges', label: t('dashboard.tabs.challenges'), icon: <ChallengesIcon className="h-5 w-5" /> },
        { id: 'opportunities', label: t('dashboard.tabs.opportunities'), icon: <LightbulbIcon className="h-5 w-5" /> },
        { id: 'initiatives', label: t('dashboard.tabs.initiatives'), icon: <SparklesIcon className="h-5 w-5" /> },
    ];

    return (
        <div className="space-y-6">
            <PageTitle />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="border-b border-natural-200 dark:border-natural-700">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label={t('dashboard.title')}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`group inline-flex items-center gap-x-2 rtl:flex-row-reverse whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dark-purple-500 dark:focus-visible:ring-offset-natural-900 rounded-t-md ${
                                activeTab === tab.id
                                    ? 'border-dark-purple-500 text-dark-purple-600 dark:text-dark-purple-400'
                                    : 'border-transparent text-natural-500 hover:text-natural-700 hover:border-natural-300 dark:hover:text-natural-200 dark:hover:border-natural-600'
                            }`}
                        >
                            <span className={`transition-colors duration-200 ${activeTab === tab.id ? 'text-dark-purple-500 dark:text-dark-purple-400' : 'text-natural-500 dark:text-natural-400 group-hover:text-natural-700 dark:group-hover:text-natural-200'}`}>
                                {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            
            <TabContent 
                activeTab={activeTab} 
                challenges={challenges} 
                opportunities={opportunities} 
                onViewItem={setItemToView}
                onDrilldown={(title, challenges) => setDrilldown({ title, challenges })}
            />

             {/* Modals */}
            <DrilldownModal
                isOpen={!!drilldown}
                onClose={() => setDrilldown(null)}
                title={drilldown?.title || ''}
                challenges={drilldown?.challenges || []}
                onViewDetails={(challenge) => {
                    setDrilldown(null);
                    setItemToView(challenge);
                }}
            />

            {itemToView?.type === 'challenge' && <ChallengeDetailsModal
                isOpen={!!itemToView}
                challenge={itemToView}
                onClose={() => setItemToView(null)}
                onEdit={handleEdit}
                onDelete={() => { /* TODO: Implement delete from details */ setItemToView(null);}}
                onDirectUpdate={() => {}}
            />}
            
            {itemToView?.type === 'opportunity' && <OpportunityDetailsModal
                isOpen={!!itemToView}
                opportunity={itemToView}
                onClose={() => setItemToView(null)}
                onEdit={handleEdit}
                onDelete={() => { /* TODO: Implement delete from details */ setItemToView(null);}}
            />}
            
            {itemToEdit?.type === 'challenge' && <AddChallengeModal 
                isOpen={!!itemToEdit}
                onClose={() => setItemToEdit(null)}
                onSave={handleSave}
                challengeToEdit={itemToEdit}
            />}

            {itemToEdit?.type === 'opportunity' && <AddOpportunityModal
                isOpen={!!itemToEdit}
                onClose={() => setItemToEdit(null)}
                onSave={handleSave}
                opportunityToEdit={itemToEdit}
            />}
        </div>
    );
};

export default Dashboard;