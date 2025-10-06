import React from 'react';
import { XCircleIcon } from './icons/IconComponents';

interface ChipProps {
    label: string;
    onRemove: () => void;
    ariaLabel: string;
}

const Chip: React.FC<ChipProps> = ({ label, onRemove, ariaLabel }) => {
    return (
        <div className="flex items-center bg-dark-purple-100 dark:bg-dark-purple-800 text-dark-purple-800 dark:text-dark-purple-100 text-sm font-medium pl-2.5 pr-1.5 py-1 rounded-full">
            <span>{label}</span>
            <button 
                onClick={onRemove} 
                className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-dark-purple-200 dark:hover:bg-dark-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-dark-purple-100 dark:focus:ring-offset-dark-purple-800 focus:ring-dark-purple-500"
                aria-label={ariaLabel}
            >
                <XCircleIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export default Chip;
