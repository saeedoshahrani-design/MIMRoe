import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { CloseIcon, SparklesIcon } from '../icons/IconComponents';
import { GoogleGenAI, Type } from '@google/genai';

interface AddProcedureFromTextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (parsedData: any) => void;
}

const AddProcedureFromTextModal: React.FC<AddProcedureFromTextModalProps> = ({ isOpen, onClose, onComplete }) => {
    const { t } = useLocalization();
    const [procedureText, setProcedureText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);


    const handleGenerate = async () => {
        if (!procedureText.trim()) {
            setError('Please enter a description of the procedure.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgress(0);

        progressIntervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    if(progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                    return 95;
                }
                return prev + 5;
            });
        }, 500);

        try {
            
            const procedureSchema = {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'The official title of the procedure.' },
                  description: { type: Type.STRING, description: 'A brief summary of the procedure\'s purpose.' },
                  departmentName: { type: Type.STRING, description: 'The name of the owning department responsible for this procedure.' },
                  linkedService: { type: Type.STRING, description: 'The name of the related service, if any.'},
                  durationDays: { type: Type.NUMBER, description: 'The average duration of the procedure in days.'},
                  eReadiness: {
                    type: Type.STRING,
                    description: 'The e-readiness status.',
                    enum: ['electronic', 'partially-electronic', 'not-electronic'],
                  },
                  inputs: { type: Type.STRING, description: 'A list of necessary inputs, separated by newlines.' },
                  outputs: { type: Type.STRING, description: 'A list of expected outputs, separated by newlines.' },
                  policiesAndReferences: { type: Type.STRING, description: 'A list of related policies and references, separated by newlines.' },
                  technicalSystems: { type: Type.STRING, description: 'A list of technical systems used, separated by newlines.'},
                  formsUsed: {
                      type: Type.ARRAY,
                      description: 'A list of the names of forms used in the procedure.',
                      items: { type: Type.STRING }
                  },
                  definitions: {
                      type: Type.ARRAY,
                      description: 'A list of terms and their definitions related to the procedure.',
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              term: { type: Type.STRING },
                              definition: { type: Type.STRING }
                          },
                          required: ['term', 'definition']
                      }
                  },
                  steps: {
                    type: Type.ARRAY,
                    description: 'An ordered list of the steps in the procedure.',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepName: { type: Type.STRING, description: 'The name or title of the step.' },
                        description: { type: Type.STRING, description: 'A detailed description of the actions taken in this step.' },
                        department: { type: Type.STRING, description: 'The department executing the step.' },
                        responsible: { type: Type.STRING, description: 'The role or person responsible for the step.' },
                        durationHours: { type: Type.NUMBER, description: 'The average time in hours to complete this step.' },
                        waitHours: { type: Type.NUMBER, description: 'The average wait time in hours after this step.' },
                        waitDays: { type: Type.NUMBER, description: 'The average wait time in days after this step.' },
                        systemUsed: { type: Type.STRING, description: 'The technical system or tool used in this step.' },
                      },
                      required: ['stepName', 'description', 'department', 'responsible'],
                    },
                  },
                },
                required: ['title', 'description', 'departmentName', 'steps'],
            };

            // FIX: Moved dynamic import to top-level. Using `process.env.API_KEY!` assuming it's set as per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `Parse the following text which describes a business procedure. Extract all the specified fields. If any information for a required field is not present in the text, make a reasonable and appropriate suggestion based on the context. Do not leave required fields empty unless they are truly optional. Provide the output in a structured JSON format that conforms to the provided schema. Here is the text: \n\n"${procedureText}"`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: procedureSchema,
                },
            });
            
            let jsonText = response.text.trim();
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
                if (jsonText.endsWith("```")) {
                    jsonText = jsonText.substring(0, jsonText.length - 3);
                }
            }

            const parsedData = JSON.parse(jsonText);
            onComplete(parsedData);

        } catch (e: any) {
            console.error(e);
            if (e instanceof SyntaxError) {
                setError(t('procedures.aiModal.aiJsonParseError', { details: e.message }));
            } else if (e.message && e.message.includes('API key not valid')) {
                setError(t('aiSettings.keyInvalidError'));
            } else if (e instanceof TypeError && e.message.includes('Failed to fetch dynamically imported module')) {
                setError(t('aiSettings.moduleLoadError'));
            } else {
                setError(t('procedures.aiModal.error'));
            }
        } finally {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            setProgress(100);
            setTimeout(() => {
                setIsLoading(false);
                setProgress(0);
            }, 500);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-natural-700">
                    <h2 className="text-lg font-bold">{t('procedures.aiModal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <p className="text-sm text-natural-600 dark:text-natural-300">
                        {t('procedures.aiModal.description')}
                    </p>
                    <textarea
                        value={procedureText}
                        onChange={e => setProcedureText(e.target.value)}
                        placeholder={t('procedures.aiModal.placeholder')}
                        rows={10}
                        className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"
                        disabled={isLoading}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <div className="flex justify-end items-center p-4 mt-auto border-t dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-md">{t('cancel')}</button>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="relative ms-3 px-4 py-2 text-sm text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700 disabled:bg-natural-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden w-40"
                    >
                        {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="absolute top-0 left-0 h-full bg-dark-purple-700/70" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                                <span className="relative z-10">{t('procedures.aiModal.generating')} {progress}%</span>
                            </div>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                {t('procedures.aiModal.generate')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProcedureFromTextModal;
