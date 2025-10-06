import React from 'react';

interface KpiCardProps {
    title: string;
    value: string | number;
    description?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, description }) => {
    return (
        <div className="bg-white dark:bg-natural-800 p-4 rounded-lg shadow-sm border border-natural-200 dark:border-natural-700">
            <h4 className="text-sm font-medium text-natural-500 dark:text-natural-400 truncate">{title}</h4>
            <p className="mt-1 text-3xl font-semibold text-natural-800 dark:text-natural-100">{value}</p>
            {description && <p className="text-xs text-natural-400 dark:text-natural-500 mt-1">{description}</p>}
        </div>
    );
};

export default KpiCard;
