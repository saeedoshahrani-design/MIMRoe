import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LeadTasksData, LeadTask, LeadTaskCategory } from '../types';
import { seedLeadTasksData } from '../data/mockData';
import { loadBox, saveBox } from '../utils/storage';

const LS_KEY = 'lead-tasks';

interface LeadTasksContextType {
    leadTasksData: LeadTasksData;
    updateLeaderName: (name: string) => void;
    updateLeaderPhoto: (photo: string) => void;
    addTask: (category: LeadTaskCategory, text: string) => void;
    updateTask: (category: LeadTaskCategory, taskId: string, text: string) => void;
    deleteTask: (category: LeadTaskCategory, taskId: string) => void;
}

const LeadTasksContext = createContext<LeadTasksContextType | undefined>(undefined);

export const LeadTasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [leadTasksData, setLeadTasksData] = useState<LeadTasksData>(() => loadBox<LeadTasksData>(LS_KEY, seedLeadTasksData));

    useEffect(() => {
        saveBox(LS_KEY, leadTasksData);
    }, [leadTasksData]);

    const updateLeaderName = useCallback((name: string) => {
        setLeadTasksData(prev => ({ ...prev, leaderName: name }));
    }, []);

    const updateLeaderPhoto = useCallback((photo: string) => {
        setLeadTasksData(prev => ({ ...prev, leaderPhoto: photo }));
    }, []);

    const addTask = useCallback((category: LeadTaskCategory, text: string) => {
        const newTask: LeadTask = { id: `LT${Date.now()}`, text };
        setLeadTasksData(prev => ({
            ...prev,
            tasks: {
                ...prev.tasks,
                [category]: [...prev.tasks[category], newTask],
            },
        }));
    }, []);

    const updateTask = useCallback((category: LeadTaskCategory, taskId: string, text: string) => {
        setLeadTasksData(prev => ({
            ...prev,
            tasks: {
                ...prev.tasks,
                [category]: prev.tasks[category].map(task =>
                    task.id === taskId ? { ...task, text } : task
                ),
            },
        }));
    }, []);

    const deleteTask = useCallback((category: LeadTaskCategory, taskId: string) => {
        setLeadTasksData(prev => ({
            ...prev,
            tasks: {
                ...prev.tasks,
                [category]: prev.tasks[category].filter(task => task.id !== taskId),
            },
        }));
    }, []);

    const value = { leadTasksData, updateLeaderName, updateLeaderPhoto, addTask, updateTask, deleteTask };

    return (
        <LeadTasksContext.Provider value={value}>
            {children}
        </LeadTasksContext.Provider>
    );
};

export const useLeadTasks = (): LeadTasksContextType => {
    const context = useContext(LeadTasksContext);
    if (!context) {
        throw new Error('useLeadTasks must be used within a LeadTasksProvider');
    }
    return context;
};
