import React, { useState, useRef } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import Card from '../components/Card';
import PageTitle from '../components/PageTitle';
import { useLeadTasks } from '../context/LeadTasksContext';
import { LeadTaskCategory } from '../types';
import TaskCategoryCard from '../components/leadTasks/TaskCategoryCard';
import { PencilIcon } from '../components/icons/IconComponents';

const LeadTasks: React.FC = () => {
    const { t } = useLocalization();
    const { leadTasksData, updateLeaderName, updateLeaderPhoto } = useLeadTasks();
    const { leaderName, leaderPhoto, tasks } = leadTasksData;

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(leaderName);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNameSave = () => {
        if (editedName.trim()) {
            updateLeaderName(editedName.trim());
        }
        setIsEditingName(false);
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateLeaderPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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
                <div className="relative group">
                    <img src={leaderPhoto} alt="Leader" className="w-28 h-28 rounded-full object-cover border-4 border-mim-bright-blue" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={t('leadTasks.changePhoto')}
                    >
                        <PencilIcon className="w-6 h-6" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        className="hidden"
                        accept="image/*"
                    />
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
                            <h2 className="text-2xl font-bold">{leaderName}</h2>
                            <button onClick={() => { setEditedName(leaderName); setIsEditingName(true); }} className="text-natural-400 opacity-0 group-hover:opacity-100 transition-opacity">
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