import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LeadTasksData, LeadTask, LeadTaskCategory, LocalizedString } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, runTransaction, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { seedLeadTasksData } from '../data/mockData';
import { autoTranslate } from '../utils/localizationUtils';

const COLLECTION_NAME = 'leadTasks';
const DOC_ID = 'main';

interface LeadTasksContextType {
    leadTasksData: LeadTasksData;
    updateLeaderName: (name: string, lang: 'ar' | 'en') => Promise<void>;
    addTask: (category: LeadTaskCategory, text: string, lang: 'ar' | 'en') => Promise<void>;
    updateTask: (category: LeadTaskCategory, taskId: string, text: string, lang: 'ar' | 'en') => Promise<void>;
    deleteTask: (category: LeadTaskCategory, taskId: string) => Promise<void>;
}

const LeadTasksContext = createContext<LeadTasksContextType | undefined>(undefined);

export const LeadTasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [leadTasksData, setLeadTasksData] = useState<LeadTasksData>(seedLeadTasksData);

    useEffect(() => {
        if (!user) {
            setLeadTasksData(seedLeadTasksData); // Reset to default when logged out
            return;
        }

        const docRef = doc(db, 'workspaces', 'shared', COLLECTION_NAME, DOC_ID);
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setLeadTasksData(docSnap.data() as LeadTasksData);
            } else {
                console.log('No lead tasks data found for workspace, using default.');
                setLeadTasksData(seedLeadTasksData);
            }
        }, (error) => {
            console.error("Error listening to lead tasks document:", error);
        });

        return () => unsubscribe();
    }, [user]);
    
    // Memoize getDocRef to ensure stability for functions that depend on it
    const getDocRef = useCallback(() => {
        if (!user) throw new Error("User not authenticated");
        return doc(db, 'workspaces', 'shared', COLLECTION_NAME, DOC_ID);
    }, [user]);

    const updateLeaderName = useCallback(async (name: string, lang: 'ar' | 'en') => {
        const docRef = getDocRef();
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                const otherLang = lang === 'ar' ? 'en' : 'ar';
    
                if (!docSnap.exists()) {
                    // Document doesn't exist. Create it with seed data, but override the name.
                    const newDocData = { ...seedLeadTasksData };
                    newDocData.leaderName = {
                        [lang]: name,
                        [otherLang]: autoTranslate(name, otherLang),
                    } as LocalizedString;
                    transaction.set(docRef, newDocData);
                } else {
                    // Document exists. Update it.
                    const currentData = docSnap.data() as LeadTasksData;
                    const currentName = currentData.leaderName || { ar: '', en: '' };
    
                    const updates: { [key: string]: any } = {};
                    updates[`leaderName.${lang}`] = name;
    
                    // Only set the other language if it's missing or was auto-generated from the old value
                    if (!currentName[otherLang] || autoTranslate(currentName[lang] || '', otherLang) === currentName[otherLang]) {
                        updates[`leaderName.${otherLang}`] = autoTranslate(name, otherLang);
                    }
                    
                    transaction.update(docRef, updates);
                }
            });
        } catch (error) {
            console.error("Failed to update leader name:", error);
        }
    }, [getDocRef]);

    const runTasksTransaction = useCallback(async (updateLogic: (tasks: Record<LeadTaskCategory, LeadTask[]>) => Record<LeadTaskCategory, LeadTask[]>) => {
        const docRef = getDocRef();
        try {
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(docRef);
                
                if (!sfDoc.exists()) {
                    // Document doesn't exist, create it with the initial seed data, then apply the logic
                    const initialTasks = seedLeadTasksData.tasks;
                    const updatedTasks = updateLogic(initialTasks);
                    const newDocData = { ...seedLeadTasksData, tasks: updatedTasks };
                    transaction.set(docRef, newDocData);
                } else {
                    // Document exists, update it
                    const data = sfDoc.data() as LeadTasksData;
                    const currentTasks = data.tasks || {} as Record<LeadTaskCategory, LeadTask[]>;
                    const updatedTasks = updateLogic(currentTasks);
                    transaction.update(docRef, { tasks: updatedTasks });
                }
            });
        } catch (e) {
            console.error("Task transaction failed: ", e);
        }
    }, [getDocRef]);

    const addTask = useCallback(async (category: LeadTaskCategory, text: string, lang: 'ar' | 'en') => {
        await runTasksTransaction((currentTasks) => {
            const otherLang = lang === 'ar' ? 'en' : 'ar';
            const newTask: LeadTask = {
                id: `LT${Date.now()}`,
                text: { [lang]: text, [otherLang]: autoTranslate(text, otherLang) } as LocalizedString
            };
            const categoryTasks = currentTasks[category] || [];
            return { ...currentTasks, [category]: [...categoryTasks, newTask] };
        });
    }, [runTasksTransaction]);

    const updateTask = useCallback(async (category: LeadTaskCategory, taskId: string, text: string, lang: 'ar' | 'en') => {
        await runTasksTransaction((currentTasks) => {
            const otherLang = lang === 'ar' ? 'en' : 'ar';
            const categoryTasks = currentTasks[category] || [];
            const updatedCategoryTasks = categoryTasks.map(task => {
                if (task.id === taskId) {
                    const newText: LocalizedString = { ...task.text, [lang]: text };
                    // Only auto-translate if other language is missing or was auto-generated from old value
                    if (!newText[otherLang] || autoTranslate(task.text[lang], otherLang) === newText[otherLang]) {
                        newText[otherLang] = autoTranslate(text, otherLang);
                    }
                    return { ...task, text: newText };
                }
                return task;
            });
            return { ...currentTasks, [category]: updatedCategoryTasks };
        });
    }, [runTasksTransaction]);

    const deleteTask = useCallback(async (category: LeadTaskCategory, taskId: string) => {
        await runTasksTransaction((currentTasks) => {
            const categoryTasks = currentTasks[category] || [];
            const updatedCategoryTasks = categoryTasks.filter(task => task.id !== taskId);
            return { ...currentTasks, [category]: updatedCategoryTasks };
        });
    }, [runTasksTransaction]);


    const value = { leadTasksData, updateLeaderName, addTask, updateTask, deleteTask };

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