import React, { useState } from 'react';
import { StrategicInitiative } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import PageTitle from '../PageTitle';
import Toast from '../Toast';
import InitiativeInfoCard from './InitiativeInfoCard';
import InitiativeMembersTab from './InitiativeMembersTab';
import InitiativeTimelineTab from './InitiativeTimelineTab';

interface InitiativeDetailViewProps {
    initiative: StrategicInitiative;
    onBack: () => void;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

type TabId = 'card' | 'members' | 'timeline';

const InitiativeDetailView: React.FC<InitiativeDetailViewProps> = ({ initiative, onBack, setToast }) => {
    const { t, language } = useLocalization();
    const [activeTab, setActiveTab] = useState<TabId>('card');

    const tabs: { id: TabId, label: string }[] = [
        { id: 'card', label: t('initiatives.details.tabs.card') },
        { id: 'members', label: t('initiatives.details.tabs.members') },
        { id: 'timeline', label: t('initiatives.details.tabs.timeline') },
    ];

    return (
        <div className="space-y-4">
            <PageTitle />
            
            <div className="flex items-center text-sm text-natural-500 dark:text-natural-400">
                 <button onClick={onBack} className="hover:underline">{t('nav.initiatives')}</button>
                 <span className="mx-2 rtl:rotate-180">/</span>
                 <span className="font-medium text-natural-700 dark:text-natural-200">{initiative.name[language]}</span>
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
                {activeTab === 'card' && (
                    <div>
                        <InitiativeInfoCard initiative={initiative} setToast={setToast} />
                    </div>
                )}
                {activeTab === 'members' && <InitiativeMembersTab initiative={initiative} setToast={setToast} />}
                {activeTab === 'timeline' && <InitiativeTimelineTab initiative={initiative} setToast={setToast} />}
            </div>
        </div>
    );
};

export default InitiativeDetailView;
