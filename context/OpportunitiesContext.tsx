
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Opportunity } from '../types';
import { seedOpportunities } from '../data/mockData';
import { generateNextOpportunityCode } from '../utils/opportunityUtils';
import { loadBox, saveBox } from '../utils/storage';

const LS_KEY = 'opportunities';

type OpportunityFormData = Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'>;

interface OpportunitiesContextType {
    opportunities: Opportunity[];
    addOpportunity: (opportunityData: OpportunityFormData) => void;
    updateOpportunity: (id: string, opportunityData: Partial<OpportunityFormData>) => void;
    deleteOpportunity: (id: string) => void;
}

const OpportunitiesContext = createContext<OpportunitiesContextType | undefined>(undefined);

export const OpportunitiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>(() => loadBox<Opportunity[]>(LS_KEY, seedOpportunities));

    useEffect(() => {
        saveBox(LS_KEY, opportunities);
    }, [opportunities]);

    const addOpportunity = useCallback((opportunityData: OpportunityFormData) => {
        const now = new Date().toISOString();
        const newOpportunity: Opportunity = {
            ...opportunityData,
            type: 'opportunity',
            id: `OP${Date.now()}`,
            code: generateNextOpportunityCode(opportunities),
            createdAt: now,
            updatedAt: now,
        };
        setOpportunities(prev => [newOpportunity, ...prev]);
    }, [opportunities]);

    const updateOpportunity = useCallback((id: string, opportunityData: Partial<OpportunityFormData>) => {
        const now = new Date().toISOString();
        setOpportunities(prev => prev.map(op =>
            op.id === id
                ? { ...op, ...opportunityData, updatedAt: now }
                : op
        ));
    }, []);
    
    const deleteOpportunity = useCallback((id: string) => {
        setOpportunities(prev => prev.filter(op => op.id !== id));
    }, []);

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
