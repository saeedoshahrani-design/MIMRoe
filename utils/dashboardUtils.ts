import { Challenge, DashboardFilters } from '../types';
import { calculateProgress } from './calculateProgress';
import { calculatePlannedProgress, getPerformanceStatus } from './calculatePlannedProgress';
import { locales } from '../i18n/locales';

export const getDefaultFilters = (): DashboardFilters => ({
  timeRange: 'all',
  customDateRange: { start: null, end: null },
  selectedDepartments: [],
  selectedStatuses: [],
  selectedPerformance: [],
  searchTerm: '',
});


export const filterChallenges = (challenges: Challenge[], filters: DashboardFilters): Challenge[] => {
    const { timeRange, customDateRange, selectedDepartments, selectedStatuses, selectedPerformance, searchTerm } = filters;

    const now = new Date();
    const lowerSearchTerm = searchTerm.toLowerCase();

    return challenges.filter(c => {
        // Time Range Filter
        if (timeRange !== 'all') {
            const challengeDate = new Date(c.created_at);
            if (timeRange === 'custom') {
                const startDate = customDateRange.start ? new Date(customDateRange.start) : null;
                const endDate = customDateRange.end ? new Date(customDateRange.end) : null;
                if (startDate && challengeDate < startDate) return false;
                // Add 1 day to end date to include the whole day
                if (endDate) {
                    const inclusiveEndDate = new Date(endDate);
                    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
                    if (challengeDate >= inclusiveEndDate) return false;
                }

            } else {
                const diffDays = (now.getTime() - challengeDate.getTime()) / (1000 * 3600 * 24);
                const days = timeRange === '30' ? 30 : 90;
                if (diffDays > days) return false;
            }
        }

        // Department Filter
        if (selectedDepartments.length > 0 && !selectedDepartments.includes(c.department)) {
            return false;
        }

        // Status Filter
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(c.status)) {
            return false;
        }

        // Performance Filter
        if (selectedPerformance.length > 0) {
            const actual = calculateProgress(c.activities);
            const planned = calculatePlannedProgress(c.start_date, c.target_date);
            const performance = getPerformanceStatus(actual, planned);
            if (!selectedPerformance.includes(performance)) {
                return false;
            }
        }
        
        // Search Term Filter
        if (searchTerm) {
             const matchesSearch = 
                (c.title || '').toLowerCase().includes(lowerSearchTerm) ||
                (c.code || '').toLowerCase().includes(lowerSearchTerm);
            if (!matchesSearch) return false;
        }

        return true;
    });
};


