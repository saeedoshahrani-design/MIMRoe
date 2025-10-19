import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Challenge } from '../types.ts';
import { db } from '../firebase.ts';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, writeBatch } from 'firebase/firestore';
import { generateNextChallengeCode } from '../utils/challengeUtils.ts';
import { useAuth } from './AuthContext.tsx';

type ChallengeFormData = Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'>;

interface ChallengesContextType {
    challenges: Challenge[];
    addChallenge: (challengeData: ChallengeFormData) => Promise<void>;
    updateChallenge: (id: string, challengeData: Partial<ChallengeFormData>) => Promise<void>;
    deleteChallenge: (id: string) => Promise<void>;
    updateChallengeDirectly: (challenge: Challenge) => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

const COLLECTION_NAME = 'challenges';

const toUtcDateString = (dateStr: string | undefined | null) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr; // Return as is if not YYYY-MM-DD or is already a full ISO string
    }
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
};

export const ChallengesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    useEffect(() => {
        if (!user) {
            setChallenges([]);
            return;
        }

        const collRef = collection(db, 'workspaces', 'shared', COLLECTION_NAME);
        const q = query(collRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const challengesFromDb = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Challenge));
            challengesFromDb.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setChallenges(challengesFromDb);
        }, (error) => {
            console.error("Error listening to challenges collection:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const addChallenge = useCallback(async (challengeData: ChallengeFormData) => {
        if (!user) throw new Error("User not authenticated");
        const now = new Date().toISOString();
        const newCode = generateNextChallengeCode(challenges);
        
        const newChallenge: Omit<Challenge, 'id'> = {
            ...challengeData,
            start_date: toUtcDateString(challengeData.start_date) as string,
            target_date: toUtcDateString(challengeData.target_date) as string,
            type: 'challenge',
            code: newCode,
            created_at: now,
            updated_at: now,
            is_archived: false,
            linkedTargetIds: challengeData.linkedTargetIds || [],
        };
        await addDoc(collection(db, 'workspaces', 'shared', COLLECTION_NAME), newChallenge);
    }, [challenges, user]);

    const updateChallenge = useCallback(async (id: string, challengeData: Partial<ChallengeFormData>) => {
        if (!user) throw new Error("User not authenticated");
        const now = new Date().toISOString();
        const challengeDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        
        const updateData = { ...challengeData };
        if (updateData.start_date) {
            updateData.start_date = toUtcDateString(updateData.start_date) as string;
        }
        if (updateData.target_date) {
            updateData.target_date = toUtcDateString(updateData.target_date) as string;
        }

        await updateDoc(challengeDoc, {
            ...updateData,
            updated_at: now,
        });
    }, [user]);
    
    const updateChallengeDirectly = useCallback(async (updatedChallenge: Challenge) => {
        if (!user) throw new Error("User not authenticated");
        const { id, ...data } = updatedChallenge;
        const challengeDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        await updateDoc(challengeDoc, data);
    }, [user]);

    const deleteChallenge = useCallback(async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        const challengeDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
        await deleteDoc(challengeDoc);
    }, [user]);

    const value = { challenges, addChallenge, updateChallenge, deleteChallenge, updateChallengeDirectly };

    return (
        <ChallengesContext.Provider value={value}>
            {children}
        </ChallengesContext.Provider>
    );
};

export const useChallenges = (): ChallengesContextType => {
    const context = useContext(ChallengesContext);
    if (!context) {
        throw new Error('useChallenges must be used within a ChallengesProvider');
    }
    return context;
};