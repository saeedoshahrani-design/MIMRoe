
import React, { useState, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import PageTitle from '../components/PageTitle';
import BusinessGanttChart from '../components/gantt/BusinessGanttChart';
import { useChallenges } from '../context/ChallengesContext';
import { Challenge, TimelineTask } from '../types';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal';
import AddChallengeModal from '../components/AddChallengeModal';
import { calculateProgress } from '../utils/calculateProgress';
import { calculatePlannedProgress } from '../utils/calculatePlannedProgress';
import { useTimelineTasks } from '../context/TimelineTasksContext';
import ManualTaskModal from '../components/gantt/ManualTaskModal';

const BusinessTimeline: React.FC = () => {
    const { t } = useLocalization();
    const { challenges, updateChallengeDirectly, updateChallenge } = useChallenges();
    const { manualTasks, addTask, updateTask, deleteTask } = useTimelineTasks();

    const [challengeToView, setChallengeToView] = useState<Challenge | null>(null);
    const [challengeToEdit, setChallengeToEdit] = useState<Challenge | null>(null);
    const [manualTaskToManage, setManualTaskToManage] = useState<TimelineTask | null>(null);
    const [isManualTaskModalOpen, setIsManualTaskModalOpen] = useState(false);

    const challengesForGantt = useMemo(() => {
        return challenges.map(c => ({
            ...c,
            actual_percent: calculateProgress(c.activities),
            planned_percent_today: calculatePlannedProgress(c.start_date, c.target_date),
        }));
    }, [challenges]);
    
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

    return (
        <div className="space-y-6">
            <PageTitle />

            <div className="h-[calc(100vh-200px)]">
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
