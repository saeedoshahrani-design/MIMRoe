import { Opportunity } from '../types';

export const generateNextOpportunityCode = (existingOpportunities: Opportunity[]): string => {
    if (!existingOpportunities || existingOpportunities.length === 0) {
        return 'OP01';
    }
    const codes = existingOpportunities
        .map(c => c.code)
        .filter(code => code && code.startsWith('OP'));

    if (codes.length === 0) {
        return 'OP01';
    }

    const maxNum = codes.reduce((max, code) => {
        const num = parseInt(code.substring(2), 10);
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const nextNum = maxNum + 1;
    return `OP${String(nextNum).padStart(2, '0')}`;
};
