import { PerformanceStatus } from '../types';

/**
 * Calculates the planned progress percentage based on the current date between a start and target date.
 * @param startDateString - The start date in ISO format (YYYY-MM-DD).
 * @param targetDateString - The target date in ISO format (YYYY-MM-DD).
 * @returns A number between 0 and 100 representing the planned progress percentage.
 */
export const calculatePlannedProgress = (startDateString?: string | null, targetDateString?: string | null): number => {
    if (!startDateString || !targetDateString) {
        return 0;
    }

    try {
        const startDate = new Date(startDateString);
        const targetDate = new Date(targetDateString);
        const today = new Date();

        // Set hours to 0 to compare dates only
        startDate.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (today < startDate) {
            return 0;
        }

        if (today >= targetDate) {
            return 100;
        }

        const totalDuration = targetDate.getTime() - startDate.getTime();
        if (totalDuration <= 0) {
            return today >= targetDate ? 100 : 0;
        }

        const elapsedDuration = today.getTime() - startDate.getTime();
        const progress = (elapsedDuration / totalDuration) * 100;

        return Math.round(Math.max(0, Math.min(100, progress)));
    } catch (e) {
        console.error("Error calculating planned progress:", e);
        return 0;
    }
};

/**
 * Determines the performance status by comparing actual progress to planned progress.
 * @param actualProgress - The actual progress percentage (0-100).
 * @param plannedProgress - The planned progress percentage (0-100).
 * @returns The performance status: 'ahead', 'onTrack', or 'behind'.
 */
export const getPerformanceStatus = (actualProgress: number, plannedProgress: number): PerformanceStatus => {
    if (plannedProgress === 0 && actualProgress > 0) return 'ahead';
    if (plannedProgress === 100 && actualProgress < 100) return 'behind';
    
    const difference = actualProgress - plannedProgress;
    
    if (difference >= 5) { // More than 5% ahead
        return 'ahead';
    }
    if (difference < -10) { // More than 10% behind
        return 'behind';
    }
    return 'onTrack';
};
