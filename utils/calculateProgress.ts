import { Activity } from '../types';

export const calculateProgress = (activities: Activity[]): number => {
    if (!activities || activities.length === 0) {
        return 0;
    }

    const totalWeight = activities.reduce((sum, activity) => sum + (activity.weight || 0), 0);
    
    if (totalWeight === 0) {
        return 0;
    }

    const completedWeight = activities
        .filter(activity => activity.is_completed)
        .reduce((sum, activity) => sum + (activity.weight || 0), 0);

    const progress = (completedWeight / totalWeight) * 100;

    return Math.round(progress);
};
