import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Procedure, LocalizedString, EReadiness, AttachedFile, Kpi, Definition, ProcedureStep, ChangeLogEntry } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { generateNextProcedureCode } from '../utils/procedureUtils';
import { autoTranslate } from '../utils/localizationUtils';
import { GoogleGenAI } from '@google/genai';

// This is the type for form data, which uses plain strings for the current language
export type ProcedureFormData = {
    title: string;
    description: string;
    inputs: string;
    outputs: string;
    policiesAndReferences: string;
    technicalSystems: string;
    departmentId: string;
    linkedService: string;
    durationDays?: number;
    eReadiness: EReadiness;
    formsUsed: {
        id: number;
        name: string;
        file: File | null;
        existingFile?: AttachedFile;
    }[];
    definitions: {
        id: string;
        term: string;
        definition: string;
    }[];
    kpis: {
        id: string;
        name: string;
        target: string;
        description: string;
    }[];
    linkedTaskIds: string[];
    linkedTargetIds: string[];
};

interface ProceduresContextType {
    procedures: Procedure[];
    isUpdating: boolean;
    addProcedure: (data: Partial<ProcedureFormData>, lang: 'ar' | 'en') => Promise<string>; // returns new ID
    updateProcedure: (id: string, data: ProcedureFormData, lang: 'ar' | 'en') => Promise<void>;
    updateProcedurePartial: (id: string, data: Partial<Omit<Procedure, 'id'>>) => Promise<void>;
    deleteProcedure: (id: string) => Promise<void>;
    addManualChangeLogEntry: (procedureId: string, data: Omit<ChangeLogEntry, 'id' | 'isManual'>) => Promise<void>;
    updateManualChangeLogEntry: (procedureId: string, entryId: string, data: Omit<ChangeLogEntry, 'id' | 'isManual'>) => Promise<void>;
    deleteChangeLogEntry: (procedureId: string, entryId: string) => Promise<void>;
}

const ProceduresContext = createContext<ProceduresContextType | undefined>(undefined);

const COLLECTION_NAME = 'procedures';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

const generateChangeLogDescriptionAI = async (changeDescription: string): Promise<string> => {
    try {
        // FIX: Moved dynamic import to top-level. Using `process.env.API_KEY!` assuming it's set as per guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

        const prompt = `Based on the following technical change description, write a concise, human-readable summary in Arabic for a change log. The summary should be clear and professional. Do not include a date or any preamble like "The change was:". Just provide the description. Change: "${changeDescription}"`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text.trim();
    } catch (e) {
        console.error("AI description generation failed:", e);
        return `وصف تلقائي: ${changeDescription}`; // Fallback to a simple Arabic description
    }
};

