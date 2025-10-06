import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import PageTitle from '../components/PageTitle';
import Card from '../components/Card';
import { ChallengesIcon, OpportunitiesIcon, SearchIcon, CalendarIcon, MatrixIcon } from '../components/icons/IconComponents';
import { Challenge, Opportunity, OpportunityDashboardFilters, OpportunityStatus, Initiative } from '../types';
import { locales } from '../i18n/locales';
import { DepartmentsComparisonChart, SummaryDonutChart } from '../components/charts/Charts';
import TimelineAdherence from '../components/TimelineAdherence';
import { prepareDepartmentsComparisonData, prepareTimelineAdherenceData, prepareStatusDistributionData, prepareCategoryDistributionData } from '../utils/dashboardUtils';
import DrilldownModal from '../components/DrilldownModal';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal';
import EmptyState from '../components/EmptyState';
import UnifiedPriorityMatrix from '../components/challenges/PriorityMatrix';
import SummaryKpiCard from '../components/SummaryKpiCard';
import KpiCard from '../components/KpiCard';
import { STATUS_DONUT_COLORS, CATEGORY_DONUT_COLORS, OPPORTUNITY_STATUS_DONUT_COLORS, OPPORTUNITY_STATUS_COLORS } from '../utils/chartUtils';
import { useOpportunities } from '../context/OpportunitiesContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Label } from 'recharts';
import { useChartTheme } from '../utils/chartUtils';
import { departments } from '../data/mockData';
import { getDefaultOpportunityFilters, filterOpportunities, calculateOpportunityKpis, prepareOpportunityStatusDistributionData, prepareOpportunityDepartmentDistributionData } from '../utils/opportunityDashboardUtils';
import OpportunityCard from '../components/OpportunityCard';
import AddOpportunityModal from '../components/AddOpportunityModal';
import OpportunityDetailsModal from '../components/OpportunityDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import AddChallengeModal from '../components/AddChallengeModal';
import { useChallenges } from '../context/ChallengesContext';
import Toast from '../components/Toast';

type DashboardTab = 'priorityMatrix' | 'challenges' | 'opportunities';

