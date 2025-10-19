import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DepartmentData, DepartmentTask, DepartmentTarget } from '../types';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useLocalization } from '../hooks/useLocalization';
import { useAuth } from './AuthContext';

const COLLECTION_NAME = 'departmentData';

type DepartmentDataMap = Record<string, DepartmentData>;
type ToastState = { message: string; type: 'success' | 'info'; action?: { label: string; onClick: () => void; } } | null;

interface DepartmentsDataContextType {
    getDepartmentData: (departmentId: string) => DepartmentData;
    addTask: (departmentId: string, taskData: Pick<DepartmentTask, 'description'>) => Promise<void>;
    updateTask: (departmentId: string, taskId: string, taskData: Pick<DepartmentTask, 'description'>) => Promise<void>;
    deleteTask: (departmentId: string, taskId: string) => Promise<void>;
    reorderTasks: (departmentId: string, draggedId: string, targetId: string) => Promise<void>;
    addTarget: (departmentId: string, targetData: Omit<DepartmentTarget, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateTarget: (departmentId: string, targetId: string, targetData: Partial<Omit<DepartmentTarget, 'id'>>) => Promise<void>;
    deleteTarget: (departmentId: string, targetId: string) => Promise<void>;
    reorderTargets: (departmentId: string, draggedId: string, targetId: string) => Promise<void>;
    toast: ToastState;
    setToast: (toast: ToastState) => void;
}

const DepartmentsDataContext = createContext<DepartmentsDataContextType | undefined>(undefined);

const toUtcDateString = (dateStr: string | undefined | null) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr; // Return as is if not YYYY-MM-DD or is already a full ISO string
    }
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
};

export const DepartmentsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [data, setData] = useState<DepartmentDataMap>({});
    const [toast, setToast] = useState<ToastState>(null);
    const { t } = useLocalization();

    useEffect(() => {
        if (!user) {
            setData({});
            return;
        }

        const collRef = collection(db, 'workspaces', 'shared', COLLECTION_NAME);
        const unsubscribe = onSnapshot(collRef, (snapshot) => {
            const dataMap: DepartmentDataMap = {};
            snapshot.forEach(doc => {
                dataMap[doc.id] = doc.data() as DepartmentData;
            });
            setData(dataMap);
        }, (error) => {
            console.error("Error listening to departmentData collection:", error);
        });
        return () => unsubscribe();
    }, [user]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    
    const getDepartmentData = useCallback((departmentId: string): DepartmentData => {
        return data[departmentId] || { tasks: [], targets: [] };
    }, [data]);

    const getDocRef = (departmentId: string) => {
        if (!user) throw new Error("User not authenticated");
        return doc(db, 'workspaces', 'shared', COLLECTION_NAME, departmentId);
    }

    const ensureDocExists = async (departmentId: string) => {
        if (!data[departmentId]) {
            await setDoc(getDocRef(departmentId), { tasks: [], targets: [] });
        }
    };

    const addTask = async (departmentId: string, taskData: Pick<DepartmentTask, 'description'>) => {
        await ensureDocExists(departmentId);
        const now = new Date().toISOString();
        const currentTasks = getDepartmentData(departmentId).tasks;
        const newTask: DepartmentTask = {
            description: taskData.description,
            id: `T${Date.now()}`,
            order: 0,
            createdAt: now,
            updatedAt: now,
        };
        const updatedTasks = [newTask, ...currentTasks].map((t, i) => ({ ...t, order: i }));
        await updateDoc(getDocRef(departmentId), { tasks: updatedTasks });
    };
    
    const updateTask = async (departmentId: string, taskId: string, taskData: Pick<DepartmentTask, 'description'>) => {
        const currentTasks = getDepartmentData(departmentId).tasks;
        const updatedTasks = currentTasks.map(t => t.id === taskId ? { ...t, ...taskData, updatedAt: new Date().toISOString() } : t);
        await updateDoc(getDocRef(departmentId), { tasks: updatedTasks });
    };

    const deleteTask = async (departmentId: string, taskId: string) => {
        const currentTasks = getDepartmentData(departmentId).tasks;
        const updatedTasks = currentTasks.filter(t => t.id !== taskId);
        await updateDoc(getDocRef(departmentId), { tasks: updatedTasks });
        setToast({ message: t('departments.tasks.deleteSuccess'), type: 'success' });
    };

    const reorderTasks = async (departmentId: string, draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        const tasks = [...getDepartmentData(departmentId).tasks];
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);
        const [draggedItem] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, draggedItem);
        const updatedTasks = tasks.map((t, i) => ({ ...t, order: i }));
        await updateDoc(getDocRef(departmentId), { tasks: updatedTasks });
    };
    
    const addTarget = async (departmentId: string, targetData: Omit<DepartmentTarget, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => {
        await ensureDocExists(departmentId);
        const now = new Date().toISOString();
        const currentTargets = getDepartmentData(departmentId).targets;
        const newTarget: DepartmentTarget = {
            ...targetData,
            dueDate: toUtcDateString(targetData.dueDate),
            id: `TG${Date.now()}`,
            order: 0,
            createdAt: now,
            updatedAt: now,
        };
        const updatedTargets = [newTarget, ...currentTargets].map((t, i) => ({...t, order: i}));
        await updateDoc(getDocRef(departmentId), { targets: updatedTargets });
    };

    const updateTarget = async (departmentId: string, targetId: string, targetData: Partial<Omit<DepartmentTarget, 'id'>>) => {
        const currentTargets = getDepartmentData(departmentId).targets;
        const updateData = { ...targetData };
        if (updateData.dueDate) {
            updateData.dueDate = toUtcDateString(updateData.dueDate);
        }
        const updatedTargets = currentTargets.map(t => t.id === targetId ? { ...t, ...updateData, updatedAt: new Date().toISOString() } : t);
        await updateDoc(getDocRef(departmentId), { targets: updatedTargets });
    };

    const deleteTarget = async (departmentId: string, targetId: string) => {
        const currentTargets = getDepartmentData(departmentId).targets;
        const updatedTargets = currentTargets.filter(t => t.id !== targetId);
        await updateDoc(getDocRef(departmentId), { targets: updatedTargets });
        setToast({ message: t('departments.targets.deleteSuccess'), type: 'success' });
    };

    const reorderTargets = async (departmentId: string, draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        const targets = [...getDepartmentData(departmentId).targets];
        const draggedIndex = targets.findIndex(t => t.id === draggedId);
        const targetIndex = targets.findIndex(t => t.id === targetId);
        const [draggedItem] = targets.splice(draggedIndex, 1);
        targets.splice(targetIndex, 0, draggedItem);
        const updatedTargets = targets.map((t, i) => ({ ...t, order: i }));
        await updateDoc(getDocRef(departmentId), { targets: updatedTargets });
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