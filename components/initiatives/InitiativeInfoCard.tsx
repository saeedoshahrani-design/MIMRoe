import React, { useState, useEffect, useRef } from 'react';
import { StrategicInitiative, LocalizedString } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useInitiatives } from '../../context/InitiativesContext';
import Card from '../Card';
// FIX: Changed CalendarIcon to CalendarDaysIcon and imported InformationCircleIcon
import { CalendarDaysIcon as CalendarIcon, CheckCircleIcon, XCircleIcon, UserCircleIcon, DepartmentsIcon, SparklesIcon, BoltIcon, InformationCircleIcon } from '../icons/IconComponents';
import { departments } from '../../data/mockData';
import { autoTranslate } from '../../utils/localizationUtils';

interface InitiativeInfoCardProps {
    initiative: StrategicInitiative;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};


const EditableField: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    onSave: (newValue: string) => void;
    type?: 'textarea' | 'date' | 'text';
    isLargeText?: boolean;
}> = ({ icon, label, value, onSave, type = 'textarea', isLargeText = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleSave = () => {
        if (currentValue.trim() !== value.trim()) {
            onSave(currentValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-2 rounded-md bg-natural-100 dark:bg-natural-800 border-2 border-dark-purple-400">
                <label className="block text-xs font-semibold text-natural-500 dark:text-natural-400 mb-1">{label}</label>
                {type === 'textarea' ? (
                    <textarea value={currentValue} onChange={e => setCurrentValue(e.target.value)} autoFocus className="w-full p-1 bg-white dark:bg-natural-700 rounded-md" rows={isLargeText ? 4 : 2} />
                ) : (
                    <input type={type} value={currentValue} onChange={e => setCurrentValue(e.target.value)} autoFocus className="w-full p-1 bg-white dark:bg-natural-700 rounded-md" />
                )}
                <div className="flex gap-2 mt-2">
                    <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded-full" title="Save"><CheckCircleIcon className="w-5 h-5" /></button>
                    <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-100 rounded-full" title="Cancel"><XCircleIcon className="w-5 h-5" /></button>
                </div>
            </div>
        );
    }

    return (
        <div onClick={() => setIsEditing(true)} className="flex items-start gap-4 p-2 rounded-md hover:bg-natural-100 dark:hover:bg-natural-800 cursor-pointer group min-h-[64px]">
            <div className="flex-shrink-0 text-dark-purple-500 dark:text-dark-purple-400 mt-1">{icon}</div>
            <div className="flex-grow min-w-0">
                <p className="text-xs font-semibold text-natural-500 dark:text-natural-400">{label}</p>
                <p className={`font-medium whitespace-pre-wrap break-words mt-1 ${isLargeText ? 'text-lg' : ''}`}>{value || '-'}</p>
            </div>
        </div>
    );
};

const EditableDepartmentsField: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string[];
    otherValue: string;
    onSave: (newValue: string[], newOtherValue: string) => void;
}> = ({ icon, label, value, otherValue, onSave }) => {
    const { t, language } = useLocalization();
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [isOtherChecked, setIsOtherChecked] = useState(!!otherValue);
    const [otherText, setOtherText] = useState(otherValue);
    const editRef = useRef<HTMLDivElement>(null);
    useClickOutside(editRef, () => setIsEditing(false));

    const handleToggle = (deptName: string) => {
        const newDepts = currentValue.includes(deptName)
            ? currentValue.filter(d => d !== deptName)
            : [...currentValue, deptName];
        setCurrentValue(newDepts);
    };
    
    const handleSave = () => {
        const otherTextChanged = otherText.trim() !== (otherValue || '').trim();
        const deptsChanged = JSON.stringify(currentValue.sort()) !== JSON.stringify((value || []).sort());
        
        if (deptsChanged || otherTextChanged || isOtherChecked !== !!otherValue) {
             onSave(currentValue, isOtherChecked ? otherText : '');
        }
        setIsEditing(false);
    };

    const handleStartEditing = () => {
        setCurrentValue(value || []);
        setOtherText(otherValue || '');
        setIsOtherChecked(!!otherValue);
        setIsEditing(true);
    };

    if (isEditing) {
        return (
             <div ref={editRef} className="relative p-2 rounded-md bg-natural-100 dark:bg-natural-800 border-2 border-dark-purple-400">
                <label className="block text-xs font-semibold text-natural-500 dark:text-natural-400 mb-1">{label}</label>
                <div className="p-2 border rounded-md max-h-40 overflow-y-auto bg-white dark:bg-natural-700">
                    {departments.map(dept => (
                        <label key={dept.id} className="flex items-center space-x-2 rtl:space-x-reverse p-1 rounded">
                            <input type="checkbox" checked={currentValue.includes(dept.name.ar)} onChange={() => handleToggle(dept.name.ar)} />
                            <span>{dept.name[language]}</span>
                        </label>
                    ))}
                    <label className="flex items-center space-x-2 rtl:space-x-reverse p-1 rounded font-semibold mt-2 text-dark-purple-600 dark:text-dark-purple-300">
                        <input
                            type="checkbox"
                            checked={isOtherChecked}
                            onChange={() => setIsOtherChecked(!isOtherChecked)}
                        />
                        <span>{t('initiatives.modal.other')}</span>
                    </label>
                    {isOtherChecked && (
                        <textarea
                            value={otherText}
                            onChange={e => setOtherText(e.target.value)}
                            placeholder={t('initiatives.modal.otherDepartmentsPlaceholder')}
                            className="mt-1 w-full p-1 bg-white dark:bg-natural-600 rounded-md"
                            rows={2}
                        />
                    )}
                </div>
                 <div className="flex gap-2 mt-2">
                    <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded-full" title="Save"><CheckCircleIcon className="w-5 h-5" /></button>
                </div>
            </div>
        );
    }
    
    return (
        <div onClick={handleStartEditing} className="flex items-start gap-4 p-2 rounded-md hover:bg-natural-100 dark:hover:bg-natural-800 cursor-pointer group min-h-[64px]">
             <div className="flex-shrink-0 text-dark-purple-500 dark:text-dark-purple-400 mt-1">{icon}</div>
             <div className="flex-grow">
                <p className="text-xs font-semibold text-natural-500 dark:text-natural-400">{label}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                    {(value || []).length > 0 ? value.map(deptName => {
                       const dept = departments.find(d => d.name.ar === deptName);
                       return (
                           <span key={deptName} className="px-2 py-0.5 text-xs font-medium rounded-full bg-natural-200 text-natural-700 dark:bg-natural-700 dark:text-natural-200">
                               {dept ? dept.name[language] : deptName}
                           </span>
                       )
                    }) : !otherValue && '-'}
                </div>
                {otherValue && (
                     <div className="mt-2 pt-2 border-t border-natural-200/50 dark:border-natural-700/50">
                        <p className="text-xs font-semibold text-natural-500 dark:text-natural-400">{t('initiatives.modal.other')}</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{otherValue}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const InitiativeInfoCard: React.FC<InitiativeInfoCardProps> = ({ initiative, setToast }) => {
    const { t, language } = useLocalization();
    const { updateInitiative } = useInitiatives();

    const handleUpdate = (field: keyof Omit<StrategicInitiative, 'id' | 'createdAt' | 'updatedAt' | 'axes' | 'members' | 'tasks' | 'associatedDepartments' | 'otherAssociatedDepartments'>, value: string) => {
        const localizedStringFields: (keyof StrategicInitiative)[] = ['name', 'description', 'owner', 'outcomes', 'strategicAlignment'];

        let updatedData: Partial<Omit<StrategicInitiative, 'id'>>;

        if (localizedStringFields.includes(field as keyof StrategicInitiative)) {
            const otherLang = language === 'ar' ? 'en' : 'ar';
            const currentData = initiative[field as keyof StrategicInitiative] as LocalizedString | undefined;
            
            const newLocalizedString: LocalizedString = {
                ar: currentData?.ar || '',
                en: currentData?.en || '',
            };
            newLocalizedString[language] = value;
            
            if (!newLocalizedString[otherLang] || autoTranslate(currentData?.[language] || '', otherLang) === newLocalizedString[otherLang]) {
                newLocalizedString[otherLang] = autoTranslate(value, otherLang);
            }

            updatedData = { [field]: newLocalizedString };
        } else {
            updatedData = { [field]: value };
        }

        updateInitiative(initiative.id, updatedData);
        setToast({ message: t('initiatives.notifications.updateSuccess'), type: 'success' });
    };

    const handleDepartmentsUpdate = (newDepartments: string[], newOtherDepartments: string) => {
        const otherLang = language === 'ar' ? 'en' : 'ar';
        const currentOtherData = initiative.otherAssociatedDepartments || { ar: '', en: '' };
        
        const newOtherData: LocalizedString = {
            ...currentOtherData,
            [language]: newOtherDepartments,
        };

        if (!newOtherData[otherLang] || autoTranslate(currentOtherData[language], otherLang) === newOtherData[otherLang]) {
            newOtherData[otherLang] = autoTranslate(newOtherDepartments, otherLang);
        }
        
        updateInitiative(initiative.id, { 
            associatedDepartments: newDepartments,
            otherAssociatedDepartments: newOtherData,
        });
        setToast({ message: t('initiatives.notifications.updateSuccess'), type: 'success' });
    };

    return (
        <Card>
            <div className="space-y-4">
                <EditableField icon={<div />} label={t('initiatives.modal.name')} value={initiative.name?.[language] || ''} onSave={val => handleUpdate('name', val)} type="text" isLargeText />
                <EditableField icon={<InformationCircleIcon className="w-5 h-5"/>} label={t('initiatives.modal.description')} value={initiative.description?.[language] || ''} onSave={val => handleUpdate('description', val)} />
                
                <hr className="border-natural-200 dark:border-natural-700" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <EditableField icon={<UserCircleIcon className="w-5 h-5"/>} label={t('initiatives.modal.owner')} value={initiative.owner?.[language] || ''} onSave={val => handleUpdate('owner', val)} type="text" />
                    <EditableDepartmentsField 
                        icon={<DepartmentsIcon className="w-5 h-5"/>} 
                        label={t('initiatives.modal.associatedDepartments')} 
                        value={initiative.associatedDepartments || []}
                        otherValue={initiative.otherAssociatedDepartments?.[language] || ''}
                        onSave={handleDepartmentsUpdate} 
                    />
                    <EditableField icon={<SparklesIcon className="w-5 h-5"/>} label={t('initiatives.modal.outcomes')} value={initiative.outcomes?.[language] || ''} onSave={val => handleUpdate('outcomes', val)} />
                    <EditableField icon={<BoltIcon className="w-5 h-5"/>} label={t('initiatives.modal.strategicAlignment')} value={initiative.strategicAlignment?.[language] || ''} onSave={val => handleUpdate('strategicAlignment', val)} />
                    <EditableField icon={<CalendarIcon className="w-5 h-5"/>} label={t('initiatives.modal.startDate')} value={initiative.startDate || ''} onSave={val => handleUpdate('startDate', val)} type="date" />
                    <EditableField icon={<CalendarIcon className="w-5 h-5"/>} label={t('initiatives.modal.endDate')} value={initiative.endDate || ''} onSave={val => handleUpdate('endDate', val)} type="date" />
                </div>
            </div>
        </Card>
    );
};

export default InitiativeInfoCard;