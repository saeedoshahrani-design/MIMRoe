import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { StrategicInitiative, LocalizedString, InitiativeAxis } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { autoTranslate } from '../utils/localizationUtils';

export type InitiativeFormData = {
    name: string;
    description: string;
    owner: string;
    associatedDepartments: string[];
    otherAssociatedDepartments: string;
    outcomes: string;
    strategicAlignment: string;
    startDate: string;
    endDate: string;
};

interface InitiativesContextType {
    initiatives: StrategicInitiative[];
    addInitiative: (data: InitiativeFormData, lang: 'ar' | 'en') => Promise<void>;
    updateInitiative: (id: string, data: Partial<Omit<StrategicInitiative, 'id'>>) => Promise<void>;
    deleteInitiative: (id: string) => Promise<void>;
}

const InitiativesContext = createContext<InitiativesContextType | undefined>(undefined);

const COLLECTION_NAME = 'strategicInitiatives';

const toUtcDateString = (dateStr: string | undefined | null) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr; // Return as is if not YYYY-MM-DD or is already a full ISO string
    }
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
};

export const InitiativesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [initiatives, setInitiatives] = useState<StrategicInitiative[]>([]);

    useEffect(() => {
        if (!user) {
            setInitiatives([]);
            return;
        }

        const collRef = collection(db, 'workspaces', 'shared', COLLECTION_NAME);
        const q = query(collRef);
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const initiativesFromDb = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as StrategicInitiative));
            initiativesFromDb.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setInitiatives(initiativesFromDb);
        }, (error) => {
            console.error("Error listening to initiatives collection:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const addInitiative = useCallback(async (data: InitiativeFormData, lang: 'ar' | 'en') => {
        if (!user) throw new Error("User not authenticated");
        const now = new Date().toISOString();
        const otherLang = lang === 'ar' ? 'en' : 'ar';
        const createLocalizedString = (text: string): LocalizedString => ({
            [lang]: text,
            [otherLang]: autoTranslate(text, otherLang),
        } as LocalizedString);

        const newInitiative: Omit<StrategicInitiative, 'id'> = {
            name: createLocalizedString(data.name),
            description: createLocalizedString(data.description),
            owner: createLocalizedString(data.owner),
            associatedDepartments: data.associatedDepartments,
            otherAssociatedDepartments: data.otherAssociatedDepartments ? createLocalizedString(data.otherAssociatedDepartments) : { ar: '', en: '' },
            outcomes: createLocalizedString(data.outcomes),
            strategicAlignment: createLocalizedString(data.strategicAlignment),
            startDate: toUtcDateString(data.startDate) as string,
            endDate: toUtcDateString(data.endDate) as string,
            members: [],
            tasks: [],
            axes: [] as InitiativeAxis[],
            createdAt: now,
            updatedAt: now,
        };
        await addDoc(collection(db, 'workspaces', 'shared', COLLECTION_NAME), newInitiative);
    }, [user]);

    const updateInitiative = useCallback(async (id: string, data: Partial<Omit<StrategicInitiative, 'id'>>) => {
        if (!user) throw new Error("User not authenticated");
        const now = new Date().toISOString();
        const initiativeDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);

        const updateData = { ...data };
        if (updateData.startDate) {
            updateData.startDate = toUtcDateString(updateData.startDate) as string;
        }
        if (updateData.endDate) {
            updateData.endDate = toUtcDateString(updateData.endDate) as string;
        }
        if (updateData.tasks) {
            updateData.tasks = updateData.tasks.map(task => ({
                ...task,
                start: toUtcDateString(task.start) as string,
                end: toUtcDateString(task.end) as string,
            }));
        }
        
        await updateDoc(initiativeDoc, {
            ...updateData,
            updatedAt: now,
        });
    }, [user]);

    const deleteInitiative = useCallback(async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        const initiativeDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        await deleteDoc(initiativeDoc);
    }, [user]);

    const value = { initiatives, addInitiative, updateInitiative, deleteInitiative };

    return (
        <InitiativesContext.Provider value={value}>
            {children}
        </InitiativesContext.Provider>
    );
};

export const useInitiatives = (): InitiativesContextType => {
    const context = useContext(InitiativesContext);
    if (!context) {
        throw new Error('useInitiatives must be used within a InitiativesProvider');
    }
    return context;
};