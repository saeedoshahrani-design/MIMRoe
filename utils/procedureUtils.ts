import { Procedure } from '../types';

export const autoTranslate = (text: string, toLang: 'ar' | 'en'): string => {
    if (!text) return '';
    // Simple placeholder for development
    return `(${toLang.toUpperCase()}) ${text}`;
};


export const generateNextProcedureCode = (existingProcedures: Procedure[]): string => {
    if (!existingProcedures || existingProcedures.length === 0) {
        return 'PROC-001';
    }
    
    const maxNum = existingProcedures.reduce((max, p) => {
        const numMatch = p.code.match(/\d+$/);
        if (numMatch) {
            const num = parseInt(numMatch[0], 10);
            return Math.max(max, num);
        }
        return max;
    }, 0);

    const nextNum = maxNum + 1;
    return `PROC-${String(nextNum).padStart(3, '0')}`;
};