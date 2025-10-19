import { locales } from '../i18n/locales';
import { departments } from '../data/mockData';

type TranslatableChallengeField = 'status' | 'category' | 'impact' | 'effort' | 'priority';

// This function finds the English-like key (e.g., 'in_progress') from the Arabic value (e.g., 'قيد المعالجة')
const findKeyForValue = (object: Record<string, string>, value: string): string | null => {
    if (!object) return null;
    const entry = Object.entries(object).find(([_, val]) => val === value);
    return entry ? entry[0] : null;
};

export const translateChallengeField = (
    field: TranslatableChallengeField,
    value: string, // The Arabic value from the database
    t: (key: string) => string
): string => {
    if (!value) return '';
    const arLocaleOptions = locales.ar.challenges[`${field}Options` as const];
    
    const key = findKeyForValue(arLocaleOptions, value);
    
    if (key) {
        return t(`challenges.${field}Options.${key}`);
    }
    
    return value; // Fallback
};

export const translateDepartment = (
    arabicName: string,
    language: 'ar' | 'en'
): string => {
    if (!arabicName) return '';
    const department = departments.find(d => d.name.ar === arabicName);
    return department ? department.name[language] : arabicName;
};

export const autoTranslate = (text: string, toLang: 'ar' | 'en'): string => {
    if (!text) return '';
    // Simple placeholder for development
    return `(${toLang.toUpperCase()}) ${text}`;
};