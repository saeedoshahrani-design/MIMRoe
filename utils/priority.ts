import { Challenge } from '../types';

export type PriorityValue = 'منخفض' | 'متوسط' | 'مرتفع';

export interface PriorityResult {
    categoryKey: 'quick_wins' | 'major_projects' | 'small_quick_wins' | 'not_worth_it';
    score: number;
    legacyPriority: Challenge['priority'];
}

export const computePriorityDetails = (effort: PriorityValue, impact: PriorityValue): PriorityResult => {
    if (impact === 'مرتفع') {
        if (effort === 'منخفض') return { categoryKey: 'quick_wins', score: 4, legacyPriority: 'عالي' }; // Quick Wins
        if (effort === 'متوسط') return { categoryKey: 'major_projects', score: 3, legacyPriority: 'عالي' }; // Major Projects
        if (effort === 'مرتفع') return { categoryKey: 'major_projects', score: 3, legacyPriority: 'عالي' }; // Major Projects
    }
    if (impact === 'متوسط') {
        if (effort === 'منخفض') return { categoryKey: 'quick_wins', score: 3, legacyPriority: 'متوسط' }; // Quick Wins
        if (effort === 'متوسط') return { categoryKey: 'small_quick_wins', score: 2, legacyPriority: 'متوسط' }; // Fill In
        if (effort === 'مرتفع') return { categoryKey: 'not_worth_it', score: 1, legacyPriority: 'منخفض' }; // Consider Later
    }
    if (impact === 'منخفض') {
        if (effort === 'منخفض') return { categoryKey: 'small_quick_wins', score: 2, legacyPriority: 'منخفض' }; // Fill In
        if (effort === 'متوسط') return { categoryKey: 'not_worth_it', score: 1, legacyPriority: 'منخفض' }; // Consider Later
        if (effort === 'مرتفع') return { categoryKey: 'not_worth_it', score: 0, legacyPriority: 'منخفض' }; // Not Worth It
    }
    // Default fallback
    return { categoryKey: 'not_worth_it', score: 0, legacyPriority: 'منخفض' };
};

export const getPriorityBadgeStyle = (category: 'quick_wins' | 'major_projects' | 'small_quick_wins' | 'not_worth_it') => {
    switch (category) {
        case 'quick_wins':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'major_projects':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'small_quick_wins':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'not_worth_it':
            return 'bg-natural-100 text-natural-800 dark:bg-natural-700 dark:text-natural-200';
        default:
            return 'bg-natural-100 text-natural-800 dark:bg-natural-700 dark:text-natural-200';
    }
};
