import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Opportunity } from '../types';
import { generateNextOpportunityCode } from '../utils/opportunityUtils';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const COLLECTION_NAME = 'opportunities';

type OpportunityFormData = Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'>;

interface OpportunitiesContextType {
    opportunities: Opportunity[];
    addOpportunity: (opportunityData: OpportunityFormData) => Promise<void>;
    updateOpportunity: (id: string, opportunityData: Partial<OpportunityFormData>) => Promise<void>;
    deleteOpportunity: (id: string) => Promise<void>;
}

const OpportunitiesContext = createContext<OpportunitiesContextType | undefined>(undefined);

const toUtcDateString = (dateStr: string | undefined | null) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr; // Return as is if not YYYY-MM-DD or is already a full ISO string
    }
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
};

export const OpportunitiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    useEffect(() => {
        if (!user) {
            setOpportunities([]);
            return;
        }
        
        const collRef = collection(db, 'workspaces', 'shared', COLLECTION_NAME);
        const q = query(collRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const opportunitiesFromDb = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Opportunity));
            opportunitiesFromDb.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOpportunities(opportunitiesFromDb);
        }, (error) => {
            console.error("Error listening to opportunities collection:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const addOpportunity = useCallback(async (opportunityData: OpportunityFormData) => {
        if (!user) throw new Error("User not authenticated");
        const now = new Date().toISOString();
        const newCode = generateNextOpportunityCode(opportunities);

        const newOpportunity: Omit<Opportunity, 'id'> = {
            ...opportunityData,
            startDate: toUtcDateString(opportunityData.startDate) as string,
            dueDate: toUtcDateString(opportunityData.dueDate) as string,
            type: 'opportunity',
            code: newCode,
            createdAt: now,
            updatedAt: now,
        };
        await addDoc(collection(db, 'workspaces', 'shared', COLLECTION_NAME), newOpportunity);
    }, [opportunities, user]);

    const updateOpportunity = useCallback(async (id: string, opportunityData: Partial<OpportunityFormData>) => {
        if (!user) throw new Error("User not authenticated");
        const now = new Date().toISOString();
        const opportunityDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);

        const updateData = { ...opportunityData };
        if (updateData.startDate) {
            updateData.startDate = toUtcDateString(updateData.startDate) as string;
        }
        if (updateData.dueDate) {
            updateData.dueDate = toUtcDateString(updateData.dueDate) as string;
        }
        
        await updateDoc(opportunityDoc, {
            ...updateData,
            updatedAt: now,
        });
    }, [user]);
    
    const deleteOpportunity = useCallback(async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        const opportunityDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        await deleteDoc(opportunityDoc);
    }, [user]);

    const value = { opportunities, addOpportunity, updateOpportunity, deleteOpportunity };

    return (
        <OpportunitiesContext.Provider value={value}>
            {children}
        </OpportunitiesContext.Provider>
    );
};

export const useOpportunities = (): OpportunitiesContextType => {
    const context = useContext(OpportunitiesContext);
    if (!context) {
        throw new Error('useOpportunities must be used within a OpportunitiesProvider');
    }
    return context;
};