import React, { useState, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import PageTitle from '../components/PageTitle.tsx';
import BusinessGanttChart from '../components/gantt/BusinessGanttChart.tsx';
import { useChallenges } from '../context/ChallengesContext.tsx';
import { Challenge, TimelineTask } from '../types.ts';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal.tsx';
import AddChallengeModal from '../components/AddChallengeModal.tsx';
import { calculateProgress } from '../utils/calculateProgress.ts';
import { calculatePlannedProgress } from '../utils/calculatePlannedProgress.ts';
import { useTimelineTasks } from '../context/TimelineTasksContext.tsx';
import ManualTaskModal from '../components/gantt/ManualTaskModal.tsx';
import { DocumentArrowDownIcon } from '../components/icons/IconComponents.tsx';

const BusinessTimeline: React.FC = () => {
    const { t, language } = useLocalization();
    const { challenges, updateChallengeDirectly, updateChallenge } = useChallenges();
    const { manualTasks, addTask, updateTask, deleteTask } = useTimelineTasks();

    const [challengeToView, setChallengeToView] = useState<Challenge | null>(null);
    const [challengeToEdit, setChallengeToEdit] = useState<Challenge | null>(null);
    const [manualTaskToManage, setManualTaskToManage] = useState<TimelineTask | null>(null);
    const [isManualTaskModalOpen, setIsManualTaskModalOpen] = useState(false);

    // FIX: Define `challengesForGantt` to be passed to the chart. This was previously undefined.
    const challengesForGantt = useMemo(() => {
        return challenges.map(c => ({
            ...c,
            actual_percent: calculateProgress(c.activities),
            planned_percent_today: calculatePlannedProgress(c.start_date, c.target_date),
        }));
    }, [challenges]);

    const allTasks = useMemo(() => {
        const linkedTasks: TimelineTask[] = challenges.map(c => ({
            ...c,
            id: c.id,
            seq: 0,
            title: c.title,
            code: c.code,
            department: c.department,
            start: c.start_date,
            end: c.target_date,
            actual_percent: calculateProgress(c.activities),
            planned_percent_today: calculatePlannedProgress(c.start_date, c.target_date),
            status: c.status,
            source: 'linked',
            description: c.description
        }));
    
        // FIX: Replaced problematic sort logic with a safer method that explicitly creates Date objects and uses getTime(). The `new Date()` constructor handles `string | Date`, so casting to string is incorrect.
        const sortedTasks = [...linkedTasks, ...manualTasks].sort((a,b) => {
            // FIX: Use a type-safe method to get timestamps from `string | Date` types to resolve TypeScript errors in the sort function.
            const dateA = a.start instanceof Date ? a.start : new Date(a.start);
            const dateB = b.start instanceof Date ? b.start : new Date(b.start);
            return dateA.getTime() - dateB.getTime();
        });
        return sortedTasks;
      }, [challenges, manualTasks, language]);
    
    const handleChallengeClick = (challenge: Challenge) => {
        const originalChallenge = challenges.find(c => c.id === challenge.id);
        if (originalChallenge) {
            setChallengeToView(originalChallenge);
        }
    };
    
    const handleSaveChallenge = (challengeData: Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'> & { id?: string }) => {
        if (challengeData.id) {
            updateChallenge(challengeData.id, challengeData);
        }
        setChallengeToEdit(null);
    };

    const handleManualTaskClick = (task: TimelineTask) => {
        setManualTaskToManage(task);
        setIsManualTaskModalOpen(true);
    };

    const handleAddManualTaskRequest = () => {
        setManualTaskToManage(null);
        setIsManualTaskModalOpen(true);
    };
    
    const handleSaveManualTask = (data: Omit<TimelineTask, 'id' | 'seq' | 'source'>) => {
        if (manualTaskToManage) {
            updateTask({ ...manualTaskToManage, ...data });
        } else {
            addTask(data);
        }
        setIsManualTaskModalOpen(false);
        setManualTaskToManage(null);
    };
    
    const handleDeleteManualTask = (id: string) => {
        deleteTask(id);
        setIsManualTaskModalOpen(false);
        setManualTaskToManage(null);
    };

    const handleExport = () => {
        if (allTasks.length === 0) return;
    
        const formatDateForExcel = (dateString: string | Date) => {
            if (!dateString) return '';
            try {
                return new Date(dateString).toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };
    
        const escapeCsvCell = (cellData: any) => {
            const stringData = String(cellData ?? '');
            if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
                return `"${stringData.replace(/"/g, '""')}"`;
            }
            return stringData;
        };
    
        const headers = [
            escapeCsvCell(t('csvHeaders.taskName')),
            escapeCsvCell(t('csvHeaders.startDate')),
            escapeCsvCell(t('csvHeaders.endDate')),
            escapeCsvCell(t('csvHeaders.actualProgress')),
            escapeCsvCell(t('csvHeaders.plannedProgress'))
        ];
    
        const rows = allTasks.map(task => [
            escapeCsvCell(task.title),
            formatDateForExcel(task.start),
            formatDateForExcel(task.end),
            task.actual_percent,
            Math.round(task.planned_percent_today ?? 0)
        ].join(','));
    
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'timeline_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <PageTitle />
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-natural-700 border border-green-600 text-green-600 dark:text-green-300 rounded-md text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={allTasks.length === 0}
                    title={t('exportToExcel')}
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span>{t('export')}</span>
                </button>
            </div>

            <div className="h-[calc(100vh-220px)]">
                <BusinessGanttChart
                    challenges={challengesForGantt}
                    onChallengeClick={handleChallengeClick}
                    manualTasks={manualTasks}
                    onAddManualTaskRequest={handleAddManualTaskRequest}
                    onManualTaskClick={handleManualTaskClick}
                />
            </div>

            {isManualTaskModalOpen && (
                <ManualTaskModal
                    isOpen={isManualTaskModalOpen}
                    onClose={() => setIsManualTaskModalOpen(false)}
                    onSave={handleSaveManualTask}
                    onDelete={handleDeleteManualTask}
                    taskToManage={manualTaskToManage}
                />
            )}
            
            {challengeToView && <ChallengeDetailsModal
                isOpen={!!challengeToView}
                challenge={challengeToView}
                onClose={() => setChallengeToView(null)}
                onEdit={(challenge) => { setChallengeToView(null); setChallengeToEdit(challenge); }}
                onDelete={() => { /* Not implemented from this view */ setChallengeToView(null); }}
                onDirectUpdate={updateChallengeDirectly}
            />}
            
            {challengeToEdit && <AddChallengeModal 
                isOpen={!!challengeToEdit}
                onClose={() => setChallengeToEdit(null)}
                onSave={handleSaveChallenge}
                challengeToEdit={challengeToEdit}
            />}
        </div>
    );
};

export default BusinessTimeline;
