
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-natural-800 rounded-xl shadow-sm border border-natural-200 dark:border-natural-700 p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
