import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DepartmentData, DepartmentTask, DepartmentTarget } from '../types';
import { loadBox, saveBox } from '../utils/storage';

const LS_KEY = 'departments-data';

type DepartmentDataMap = Record<string, DepartmentData>;
type ToastState = { message: string; type: 'success' | 'info'; action?: { label: string; onClick: () => void; } } | null;

interface DepartmentsDataContextType {
    getDepartmentData: (departmentId: string) => DepartmentData;
    addTask: (departmentId: string, taskData: Pick<DepartmentTask, 'description'>) => void;
    updateTask: (departmentId: string, taskId: string, taskData: Pick<DepartmentTask, 'description'>) => void;
    deleteTask: (departmentId: string, taskId: string) => void;
    reorderTasks: (departmentId: string, draggedId: string, targetId: string) => void;
    addTarget: (departmentId: string, targetData: Omit<DepartmentTarget, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => void;
    updateTarget: (departmentId: string, targetId: string, targetData: Partial<Omit<DepartmentTarget, 'id'>>) => void;
    deleteTarget: (departmentId: string, targetId: string) => void;
    reorderTargets: (departmentId: string, draggedId: string, targetId: string) => void;
    toast: ToastState;
    setToast: (toast: ToastState) => void;
}

const DepartmentsDataContext = createContext<DepartmentsDataContextType | undefined>(undefined);

export const DepartmentsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<DepartmentDataMap>(() => loadBox<DepartmentDataMap>(LS_KEY, {}));
    const [toast, setToast] = useState<ToastState>(null);
    const undoTimeoutRef = React.useRef<number | null>(null);

    useEffect(() => {
        saveBox(LS_KEY, data);
    }, [data]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 7000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    
    const getDepartmentData = useCallback((departmentId: string): DepartmentData => {
        return data[departmentId] || { tasks: [], targets: [] };
    }, [data]);

    const updateDepartmentData = (departmentId: string, updater: (prevData: DepartmentData) => DepartmentData) => {
        setData(prev => ({
            ...prev,
            [departmentId]: updater(prev[departmentId] || { tasks: [], targets: [] }),
        }));
    };

    const addTask = (departmentId: string, taskData: Pick<DepartmentTask, 'description'>) => {
        updateDepartmentData(departmentId, prev => {
            const now = new Date().toISOString();
            const newTask: Omit<DepartmentTask, 'order'> = {
                ...taskData,
                id: `T${Date.now()}`,
                createdAt: now,
                updatedAt: now,
            };
            const updatedTasks = [newTask, ...prev.tasks].map((t, i) => ({ ...t, order: i }));
            return { ...prev, tasks: updatedTasks as DepartmentTask[] };
        });
    };
    
    const updateTask = (departmentId: string, taskId: string, taskData: Pick<DepartmentTask, 'description'>) => {
        updateDepartmentData(departmentId, prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...taskData, updatedAt: new Date().toISOString() } : t),
        }));
    };

    const deleteTask = (departmentId: string, taskId: string) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        
        const originalState = { ...data };
        const taskToDelete = originalState[departmentId]?.tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;

        // Optimistic update
        updateDepartmentData(departmentId, prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId)
        }));

        setToast({
            message: "Task deleted.",
            type: 'info',
            action: {
                label: "Undo",
                onClick: () => {
                    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                    setData(originalState);
                    setToast(null);
                }
            }
        });

        undoTimeoutRef.current = window.setTimeout(() => {
            undoTimeoutRef.current = null;
        }, 7000);
    };

    const reorderTasks = (departmentId: string, draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        updateDepartmentData(departmentId, prev => {
            const tasks = [...prev.tasks];
            const draggedIndex = tasks.findIndex(t => t.id === draggedId);
            const targetIndex = tasks.findIndex(t => t.id === targetId);
            const [draggedItem] = tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, draggedItem);
            return { ...prev, tasks: tasks.map((t, i) => ({ ...t, order: i })) };
        });
    };
    
    // Target Functions
    const addTarget = (departmentId: string, targetData: Omit<DepartmentTarget, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => {
        updateDepartmentData(departmentId, prev => {
            const now = new Date().toISOString();
            const newTarget: Omit<DepartmentTarget, 'order'> = {
                ...targetData,
                id: `TG${Date.now()}`,
                createdAt: now,
                updatedAt: now,
            };
            const updatedTargets = [newTarget, ...prev.targets].map((t, i) => ({...t, order: i}));
            return { ...prev, targets: updatedTargets as DepartmentTarget[] };
        });
    };

    const updateTarget = (departmentId: string, targetId: string, targetData: Partial<Omit<DepartmentTarget, 'id'>>) => {
        updateDepartmentData(departmentId, prev => ({
            ...prev,
            targets: prev.targets.map(t => t.id === targetId ? { ...t, ...targetData, updatedAt: new Date().toISOString() } : t),
        }));
    };

    const deleteTarget = (departmentId: string, targetId: string) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        
        const originalState = { ...data };
        const targetToDelete = originalState[departmentId]?.targets.find(t => t.id === targetId);
        if (!targetToDelete) return;

        updateDepartmentData(departmentId, prev => ({
            ...prev,
            targets: prev.targets.filter(t => t.id !== targetId)
        }));
        
        setToast({
            message: "Target deleted.",
            type: 'info',
            action: {
                label: "Undo",
                onClick: () => {
                    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                    setData(originalState);
                    setToast(null);
                }
            }
        });
        
        undoTimeoutRef.current = window.setTimeout(() => {
            undoTimeoutRef.current = null;
        }, 7000);
    };

    const reorderTargets = (departmentId: string, draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        updateDepartmentData(departmentId, prev => {
            const targets = [...prev.targets];
            const draggedIndex = targets.findIndex(t => t.id === draggedId);
            const targetIndex = targets.findIndex(t => t.id === targetId);
            const [draggedItem] = targets.splice(draggedIndex, 1);
            targets.splice(targetIndex, 0, draggedItem);
            return { ...prev, targets: targets.map((t, i) => ({ ...t, order: i })) };
        });
    };

    const value = {
        getDepartmentData,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        addTarget,
        updateTarget,
        deleteTarget,
        reorderTargets,
        toast,
        setToast,
    };

    return (
        <DepartmentsDataContext.Provider value={value}>
            {children}
        </DepartmentsDataContext.Provider>
    );
};

export const useDepartmentsData = (): DepartmentsDataContextType => {
    const context = useContext(DepartmentsDataContext);
    if (!context) {
        throw new Error('useDepartmentsData must be used within a DepartmentsDataProvider');
    }
    return context;
};
