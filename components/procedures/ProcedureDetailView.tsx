import React, { useState } from 'react';
import { Procedure } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import Card from '../Card';
import EmptyState from '../EmptyState';
import { OpportunitiesIcon } from '../icons/IconComponents';
import ProcedureInfoCard from './ProcedureInfoCard';
import ProcedureKpisTab from './ProcedureKpisTab';
import ProcedureStepsTab from './ProcedureDiagramTab';
import ProcedureImprovementTab from './ProcedureImprovementTab';
import ProcedureChangeLogTab from './ProcedureChangeLogTab';

interface ProcedureDetailViewProps {
    procedure: Procedure;
    onBack: () => void;
    onEdit: (procedure: Procedure) => void;
    onDelete: (procedure: Procedure) => void;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
    updateProcedurePartial: (id: string, data: Partial<Omit<Procedure, 'id'>>) => Promise<void>;
}

type TabId = 'info' | 'kpis' | 'stepsTable' | 'improvementOpportunities' | 'changeLog';

const ProcedureDetailView: React.FC<ProcedureDetailViewProps> = ({ procedure, onBack, onEdit, onDelete, setToast, updateProcedurePartial }) => {
    const { t, language } = useLocalization();
    const [activeTab, setActiveTab] = useState<TabId>('info');

    const tabs: { id: TabId, label: string }[] = [
        { id: 'info', label: t('procedures.details.tabs.card') },
        { id: 'stepsTable', label: t('procedures.details.tabs.stepsTable') },
        { id: 'kpis', label: t('procedures.details.tabs.kpis') },
        { id: 'improvementOpportunities', label: t('procedures.details.tabs.improvementOpportunities') },
        { id: 'changeLog', label: t('procedures.details.tabs.changeLog') },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center text-sm text-natural-500 dark:text-natural-400">
                 <button onClick={onBack} className="hover:underline">{t('nav.procedures')}</button>
                 <span className="mx-2 rtl:rotate-180">/</span>
                 <span className="font-medium text-natural-700 dark:text-natural-200 truncate max-w-xs">{procedure.title[language]}</span>
            </div>

            <div className="border-b border-natural-200 dark:border-natural-700">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-dark-purple-500 text-dark-purple-600 dark:text-dark-purple-400'
                                    : 'border-transparent text-natural-500 hover:text-natural-700 hover:border-natural-300 dark:hover:text-natural-200 dark:hover:border-natural-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="pt-4">
                {activeTab === 'info' && (
                    <ProcedureInfoCard procedure={procedure} onEdit={onEdit} onDelete={onDelete} />
                )}
                 {activeTab === 'stepsTable' && (
                    <ProcedureStepsTab procedure={procedure} updateProcedurePartial={updateProcedurePartial} setToast={setToast} />
                )}
                {activeTab === 'kpis' && (
                    <ProcedureKpisTab procedure={procedure} setToast={setToast} />
                )}
                {activeTab === 'improvementOpportunities' && (
                    <ProcedureImprovementTab procedure={procedure} setToast={setToast} />
                )}
                {activeTab === 'changeLog' && (
                    <ProcedureChangeLogTab procedure={procedure} />
                )}
            </div>
        </div>
    );
};

export default ProcedureDetailView;