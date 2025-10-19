import React, { useState } from 'react';
import { Procedure, Kpi, LocalizedString } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useProcedures } from '../../context/ProceduresContext';
import Card from '../Card';
import EmptyState from '../EmptyState';
import { ChartBarIcon, PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from '../icons/IconComponents';
import { autoTranslate } from '../../utils/localizationUtils';
import { GoogleGenAI, Type } from '@google/genai';

interface ProcedureKpisTabProps {
    procedure: Procedure;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

interface KpiFormData {
    id?: string;
    name: string;
    target: string;
    description: string;
}

const ProcedureKpisTab: React.FC<ProcedureKpisTabProps> = ({ procedure, setToast }) => {
    const { t, language } = useLocalization();
    const { updateProcedurePartial } = useProcedures();

    const [isAdding, setIsAdding] = useState(false);
    const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
    const [kpiFormData, setKpiFormData] = useState<KpiFormData>({ name: '', target: '', description: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiGeneratedData, setAiGeneratedData] = useState<null | { name: LocalizedString; target: LocalizedString; description: LocalizedString; }>(null);

    const handleUpdateKpis = async (updatedKpis: Kpi[]) => {
        try {
            await updateProcedurePartial(procedure.id, { kpis: updatedKpis });
            setToast({ message: t('procedures.notifications.updateSuccess'), type: 'success' });
        } catch (error) {
            console.error("Failed to update KPIs:", error);
            setToast({ message: "Failed to update KPIs.", type: 'info' });
        }
    };

    const handleSave = () => {
        if (!kpiFormData.name.trim()) return;

        const otherLang = language === 'ar' ? 'en' : 'ar';
        const createLocalizedString = (text: string, existing?: LocalizedString): LocalizedString => ({
            [language]: text,
            [otherLang]: existing?.[otherLang] || autoTranslate(text, otherLang),
        } as LocalizedString);

        if (editingKpiId) {
            // Update existing KPI
            const updatedKpis = (procedure.kpis || []).map(kpi => {
                if (kpi.id === editingKpiId) {
                    return {
                        ...kpi,
                        name: createLocalizedString(kpiFormData.name, kpi.name),
                        target: createLocalizedString(kpiFormData.target, kpi.target),
                        description: createLocalizedString(kpiFormData.description, kpi.description),
                    };
                }
                return kpi;
            });
            handleUpdateKpis(updatedKpis);
            setEditingKpiId(null);
        } else {
            // Add new KPI
            let newKpi: Kpi;
            if (aiGeneratedData) {
                // Saving an AI-generated KPI
                newKpi = {
                    id: `kpi-${Date.now()}`,
                    name: aiGeneratedData.name,
                    target: aiGeneratedData.target,
                    description: aiGeneratedData.description,
                    isAiGenerated: true,
                };
                 const updatedKpis = [...(procedure.kpis || []), newKpi];
                handleUpdateKpis(updatedKpis);
                setAiGeneratedData(null);
            } else {
                 newKpi = {
                    id: `kpi-${Date.now()}`,
                    name: createLocalizedString(kpiFormData.name),
                    target: createLocalizedString(kpiFormData.target),
                    description: createLocalizedString(kpiFormData.description),
                };
                const updatedKpis = [...(procedure.kpis || []), newKpi];
                handleUpdateKpis(updatedKpis);
            }
        }
        setIsAdding(false);
        setKpiFormData({ name: '', target: '', description: '' });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingKpiId(null);
        setAiGeneratedData(null);
        setKpiFormData({ name: '', target: '', description: '' });
    };

    const handleDelete = (id: string) => {
        const updatedKpis = (procedure.kpis || []).filter(kpi => kpi.id !== id);
        handleUpdateKpis(updatedKpis);
    };

    const handleGenerateKpi = async () => {
        if (!procedure.steps || procedure.steps.length === 0) {
            setToast({ message: t('procedures.noStepsForKpiAi'), type: 'info' });
            return;
        }
        setIsGenerating(true);
        try {
            // FIX: Moved dynamic import to top-level. Using `process.env.API_KEY!` assuming it's set as per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const stepsText = procedure.steps.map((step, i) => `Step ${i + 1} (${step.durationHours}h): ${step.stepName} - ${step.description}`).join('\n');
            const prompt = `Based on the following procedure steps, suggest one relevant, measurable, and specific Key Performance Indicator (KPI).
Procedure: "${procedure.title[language]}"
Steps:\n${stepsText}

Provide a name for the KPI, a specific target, and a brief description. All text must be in both English and Arabic.
Your response MUST be a valid JSON object.`;
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, ar: { type: Type.STRING } } },
                    target: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, ar: { type: Type.STRING } } },
                    description: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, ar: { type: Type.STRING } } },
                },
                required: ['name', 'target', 'description']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema }
            });

            const result = JSON.parse(response.text);
            setAiGeneratedData(result);
            setIsAdding(true);
            setEditingKpiId(null);
            setKpiFormData({ name: result.name[language], target: result.target[language], description: result.description[language] });
            setToast({ message: t('procedures.notifications.aiKpiSuccess'), type: 'success' });

        } catch (e) {
            console.error("KPI Generation Error:", e);
            setToast({ message: t('procedures.notifications.aiKpiError'), type: 'info' });
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <Card>
            <div className="space-y-4">
                {(procedure.kpis || []).length === 0 && !isAdding ? (
                     <EmptyState icon={<ChartBarIcon className="w-12 h-12" />} message="No KPIs defined for this procedure." />
                ) : (
                    <div className="space-y-3">
                        {(procedure.kpis || []).map(kpi => (
                            <div key={kpi.id} className="p-3 border rounded-md dark:border-natural-700 group relative">
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingKpiId(kpi.id); setIsAdding(false); setKpiFormData({ name: kpi.name[language], target: kpi.target[language], description: kpi.description[language] }); }} className="p-1 text-natural-500 hover:text-dark-purple-600"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(kpi.id)} className="p-1 text-natural-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                                <h4 className="font-bold flex items-center gap-2">{kpi.name[language]} {kpi.isAiGenerated && <span title={t('procedures.aiGeneratedKpiTooltip')}><SparklesIcon className="w-4 h-4 text-bright-blue-500" /></span>}</h4>
                                <p className="text-sm text-natural-500 dark:text-natural-400">{t('procedures.kpiTarget')}: <span className="font-semibold">{kpi.target[language]}</span></p>
                                <p className="text-sm mt-1">{kpi.description[language]}</p>
                            </div>
                        ))}
                    </div>
                )}
                
                 {(isAdding || editingKpiId) && (
                    <div className="p-4 border-2 border-dashed rounded-md dark:border-natural-600 space-y-3 bg-natural-50 dark:bg-natural-800/50">
                        {aiGeneratedData && (
                            <div className="p-2 text-sm bg-bright-blue-100/50 text-bright-blue-800 dark:bg-bright-blue-900/50 dark:text-bright-blue-200 rounded-md flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4" />
                                <span>{t('procedures.aiGeneratedKpiTooltip')}</span>
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-bold">{t('procedures.kpiName')}</label>
                            <input value={kpiFormData.name} onChange={e => setKpiFormData({...kpiFormData, name: e.target.value})} className="mt-1 w-full bg-white dark:bg-natural-700 p-1 rounded" />
                        </div>
                        <div>
                            <label className="text-xs font-bold">{t('procedures.kpiTarget')}</label>
                            <input value={kpiFormData.target} onChange={e => setKpiFormData({...kpiFormData, target: e.target.value})} className="mt-1 w-full bg-white dark:bg-natural-700 p-1 rounded" />
                        </div>
                        <div>
                            <label className="text-xs font-bold">{t('procedures.kpiDescription')}</label>
                            <textarea value={kpiFormData.description} onChange={e => setKpiFormData({...kpiFormData, description: e.target.value})} rows={3} className="mt-1 w-full bg-white dark:bg-natural-700 p-1 rounded"></textarea>
                        </div>
                         <div className="flex justify-end gap-2">
                            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-100 rounded-full"><XCircleIcon className="w-5 h-5" /></button>
                            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded-full"><CheckCircleIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                )}
                
                <div className="mt-4 pt-4 border-t dark:border-natural-700 flex justify-between items-center">
                    <button
                        onClick={() => { setIsAdding(true); setEditingKpiId(null); setKpiFormData({ name: '', target: '', description: '' }); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-natural-700 border border-dark-purple-600 text-dark-purple-600 dark:text-dark-purple-300 rounded-md text-sm font-medium hover:bg-dark-purple-50 dark:hover:bg-dark-purple-900/40"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {t('procedures.addKpi')}
                    </button>
                    <button
                        onClick={handleGenerateKpi}
                        disabled={isGenerating || !procedure.steps || procedure.steps.length === 0}
                        title={(!procedure.steps || procedure.steps.length === 0) ? t('procedures.noStepsForKpiAi') : ''}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-natural-700 border-2 border-dashed border-bright-blue-600 text-bright-blue-600 dark:text-bright-blue-300 rounded-md text-sm font-medium hover:bg-bright-blue-50 dark:hover:bg-bright-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-4 h-4" />}
                        {isGenerating ? t('procedures.generatingKpi') : t('procedures.generateKpi')}
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default ProcedureKpisTab;