const createChangeLogEntry = async (oldProc: Procedure, newData: Partial<Omit<Procedure, 'id'>>, lang: 'ar' | 'en'): Promise<ChangeLogEntry | null> => {
    let changes: string[] = [];
    let element: ChangeLogEntry['element'] | null = null;
    let type: ChangeLogEntry['type'] = 'edit';

    // 1. Check for KPI changes
    if (newData.kpis !== undefined) {
        element = 'kpis';
        const oldKpis = oldProc.kpis || [];
        const newKpis = newData.kpis || [];

        newKpis.forEach(nk => {
            if (!oldKpis.some(ok => ok.id === nk.id)) {
                changes.push(`Added KPI named "${nk.name[lang]}".`);
            }
        });
        oldKpis.forEach(ok => {
            if (!newKpis.some(nk => nk.id === ok.id)) {
                changes.push(`Deleted KPI named "${ok.name[lang]}".`);
            }
        });
        newKpis.forEach(nk => {
            const ok = oldKpis.find(ok => ok.id === nk.id);
            if (ok) {
                const kpiChanges: string[] = [];
                if (ok.name[lang] !== nk.name[lang]) kpiChanges.push(`name was changed from "${ok.name[lang]}" to "${nk.name[lang]}"`);
                if (ok.target[lang] !== nk.target[lang]) kpiChanges.push(`target was changed from "${ok.target[lang]}" to "${nk.target[lang]}"`);
                if (ok.description[lang] !== nk.description[lang]) kpiChanges.push(`description was updated.`);
                if (kpiChanges.length > 0) {
                    changes.push(`For KPI "${ok.name[lang]}", the ${kpiChanges.join(' and the ')}.`);
                }
            }
        });
    }
    // 2. Check for Step changes
    else if (newData.steps !== undefined) {
        element = 'steps';
        const oldSteps = oldProc.steps || [];
        const newSteps = newData.steps || [];
        
        newSteps.forEach(ns => {
            if (!oldSteps.some(os => os.id === ns.id)) {
                changes.push(`Added Step named "${ns.stepName}".`);
            }
        });
        oldSteps.forEach(os => {
            if (!newSteps.some(ns => ns.id === os.id)) {
                changes.push(`Deleted Step named "${os.stepName}".`);
            }
        });
        newSteps.forEach(ns => {
            const os = oldSteps.find(os => os.id === ns.id);
            if (os) {
                const stepChanges: string[] = [];
                if (os.stepName !== ns.stepName) stepChanges.push(`name changed from "${os.stepName}" to "${ns.stepName}"`);
                if (os.description !== ns.description) stepChanges.push(`description was updated`);
                if (os.department !== ns.department) stepChanges.push(`department changed from "${os.department || 'none'}" to "${ns.department || 'none'}"`);
                if (os.responsible !== ns.responsible) stepChanges.push(`responsible changed from "${os.responsible || 'none'}" to "${ns.responsible || 'none'}"`);
                if (os.durationHours !== ns.durationHours) stepChanges.push(`duration changed from ${os.durationHours}h to ${ns.durationHours}h`);
                if (os.waitHours !== ns.waitHours || os.waitDays !== ns.waitDays) stepChanges.push(`wait time changed from ${os.waitDays || 0}d ${os.waitHours || 0}h to ${ns.waitDays || 0}d ${ns.waitHours || 0}h`);
                if (os.systemUsed !== ns.systemUsed) stepChanges.push(`system used changed from "${os.systemUsed || 'none'}" to "${ns.systemUsed || 'none'}"`);
                
                if (stepChanges.length > 0) {
                    changes.push(`For Step "${os.stepName}", the ${stepChanges.join(' and the ')}.`);
                }
            }
        });
    }
    // 3. Check for Card changes
    else {
        element = 'card';
        const cardChanges: string[] = [];

        const compareField = (fieldName: keyof Procedure, label: string) => {
            const oldVal = oldProc[fieldName];
            const newVal = newData[fieldName];
            if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                if (typeof newVal === 'object' && newVal !== null && 'en' in newVal && 'ar' in newVal) {
                    const oldLocStr = oldVal as LocalizedString;
                    const newLocStr = newVal as LocalizedString;
                    if (oldLocStr && newLocStr && oldLocStr[lang] !== newLocStr[lang]) {
                         cardChanges.push(`${label} was changed from "${oldLocStr[lang]}" to "${newLocStr[lang]}".`);
                    }
                } else if (typeof oldVal !== 'object' && typeof newVal !== 'object') {
                     cardChanges.push(`${label} was changed from "${oldVal}" to "${newVal}".`);
                } else {
                    cardChanges.push(`${label} section was updated.`);
                }
            }
        };
        
        compareField('title', 'Title');
        compareField('description', 'Description');
        compareField('departmentId', 'Department');
        compareField('eReadiness', 'E-Readiness');
        compareField('durationDays', 'Duration (in days)');
        compareField('inputs', 'Inputs');
        compareField('outputs', 'Outputs');
        compareField('policiesAndReferences', 'Policies and References');
        compareField('technicalSystems', 'Technical Systems');
        compareField('linkedService', 'Linked Service');
        compareField('linkedTaskIds', 'Linked Tasks');
        compareField('linkedTargetIds', 'Linked Targets');
        
        if (cardChanges.length > 0) {
            changes.push(`Updated the procedure card: ${cardChanges.join(' ')}`);
        }
    }
    
    if (changes.length === 0) return null;

    if (changes.some(c => c.startsWith('Added'))) type = 'add';
    else if (changes.some(c => c.startsWith('Deleted'))) type = 'delete';

    const finalChangeDescription = changes.join(' ');
    const aiDescription = await generateChangeLogDescriptionAI(finalChangeDescription);

    return {
        id: `log-${Date.now()}`,
        type,
        element: element!,
        description: aiDescription,
        timestamp: new Date().toISOString(),
    };
};

