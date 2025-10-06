import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Employee } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
// FIX: Import ClockIcon.
import { CloseIcon, UserCircleIcon, IdentificationIcon, AcademicCapIcon, BriefcaseIcon, ListBulletIcon, SparklesIcon, CalendarIcon, ClockIcon } from '../icons/IconComponents';
import { departments } from '../../data/mockData';
import EditableList from './EditableList';

interface EmployeeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    initialMode?: 'view' | 'edit';
    onSave: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
}

type Tab = 'info' | 'qualifications' | 'tasks';

const getNewEmployee = (): Employee => ({
  id: '', // Will be generated in context
  name: { en: '', ar: '' },
  title: { en: '', ar: '' },
  department: { en: '', ar: '' },
  avatar: '',
  joinDate: new Date().toISOString().split('T')[0],
  experienceYears: 0,
  qualifications: { en: [], ar: [] },
  certifications: { en: [], ar: [] },
  trainingCourses: { en: [], ar: [] },
  tasks: { en: [], ar:[] },
  achievements: { en: [], ar: [] },
});

const DetailItem: React.FC<{ icon: React.ReactNode, label: string; value?: string | React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-natural-400 mt-0.5">{icon}</div>
        <div>
            <p className="text-xs font-semibold text-natural-500 dark:text-natural-400">{label}</p>
            <div className="font-medium text-natural-800 dark:text-natural-200">{value || '-'}</div>
        </div>
    </div>
);

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ isOpen, onClose, employee, initialMode = 'view', onSave, onDelete }) => {
    const { t, language, formatDate } = useLocalization();
    const [mode, setMode] = useState(initialMode);
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [formData, setFormData] = useState<Employee | null>(employee);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isCreateMode = !employee;

    useEffect(() => {
        if (isOpen) {
            if (isCreateMode) {
                setFormData(getNewEmployee());
                setMode('edit');
            } else {
                setFormData(employee);
                setMode(initialMode);
            }
            setActiveTab('info');
        }
    }, [isOpen, initialMode, employee, isCreateMode]);
    
    const tenure = useMemo(() => {
        if (!employee) return '';
        const joinDate = new Date(employee.joinDate);
        const now = new Date();
        let years = now.getFullYear() - joinDate.getFullYear();
        let months = now.getMonth() - joinDate.getMonth();
        let days = now.getDate() - joinDate.getDate();

        if (days < 0) {
            months--;
            days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(t('team.details.years', { count: years }));
        if (months > 0) parts.push(t('team.details.months', { count: months }));
        if (years === 0 && months === 0 && days >= 0) {
            parts.push(t('team.details.days', { count: days }));
        }

        return parts.join(language === 'ar' ? ' و' : ', ');
    }, [employee, t, language]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => prev ? ({ ...prev, avatar: reader.result as string }) : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setFormData(prev => prev ? ({ ...prev, avatar: '' }) : null);
    };


    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const [field, lang] = name.split('.');
        
        if (lang) {
            setFormData(prev => prev ? ({ ...prev, [field]: { ...prev[field as keyof Employee] as object, [lang]: value } }) as Employee : null);
        } else {
            setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
        }
    };
    
    const handleListChange = (field: keyof Employee, lang: 'ar' | 'en', newItems: string[]) => {
        setFormData(prev => {
            if (!prev) return null;
            const currentList = prev[field] as { ar: string[], en: string[] };
            return { ...prev, [field]: { ...currentList, [lang]: newItems } };
        });
    };

    const handleSave = () => {
        if (formData) {
            onSave(formData);
        }
    };
    
    const handleDelete = () => {
        if (employee) {
            onDelete(employee);
            onClose();
        }
    };

    const handleCancelEdit = () => {
        if (isCreateMode) {
            onClose();
        } else {
            setFormData(employee);
            setMode('view');
        }
    };

    if (!isOpen || !formData) return null;

    const tabs: { id: Tab, label: string, icon: React.ReactNode }[] = [
        { id: 'info', label: t('team.details.tabs.info'), icon: <IdentificationIcon className="w-5 h-5" /> },
        { id: 'qualifications', label: t('team.details.tabs.qualifications'), icon: <AcademicCapIcon className="w-5 h-5" /> },
        { id: 'tasks', label: t('team.details.tabs.tasks'), icon: <ListBulletIcon className="w-5 h-5" /> },
    ];
    
    const modalTitle = isCreateMode
        ? t('team.details.addTitle')
        : (mode === 'edit' ? t('team.details.editTitle') : t('team.details.title'));
    
    const renderViewMode = () => (
        <>
            <div className="flex items-center gap-4 px-6 pt-6">
                {employee.avatar ? (
                    <img src={employee.avatar} alt={employee.name[language]} className="w-24 h-24 rounded-full object-cover border-4 border-mim-bright-blue" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-natural-100 dark:bg-natural-700 flex items-center justify-center border-4 border-mim-bright-blue">
                        <UserCircleIcon className="w-20 h-20 text-natural-400 dark:text-natural-500" />
                    </div>
                )}
                <div>
                    <h3 className="text-2xl font-bold text-natural-800 dark:text-natural-100">{employee.name[language]}</h3>
                    <p className="text-md text-natural-500 dark:text-natural-400">{employee.title[language]}</p>
                </div>
            </div>

            <div className="px-6 mt-4 border-b border-natural-200 dark:border-natural-700">
                <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === tab.id ? 'border-dark-purple-500 text-dark-purple-600 dark:text-dark-purple-400' : 'border-transparent text-natural-500 hover:text-natural-700 hover:border-natural-300'}`}>
                           {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="p-6">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DetailItem icon={<BriefcaseIcon className="w-5 h-5" />} label={t('team.details.department')} value={employee.department[language]} />
                        <DetailItem icon={<CalendarIcon className="w-5 h-5" />} label={t('team.details.joinDate')} value={formatDate(employee.joinDate)} />
                        <DetailItem icon={<ClockIcon className="w-5 h-5" />} label={t('team.details.tenure')} value={tenure} />
                        <DetailItem icon={<BriefcaseIcon className="w-5 h-5" />} label={t('team.details.experience')} value={t('team.details.years', { count: employee.experienceYears })} />
                    </div>
                )}
                {activeTab === 'qualifications' && (
                    <div className="space-y-4">
                        <p className="font-semibold text-sm">{t('team.details.academic')}</p>
                        <ul className="list-disc list-inside space-y-1 ps-2"><li key="qual">{employee.qualifications[language]}</li></ul>
                        <p className="font-semibold text-sm pt-2">{t('team.details.certs')}</p>
                        <ul className="list-disc list-inside space-y-1 ps-2">{employee.certifications[language].map((c, i) => <li key={i}>{c}</li>)}</ul>
                        <p className="font-semibold text-sm pt-2">{t('team.details.courses')}</p>
                        <ul className="list-disc list-inside space-y-1 ps-2">{employee.trainingCourses[language].map((c, i) => <li key={i}>{c}</li>)}</ul>
                    </div>
                )}
                 {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm"><ListBulletIcon className="w-5 h-5 text-natural-400"/>{t('team.details.tasks')}</div>
                        <ul className="list-disc list-inside space-y-1 ps-2">{employee.tasks[language].map((t, i) => <li key={i}>{t}</li>)}</ul>
                        <div className="flex items-center gap-2 font-semibold text-sm pt-2"><SparklesIcon className="w-5 h-5 text-natural-400"/>{t('team.details.achievements')}</div>
                        <ul className="list-disc list-inside space-y-1 ps-2">{employee.achievements[language].map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                )}
            </div>
        </>
    );
    
    const renderEditMode = () => (
        <div className="p-6 space-y-4">
            <div className="flex justify-center">
                <div className="relative group w-28 h-28">
                    {formData.avatar ? (
                        <img src={formData.avatar} alt={formData.name[language]} className="w-28 h-28 rounded-full object-cover border-4 border-natural-200 dark:border-natural-700" />
                    ) : (
                        <div className="w-28 h-28 rounded-full bg-natural-100 dark:bg-natural-700 flex items-center justify-center border-4 border-natural-200 dark:border-natural-700">
                            <UserCircleIcon className="w-24 h-24 text-natural-400 dark:text-natural-500" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="hover:underline">{t('team.details.changePhoto')}</button>
                        {formData.avatar && <button type="button" onClick={handleRemovePhoto} className="hover:underline text-red-400">{t('team.details.removePhoto')}</button>}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold">{t('team.details.nameAr')}</label>
                    <input name="name.ar" value={formData.name.ar} onChange={handleFormChange} className="mt-1 w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm" />
                </div>
                 <div>
                    <label className="text-xs font-semibold">{t('team.details.nameEn')}</label>
                    <input name="name.en" value={formData.name.en} onChange={handleFormChange} className="mt-1 w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm" />
                </div>
                 <div>
                    <label className="text-xs font-semibold">{t('team.details.titleAr')}</label>
                    <input name="title.ar" value={formData.title.ar} onChange={handleFormChange} className="mt-1 w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm" />
                </div>
                 <div>
                    <label className="text-xs font-semibold">{t('team.details.titleEn')}</label>
                    <input name="title.en" value={formData.title.en} onChange={handleFormChange} className="mt-1 w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm" />
                </div>
                 <div>
                    <label className="text-xs font-semibold">{t('team.details.department')}</label>
                    <select name="department.ar" value={formData.department.ar} onChange={(e) => {
                        const arValue = e.target.value;
                        const enValue = departments.find(d => d.name.ar === arValue)?.name.en || '';
                        setFormData(p => p ? ({ ...p, department: {ar: arValue, en: enValue} }) : null);
                    }} className="mt-1 w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm">
                         <option value="">{t('challenges.selectDepartment')}</option>
                         {departments.map(d => <option key={d.id} value={d.name.ar}>{d.name[language]}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-xs font-semibold">{t('team.details.joinDate')}</label>
                    <input type="date" name="joinDate" value={formData.joinDate} onChange={handleFormChange} className="mt-1 w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm" />
                </div>
            </div>
             <EditableList label={t('team.details.academic')} items={formData.qualifications[language]} onItemsChange={(newItems) => handleListChange('qualifications', language, newItems)} />
            <EditableList label={t('team.details.certs')} items={formData.certifications[language]} onItemsChange={(newItems) => handleListChange('certifications', language, newItems)} />
            <EditableList label={t('team.details.courses')} items={formData.trainingCourses[language]} onItemsChange={(newItems) => handleListChange('trainingCourses', language, newItems)} />
            <EditableList label={t('team.details.tasks')} items={formData.tasks[language]} onItemsChange={(newItems) => handleListChange('tasks', language, newItems)} />
            <EditableList label={t('team.details.achievements')} items={formData.achievements[language]} onItemsChange={(newItems) => handleListChange('achievements', language, newItems)} />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700 flex-shrink-0">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {mode === 'view' ? renderViewMode() : renderEditMode()}
                </div>
                <div className="flex justify-between items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg flex-shrink-0">
                    {mode === 'view' && !isCreateMode ? (
                        <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                            {t('delete')}
                        </button>
                    ) : <div></div>}
                    <div className="flex items-center gap-3">
                         <button onClick={mode === 'view' ? onClose : handleCancelEdit} type="button" className="px-4 py-2 text-sm font-medium text-natural-700 dark:text-natural-200 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md hover:bg-natural-50 dark:hover:bg-natural-600">
                           {mode === 'view' ? t('close') : t('cancel')}
                        </button>
                        <button onClick={mode === 'view' ? () => setMode('edit') : handleSave} type="button" className="px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">
                            {mode === 'view' ? t('edit') : t('team.saveChanges')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;