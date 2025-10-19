

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Challenge, Opportunity, Initiative } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import ChallengeChip from './ChallengeChip';
import OpportunityChip from './OpportunityChip';
import { locales } from '../../i18n/locales';

interface UnifiedPriorityMatrixProps {
    challenges: Challenge[];
    opportunities: Opportunity[];
    onChallengeClick: (challenge: Challenge) => void;
    onOpportunityClick: (opportunity: Opportunity) => void;
}

type EffortLevel = 'low' | 'medium' | 'high';
type ImpactLevel = 'low' | 'medium' | 'high';
type ViewToggle = 'all' | 'challenges' | 'opportunities';

const effortMap: Record<Challenge['effort'], EffortLevel> = { 'منخفض': 'low', 'متوسط': 'medium', 'مرتفع': 'high' };
const impactMap: Record<Challenge['impact'], ImpactLevel> = { 'منخفض': 'low', 'متوسط': 'medium', 'مرتفع': 'high' };

const quadrantMap: Record<ImpactLevel, Record<EffortLevel, keyof typeof locales.en.dashboard.matrix.quadrants>> = {
    high: { low: 'quickWins', medium: 'majorProjects', high: 'majorProjects' },
    medium: { low: 'quickWins', medium: 'smallQuickWins', high: 'notWorth' },
    low: { low: 'smallQuickWins', medium: 'notWorth', high: 'notWorth' },
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};


