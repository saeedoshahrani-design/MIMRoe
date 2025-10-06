import React from 'react';

interface SummaryKpiCardProps {
    title: string;
    value: string | number;
    subtitle: string;
}

const SummaryKpiCard: React.FC<SummaryKpiCardProps> = ({ title, value, subtitle }) => {
    return (
        <div className="bg-white dark:bg-natural-800 rounded-xl shadow-sm border border-natural-200 dark:border-natural-700 p-6 flex flex-col justify-center text-center h-full">
            <h4 className="text-sm font-semibold text-natural-500 dark:text-natural-400">{title}</h4>
            <p className="my-2 text-5xl font-bold text-dark-purple-600 dark:text-dark-purple-300">{value}</p>
            <p className="text-xs text-natural-400 dark:text-natural-500">{subtitle}</p>
        </div>
    );
};

export default SummaryKpiCard;
