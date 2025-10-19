import React, { useState, useMemo } from 'react';
import { Procedure, Opportunity, LocalizedString, PriorityValue } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useOpportunities } from '../../context/OpportunitiesContext';
import Card from '../Card';
import EmptyState from '../EmptyState';
import { SparklesIcon, OpportunitiesIcon } from '../icons/IconComponents';
import OpportunityCard from '../OpportunityCard';
import AddOpportunityModal from '../AddOpportunityModal';
import ConfirmationModal from '../ConfirmationModal';
import OpportunityDetailsModal from '../OpportunityDetailsModal';
import { computePriorityDetails } from '../../utils/priority';
import { departments } from '../../data/mockData';
import { GoogleGenAI, Type } from '@google/genai';

interface ProcedureImprovementTabProps {
    procedure: Procedure;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

const ProcedureImprovementTab: React.FC<ProcedureImprovementTabProps> = ({ procedure, setToast }) => {
    const { t, language } = useLocalization();
    const { opportunities, addOpportunity, updateOpportunity, deleteOpportunity } = useOpportunities();
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
    const [opportunityToView, setOpportunityToView] = useState<Opportunity | null>(null);
    const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);

    const linkedOpportunities = useMemo(() => {
        return opportunities.filter(op => op.linkedProcedureId === procedure.id);
    }, [opportunities, procedure.id]);

    const handleSave = (data: Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'> & { id?: string }) => {
        if (data.id) {
            updateOpportunity(data.id, data);
            setToast({ message: t('opportunities.notifications.updateSuccess'), type: 'success' });
        }
        setOpportunityToEdit(null);
    };

    const handleConfirmDelete = () => {
        if (opportunityToDelete) {
            deleteOpportunity(opportunityToDelete.id);
            setToast({ message: t('opportunities.notifications.deleteSuccess'), type: 'success' });
            setOpportunityToDelete(null);
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            // FIX: Moved dynamic import to top-level. Using `process.env.API_KEY!` assuming it's set as per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const stepsText = (procedure.steps || []).map((step, i) => `Step ${i + 1}: ${step.stepName} - ${step.description}`).join('\n');
            const existingOppsText = linkedOpportunities.length > 0
                ? `\n\nExisting improvement opportunities for this procedure (do not suggest duplicates):\n${linkedOpportunities.map(op => `- ${op.title[language]}`).join('\n')}`
                : '';

            const prompt = `Based on the following procedure, analyze its steps and identify a single, high-impact improvement opportunity.
Procedure Title: ${procedure.title.en} / ${procedure.title.ar}
Procedure Description: ${procedure.description.en} / ${procedure.description.ar}
Procedure Steps:\n${stepsText}
${existingOppsText}

Suggest a new, non-redundant improvement opportunity. Describe the current situation and a proposed solution. Estimate the impact and effort.
Your response MUST be a valid JSON object. All text fields must be provided in BOTH English and Arabic.`;
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, ar: { type: Type.STRING } } },
                    currentSituation: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, ar: { type: Type.STRING } } },
                    proposedSolution: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, ar: { type: Type.STRING } } },
                    impact: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                    effort: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                },
                required: ['title', 'currentSituation', 'proposedSolution', 'impact', 'effort']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json', responseSchema: schema }
            });
            const result = JSON.parse(response.text);

            const impactAr: PriorityValue = result.impact === 'low' ? 'منخفض' : result.impact === 'medium' ? 'متوسط' : 'مرتفع';
            const effortAr: PriorityValue = result.effort === 'low' ? 'منخفض' : result.effort === 'medium' ? 'متوسط' : 'مرتفع';
            const priorityDetails = computePriorityDetails(effortAr, impactAr);
            
            const dept = departments.find(d => d.id === procedure.departmentId);

            const newOpportunityData: Omit<Opportunity, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'type'> = {
                title: result.title,
                department: dept ? dept.name.ar : '',
                status: 'Under Review',
                impact: impactAr,
                effort: effortAr,
                priority: priorityDetails.legacyPriority,
                priority_category: priorityDetails.categoryKey,
                priority_score: priorityDetails.score,
                currentSituation: result.currentSituation,
                proposedSolution: result.proposedSolution,
                progress: 0,
                owner: { en: 'AI Suggestion', ar: 'اقتراح الذكاء الاصطناعي' },
                startDate: '',
                dueDate: '',
                isAiGenerated: true,
                linkedProcedureId: procedure.id,
                linkedProcedureCode: procedure.code,
                linkedProcedureTitle: procedure.title,
            };

            await addOpportunity(newOpportunityData);
            setToast({ message: t('procedures.notifications.aiOpportunitySuccess'), type: 'success' });

        } catch (e: any) {
            console.error("Opportunity Generation Error:", e);
            let errorMessage = t('procedures.notifications.aiOpportunityError');
             if (e.message && e.message.includes('API key not valid')) {
                errorMessage = t('aiSettings.keyInvalidError');
            }
            setToast({ message: errorMessage, type: 'info' });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <AddOpportunityModal 
                isOpen={!!opportunityToEdit}
                onClose={() => setOpportunityToEdit(null)}
                onSave={handleSave}
                opportunityToEdit={opportunityToEdit}
            />
            {opportunityToView && <OpportunityDetailsModal
                isOpen={!!opportunityToView}
                opportunity={opportunityToView}
                onClose={() => setOpportunityToView(null)}
                onEdit={setOpportunityToEdit}
                onDelete={setOpportunityToDelete}
            />}
            <ConfirmationModal
                isOpen={!!opportunityToDelete}
                onClose={() => setOpportunityToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('opportunities.deleteOpportunity')}
                message={t('opportunities.deleteOpportunityConfirm')}
            />

            {linkedOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {linkedOpportunities.map(op => (
                        <OpportunityCard
                            key={op.id}
                            opportunity={op}
                            onEdit={setOpportunityToEdit}
                            onDelete={setOpportunityToDelete}
                            onViewDetails={setOpportunityToView}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <EmptyState 
                        icon={<OpportunitiesIcon className="w-12 h-12" />}
                        message={t('procedures.emptyImprovementOpportunities')} 
                    />
                </Card>
            )}

            <Card className="mt-6">
                 <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-natural-700 border-2 border-dashed border-bright-blue-600 text-bright-blue-600 dark:text-bright-blue-300 rounded-lg font-semibold hover:bg-bright-blue-50 dark:hover:bg-bright-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isAnalyzing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            {t('procedures.analyzingProcedure')}
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5" />
                            {t('procedures.analyzeProcedure')}
                        </>
                    )}
                </button>
            </Card>
        </div>
    );
};

export default ProcedureImprovementTab;