// Helper chart components copied from Charts.tsx for reuse
const CategoricalTooltip: React.FC<any> = ({ active, payload, label, formatNumber, isRtl, legendFormatter }) => {
    const themeStyles = useChartTheme();
    if (active && payload && payload.length) {
        const isPieChart = !!payload[0].percent;
        const total = isPieChart ? payload.reduce((sum: number, entry: any) => sum + entry.value, 0) : payload[0].payload.total;

        return (
            <div className="p-3 rounded-md shadow-lg" style={themeStyles.tooltip as React.CSSProperties}>
                <p className="font-bold mb-1 text-sm">{isPieChart ? payload[0].name : label}</p>
                {payload.map((entry: any, index: number) => {
                     const value = entry.value;
                     const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                     const displayName = legendFormatter ? legendFormatter(entry.name) : entry.name;
                    return (
                        <div key={`item-${index}`} className="flex items-center text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
                             <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.payload.fill, marginLeft: isRtl ? '0.5rem' : '0', marginRight: isRtl ? '0' : '0.5rem' }}></div>
                             <span>{`${displayName}: `}</span>
                             <span className="font-semibold" style={{ marginLeft: isRtl ? '0' : '0.25rem', marginRight: isRtl ? '0.25rem' : '0' }}>{formatNumber(value)} ({formatNumber(percentage)}%)</span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const CustomizedXAxisTick = (props: any) => {
    const { x, y, payload, fill } = props;
    const value = payload.value;
    const lineLength = 16;

    if (value.length <= lineLength) {
        return (
            <g transform={`translate(${x},${y})`}>
                <title>{value}</title>
                <text x={0} y={0} dy={16} textAnchor="middle" fill={fill} fontSize={12}>
                    {value}
                </text>
            </g>
        );
    }

    const words = value.split(' ');
    let line1 = '';
    let line2 = '';
    for (const word of words) {
        if ((line1 + ' ' + word).trim().length <= lineLength) {
            line1 = (line1 + ' ' + word).trim();
        } else {
            line2 = (line2 + ' ' + word).trim();
        }
    }

    return (
        <g transform={`translate(${x},${y})`}>
            <title>{value}</title>
            <text x={0} y={0} dy={12} textAnchor="middle" fill={fill} fontSize={12}>
                <tspan x="0" dy="0">{line1}</tspan>
                {line2 && <tspan x="0" dy="15">{line2.length > lineLength ? line2.substring(0, lineLength-1) + '…' : line2}</tspan>}
            </text>
        </g>
    );
};


const Dashboard: React.FC = () => {
    const { t, language, formatDate } = useLocalization();
    const [activeTab, setActiveTab] = useState<DashboardTab>('priorityMatrix');
    const { challenges, addChallenge, updateChallenge } = useChallenges();
    const { opportunities, addOpportunity, updateOpportunity } = useOpportunities();

    const [drilldown, setDrilldown] = useState<{ title: string; challenges: Challenge[] } | null>(null);
    const [itemToView, setItemToView] = useState<Initiative | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Initiative | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleEdit = (item: Initiative) => {
        setItemToEdit(item);
    };

    const handleSave = (data: (Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'> | Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'>) & { id?: string }) => {
        if (!itemToEdit) return;

        let updatedItem: Initiative | undefined;

        if (itemToEdit.type === 'challenge') {
            updateChallenge(itemToEdit.id, data as Partial<Challenge>);
            setToast({ message: t('challenges.notifications.updateSuccess'), type: 'success' });
            // Find the updated challenge from the global state to refresh the details view
            updatedItem = challenges.find(c => c.id === itemToEdit.id);

        } else if (itemToEdit.type === 'opportunity') {
            updateOpportunity(itemToEdit.id, data as Partial<Opportunity>);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
             // Find the updated opportunity from the global state to refresh the details view
            updatedItem = opportunities.find(o => o.id === itemToEdit.id);
        }
        
        setItemToEdit(null); // Close edit modal
        if (updatedItem) {
            setItemToView(updatedItem); // Refresh details modal with new data
        }
    };

    // Prepare data for charts
    const departmentsComparisonData = useMemo(() => prepareDepartmentsComparisonData(challenges), [challenges]);
    const timelineAdherenceData = useMemo(() => prepareTimelineAdherenceData(challenges), [challenges]);
    const statusDistributionData = useMemo(() => prepareStatusDistributionData(challenges, t), [challenges, t, language]);
    const categoryDistributionData = useMemo(() => prepareCategoryDistributionData(challenges, t), [challenges, t, language]);
    const totalChallenges = useMemo(() => challenges.length, [challenges]);


    const handleDepartmentSegmentClick = (payload: { department: string, status: string }) => {
        const filtered = challenges.filter(c => c.department === payload.department && c.status === payload.status);
        const statusLabel = t(`dashboard.chartStatus.${String(payload.status as keyof typeof locales.en.dashboard.chartStatus)}`);
        setDrilldown({
            title: `${payload.department} - ${statusLabel}`,
            challenges: filtered
        });
    };

    const handleTimelineClick = (deptData: { name: string, challenges: Challenge[] }) => {
        setDrilldown({
            title: `${deptData.name} - ${t('challenges.title')}`,
            challenges: deptData.challenges
        });
    };

    const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
        { id: 'priorityMatrix', label: t('dashboard.tabs.priorityMatrix'), icon: <MatrixIcon className="h-5 w-5" /> },
        { id: 'challenges', label: t('dashboard.tabs.challenges'), icon: <ChallengesIcon className="h-5 w-5" /> },
        { id: 'opportunities', label: t('dashboard.tabs.opportunities'), icon: <OpportunitiesIcon className="h-5 w-5" /> },
    ];
    
    // START: Opportunities Dashboard Component
    const OpportunitiesDashboard = () => {
        const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
        const [filters, setFilters] = useState<OpportunityDashboardFilters>(getDefaultOpportunityFilters());
        
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
            if (data.id) {
                updateOpportunity(data.id, data);
                setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
            } else {
                addOpportunity(data);
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
                        <SummaryDonutChart title={t('dashboard.opportunities.statusDistribution')} data={statusData} colors={OPPORTUNITY_STATUS_DONUT_COLORS} isLoading={isLoading} />
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
    // END: Opportunities Dashboard Component

    const TabContent = () => {
        switch (activeTab) {
            case 'priorityMatrix':
                return (
                    <Card>
                        <UnifiedPriorityMatrix
                            challenges={challenges}
                            opportunities={opportunities}
                            onChallengeClick={(c) => setItemToView(c)}
                            onOpportunityClick={(o) => setItemToView(o)}
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
        }

        return null;
    };

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
            
            <TabContent />

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