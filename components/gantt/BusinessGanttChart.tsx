import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { Challenge, TimelineTask } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { departments } from '../../data/mockData';
import {
    LayersIcon, CheckCircleIcon, AlertTriangleIcon, MapIcon, FolderIcon, ShieldIcon
} from '../icons/IconComponents';
import { locales } from '../../i18n/locales';

type ChallengeStatus = Challenge['status'];

interface BusinessGanttChartProps {
  challenges: (Challenge & { actual_percent: number; planned_percent_today: number })[];
  onChallengeClick: (challenge: Challenge) => void;
  manualTasks: TimelineTask[];
  onAddManualTaskRequest: () => void;
  onManualTaskClick: (task: TimelineTask) => void;
}

const getUTCMidnight = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const daysBetweenUTC = (date1: Date, date2: Date): number => {
  const oneDay = 1000 * 60 * 60 * 24;
  return (date2.getTime() - date1.getTime()) / oneDay;
};

// Sunday as the first day of the week
const getWeekNumber = (d: Date): number => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Sunday is 0, Monday is 1, etc.
    const dayNum = date.getUTCDay();
    // Set to previous Sunday
    date.setUTCDate(date.getUTCDate() - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Sunday
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};


const statusColors: Record<ChallengeStatus, string> = {
    'جديد': '#7A8595',
    'قيد المعالجة': '#FF8C32',
    'مغلق': '#18C37E',
    'قيد المراجعة': '#A58BD3'
};

const DepartmentIcon: React.FC<{ deptId?: string }> = ({ deptId }) => {
    if (!deptId) return null;
    const deptObject = departments.find(d => d.name.ar === deptId);
    const deptNumericId = deptObject ? deptObject.id : null;
    
    const iconMap: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
        '1': LayersIcon, '2': CheckCircleIcon, '3': AlertTriangleIcon, '4': MapIcon, '5': FolderIcon, '6': ShieldIcon,
    };
    const IconComponent = deptNumericId ? iconMap[deptNumericId] : null;
    if (!IconComponent) return <div className="w-3.5 h-3.5 rounded-full bg-gray-400" />;
    
    return <IconComponent className="w-3.5 h-3.5 text-gray-400" />;
};

const GanttSkeleton: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center bg-natural-50 dark:bg-natural-800 rounded-lg shadow-md border dark:border-natural-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-purple-500"></div>
    </div>
);

