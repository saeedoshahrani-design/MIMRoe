import { StrategicInitiative, InitiativeDashboardFilters, PerformanceStatus, Department, InitiativeTask } from '../types';
import { calculatePlannedProgress, getPerformanceStatus } from './calculatePlannedProgress';
import { translateDepartment } from './localizationUtils';
import { STATUS_COLORS } from './chartUtils';

/**
 * Calculates the overall actual and planned progress for a single initiative
 * by averaging the progress of its tasks.
 */
export const calculateInitiativeProgress = (tasks: InitiativeTask[] | undefined): { actual: number, planned: number, status: PerformanceStatus } => {
    if (!tasks || tasks.length === 0) {
        return { actual: 0, planned: 0, status: 'onTrack' };
    }
    const totalActual = tasks.reduce((sum, task) => sum + (task.actual_percent || 0), 0);
    const totalPlanned = tasks.reduce((sum, task) => sum + calculatePlannedProgress(task.start, task.end), 0);
    
    const actual = Math.round(totalActual / tasks.length);
    const planned = Math.round(totalPlanned / tasks.length);
    const status = getPerformanceStatus(actual, planned);

    return { actual, planned, status };
};

export const getDefaultInitiativeFilters = (): InitiativeDashboardFilters => ({
    searchTerm: '',
    selectedDepartments: [],
    selectedPerformance: [],
    dateRange: { start: null, end: null },
});

export const filterInitiatives = (initiatives: StrategicInitiative[], filters: InitiativeDashboardFilters): StrategicInitiative[] => {
    return initiatives.filter(init => {
        // Search Term
        if (filters.searchTerm) {
            const lowerSearch = filters.searchTerm.toLowerCase();
            if (
                !(init.name?.en || '').toLowerCase().includes(lowerSearch) &&
                !(init.name?.ar || '').toLowerCase().includes(lowerSearch)
            ) {
                return false;
            }
        }

        // Departments
        if (filters.selectedDepartments.length > 0) {
            const hasMatch = (init.associatedDepartments || []).some(deptAr => filters.selectedDepartments.includes(deptAr));
            if (!hasMatch) return false;
        }

        // Performance
        if (filters.selectedPerformance.length > 0) {
            const { status } = calculateInitiativeProgress(init.tasks);
            if (!filters.selectedPerformance.includes(status)) {
                return false;
            }
        }
        
        // Date Range
        if (filters.dateRange.start && filters.dateRange.end) {
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            endDate.setDate(endDate.getDate() + 1);

            const opStartDate = init.startDate ? new Date(init.startDate) : null;
            const opEndDate = init.endDate ? new Date(init.endDate) : null;
            
            // Check for overlap
            if (opStartDate && opEndDate) {
                if (opStartDate >= endDate || opEndDate < startDate) {
                    return false;
                }
            } else {
                return false; // Don't show if no dates
            }
        }
        
        return true;
    });
};


/**
 * Calculates the summary KPIs for the initiatives dashboard cards.
 */
export const calculateInitiativeKpis = (initiatives: StrategicInitiative[]) => {
    const kpis = initiatives.reduce((acc, initiative) => {
        const tasks = initiative.tasks || [];
        const { actual } = calculateInitiativeProgress(tasks);

        acc.totalInitiatives++;
        acc.totalProgress += actual;
        acc.totalTasks += tasks.length;
        acc.openTasks += tasks.filter(t => t.status !== 'مغلق').length;
        acc.closedTasks += tasks.filter(t => t.status === 'مغلق').length;

        return acc;
    }, {
        totalInitiatives: 0,
        totalProgress: 0,
        totalTasks: 0,
        openTasks: 0,
        closedTasks: 0,
    });

    return {
        totalInitiatives: kpis.totalInitiatives,
        avgProgress: kpis.totalInitiatives > 0 ? Math.round(kpis.totalProgress / kpis.totalInitiatives) : 0,
        totalTasks: kpis.totalTasks,
        openTasks: kpis.openTasks,
        closedTasks: kpis.closedTasks,
    };
};

/**
 * Prepares data for the 'Initiatives by Department' bar chart.
 */
export const prepareInitiativesByDepartmentData = (initiatives: StrategicInitiative[], departments: Department[], language: 'ar' | 'en') => {
    const deptCount: Record<string, number> = {};

    initiatives.forEach(initiative => {
        (initiative.associatedDepartments || []).forEach(deptArName => {
            const deptLangName = translateDepartment(deptArName, language);
            deptCount[deptLangName] = (deptCount[deptLangName] || 0) + 1;
        });
    });

    return Object.entries(deptCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
};


/**
 * Prepares data for the 'Initiative Adherence' list, showing planned vs. actual progress for each.
 */
export const prepareInitiativeAdherenceData = (initiatives: StrategicInitiative[], language: 'ar' | 'en') => {
    return initiatives.map(initiative => {
        const { actual, planned } = calculateInitiativeProgress(initiative.tasks || []);
        const tasks = initiative.tasks || [];
        const openTasks = tasks.filter(t => t.status !== 'مغلق').length;
        return {
            name: initiative.name[language],
            avgActual: actual,
            avgPlanned: planned,
            taskCount: tasks.length,
            openTaskCount: openTasks,
            initiative: initiative 
        };
    }).sort((a, b) => b.avgActual - a.avgActual);
};

export const prepareInitiativeStatusDistributionData = (initiatives: StrategicInitiative[], t: (key: string) => string) => {
    const statusCounts = {
        notStarted: 0,
        inProgress: 0,
        completed: 0,
    };

    initiatives.forEach(initiative => {
        const { actual } = calculateInitiativeProgress(initiative.tasks);
        if (actual === 100) {
            statusCounts.completed++;
        } else if (actual > 0) {
            statusCounts.inProgress++;
        } else {
            statusCounts.notStarted++;
        }
    });

    return [
        { name: t('dashboard.initiatives.status.notStarted'), value: statusCounts.notStarted },
        { name: t('dashboard.initiatives.status.inProgress'), value: statusCounts.inProgress },
        { name: t('dashboard.initiatives.status.completed'), value: statusCounts.completed },
    ].filter(item => item.value > 0);
};

export const prepareTaskStatusByInitiativeData = (initiatives: StrategicInitiative[], language: 'ar' | 'en') => {
    const data = initiatives.map(initiative => {
        const taskStatusCounts = (initiative.tasks || []).reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            name: initiative.name[language],
            ...taskStatusCounts
        };
    });

    return data;
};