export const ProceduresProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!user) {
            setProcedures([]);
            return;
        }

        const collRef = collection(db, 'workspaces', 'shared', COLLECTION_NAME);
        const q = query(collRef);
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const proceduresFromDb = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Procedure));
            proceduresFromDb.sort((a, b) => (a.code > b.code) ? 1 : -1);
            setProcedures(proceduresFromDb);
        }, (error) => {
            console.error("Error listening to procedures collection:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const processFormData = async (data: Partial<ProcedureFormData>, lang: 'ar' | 'en', existingProcedure?: Procedure): Promise<Partial<Omit<Procedure, 'id' | 'code' | 'createdAt' | 'updatedAt'>>> => {
        const otherLang = lang === 'ar' ? 'en' : 'ar';
        const createLocalizedString = (text?: string, existing?: LocalizedString): LocalizedString => ({
            [lang]: text || '',
            [otherLang]: existing?.[otherLang] || autoTranslate(text || '', otherLang),
        } as LocalizedString);

        const formsUsed = data.formsUsed ? await Promise.all(
            (data.formsUsed || []).map(async (form) => {
                let fileContent: AttachedFile;
                if (form.file) {
                    fileContent = {
                        name: form.file.name,
                        type: form.file.type,
                        content: await fileToBase64(form.file),
                    };
                } else if (form.existingFile) {
                    fileContent = form.existingFile;
                } else {
                    throw new Error('Form is missing file content');
                }
                const existingForm = existingProcedure?.formsUsed?.find((_, i) => i === form.id);
                return {
                    name: createLocalizedString(form.name, existingForm?.name),
                    file: fileContent,
                };
            })
        ) : undefined;
        
        const definitions: Definition[] | undefined = data.definitions ? (data.definitions || []).map(def => {
            const existingDef = existingProcedure?.definitions?.find(d => d.id === def.id);
            return {
                id: def.id,
                term: createLocalizedString(def.term, existingDef?.term),
                definition: createLocalizedString(def.definition, existingDef?.definition),
            };
        }) : undefined;
        
        const kpis: Kpi[] | undefined = data.kpis ? (data.kpis || []).map(kpi => {
            const existingKpi = existingProcedure?.kpis?.find(k => k.id === kpi.id);
            return {
                id: kpi.id,
                name: createLocalizedString(kpi.name, existingKpi?.name),
                target: createLocalizedString(kpi.target, existingKpi?.target),
                description: createLocalizedString(kpi.description, existingKpi?.description),
            };
        }) : undefined;

        const processedData: Partial<Omit<Procedure, 'id' | 'code' | 'createdAt' | 'updatedAt'>> = {};

        if(data.title !== undefined) processedData.title = createLocalizedString(data.title, existingProcedure?.title);
        if(data.description !== undefined) processedData.description = createLocalizedString(data.description, existingProcedure?.description);
        if(data.inputs !== undefined) processedData.inputs = createLocalizedString(data.inputs, existingProcedure?.inputs);
        if(data.outputs !== undefined) processedData.outputs = createLocalizedString(data.outputs, existingProcedure?.outputs);
        if(data.policiesAndReferences !== undefined) processedData.policiesAndReferences = data.policiesAndReferences ? createLocalizedString(data.policiesAndReferences, existingProcedure?.policiesAndReferences) : { ar: '', en: '' };
        if(data.technicalSystems !== undefined) processedData.technicalSystems = data.technicalSystems ? createLocalizedString(data.technicalSystems, existingProcedure?.technicalSystems) : { ar: '', en: '' };
        if(data.departmentId !== undefined) processedData.departmentId = data.departmentId;
        if(data.linkedService !== undefined) processedData.linkedService = data.linkedService ? createLocalizedString(data.linkedService, existingProcedure?.linkedService) : { ar: '', en: '' };
        if(data.durationDays !== undefined) processedData.durationDays = data.durationDays;
        if(data.eReadiness !== undefined) processedData.eReadiness = data.eReadiness;
        if(formsUsed !== undefined) processedData.formsUsed = formsUsed;
        if(definitions !== undefined) processedData.definitions = definitions;
        if(kpis !== undefined) processedData.kpis = kpis;
        if(data.linkedTaskIds !== undefined) processedData.linkedTaskIds = data.linkedTaskIds || [];
        if(data.linkedTargetIds !== undefined) processedData.linkedTargetIds = data.linkedTargetIds || [];
        
        // steps are handled separately via updateProcedurePartial
        if (existingProcedure?.steps) {
            processedData.steps = existingProcedure.steps;
        }

        return processedData;
    };

    const addProcedure = useCallback(async (data: Partial<ProcedureFormData>, lang: 'ar' | 'en'): Promise<string> => {
        if (!user) throw new Error("User not authenticated");
        setIsUpdating(true);
        try {
            const now = new Date().toISOString();
            const code = generateNextProcedureCode(procedures);
            
            const processedData = await processFormData(data, lang);
            
            const initialLogEntry: ChangeLogEntry = {
                id: `log-${Date.now()}`,
                type: 'add',
                element: 'card',
                description: 'تم إنشاء الإجراء.',
                timestamp: now,
            };

            const newProcedure: Omit<Procedure, 'id'> = {
                title: { ar: '', en: '' },
                description: { ar: '', en: '' },
                inputs: { ar: '', en: '' },
                outputs: { ar: '', en: '' },
                departmentId: '',
                eReadiness: 'not-electronic',
                kpis: [],
                ...processedData,
                code,
                createdAt: now,
                updatedAt: now,
                changeLog: [initialLogEntry],
            };
            const docRef = await addDoc(collection(db, 'workspaces', 'shared', COLLECTION_NAME), newProcedure);
            return docRef.id;
        } finally {
            setIsUpdating(false);
        }
    }, [user, procedures]);

    const logAndUpdate = useCallback(async (id: string, updateData: Partial<Omit<Procedure, 'id'>>, lang: 'ar' | 'en' = 'ar') => {
        const oldProcedure = procedures.find(p => p.id === id);
        const now = new Date().toISOString();
        const procedureDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);

        if (!oldProcedure) {
            console.warn("Could not find old procedure to create change log entry.");
            await updateDoc(procedureDoc, { ...updateData, updatedAt: now });
            return;
        }

        try {
            const newLogEntry = await createChangeLogEntry(oldProcedure, updateData, lang);
            const existingLog = oldProcedure.changeLog || [];
            const updatedLog = newLogEntry ? [newLogEntry, ...existingLog] : existingLog;
            await updateDoc(procedureDoc, { ...updateData, changeLog: updatedLog, updatedAt: now });
        } catch(e) {
            console.error("Failed to generate change log. Updating data without log.", e);
            // Fallback to update without log
            await updateDoc(procedureDoc, { ...updateData, updatedAt: now });
        }
    }, [procedures, user]);

    const updateProcedure = useCallback(async (id: string, data: ProcedureFormData, lang: 'ar' | 'en') => {
        if (!user) throw new Error("User not authenticated");
        setIsUpdating(true);
        try {
            const existingProcedure = procedures.find(p => p.id === id);
            if (!existingProcedure) throw new Error("Procedure not found");

            const processedData = await processFormData(data, lang, existingProcedure);
            await logAndUpdate(id, processedData, lang);
        } finally {
            setIsUpdating(false);
        }
    }, [user, procedures, logAndUpdate]);

    const updateProcedurePartial = useCallback(async (id: string, data: Partial<Omit<Procedure, 'id'>>) => {
        if (!user) throw new Error("User not authenticated");
        setIsUpdating(true);
        try {
            await logAndUpdate(id, data);
        } finally {
            setIsUpdating(false);
        }
    }, [user, logAndUpdate]);

    const deleteProcedure = useCallback(async (id: string) => {
        if (!user) throw new Error("User not authenticated");
        setIsUpdating(true);
        try {
            const procedureDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, id);
            await deleteDoc(procedureDoc);
        } finally {
            setIsUpdating(false);
        }
    }, [user]);

    const addManualChangeLogEntry = useCallback(async (procedureId: string, data: Omit<ChangeLogEntry, 'id' | 'isManual'>) => {
        if (!user) throw new Error("Not authenticated");
        setIsUpdating(true);
        try {
            const procedure = procedures.find(p => p.id === procedureId);
            if (!procedure) return;

            const newEntry: ChangeLogEntry = {
                ...data,
                id: `log-${Date.now()}`,
                isManual: true,
            };

            const updatedLog = [newEntry, ...(procedure.changeLog || [])];
            const procedureDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, procedureId);
            await updateDoc(procedureDoc, { changeLog: updatedLog });
        } finally {
            setIsUpdating(false);
        }
    }, [user, procedures]);

    const updateManualChangeLogEntry = useCallback(async (procedureId: string, entryId: string, data: Omit<ChangeLogEntry, 'id' | 'isManual'>) => {
        if (!user) throw new Error("Not authenticated");
        setIsUpdating(true);
        try {
            const procedure = procedures.find(p => p.id === procedureId);
            if (!procedure) return;

            const updatedLog = (procedure.changeLog || []).map(entry => {
                if (entry.id === entryId) {
                    return { ...entry, ...data };
                }
                return entry;
            });
            const procedureDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, procedureId);
            await updateDoc(procedureDoc, { changeLog: updatedLog });
        } finally {
            setIsUpdating(false);
        }
    }, [user, procedures]);

    const deleteChangeLogEntry = useCallback(async (procedureId: string, entryId: string) => {
        if (!user) throw new Error("Not authenticated");
        setIsUpdating(true);
        try {
            const procedure = procedures.find(p => p.id === procedureId);
            if (!procedure) return;

            const updatedLog = (procedure.changeLog || []).filter(entry => entry.id !== entryId);
            const procedureDoc = doc(db, 'workspaces', 'shared', COLLECTION_NAME, procedureId);
            await updateDoc(procedureDoc, { changeLog: updatedLog });
        } finally {
            setIsUpdating(false);
        }
    }, [user, procedures]);

    const value = { procedures, isUpdating, addProcedure, updateProcedure, updateProcedurePartial, deleteProcedure, addManualChangeLogEntry, updateManualChangeLogEntry, deleteChangeLogEntry };

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
