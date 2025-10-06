import { useAppContext } from '../context/AppContext';
import { locales } from '../i18n/locales';
import { OpportunityStatus } from '../types';

// Official Color Palette
export const COLORS = {
    mimDarkestGray: '#111827',
    mimDarkGray: '#666666',
    mimMediumGray: '#B3B3B3',
    mimLightGray: '#E6E6E6',
    mimDarkPink: '#BD9F9D',
    mimDarkPurple: '#413258',
    mimBrightBlue: '#1AD9C7',
    naturalGreen600: '#059669',
    naturalAmber400: '#FBBF24',
    naturalAmber500: '#F59E0B',
};

// Consistent Status Colors (as per design system)
export const STATUS_COLORS: { [key: string]: string } = {
    'جديد': '#9AA0A6', // Natural 400
    'قيد المعالجة': '#12B886', // Teal/Accent
    'قيد المراجعة': '#6D4AFF', // Purple/Accent
    'مغلق': '#2E3440', // Near Natural 700
};

// Priority Category Colors
export const PRIORITY_CATEGORY_COLORS: { [key: string]: string } = {
    'quick_wins': COLORS.mimBrightBlue,
    'major_projects': COLORS.mimDarkPurple,
    'small_quick_wins': COLORS.mimMediumGray,
    'not_worth_it': COLORS.mimDarkGray,
};

// Performance Colors
export const PERFORMANCE_COLORS: { [key: string]: string } = {
    'onTrack': '#3B82F6', // Blue 500
    'behind': COLORS.naturalAmber500,
    'ahead': COLORS.naturalGreen600,
};

// Category Colors
export const CATEGORY_COLORS = ['#a855f7', '#1AD9C7', '#F59E0B', '#3B82F6', '#EF4444', '#6366F1'];

// Monthly Trend Colors
export const TREND_COLORS = {
    created: '#a855f7', // dark-purple-500
    completed: '#10b981', // bright-blue-500
}

// FIX: Add new color palettes for the dashboard summary donut charts.
export const STATUS_DONUT_COLORS: Record<string, string> = {
    // Keys here must match the translated output from prepareStatusDistributionData
    'New': '#94a3b8', // slate-400
    'جديد': '#94a3b8',
    'In Progress': '#14b8a6', // teal-500
    'قيد المعالجة': '#14b8a6',
    'Under Review': '#8b5cf6', // violet-500
    'قيد المراجعة': '#8b5cf6',
    'Closed': '#334155', // slate-700
    'مغلق': '#334155',
};

export const CATEGORY_DONUT_COLORS: Record<string, string> = {
    // Keys must match translated output from prepareCategoryDistributionData
    'Operational': '#06b6d4', // cyan-500
    'تشغيلي': '#06b6d4',
    'Technical': '#3b82f6', // blue-500
    'تقني': '#3b82f6',
    'Governance': '#a855f7', // purple-500
    'حوكمة': '#a855f7',
    'Human Resources': '#f97316', // orange-500
    'موارد بشرية': '#f97316',
    'Organizational': '#5eead4', // teal-300
    'تنظيمي': '#5eead4',
    'External': '#fbbf24', // amber-400
    'خارجي': '#fbbf24',
};

export const OPPORTUNITY_STATUS_DONUT_COLORS: Record<string, string> = {
    // Keys here must match the translated output
    'Under Review': '#f97316', // orange-500
    'قيد المراجعة': '#f97316',
    'In Progress': '#3b82f6', // blue-500
    'قيد التنفيذ': '#3b82f6',
    'Implemented': '#22c55e', // green-500
    'منفذة': '#22c55e',
    'On Hold': '#64748b', // slate-500
    'معلقة': '#64748b',
};

export const OPPORTUNITY_STATUS_COLORS: Record<OpportunityStatus, string> = {
    'Under Review': '#f97316', // orange-500
    'In Progress': '#3b82f6', // blue-500
    'Implemented': '#22c55e', // green-500
    'On Hold': '#64748b', // slate-500
};


// Hook to get theme-dependent styles
export const useChartTheme = () => {
    const { theme, language } = useAppContext();
    const isDark = theme === 'dark';
    const isRtl = language === 'ar';
    const formatNumber = locales[language].formatNumber;

    return {
        isRtl,
        formatNumber,
        tick: { fill: isDark ? COLORS.mimMediumGray : COLORS.mimDarkGray, fontSize: 12 },
        grid: { stroke: isDark ? '#374151' : '#e5e7eb' },
        tooltip: {
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
            color: isDark ? COLORS.mimLightGray : COLORS.mimDarkestGray,
            backdropFilter: 'blur(4px)',
            direction: isRtl ? 'rtl' : 'ltr',
        },
        legend: { color: isDark ? COLORS.mimLightGray : COLORS.mimDarkestGray, fontSize: 12 },
        label: { fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, fontWeight: 'bold' }
    };
};