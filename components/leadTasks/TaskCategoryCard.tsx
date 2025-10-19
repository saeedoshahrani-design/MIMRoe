import React, { useState } from 'react';
import { LeadTask, LeadTaskCategory } from '../../types';
import Card from '../Card';
import TaskItem from './TaskItem';
import { useLeadTasks } from '../../context/LeadTasksContext';
import { PlusIcon } from '../icons/IconComponents';
import { useAppContext } from '../../context/AppContext';

interface TaskCategoryCardProps {
    title: string;
    category: LeadTaskCategory;
    tasks: LeadTask[];
}

const TaskCategoryCard: React.FC<TaskCategoryCardProps> = ({ title, category, tasks }) => {
    const { addTask } = useLeadTasks();
    const { language } = useAppContext();
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            addTask(category, newTaskText.trim(), language);
            setNewTaskText('');
        }
    };

    return (
        <Card>
            <h3 className="font-bold text-lg text-dark-purple-700 dark:text-dark-purple-300 mb-3 border-b border-natural-200 dark:border-natural-700 pb-2">{title}</h3>
            <ul className="space-y-2 mb-4">
                {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} category={category} />
                ))}
            </ul>
            <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2 border-t border-natural-200 dark:border-natural-700">
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-grow bg-natural-100 dark:bg-natural-700 rounded-md px-2 py-1 text-sm border-transparent focus:border-dark-purple-500 focus:ring-dark-purple-500"
                />
                <button type="submit" className="p-1.5 rounded-full bg-dark-purple-600 text-white hover:bg-dark-purple-700 disabled:bg-natural-400" disabled={!newTaskText.trim()}>
                    <PlusIcon className="w-4 h-4" />
                </button>
            </form>
        </Card>
    );
};

export default TaskCategoryCard;