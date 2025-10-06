import { Opportunity, OpportunityDashboardFilters, OpportunityStatus } from '../types';
import { departments } from '../data/mockData';

export const getDefaultOpportunityFilters = (): OpportunityDashboardFilters => ({
    searchTerm: '',
    selectedDepartments: [],
    selectedStatuses: [],
    dateRange: { start: null, end: null },
});

export const filterOpportunities = (opportunities: Opportunity[], filters: OpportunityDashboardFilters): Opportunity[] => {
    return opportunities.filter(op => {
        // Search Term
        if (filters.searchTerm) {
            const lowerSearch = filters.searchTerm.toLowerCase();
            if (
                !op.title.toLowerCase().includes(lowerSearch) &&
                !op.proposedSolution.toLowerCase().includes(lowerSearch) &&
                !op.code.toLowerCase().includes(lowerSearch)
            ) {
                return false;
            }
        }

        // Departments
        if (filters.selectedDepartments.length > 0 && !filters.selectedDepartments.includes(op.department)) {
            return false;
        }

        // Statuses
        if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes(op.status)) {
            return false;
        }
        
        // Date Range (checks if opportunity's start OR due date falls within the range)
        if (filters.dateRange.start && filters.dateRange.end) {
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            endDate.setDate(endDate.getDate() + 1); // Make end date inclusive

            const opStartDate = op.startDate ? new Date(op.startDate) : null;
            const opDueDate = op.dueDate ? new Date(op.dueDate) : null;

            const startsInRange = opStartDate && opStartDate >= startDate && opStartDate < endDate;
            const endsInRange = opDueDate && opDueDate >= startDate && opDueDate < endDate;
            
            if (!startsInRange && !endsInRange) {
                 return false;
            }
        }
        
        return true;
    });
};

export const calculateOpportunityKpis = (opportunities: Opportunity[]) => {
    const now = new Date();
    let nearestDueDate: Date | null = null;
    
    const kpis = opportunities.reduce((acc, op) => {
        acc.total++;
        if (op.status === 'Under Review') acc.underReview++;
        if (op.status === 'In Progress') acc.inProgress++;
        if (op.status === 'Implemented') acc.implemented++;
        acc.totalProgress += op.progress;

        if (op.dueDate) {
            const dueDate = new Date(op.dueDate);
            if (dueDate >= now && (!nearestDueDate || dueDate < nearestDueDate)) {
                nearestDueDate = dueDate;
            }
        }

        return acc;
    }, {
        total: 0,
        underReview: 0,
        inProgress: 0,
        implemented: 0,
        totalProgress: 0,
    });

    return {
        total: kpis.total,
        underReview: kpis.underReview,
        inProgress: kpis.inProgress,
        implemented: kpis.implemented,
        avgProgress: kpis.total > 0 ? Math.round(kpis.totalProgress / kpis.total) : 0,
        nearestDueDate,
    };
};


export const prepareOpportunityStatusDistributionData = (opportunities: Opportunity[], t: (key: string) => string) => {
    const statusCounts = opportunities.reduce((acc, op) => {
        const translatedStatus = t(`opportunities.statusOptions.${op.status}`);
        acc[translatedStatus] = (acc[translatedStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
};


export const prepareOpportunityDepartmentDistributionData = (opportunities: Opportunity[], language: 'en' | 'ar') => {
    const departmentsData = opportunities.reduce((acc, op) => {
        const dept = departments.find(d => d.name.ar === op.department);
        const deptName = dept ? dept.name[language] : op.department;

        if (!acc[deptName]) {
            acc[deptName] = {
                name: deptName,
                total: 0,
                'Under Review': 0,
                'In Progress': 0,
                'Implemented': 0,
                'On Hold': 0,
            };
        }
        acc[deptName][op.status]++;
        acc[deptName].total++;
        return acc;
    }, {} as Record<string, { name: string; total: number } & Record<OpportunityStatus, number>>);
    
    return Object.values(departmentsData).sort((a, b) => b.total - a.total);
};