
import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-natural-300 dark:border-natural-700 rounded-lg h-full">
            {icon && <div className="text-natural-400 dark:text-natural-500 mb-4">{icon}</div>}
            <p className="text-natural-500 dark:text-natural-400">{message}</p>
        </div>
    );
};

export default EmptyState;