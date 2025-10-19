import React, { useState, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import Card from '../components/Card.tsx';
import PageTitle from '../components/PageTitle.tsx';
import { useLeadTasks } from '../context/LeadTasksContext.tsx';
import { LeadTaskCategory } from '../types.ts';
import TaskCategoryCard from '../components/leadTasks/TaskCategoryCard.tsx';
import { PencilIcon, UserCircleIcon } from '../components/icons/IconComponents.tsx';

const LeadTasks: React.FC = () => {
    const { t, language } = useLocalization();
    const { leadTasksData, updateLeaderName } = useLeadTasks();
    const { leaderName, tasks } = leadTasksData;

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(leaderName[language]);
    
    useEffect(() => {
        // Sync local state with context when not in editing mode
        if (!isEditingName) {
            setEditedName(leaderName[language] || '');
        }
    }, [leaderName, language, isEditingName]);

    const handleNameSave = () => {
        if (editedName.trim() && editedName.trim() !== leaderName[language]) {
            updateLeaderName(editedName.trim(), language);
        }
        setIsEditingName(false);
    };

    const taskCategories: { id: LeadTaskCategory; title: string }[] = [
        { id: 'strategic', title: t('leadTasks.strategic') },
        { id: 'communication', title: t('leadTasks.communication') },
        { id: 'development', title: t('leadTasks.development') },
        { id: 'operational', title: t('leadTasks.operational') },
        { id: 'additional', title: t('leadTasks.additional') },
    ];

    return (
        <div className="space-y-6">
            <PageTitle />
            <Card className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 rtl:md:space-x-reverse">
                <div className="relative">
                    <UserCircleIcon className="w-28 h-28 text-natural-300 dark:text-natural-600 border-4 border-mim-bright-blue rounded-full" />
                </div>
                <div className="text-center md:text-left rtl:md:text-right">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onBlur={handleNameSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                                autoFocus
                                className="text-2xl font-bold bg-natural-100 dark:bg-natural-700 rounded-md px-2 py-1"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <h2 className="text-2xl font-bold">{leaderName[language]}</h2>
                            <button onClick={() => { setEditedName(leaderName[language]); setIsEditingName(true); }} className="text-natural-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    <p className="text-natural-500 dark:text-natural-400">{t('leadTasks.role')}</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {taskCategories.map(({ id, title }) => (
                    <TaskCategoryCard
                        key={id}
                        category={id}
                        title={title}
                        tasks={tasks[id]}
                    />
                ))}
            </div>
        </div>
    );
};

export default LeadTasks;
