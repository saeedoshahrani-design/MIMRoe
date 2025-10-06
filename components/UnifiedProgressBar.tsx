import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { PerformanceStatus } from '../types';

interface UnifiedProgressBarProps {
    actualProgress: number;
    plannedProgress: number;
    status: PerformanceStatus;
    startDate?: string;
    targetDate?: string;
}

const UnifiedProgressBar: React.FC<UnifiedProgressBarProps> = ({ actualProgress, plannedProgress, status, startDate, targetDate }) => {
    const { t, language, formatDate } = useLocalization();

    const cappedActual = Math.round(Math.max(0, Math.min(100, actualProgress)));
    const cappedPlanned = Math.round(Math.max(0, Math.min(100, plannedProgress)));
    const showPlannedElements = !!(startDate && targetDate && (new Date(targetDate) > new Date(startDate)));

    const statusIndicator = {
        onTrack: { text: t('challenges.performanceStatus.onTrack'), className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
        behind: { text: t('challenges.performanceStatus.behind'), className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
        ahead: { text: t('challenges.performanceStatus.ahead'), className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    }[status];

    return (
        <div className="group relative w-full" aria-label={t('challenges.progress')}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-natural-800 dark:text-natural-100">{t('challenges.progress')}</span>
                 {showPlannedElements && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusIndicator.className}`}>
                        {statusIndicator.text}
                    </span>
                )}
            </div>

            <div className="relative w-full">
                <div className="relative w-full bg-natural-200 dark:bg-natural-700 rounded-full h-3 overflow-hidden" role="presentation">
                    {/* Planned Progress (Bottom Layer) */}
                    {showPlannedElements && (
                        <div
                            className="absolute top-0 start-0 h-full bg-dark-purple-300 dark:bg-dark-purple-800 transition-all duration-500"
                            style={{ width: `${cappedPlanned}%`, transitionProperty: 'width' }}
                        />
                    )}
                
                    {/* Actual Progress (Top Layer) */}
                    <div
                        className="absolute top-0 start-0 h-full bg-bright-blue-600 transition-all duration-500"
                        style={{ width: `${cappedActual}%`, transitionProperty: 'width' }}
                    />
                </div>

                {/* Planned Progress Marker */}
                {showPlannedElements && (
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 h-5 w-0.5 bg-dark-purple-600 dark:bg-dark-purple-400 z-10"
                        style={{ 
                            [language === 'ar' ? 'right' : 'left']: `${cappedPlanned}%`,
                            transform: language === 'ar' ? 'translateY(-50%) translateX(50%)' : 'translateY(-50%) translateX(-50%)',
                            transitionProperty: 'left, right' 
                        }}
                    />
                )}
            </div>

            <div className="flex justify-between items-center mt-1 text-xs text-natural-500 dark:text-natural-400">
                <span className="font-bold text-bright-blue-700 dark:text-bright-blue-300">{t('challenges.actualProgress')}: {cappedActual}%</span>
                {showPlannedElements && <span className="font-bold text-dark-purple-700 dark:text-dark-purple-300">{t('challenges.plannedProgress')}: {cappedPlanned}%</span>}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-natural-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                <p><strong>{t('challenges.actualProgress')}:</strong> {cappedActual}%</p>
                {showPlannedElements ? (
                    <>
                    <p><strong>{t('challenges.plannedProgress')}:</strong> {cappedPlanned}%</p>
                    <hr className="my-1 border-natural-600"/>
                    <p><strong>{t('challenges.startDate')}:</strong> {formatDate(startDate)}</p>
                    <p><strong>{t('challenges.targetDate')}:</strong> {formatDate(targetDate)}</p>
                    </>
                ) : (
                    <p className="italic">{t('challenges.plannedProgressTooltip')}</p>
                )}
            </div>
        </div>
    );
};

export default UnifiedProgressBar;