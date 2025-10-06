
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TimelineTask } from '../types';
import { loadBox, saveBox } from '../utils/storage';

const LS_KEY = 'timeline-manual-tasks';

type ManualTaskData = Omit<TimelineTask, 'id' | 'seq' | 'source'>;

interface TimelineTasksContextType {
    manualTasks: TimelineTask[];
    addTask: (taskData: ManualTaskData) => void;
    updateTask: (task: TimelineTask) => void;
    deleteTask: (taskId: string) => void;
}

const TimelineTasksContext = createContext<TimelineTasksContextType | undefined>(undefined);

export const TimelineTasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [manualTasks, setManualTasks] = useState<TimelineTask[]>(() => loadBox<TimelineTask[]>(LS_KEY, []));

    useEffect(() => {
        saveBox(LS_KEY, manualTasks);
    }, [manualTasks]);

    const addTask = useCallback((taskData: ManualTaskData) => {
        setManualTasks(prev => {
            const nextSeq = (prev[prev.length - 1]?.seq ?? 0) + 1;
            const newTask: TimelineTask = {
                ...taskData,
                id: crypto.randomUUID(),
                seq: nextSeq,
                source: 'manual',
            };
            return [...prev, newTask];
        });
    }, []);
    
    const updateTask = useCallback((updatedTask: TimelineTask) => {
        setManualTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        setManualTasks(prev => prev.filter(task => task.id !== taskId));
    }, []);

    const value = { manualTasks, addTask, updateTask, deleteTask };

    return (
        <TimelineTasksContext.Provider value={value}>
            {children}
        </TimelineTasksContext.Provider>
    );
};

export const useTimelineTasks = (): TimelineTasksContextType => {
    const context = useContext(TimelineTasksContext);
    if (!context) {
        throw new Error('useTimelineTasks must be used within a TimelineTasksProvider');
    }
    return context;
};