const BusinessGanttChart: React.FC<BusinessGanttChartProps> = ({ challenges, onChallengeClick, manualTasks, onAddManualTaskRequest, onManualTaskClick }) => {
  const { t, language, formatDate } = useLocalization();
  const [dayWidth, setDayWidth] = useState(18);
  const zoomLevels = [14, 18, 22];
  const [isLoading, setIsLoading] = useState(true);
  
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const allTasks = useMemo(() => {
    const linkedTasks: TimelineTask[] = challenges.map(c => ({
      id: c.id,
      seq: 0,
      title: language === 'ar' ? c.title_ar : c.title_en,
      code: c.code,
      department: c.department,
      start: c.start_date,
      end: c.target_date,
      actual_percent: c.actual_percent ?? 0,
      planned_percent_today: c.planned_percent_today,
      status: c.status,
      source: 'linked',
      description: c.description
    }));

    return [...linkedTasks, ...manualTasks].sort((a,b) => +new Date(a.start) - +new Date(b.start));
  }, [challenges, manualTasks, language]);

  const { timeScale, months, weeks, days } = useMemo(() => {
    if (allTasks.length === 0) {
      const start = new Date();
      const end = new Date();
      start.setDate(start.getDate() - 15);
      end.setDate(end.getDate() + 15);
      const startUTC = getUTCMidnight(start);
      const endUTC = getUTCMidnight(end);
      const totalDays = daysBetweenUTC(startUTC, endUTC) + 1;
      return { timeScale: { start: startUTC, end: endUTC, totalDays }, months: [], weeks: [], days: [] };
    }

    const startDates = allTasks.map(c => getUTCMidnight(c.start));
    const endDates = allTasks.map(c => getUTCMidnight(c.end));
    
    let timelineStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    let timelineEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

    timelineStart.setUTCDate(timelineStart.getUTCDate() - 1);
    timelineEnd.setUTCDate(timelineEnd.getUTCDate() + 1);

    const totalDays = Math.round(daysBetweenUTC(timelineStart, timelineEnd)) + 1;
    
    const generatedDays = Array.from({ length: totalDays }).map((_, i) => {
        const date = new Date(timelineStart);
        date.setUTCDate(date.getUTCDate() + i);
        return date;
    });

    const generatedMonths: { name: string; startDay: number, dayCount: number }[] = [];
    if (generatedDays.length > 0) {
        let currentMonth = -1;
        generatedDays.forEach((day, index) => {
            if (day.getUTCMonth() !== currentMonth) {
                currentMonth = day.getUTCMonth();
                const monthName = locales.en.months[day.getUTCMonth()]; // Always use Gregorian month name
                const year = day.getUTCFullYear();
                generatedMonths.push({
                    name: `${monthName} ${year}`,
                    startDay: index,
                    dayCount: 1
                });
            } else {
                generatedMonths[generatedMonths.length - 1].dayCount++;
            }
        });
    }

    const generatedWeeks: { name: string; startDay: number, dayCount: number }[] = [];
    if (generatedDays.length > 0) {
        let currentWeek = -1;
        generatedDays.forEach((day, index) => {
            const weekNum = getWeekNumber(day);
            if (weekNum !== currentWeek) {
                currentWeek = weekNum;
                generatedWeeks.push({
                    name: String(weekNum),
                    startDay: index,
                    dayCount: 1
                });
            } else {
                generatedWeeks[generatedWeeks.length - 1].dayCount++;
            }
        });
    }
    
    return {
      timeScale: { start: timelineStart, end: timelineEnd, totalDays },
      months: generatedMonths,
      weeks: generatedWeeks,
      days: generatedDays,
    };
  }, [allTasks, language]);

  const handleZoom = (direction: 'in' | 'out') => {
      const currentIndex = zoomLevels.indexOf(dayWidth);
      if (direction === 'in' && currentIndex < zoomLevels.length - 1) {
          setDayWidth(zoomLevels[currentIndex + 1]);
      }
      if (direction === 'out' && currentIndex > 0) {
          setDayWidth(zoomLevels[currentIndex - 1]);
      }
  };

  const handleTaskClick = (task: TimelineTask) => {
    if (task.source === 'manual') {
      onManualTaskClick(task);
    } else {
      const originalChallenge = challenges.find(c => c.id === task.id);
      if (originalChallenge) {
        onChallengeClick(originalChallenge);
      }
    }
  };
  
  const handleScroll = () => {
    if (timelineHeaderRef.current && scrollContainerRef.current) {
        timelineHeaderRef.current.scrollLeft = scrollContainerRef.current.scrollLeft;
    }
  };


  const todayPosition = useMemo(() => {
    const todayUTC = getUTCMidnight(new Date());
    if (todayUTC < timeScale.start || todayUTC > timeScale.end) return null;
    const offset = daysBetweenUTC(timeScale.start, todayUTC);
    return offset * dayWidth;
  }, [timeScale.start, timeScale.end, dayWidth]);

  if (isLoading) {
      return <GanttSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-natural-800 rounded-lg shadow-md border dark:border-natural-700 text-sm h-full flex flex-col" dir="rtl">
        {/* HEADER */}
        <div className="flex flex-shrink-0">
            <div className="w-[360px] flex-shrink-0 z-10 sticky right-0 bg-natural-50 dark:bg-natural-800/80">
                 <div className="flex items-center justify-between px-3 h-[52px] border-b border-l border-natural-200 dark:border-natural-700">
                    <div className="flex items-center gap-3">
                        <span className="text-natural-500 dark:text-natural-400 w-10 text-center font-semibold">#</span>
                        <h3 className="font-semibold text-natural-700 dark:text-natural-200">{t('timeline.tasks')}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onAddManualTaskRequest} className="px-3 py-1.5 text-xs rounded-md bg-dark-purple-600 text-white hover:bg-dark-purple-700">
                            + {t('timeline.addTask')}
                        </button>
                        <div className="flex gap-1 border-l border-natural-200 dark:border-natural-700 pl-2">
                            <button onClick={() => handleZoom('out')} className="px-2 py-0.5 rounded text-natural-500 hover:bg-natural-200 dark:hover:bg-natural-700 text-lg font-mono">-</button>
                            <button onClick={() => handleZoom('in')} className="px-2 py-0.5 rounded text-natural-500 hover:bg-natural-200 dark:hover:bg-natural-700 text-lg font-mono">+</button>
                        </div>
                    </div>
                 </div>
            </div>
            <div ref={timelineHeaderRef} className="flex-grow overflow-x-hidden bg-natural-50 dark:bg-natural-800/80 backdrop-blur-sm">
                <div className="relative h-[52px] border-b dark:border-natural-700" style={{ width: timeScale.totalDays * dayWidth }}>
                    <div className="relative h-1/2 border-b dark:border-natural-700">
                         {months.map(month => (
                            <div key={month.name} className="absolute h-full flex items-center justify-center font-semibold text-xs text-natural-600 dark:text-natural-300 border-l dark:border-natural-200 dark:border-natural-700 whitespace-nowrap" style={{ right: month.startDay * dayWidth, width: month.dayCount * dayWidth }}>
                              {month.name}
                            </div>
                         ))}
                    </div>
                    <div className="relative h-1/2">
                        {weeks.map((week) => (
                          <div key={`${week.name}-${week.startDay}`} className="absolute h-full flex items-center justify-center font-semibold text-xs text-natural-500 dark:text-natural-400 border-l dark:border-natural-200 dark:border-natural-700" style={{ right: week.startDay * dayWidth, width: week.dayCount * dayWidth }}>
                            {week.name}
                          </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        
        {/* SCROLLABLE CONTENT */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-grow overflow-auto">
            <div className="flex min-w-max relative">
                {/* Side Panel */}
                <div className="w-[360px] flex-shrink-0 bg-white dark:bg-natural-800 z-10 sticky right-0">
                    {allTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="bg-white dark:bg-natural-800 grid grid-cols-[48px,1fr,auto] items-center px-3 h-[44px] border-b border-l dark:border-l-natural-700/50 dark:border-natural-700/50 cursor-pointer hover:bg-natural-50 dark:hover:bg-natural-700/30" 
                          onClick={() => handleTaskClick(task)}
                        >
                            <span className="text-center text-sm text-natural-500">{task.source === 'manual' ? task.seq : ''}</span>
                            <p className="font-medium text-natural-800 dark:text-natural-200 truncate mx-2 text-sm" title={task.title}>
                                {task.title}
                            </p>
                             <div className="flex items-center gap-2 justify-self-end">
                                 {task.code && (
                                     <span className="flex-shrink-0 w-[68px] h-6 flex items-center justify-center text-[12px] font-semibold bg-natural-100 dark:bg-natural-700 text-natural-600 dark:text-natural-300 rounded-full">
                                        {task.code}
                                     </span>
                                 )}
                                <div className="flex-shrink-0" title={task.department}>
                                    <DepartmentIcon deptId={task.department} />
                                </div>
                             </div>
                        </div>
                    ))}
                </div>

                {/* Gantt Area */}
                <div className="flex-grow">
                  <div className="relative" style={{ height: allTasks.length * 44, width: timeScale.totalDays * dayWidth }}>
                      {days.map((day, i) => {
                          const dayOfWeek = day.getUTCDay();
                          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
                          return (
                              <div key={i} className={`absolute top-0 bottom-0 border-l border-natural-200 dark:border-natural-700/50 ${isWeekend ? 'bg-natural-100/70 dark:bg-natural-700/40' : ''}`} style={{ right: i * dayWidth, width: dayWidth }}></div>
                          )
                      })}
                      {todayPosition !== null && (
                        <div className="absolute top-0 bottom-0 w-px z-10" style={{ right: todayPosition, backgroundColor: 'rgba(168, 85, 247, 0.5)' }}></div>
                      )}
                      
                      {allTasks.map((task, index) => {
                          const taskStart = getUTCMidnight(task.start);
                          const taskTarget = getUTCMidnight(task.end);
                          if (taskStart > taskTarget) return null;

                          const startOffsetDays = daysBetweenUTC(timeScale.start, taskStart);
                          const durationDays = daysBetweenUTC(taskStart, taskTarget) + 1;
                          const right = startOffsetDays * dayWidth;
                          const width = durationDays * dayWidth - 2;
                          
                          const todayUTC = getUTCMidnight(new Date());
                          const isOverdue = todayUTC > taskTarget && (task.actual_percent) < 100;
                          
                          return (
                              <div 
                                key={task.id} 
                                className="absolute h-[44px] grid items-center group" 
                                style={{ top: `${index * 44}px`, right, width }}
                              >
                                <div className="relative w-full h-[14px] cursor-pointer" onClick={() => handleTaskClick(task)}>
                                    <div className="absolute w-full h-full bg-natural-300 dark:bg-natural-600 rounded-[7px]"></div>
                                    <div 
                                        className={`h-full rounded-[7px] relative ${isOverdue ? 'shadow-[0_0_0_1px_#E34B4B_inset]' : ''}`}
                                        style={{ 
                                          width: `${task.actual_percent}%`, 
                                          backgroundColor: statusColors[task.status],
                                          border: task.status === 'قيد المراجعة' ? '1px dashed rgba(255,255,255,0.5)' : 'none',
                                        }}
                                    >
                                        {task.actual_percent > 0 && (
                                            <div 
                                                className="absolute -top-5 bg-natural-800 dark:bg-natural-900/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-[10px] whitespace-nowrap"
                                                style={{ [language === 'ar' ? 'left' : 'right']: '0' }}
                                            >
                                                {Math.round(task.actual_percent)}%
                                            </div>
                                        )}
                                    </div>
                                    
                                    {task.planned_percent_today && task.planned_percent_today > 0 && (
                                        <div
                                            className="absolute top-[-2px] bottom-[-2px] w-px bg-dark-purple-500/70 dark:bg-dark-purple-300/70 z-10"
                                            style={{ right: `${task.planned_percent_today}%` }}
                                            title={`${t('gantt_planned')}: ${task.planned_percent_today.toFixed(0)}%`}
                                        ></div>
                                    )}

                                    <div className="absolute z-30 bottom-full mb-2 right-1/2 translate-x-1/2 w-64 p-3 bg-natural-900 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity" role="tooltip">
                                          <p className="font-bold text-sm mb-1 truncate">{`${task.code ?? ''}: ${task.title}`}</p>
                                          <p className="text-natural-300 text-xs truncate">{`${task.department || ''} • ${task.status}`}</p>
                                          <hr className="my-2 border-natural-600" />
                                          <div className="grid grid-cols-[1fr,auto] gap-x-2 text-[11px]">
                                              <span>{t('gantt_plannedProgress')}:</span><span className="font-semibold">{task.planned_percent_today?.toFixed(0) ?? 0}%</span>
                                              <span>{t('gantt_actualProgress')}:</span><span className="font-semibold">{Math.round(task.actual_percent)}%</span>
                                              <span>{t('planned_start')}:</span><span className="font-semibold">{formatDate(task.start as string)}</span>
                                              <span>{t('planned_end')}:</span><span className="font-semibold">{formatDate(task.end as string)}</span>
                                          </div>
                                          <div className="absolute -bottom-1 right-1/2 translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-natural-900"></div>
                                      </div>
                                </div>
                              </div>
                          );
                      })}
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BusinessGanttChart;