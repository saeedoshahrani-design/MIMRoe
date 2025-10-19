import React, { useState } from 'react';
import { StrategicInitiative, InitiativeAxis, LocalizedString } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useInitiatives } from '../../context/InitiativesContext';
import Card from '../Card';
import EmptyState from '../EmptyState';
import { CheckBadgeIcon, PlusIcon, PencilIcon, TrashIcon } from '../icons/IconComponents';
import { autoTranslate } from '../../utils/localizationUtils';

interface InitiativeAxesCardProps {
    initiative: StrategicInitiative;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

const InitiativeAxesCard: React.FC<InitiativeAxesCardProps> = ({ initiative, setToast }) => {
    const { t, language } = useLocalization();
    const { updateInitiative } = useInitiatives();
    
    const [editingAxisId, setEditingAxisId] = useState<string | null>(null);
    const [axisText, setAxisText] = useState('');

    const handleStartEdit = (axis: InitiativeAxis) => {
        setEditingAxisId(axis.id);
        setAxisText(axis.text[language]);
    };

    const handleSave = (id: string) => {
        const otherLang = language === 'ar' ? 'en' : 'ar';
        const updatedAxes = (initiative.axes || []).map(axis => {
            if (axis.id === id) {
                const newText: LocalizedString = {
                    ...axis.text,
                    [language]: axisText,
                    [otherLang]: axis.text[otherLang] || autoTranslate(axisText, otherLang)
                };
                return { ...axis, text: newText };
            }
            return axis;
        });
        updateInitiative(initiative.id, { axes: updatedAxes });
        setEditingAxisId(null);
        setAxisText('');
    };
    
    const handleAdd = () => {
        if (!axisText.trim()) return;
        const otherLang = language === 'ar' ? 'en' : 'ar';
        const newAxis: InitiativeAxis = {
            id: `axis-${Date.now()}`,
            text: {
                [language]: axisText,
                [otherLang]: autoTranslate(axisText, otherLang)
            } as LocalizedString
        };
        const updatedAxes = [...(initiative.axes || []), newAxis];
        updateInitiative(initiative.id, { axes: updatedAxes });
        setAxisText('');
    };

    const handleDelete = (id: string) => {
        const updatedAxes = (initiative.axes || []).filter(axis => axis.id !== id);
        updateInitiative(initiative.id, { axes: updatedAxes });
    };

    return (
        <Card className="flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <CheckBadgeIcon className="w-6 h-6 text-dark-purple-500" />
                {t('initiatives.details.axes.title')}
            </h3>

            {(initiative.axes || []).length > 0 ? (
                <div className="space-y-2">
                    {(initiative.axes || []).map(axis => (
                        <div key={axis.id} className="group flex items-center gap-2 p-2 rounded-md hover:bg-natural-100 dark:hover:bg-natural-800">
                            {editingAxisId === axis.id ? (
                                <input
                                    value={axisText}
                                    onChange={e => setAxisText(e.target.value)}
                                    onBlur={() => handleSave(axis.id)}
                                    onKeyDown={e => e.key === 'Enter' && handleSave(axis.id)}
                                    autoFocus
                                    className="flex-grow bg-white dark:bg-natural-700 p-1 rounded border border-dark-purple-400"
                                />
                            ) : (
                                <p className="flex-grow text-sm text-natural-700 dark:text-natural-200">{axis.text[language]}</p>
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button onClick={() => handleStartEdit(axis)} className="p-1 text-natural-500 hover:text-dark-purple-600"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(axis.id)} className="p-1 text-natural-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<CheckBadgeIcon className="w-12 h-12" />} message={t('initiatives.details.axes.empty')} />
            )}

            <div className="mt-auto pt-4 border-t dark:border-natural-700 flex gap-2">
                <input
                    value={axisText}
                    onChange={e => setAxisText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder={t('initiatives.details.axes.placeholder')}
                    className="flex-grow w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm"
                />
                <button
                    onClick={handleAdd}
                    disabled={!axisText.trim()}
                    className="px-3 py-1.5 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700 disabled:bg-natural-400"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>
        </Card>
    );
};

export default InitiativeAxesCard;