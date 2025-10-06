import { TargetStatus } from '../types';

export const calculateTargetProgress = (baseline: number, current: number, target: number): number => {
    if (target === baseline) {
        return current >= target ? 100 : 0;
    }
    
    // Handle cases where the goal is to decrease a value
    if (target < baseline) {
        const total_distance = baseline - target;
        const progress_distance = baseline - current;
        const progress = (progress_distance / total_distance) * 100;
        return Math.max(0, Math.min(100, Math.round(progress)));
    }

    // Standard case: increase a value
    const total_distance = target - baseline;
    const progress_distance = current - baseline;
    const progress = (progress_distance / total_distance) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
};

export const getTargetStatus = (progress: number): TargetStatus => {
    if (progress >= 80) {
        return 'onTrack';
    }
    if (progress >= 50) {
        return 'atRisk';
    }
    return 'behind';
};