export const calculateKpis = (challenges: Challenge[]) => {
    if (challenges.length === 0) {
        return {
            totalChallenges: 0,
            overdueChallenges: 0,
            avgActualProgress: 0,
            performanceDistribution: { onTrack: 0, behind: 0, ahead: 0 },
        };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueChallenges = challenges.filter(c => {
        if (!c.target_date) return false;
        const targetDate = new Date(c.target_date);
        return targetDate < now && c.status !== 'مغلق';
    }).length;
    
    const totalActualProgress = challenges.reduce((sum, c) => sum + calculateProgress(c.activities), 0);
    const avgActualProgress = totalActualProgress / challenges.length;

    const performanceDistribution = challenges.reduce((acc, c) => {
        const actual = calculateProgress(c.activities);
        const planned = calculatePlannedProgress(c.start_date, c.target_date);
        const status = getPerformanceStatus(actual, planned);
        acc[status]++;
        return acc;
    }, { onTrack: 0, behind: 0, ahead: 0 });


    return {
        totalChallenges: challenges.length,
        overdueChallenges,
        avgActualProgress,
        performanceDistribution,
    };
};

// Chart Data Preparation Functions

export const prepareDepartmentsComparisonData = (challenges: Challenge[]) => {
    const departmentsData = challenges.reduce((acc, c) => {
        if (!acc[c.department]) {
            acc[c.department] = { name: c.department, 'جديد': 0, 'قيد المعالجة': 0, 'قيد المراجعة': 0, 'مغلق': 0, total: 0 };
        }
        acc[c.department][c.status]++;
        acc[c.department].total++;
        return acc;
    }, {} as Record<string, any>);
    return Object.values(departmentsData);
};

export const prepareCategoryBreakdownData = (challenges: Challenge[]) => {
    const categoryData = challenges.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
};

export const prepareMonthlyTrendsData = (challenges: Challenge[]) => {
    const trends = challenges.reduce((acc, c) => {
        if (!c.created_at) return acc;
        const month = new Date(c.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!acc[month]) {
            acc[month] = { name: month, created: 0, completed: 0, date: new Date(c.created_at) };
        }
        acc[month].created++;
        if (c.status === 'مغلق') {
            acc[month].completed++;
        }
        return acc;
        // FIX: Provide a type for the accumulator to resolve 'unknown' type errors.
    }, {} as Record<string, { name: string; created: number; completed: number; date: Date; }>);

    return Object.values(trends).sort((a,b) => a.date.getTime() - b.date.getTime());
};

export const prepareChallengesAgingData = (challenges: Challenge[], t: (key: string) => string) => {
    const now = new Date();
    const openChallenges = challenges.filter(c => c.status !== 'مغلق' && c.start_date);

    const buckets = {
        '0-30': { name: t('dashboard.agingBuckets.0-30'), 'جديد': 0, 'قيد المعالجة': 0, 'قيد المراجعة': 0 },
        '31-60': { name: t('dashboard.agingBuckets.31-60'), 'جديد': 0, 'قيد المعالجة': 0, 'قيد المراجعة': 0 },
        '61-90': { name: t('dashboard.agingBuckets.61-90'), 'جديد': 0, 'قيد المعالجة': 0, 'قيد المراجعة': 0 },
        '>90': { name: t('dashboard.agingBuckets.>90'), 'جديد': 0, 'قيد المعالجة': 0, 'قيد المراجعة': 0 },
    };

    openChallenges.forEach(c => {
        const startDate = new Date(c.start_date);
        const ageInDays = (now.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        
        let bucketKey: keyof typeof buckets;
        if (ageInDays <= 30) bucketKey = '0-30';
        else if (ageInDays <= 60) bucketKey = '31-60';
        else if (ageInDays <= 90) bucketKey = '61-90';
        else bucketKey = '>90';
        
        if (c.status !== 'مغلق') {
            buckets[bucketKey][c.status as 'جديد' | 'قيد المعالجة' | 'قيد المراجعة']++;
        }
    });

    return Object.values(buckets);
};

export const prepareTimelineAdherenceData = (challenges: Challenge[]) => {
    if (!challenges || challenges.length === 0) return [];
    
    const challengesByDept = challenges.reduce((acc, c) => {
        if (!acc[c.department]) {
            acc[c.department] = [];
        }
        acc[c.department].push(c);
        return acc;
    }, {} as Record<string, Challenge[]>);

    return Object.entries(challengesByDept).map(([name, deptChallenges]) => {
        const totalActual = deptChallenges.reduce((sum, c) => sum + calculateProgress(c.activities), 0);
        const totalPlanned = deptChallenges.reduce((sum, c) => sum + calculatePlannedProgress(c.start_date, c.target_date), 0);
        const count = deptChallenges.length;

        return {
            name,
            avgActual: count > 0 ? Math.round(totalActual / count) : 0,
            avgPlanned: count > 0 ? Math.round(totalPlanned / count) : 0,
            challenges: deptChallenges
        };
    }).sort((a,b) => b.avgActual - a.avgActual);
};


export const prepareStatusDistributionData = (challenges: Challenge[], t: (key: string) => string) => {
    if (!challenges) return [];
    const statusCounts = challenges.reduce((acc, c) => {
        // FIX: Cast locale object to Record<string, string> and simplify key lookup to prevent type errors.
        const arStatusOptions = locales.ar.dashboard.chartStatus as Record<string, string>;
        const statusKey = Object.keys(arStatusOptions).find(key => arStatusOptions[key] === c.status);
        
        const translatedStatus = statusKey ? t(`dashboard.chartStatus.${statusKey}`) : c.status;

        acc[translatedStatus] = (acc[translatedStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
};

export const prepareCategoryDistributionData = (challenges: Challenge[], t: (key: string, replacements?: Record<string, string | number>) => string) => {
    if (!challenges) return [];
    const categoryCounts = challenges.reduce((acc, c) => {
        // FIX: Cast locale object to Record<string, string> and simplify key lookup to prevent type errors.
        const arCategoryOptions = locales.ar.challenges.categoryOptions as Record<string, string>;
        const categoryKey = Object.keys(arCategoryOptions).find(key => arCategoryOptions[key] === c.category);

        if (categoryKey) {
            const translatedCategory = t(`challenges.categoryOptions.${categoryKey}`);
            acc[translatedCategory] = (acc[translatedCategory] || 0) + 1;
        } else {
            acc[c.category] = (acc[c.category] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
};