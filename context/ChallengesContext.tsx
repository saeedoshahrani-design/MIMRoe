import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Challenge } from '../types';
import { loadBox, saveBox } from '../utils/storage';
import { generateNextChallengeCode } from '../utils/challengeUtils';
import { seedChallenges } from '../data/mockData';

type ChallengeFormData = Omit<Challenge, 'id' | 'code' | 'created_at' | 'updated_at' | 'is_archived' | 'type'>;

interface ChallengesContextType {
    challenges: Challenge[];
    addChallenge: (challengeData: ChallengeFormData) => void;
    updateChallenge: (id: string, challengeData: Partial<ChallengeFormData>) => void;
    deleteChallenge: (id: string) => void;
    updateChallengeDirectly: (challenge: Challenge) => void;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

const LS_KEY = 'challenges';

export const ChallengesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [challenges, setChallenges] = useState<Challenge[]>(() => loadBox<Challenge[]>(LS_KEY, seedChallenges));

    useEffect(() => {
        saveBox(LS_KEY, challenges);
    }, [challenges]);

    const addChallenge = useCallback((challengeData: ChallengeFormData) => {
        const now = new Date().toISOString();
        const newChallenge: Challenge = {
            ...challengeData,
            type: 'challenge',
            id: `C${Date.now()}`,
            code: generateNextChallengeCode(challenges),
            created_at: now,
            updated_at: now,
            is_archived: false,
            linkedTargetIds: challengeData.linkedTargetIds || [],
        };
        setChallenges(prev => [newChallenge, ...prev]);
    }, [challenges]);

    const updateChallenge = useCallback((id: string, challengeData: Partial<ChallengeFormData>) => {
        const now = new Date().toISOString();
        setChallenges(prev => prev.map(c =>
            c.id === id
                ? { ...c, ...challengeData, updated_at: now } as Challenge
                : c
        ));
    }, []);
    
    const updateChallengeDirectly = useCallback((updatedChallenge: Challenge) => {
        setChallenges(prev => prev.map(c => 
            c.id === updatedChallenge.id 
                ? updatedChallenge
                : c
        ));
    }, []);

    const deleteChallenge = useCallback((id: string) => {
        setChallenges(prev => prev.filter(c => c.id !== id));
    }, []);

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
