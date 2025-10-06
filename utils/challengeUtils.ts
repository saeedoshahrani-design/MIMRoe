import { Challenge } from '../types';
import { locales } from '../i18n/locales';

export const generateNextChallengeCode = (existingChallenges: Challenge[]): string => {
    if (!existingChallenges || existingChallenges.length === 0) {
        return 'CH01';
    }
    const codes = existingChallenges
        .map(c => c.code)
        .filter(code => code && code.startsWith('CH'));

    if (codes.length === 0) {
        return 'CH01';
    }

    const maxNum = codes.reduce((max, code) => {
        const num = parseInt(code.substring(2), 10);
        return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const nextNum = maxNum + 1;
    return `CH${String(nextNum).padStart(2, '0')}`;
};