const MoreChipsPopover: React.FC<{
    chips: Initiative[];
    onChallengeClick: (challenge: Challenge) => void;
    onOpportunityClick: (opportunity: Opportunity) => void;
    onClose: () => void;
}> = ({ chips, onChallengeClick, onOpportunityClick, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    useClickOutside(popoverRef, onClose);

    return (
        <div ref={popoverRef} className="absolute z-30 top-full mt-2 w-64 bg-white dark:bg-natural-800 border border-natural-200 dark:border-natural-700 rounded-lg shadow-xl p-3 max-h-60 overflow-y-auto">
             <div className="flex flex-wrap gap-2">
                {chips.map(item =>
                    item.type === 'challenge'
                        ? <ChallengeChip key={item.id} challenge={item} onClick={onChallengeClick} />
                        : <OpportunityChip key={item.id} opportunity={item} onClick={onOpportunityClick} />
                )}
            </div>
        </div>
    );
};

const CHIPS_TO_SHOW = 5;

const UnifiedPriorityMatrix: React.FC<UnifiedPriorityMatrixProps> = ({ challenges, opportunities, onChallengeClick, onOpportunityClick }) => {
    const { t, language } = useLocalization();
    const isRtl = language === 'ar';
    const [popoverState, setPopoverState] = useState<{ x: number; y: number; chips: Initiative[] } | null>(null);
    const [activeToggle, setActiveToggle] = useState<ViewToggle>('all');

    const initiatives = useMemo<Initiative[]>(() => [...challenges, ...opportunities], [challenges, opportunities]);
    
    const filteredInitiatives = useMemo(() => {
        if (activeToggle === 'all') return initiatives;
        return initiatives.filter(item => item.type === (activeToggle === 'challenges' ? 'challenge' : 'opportunity'));
    }, [initiatives, activeToggle]);

    const matrixData = useMemo(() => {
        const grid: Initiative[][][] = Array(3).fill(0).map(() => Array(3).fill(0).map(() => []));
        
        filteredInitiatives.forEach(c => {
            const effortLevel = effortMap[c.effort];
            const impactLevel = impactMap[c.impact];
            if (effortLevel && impactLevel) {
                const effortIndex = ['high', 'medium', 'low'].indexOf(effortLevel);
                const impactIndex = ['low', 'medium', 'high'].indexOf(impactLevel);
                grid[impactIndex][effortIndex].push(c);
            }
        });
        return grid;
    }, [filteredInitiatives]);

    const totalChallenges = useMemo(() => filteredInitiatives.filter(c => effortMap[c.effort] && impactMap[c.impact]).length, [filteredInitiatives]);
    
    const impactLevels: ImpactLevel[] = ['high', 'medium', 'low'];
    const effortLevels: EffortLevel[] = ['high', 'medium', 'low'];

    const handleMoreClick = (e: React.MouseEvent, chips: Initiative[]) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPopoverState({ x: rect.left, y: rect.top, chips });
    };

    if (totalChallenges === 0) {
        return (
            <div className="flex items-center justify-center h-96 p-8 border-2 border-dashed border-natural-300 dark:border-natural-700 rounded-lg">
                <p className="text-natural-500 dark:text-natural-400 text-center">{t('dashboard.matrix.emptyFiltered')}</p>
            </div>
        );
    }
    
    const TogglerButton: React.FC<{ type: ViewToggle, label: string }> = ({ type, label }) => (
        <button
            onClick={() => setActiveToggle(type)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeToggle === type ? 'bg-dark-purple-600 text-white shadow' : 'bg-natural-100 dark:bg-natural-700 text-natural-600 dark:text-natural-300 hover:bg-natural-200 dark:hover:bg-natural-600'}`}
        >{label}</button>
    );

    return (
        <div className="relative p-4 md:p-6 bg-natural-50 dark:bg-natural-900/50 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-center text-dark-purple-800 dark:text-dark-purple-100 tracking-wide">{t('dashboard.matrix.title')}</h3>
                <div className="flex items-center p-1 bg-natural-100 dark:bg-natural-800 rounded-lg">
                    <TogglerButton type="all" label={t('dashboard.matrix.toggleAll')} />
                    <TogglerButton type="challenges" label={t('dashboard.matrix.toggleChallenges')} />
                    <TogglerButton type="opportunities" label={t('dashboard.matrix.toggleOpportunities')} />
                </div>
            </div>
            
            <div className="flex flex-col">
                <div className="flex items-stretch gap-x-3 md:gap-x-5">
                    <div className="relative w-12 md:w-16 flex-shrink-0">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-natural-600 dark:text-natural-300 pointer-events-none">
                            {t('dashboard.matrix.yTopLabel')}
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-xs text-natural-500 dark:text-natural-400 pointer-events-none">
                            {t('dashboard.matrix.yBottomLabel')}
                        </div>
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap font-semibold text-sm text-dark-purple-800 dark:text-dark-purple-100 pointer-events-none ${
                                isRtl ? 'right-3 translate-x-1/2' : 'left-3 -translate-x-1/2'
                            }`}
                        >
                            {t('dashboard.matrix.yTitle')}
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-2 md:gap-3">
                        {impactLevels.map((impact) =>
                            effortLevels.map((effort) => {
                                const impactIndex = ['low', 'medium', 'high'].indexOf(impact);
                                const effortIndex = ['high', 'medium', 'low'].indexOf(effort);
                                const cellItems = matrixData[impactIndex][effortIndex];
                                const quadrantName = quadrantMap[impact][effort];
                                
                                const visibleChips = cellItems.slice(0, CHIPS_TO_SHOW);
                                const hiddenChipsCount = cellItems.length - CHIPS_TO_SHOW;

                                return (
                                    <div key={`${impact}-${effort}`} className="relative bg-white dark:bg-natural-800 p-2 rounded-lg border border-dashed border-natural-300/60 dark:border-natural-700/50 min-h-[10rem] flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xs font-bold text-dark-purple-700 dark:text-dark-purple-300">
                                                {/* FIX: Explicitly cast to string to prevent implicit symbol conversion error. */}
                                                {t(`dashboard.matrix.quadrants.${String(quadrantName)}`)}
                                            </h4>
                                            <span className="text-xs font-mono font-semibold text-natural-400 dark:text-natural-500 bg-natural-100 dark:bg-natural-700/50 px-1.5 py-0.5 rounded-full">
                                                {cellItems.length}
                                            </span>
                                        </div>
                                        <div className="flex-grow flex flex-wrap gap-2 content-start">
                                            {visibleChips.map(item =>
                                                item.type === 'challenge'
                                                    ? <ChallengeChip key={item.id} challenge={item} onClick={onChallengeClick} />
                                                    : <OpportunityChip key={item.id} opportunity={item} onClick={onOpportunityClick} />
                                            )}
                                            {hiddenChipsCount > 0 && (
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => handleMoreClick(e, cellItems)}
                                                        className="h-7 px-2.5 text-xs font-bold rounded-full bg-bright-blue-100/70 text-bright-blue-800 dark:bg-bright-blue-900/50 dark:text-bright-blue-200 hover:bg-bright-blue-200/70 dark:hover:bg-bright-blue-900/80"
                                                    >
                                                        {t('dashboard.matrix.moreItems', { count: hiddenChipsCount })}
                                                    </button>
                                                    {popoverState && popoverState.chips === cellItems && (
                                                        <MoreChipsPopover 
                                                            chips={popoverState.chips} 
                                                            onChallengeClick={onChallengeClick}
                                                            onOpportunityClick={onOpportunityClick}
                                                            onClose={() => setPopoverState(null)} 
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex items-stretch gap-x-3 md:gap-x-5">
                    <div className="w-12 md:w-16 flex-shrink-0" />
                    
                    <div className="relative flex-1 h-12 mt-4">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-3 whitespace-nowrap font-semibold text-sm text-dark-purple-800 dark:text-dark-purple-100 pointer-events-none">
                            {t('dashboard.matrix.xTitle')}
                        </div>

                        <div className="absolute inset-x-0 top-1/2 translate-y-3 flex justify-between items-center text-xs text-natural-500 dark:text-natural-400 pointer-events-none">
                            <span className={'font-semibold text-natural-600 dark:text-natural-300'}>{isRtl ? t('dashboard.matrix.more') : t('dashboard.matrix.less')}</span>
                            <span className={'font-semibold text-natural-600 dark:text-natural-300'}>{isRtl ? t('dashboard.matrix.less') : t('dashboard.matrix.more')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedPriorityMatrix;