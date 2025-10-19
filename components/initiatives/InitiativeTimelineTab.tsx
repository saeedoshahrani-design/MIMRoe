import React, { useState } from 'react';
import { StrategicInitiative, InitiativeTask, Challenge } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useInitiatives } from '../../context/InitiativesContext';
import InitiativeGanttChart from './InitiativeGanttChart';
import AddInitiativeTaskModal from './AddInitiativeTaskModal';

interface InitiativeTimelineTabProps {
    initiative: StrategicInitiative;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

const InitiativeTimelineTab: React.FC<InitiativeTimelineTabProps> = ({ initiative, setToast }) => {
    const { t } = useLocalization();
    const { updateInitiative } = useInitiatives();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<InitiativeTask | null>(null);

    const tasks = initiative.tasks || [];

    const handleSave = (data: Omit<InitiativeTask, 'id' | 'seq'>) => {
        if (taskToEdit) {
            const updatedTasks = tasks.map(t => t.id === taskToEdit.id ? { ...taskToEdit, ...data } : t);
            updateInitiative(initiative.id, { tasks: updatedTasks });
        } else {
            const nextSeq = (tasks[tasks.length - 1]?.seq ?? 0) + 1;
            const newTask: InitiativeTask = { ...data, id: `task-${Date.now()}`, seq: nextSeq };
            updateInitiative(initiative.id, { tasks: [...tasks, newTask] });
        }
        setIsModalOpen(false);
        setTaskToEdit(null);
    };

    const handleDelete = (id: string) => {
        const updatedTasks = tasks.filter(t => t.id !== id);
        updateInitiative(initiative.id, { tasks: updatedTasks });
        setIsModalOpen(false);
        setTaskToEdit(null);
    };

    const handleTaskClick = (task: InitiativeTask) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const handleAddTaskRequest = () => {
        setTaskToEdit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <AddInitiativeTaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setTaskToEdit(null); }}
                onSave={handleSave}
                onDelete={handleDelete}
                taskToManage={taskToEdit}
                members={initiative.members || []}
            />
            
            <div className="h-[calc(100vh-320px)]">
                <InitiativeGanttChart
                    tasks={tasks}
                    onTaskClick={handleTaskClick}
                    onAddTaskRequest={handleAddTaskRequest}
                />
            </div>
        </div>
    );
};

export default InitiativeTimelineTab;