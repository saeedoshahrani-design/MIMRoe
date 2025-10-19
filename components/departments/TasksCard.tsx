import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { DepartmentTask, Procedure } from '../../types';
import Card from '../Card';
import EmptyState from '../EmptyState';
import { CheckBadgeIcon, SearchIcon, PlusIcon, PencilIcon, TrashIcon, LinkIcon } from '../icons/IconComponents';
import TaskFormModal from './TaskFormModal';
import ConfirmationModal from '../ConfirmationModal';

interface TasksCardProps {
    departmentId: string;
    tasks: DepartmentTask[];
    onAddTask: (taskData: Pick<DepartmentTask, 'description'>) => void;
    onUpdateTask: (taskId: string, taskData: Pick<DepartmentTask, 'description'>) => void;
    onDeleteTask: (taskId: string) => void;
    onReorderTasks: (draggedId: string, targetId: string) => void;
    setToast: (toast: any) => void;
    procedures: Procedure[];
    onViewProcedure: (procedure: Procedure) => void;
}

const TasksCard: React.FC<TasksCardProps> = ({ departmentId, tasks, onAddTask, onUpdateTask, onDeleteTask, onReorderTasks, setToast, procedures, onViewProcedure }) => {
    const { t, language } = useLocalization();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<DepartmentTask | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<DepartmentTask | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => a.order - b.order);
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return sortedTasks.filter(task => 
            (task.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sortedTasks, searchTerm]);

    const handleOpenAddModal = () => {
        setTaskToEdit(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (task: DepartmentTask) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const handleSave = (taskData: Pick<DepartmentTask, 'description'>) => {
        if (taskToEdit) {
            onUpdateTask(taskToEdit.id, taskData);
        } else {
            onAddTask(taskData);
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <TaskFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                taskToEdit={taskToEdit}
            />
            <ConfirmationModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={() => {
                    if(taskToDelete) onDeleteTask(taskToDelete.id);
                    setTaskToDelete(null);
                }}
                title={t('delete') + " " + t('departments.tasks.taskDescription')}
                message={t('deleteConfirmation')}
            />
            <Card className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <CheckBadgeIcon className="w-6 h-6 text-dark-purple-500" />
                        <h3 className="text-lg font-bold">{t('departments.tasks.title')}</h3>
                    </div>
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-1 px-3 py-1.5 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {t('departments.tasks.addTask')}
                    </button>
                </div>
                {tasks.length > 0 ? (
                    <>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('search') + '...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-2 ps-10 pe-4 focus:ring-dark-purple-500 focus:border-dark-purple-500 text-sm"
                            />
                            <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-natural-400" />
                        </div>
                        <div className="space-y-1 overflow-y-auto -mr-2 pr-2 max-h-[500px]">
                            {filteredTasks.map(task => {
                                const linkedProcedures = procedures.filter(p => p.linkedTaskIds?.includes(task.id));
                                return (
                                <div
                                    key={task.id}
                                    className="group p-2 rounded-md transition-colors hover:bg-natural-100 dark:hover:bg-natural-800"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="flex-grow text-sm text-natural-700 dark:text-natural-200 whitespace-pre-wrap py-1 min-w-0 break-words">{task.description}</p>
                                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenEditModal(task)} className="p-1 text-natural-500 hover:text-dark-purple-600 rounded-full hover:bg-natural-200 dark:hover:bg-natural-700">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setTaskToDelete(task)} className="p-1 text-natural-500 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/50">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-natural-200/50 dark:border-natural-700/50">
                                        {linkedProcedures.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className="flex-shrink-0" title={t('departments.tasks.linkedProcedures')}>
                                                    <LinkIcon className="w-4 h-4 text-natural-400" />
                                                </span>
                                                {linkedProcedures.map(proc => (
                                                    <button
                                                        key={proc.id}
                                                        onClick={() => onViewProcedure(proc)}
                                                        className="px-2 py-0.5 text-xs font-mono bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                        title={proc.title[language]}
                                                    >
                                                        {proc.code}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-natural-400 italic">
                                                <LinkIcon className="w-4 h-4"/>
                                                <span>{t('departments.tasks.noLinkedProcedures')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                         <EmptyState 
                            icon={<CheckBadgeIcon className="w-12 h-12 text-natural-300 dark:text-natural-600"/>}
                            message={t('departments.tasks.emptyState')}
                        />
                        <button 
                            onClick={handleOpenAddModal}
                            className="mt-4 flex items-center gap-1 mx-auto px-3 py-1.5 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700"
                        >
                            <PlusIcon className="w-4 h-4" />
                            {t('departments.tasks.addFirstTask')}
                        </button>
                    </div>
                )}
            </Card>
        </>
    );
};

export default TasksCard;