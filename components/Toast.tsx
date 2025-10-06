import React, { useEffect, useState } from 'react';
import { CloseIcon } from './icons/IconComponents';

interface ToastProps {
    message: string;
    type: 'success' | 'info';
    onClose: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, action }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true); // Trigger fade-in animation
    }, []);

    const typeClasses = {
        success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-400 dark:border-green-600',
        info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-600',
    };

    return (
        <div 
            className={`fixed top-20 right-4 rtl:right-auto rtl:left-4 z-50 max-w-sm w-full p-4 border-l-4 rtl:border-l-0 rtl:border-r-4 rounded-md shadow-lg transition-opacity duration-300 ${typeClasses[type]} ${visible ? 'opacity-100' : 'opacity-0'}`}
            role="alert"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <p className="text-sm font-medium">{message}</p>
                    {action && (
                        <button 
                            onClick={action.onClick}
                            className="ml-3 rtl:ml-0 rtl:mr-3 text-sm font-bold underline hover:no-underline"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
                <button onClick={onClose} className="p-1 -ml-1 -mr-2 rtl:-mr-1 rtl:-ml-2 rounded-full hover:bg-black/10">
                    <span className="sr-only">Close</span>
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Toast;