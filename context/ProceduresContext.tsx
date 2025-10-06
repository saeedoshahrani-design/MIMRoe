import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Procedure, LocalizedString, ProcedureForm, Definition, Kpi } from '../types';
import { loadBox, saveBox } from '../utils/storage';
import { seedProcedures } from '../data/mockData';
import { generateNextProcedureCode, autoTranslate } from '../utils/procedureUtils';

export type ProcedureFormData = {
    title: string;
    description: string;
    inputs: string;
    outputs: string;
    policiesAndReferences?: string;
    technicalSystems?: string;
    departmentId: string;
    linkedService?: string;
    durationDays?: number;
    eReadiness: 'electronic' | 'partially-electronic' | 'not-electronic';
    formsUsed: {
        id: number;
        name: string;
        file: File | null;
        existingFile?: { name: string; type: string; content: string };
    }[];
    definitions: { id: string; term: string; definition: string }[];
    kpi: { name: string; target: string; description: string };
};


interface ProceduresContextType {
    procedures: Procedure[];
    addProcedure: (procedureData: ProcedureFormData, lang: 'ar' | 'en') => void;
    updateProcedure: (id: string, procedureData: ProcedureFormData, lang: 'ar' | 'en') => void;
    deleteProcedure: (id: string) => void;
}

const ProceduresContext = createContext<ProceduresContextType | undefined>(undefined);

const LS_KEY = 'procedures';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};


export const ProceduresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [procedures, setProcedures] = useState<Procedure[]>(() => loadBox<Procedure[]>(LS_KEY, seedProcedures));

    useEffect(() => {
        saveBox(LS_KEY, procedures);
    }, [procedures]);

    const processProcedureData = async (data: ProcedureFormData, lang: 'ar' | 'en'): Promise<Omit<Procedure, 'id' | 'code' | 'createdAt' | 'updatedAt'>> => {
        const otherLang = lang === 'ar' ? 'en' : 'ar';
        
        const formsUsed: ProcedureForm[] = await Promise.all(
            data.formsUsed.map(async (form) => {
                let fileContent = { name: '', type: '', content: '' };
                if (form.file) {
                    fileContent = {
                        name: form.file.name,
                        type: form.file.type,
                        content: await fileToBase64(form.file),
                    };
                } else if (form.existingFile) {
                    fileContent = form.existingFile;
                }

                return {
                    name: {
                        [lang]: form.name,
                        [otherLang]: autoTranslate(form.name, otherLang),
                    } as LocalizedString,
                    file: fileContent,
                };
            })
        );
        
        const definitions: Definition[] = data.definitions.map(def => ({
            id: def.id,
            term: {
                [lang]: def.term,
                [otherLang]: autoTranslate(def.term, otherLang),
            } as LocalizedString,
            definition: {
                [lang]: def.definition,
                [otherLang]: autoTranslate(def.definition, otherLang),
            } as LocalizedString,
        }));
        
        const kpi: Kpi = {
            name: {
                [lang]: data.kpi.name,
                [otherLang]: autoTranslate(data.kpi.name, otherLang),
            } as LocalizedString,
            target: {
                [lang]: data.kpi.target,
                [otherLang]: autoTranslate(data.kpi.target, otherLang),
            } as LocalizedString,
            description: {
                [lang]: data.kpi.description,
                [otherLang]: autoTranslate(data.kpi.description, otherLang),
            } as LocalizedString,
        };

        return {
            title: {
                [lang]: data.title,
                [otherLang]: autoTranslate(data.title, otherLang),
            } as LocalizedString,
            description: {
                [lang]: data.description,
                [otherLang]: autoTranslate(data.description, otherLang),
            } as LocalizedString,
            inputs: {
                [lang]: data.inputs,
                [otherLang]: autoTranslate(data.inputs, otherLang),
            } as LocalizedString,
            outputs: {
                [lang]: data.outputs,
                [otherLang]: autoTranslate(data.outputs, otherLang),
            } as LocalizedString,
            policiesAndReferences: data.policiesAndReferences ? {
                [lang]: data.policiesAndReferences,
                [otherLang]: autoTranslate(data.policiesAndReferences, otherLang),
            } as LocalizedString : undefined,
            technicalSystems: data.technicalSystems ? {
                [lang]: data.technicalSystems,
                [otherLang]: autoTranslate(data.technicalSystems, otherLang),
            } as LocalizedString : undefined,
            departmentId: data.departmentId,
            linkedService: data.linkedService ? {
                [lang]: data.linkedService,
                [otherLang]: autoTranslate(data.linkedService, otherLang),
            } as LocalizedString : undefined,
            durationDays: data.durationDays,
            eReadiness: data.eReadiness,
            formsUsed,
            definitions,
            kpi: (kpi.name[lang] || kpi.target[lang] || kpi.description[lang]) ? kpi : undefined,
        };
    };

    const addProcedure = useCallback(async (data: ProcedureFormData, lang: 'ar' | 'en') => {
        const processedData = await processProcedureData(data, lang);
        const now = new Date().toISOString();
        
        setProcedures(prev => {
            const newProcedure: Procedure = {
                ...processedData,
                id: `PROC${Date.now()}`,
                code: generateNextProcedureCode(prev),
                createdAt: now,
                updatedAt: now,
            };
            return [newProcedure, ...prev];
        });
    }, []);

    const updateProcedure = useCallback(async (id: string, data: ProcedureFormData, lang: 'ar' | 'en') => {
        const processedData = await processProcedureData(data, lang);
        const now = new Date().toISOString();

        setProcedures(prev => prev.map(p =>
            p.id === id
                ? {
                    ...p,
                    ...processedData,
                    updatedAt: now,
                }
                : p
        ));
    }, []);


    const deleteProcedure = useCallback((id: string) => {
        setProcedures(prev => prev.filter(p => p.id !== id));
    }, []);


    const value = { procedures, addProcedure, updateProcedure, deleteProcedure };


    return (
        <ProceduresContext.Provider value={value}>
            {children}
        </ProceduresContext.Provider>
    );
};

export const useProcedures = (): ProceduresContextType => {
    const context = useContext(ProceduresContext);
    if (!context) {
        throw new Error('useProcedures must be used within a ProceduresProvider');
    }
    return context;
};
