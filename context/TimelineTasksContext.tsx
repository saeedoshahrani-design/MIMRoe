
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TimelineTask } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const COLLECTION_NAME = 'timeline-manual-tasks';

type ManualTaskData = Omit<TimelineTask, 'id' | 'seq' | 'source'>;

interface TimelineTasksContextType {
    manualTasks: TimelineTask[];
    addTask: (taskData: ManualTaskData) => Promise<void>;
    updateTask: (task: TimelineTask) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
}

const TimelineTasksContext = createContext<TimelineTasksContextType | undefined>(undefined);

export const TimelineTasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [manualTasks, setManualTasks] = useState<TimelineTask[]>([]);

    useEffect(() => {
        if (!user) {
            setManualTasks([]);
            return;
        }

        const collRef = collection(db, 'workspaces', 'shared', COLLECTION_NAME);
        const q = query(collRef, orderBy('seq'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => {
                const data = doc.data();
                const start = data.start?.toDate ? data.start.toDate().toISOString() : data.start;
                const end = data.end?.toDate ? data.end.toDate().toISOString() : data.end;
                
                return {
                    id: doc.id,
                    ...data,
                    start,
                    end
                } as TimelineTask;
            });
            setManualTasks(tasks);
        }, (error) => {
            console.error("Error listening to timeline tasks collection:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const addTask = useCallback(async (taskData: ManualTaskData) => {
        if (!user) throw new Error("User not authenticated");
        const nextSeq = (manualTasks[manualTasks.length - 1]?.seq ?? 0) + 1;
        const newTask: Omit<TimelineTask, 'id'> = {
            ...taskData,
            start: new Date(taskData.start),
            end: new Date(taskData.end),
            seq: nextSeq,
            source: 'manual',
        };
        await addDoc(collection(db, 'workspaces', 'shared', COLLECTION_NAME), newTask);
    }, [manualTasks, user]);
    
    const updateTask = useCallback(async (updatedTask: TimelineTask) => {
        if (!user) throw new Error("User not authenticated");
        const { id, ...data } = updatedTask;
        const taskDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        await updateDoc(taskDoc, {
            ...data,
            start: new Date(data.start),
            end: new Date(data.end),
        });
    }, [user]);

    const deleteTask = useCallback(async (taskId: string) => {
        if (!user) throw new Error("User not authenticated");
        const taskDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, taskId);
        await deleteDoc(taskDoc);
    }, [user]);

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
