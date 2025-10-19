import React from 'react';
import { LightbulbIcon, BoltIcon, SparklesIcon, ChartBarIcon, CheckCircleIcon, LayersIcon } from './icons/IconComponents';

const icons = [
    { Icon: LightbulbIcon, animation: 'animate-glow' },
    { Icon: BoltIcon, animation: 'animate-spin-slow' },
    { Icon: SparklesIcon, animation: 'animate-glow' },
    { Icon: ChartBarIcon, animation: 'animate-spin-slow' },
    { Icon: CheckCircleIcon, animation: 'animate-glow' },
    { Icon: LayersIcon, animation: 'animate-spin-slow' },
];

const SplashScreen: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-natural-50 dark:bg-natural-900 animate-fade-in">
            <div className="grid grid-cols-3 gap-12">
                {icons.map(({ Icon, animation }, index) => (
                    <div 
                        key={index} 
                        className={`text-dark-purple-300 dark:text-dark-purple-500 ${animation}`}
                        style={{ animationDelay: `${index * 150}ms`, animationDuration: `${(index % 2 === 0) ? '4s' : '5s'}` }}
                    >
                        <Icon className="w-16 h-16 opacity-70" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SplashScreen;
