import { Challenge } from '../types';
import { locales } from '../i18n/locales';

export type PriorityValue = 'منخفض' | 'متوسط' | 'مرتفع';

export interface PriorityResult {
    categoryKey: keyof typeof locales.en.challenges.priorityCategories;
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
        if (effort === 'منخفض') return { categoryKey: 'quick_wins', score: 4, legacyPriority: 'عالي' }; // Quick Wins
        if (effort === 'متوسط') return { categoryKey: 'small_quick_wins', score: 2, legacyPriority: 'متوسط' }; // Small Quick Wins
        if (effort === 'مرتفع') return { categoryKey: 'not_worth_it', score: 1, legacyPriority: 'منخفض' }; // Not Worth It
    }
    if (impact === 'منخفض') {
        if (effort === 'منخفض') return { categoryKey: 'small_quick_wins', score: 2, legacyPriority: 'متوسط' }; // Small Quick Wins
        if (effort === 'متوسط') return { categoryKey: 'not_worth_it', score: 1, legacyPriority: 'منخفض' }; // Not Worth It
        if (effort === 'مرتفع') return { categoryKey: 'not_worth_it', score: 1, legacyPriority: 'منخفض' }; // Not Worth It
    }
    return { categoryKey: 'small_quick_wins', score: 2, legacyPriority: 'متوسط' }; // Default fallback
};

export const getPriorityBadgeStyle = (categoryKey?: string) => {
    switch (categoryKey) {
        case 'quick_wins': return 'bg-mim-bright-blue text-natural-900';
        case 'major_projects': return 'bg-mim-dark-purple text-white';
        case 'small_quick_wins': return 'bg-mim-medium-gray text-natural-900';
        case 'not_worth_it': return 'bg-mim-dark-gray text-white';
        default: return 'bg-natural-200 text-natural-800 dark:bg-natural-700 dark:text-natural-200';
    }
};
