import { PerformanceStatus } from '../types';

export const calculatePlannedProgress = (startDateStr?: string, targetDateStr?: string): number => {
    if (!startDateStr || !targetDateStr) {
        return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() <= startDate.getTime()) {
        return 0;
    }

    if (today.getTime() <= startDate.getTime()) {
        return 0;
    }

    if (today.getTime() >= targetDate.getTime()) {
        return 100;
    }

    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsedDuration = today.getTime() - startDate.getTime();

    const progress = (elapsedDuration / totalDuration) * 100;

    return Math.round(progress);
};

export const getPerformanceStatus = (actual: number, planned: number): PerformanceStatus => {
    if (actual < planned - 2) {
        return 'behind';
    }
    if (actual > planned + 10) {
        return 'ahead';
    }
    return 'onTrack';
};