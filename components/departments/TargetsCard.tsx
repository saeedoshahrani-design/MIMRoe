import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { DepartmentTarget, TargetStatus } from '../../types';
import Card from '../Card';
import EmptyState from '../EmptyState';
import { BoltIcon, SearchIcon, PlusIcon, PencilIcon, TrashIcon } from '../icons/IconComponents';
import { calculateTargetProgress, getTargetStatus } from '../../utils/departmentUtils';
import TargetFormModal from './TargetFormModal';
import ConfirmationModal from '../ConfirmationModal';

interface TargetsCardProps {
    departmentId: string;
    targets: DepartmentTarget[];
    onAddTarget: (targetData: Omit<DepartmentTarget, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => void;
    onUpdateTarget: (targetId: string, targetData: Partial<Omit<DepartmentTarget, 'id'>>) => void;
    onDeleteTarget: (targetId: string) => void;
    onReorderTargets: (draggedId: string, targetId: string) => void;
    setToast: (toast: any) => void;
}

const getStatusStyles = (status: TargetStatus) => {
    switch (status) {
        case 'onTrack': return { bar: 'bg-green-500', text: 'text-green-800 dark:text-green-200', bg: 'bg-green-100 dark:bg-green-900' };
        case 'atRisk': return { bar: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', bg: 'bg-yellow-100 dark:bg-yellow-900' };
        case 'behind': return { bar: 'bg-red-500', text: 'text-red-800 dark:text-red-200', bg: 'bg-red-100 dark:bg-red-900' };
    }
};

const TargetsCard: React.FC<TargetsCardProps> = ({ departmentId, targets, onAddTarget, onUpdateTarget, onDeleteTarget, onReorderTargets, setToast }) => {
    const { t } = useLocalization();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [targetToDelete, setTargetToDelete] = useState<DepartmentTarget | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<DepartmentTarget>>({});

    const sortedTargets = useMemo(() => {
        return [...targets].sort((a, b) => a.order - b.order);
    }, [targets]);
    
    const filteredTargets = useMemo(() => {
        return sortedTargets.filter(target =>
            target.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sortedTargets, searchTerm]);
    
     const handleEditClick = (target: DepartmentTarget) => {
        setEditingTargetId(target.id);
        setEditFormData({ name: target.name, baseline: target.baseline, current: target.current, target: target.target, dueDate: target.dueDate });
    };

    const handleCancelEdit = () => {
        setEditingTargetId(null);
        setEditFormData({});
    };

    const handleSaveEdit = () => {
        if (!editingTargetId || !editFormData.name) {
            setToast({ message: t('departments.targets.validation.nameRequired'), type: 'info' });
            return;
        }
        onUpdateTarget(editingTargetId, {
            ...editFormData,
            baseline: Number(editFormData.baseline),
            current: Number(editFormData.current),
            target: Number(editFormData.target),
        });
        handleCancelEdit();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };


    return (
        <>
            <TargetFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={(targetData) => {
                    onAddTarget(targetData);
                    setIsAddModalOpen(false);
                }}
                departmentId={departmentId}
            />
            <ConfirmationModal
                isOpen={!!targetToDelete}
                onClose={() => setTargetToDelete(null)}
                onConfirm={() => {
                    if(targetToDelete) onDeleteTarget(targetToDelete.id);
                    setTargetToDelete(null);
                }}
                title={t('delete') + " " + t('departments.targets.targetName')}
                message={t('deleteConfirmation')}
            />
            <Card className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <BoltIcon className="w-6 h-6 text-bright-blue-500" />
                        <h3 className="text-lg font-bold">{t('departments.targets.title')}</h3>
                    </div>
                     <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700">
                        <PlusIcon className="w-4 h-4" />
                        {t('departments.targets.addTarget')}
                    </button>
                </div>
                 {targets.length > 0 ? (
                    <>
                        <div className="relative">
                             <input
                                type="text"
                                placeholder={t('search') + '...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-natural-100 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md py-2 ps-10 pe-4 focus:ring-dark-purple-500 focus:border-dark-purple-500 text-sm"
                            />
                            <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-3 h-5 w-5 text-natural-400" />
                        </div>
                        <div className="space-y-4 overflow-y-auto -mr-2 pr-2 max-h-[500px]">
                            {filteredTargets.map(target => {
                                if (editingTargetId === target.id) {
                                    return (
                                        <div key={target.id} className="p-3 rounded-lg border-2 border-dark-purple-500 bg-natural-50 dark:bg-natural-800 space-y-2">
                                            <input name="name" value={editFormData.name} onChange={handleInputChange} className="w-full text-sm font-semibold bg-white dark:bg-natural-700 p-1 rounded border border-dark-purple-400 break-words" placeholder={t('departments.targets.targetName')} />
                                            <div className="grid grid-cols-3 gap-2">
                                                <input name="baseline" type="number" value={editFormData.baseline} onChange={handleInputChange} className="w-full text-xs bg-white dark:bg-natural-700 p-1 rounded border border-dark-purple-400" placeholder={t('departments.targets.baseline')} />
                                                <input name="current" type="number" value={editFormData.current} onChange={handleInputChange} className="w-full text-xs bg-white dark:bg-natural-700 p-1 rounded border border-dark-purple-400" placeholder={t('departments.targets.current')} />
                                                <input name="target" type="number" value={editFormData.target} onChange={handleInputChange} className="w-full text-xs bg-white dark:bg-natural-700 p-1 rounded border border-dark-purple-400" placeholder={t('departments.targets.target')} />
                                            </div>
                                            <input name="dueDate" type="date" value={editFormData.dueDate || ''} onChange={handleInputChange} className="w-full text-xs bg-white dark:bg-natural-700 p-1 rounded border border-dark-purple-400" />
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveEdit} className="px-2 py-1 text-xs bg-dark-purple-600 text-white rounded">{t('save')}</button>
                                                <button onClick={handleCancelEdit} className="px-2 py-1 text-xs bg-natural-200 dark:bg-natural-600 rounded">{t('cancel')}</button>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                const progress = calculateTargetProgress(target.baseline, target.current, target.target);
                                const status = getTargetStatus(progress);
                                const styles = getStatusStyles(status);

                                return (
                                    <div key={target.id} className="p-3 rounded-lg bg-natural-50 dark:bg-natural-800/50 border border-natural-200 dark:border-natural-700">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-sm break-words">{target.name}</p>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles.bg} ${styles.text}`}>
                                                {t(`departments.targets.statusOptions.${status}`)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-natural-200 dark:bg-natural-700 rounded-full h-2 my-2">
                                            <div className={`h-2 rounded-full ${styles.bar}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-natural-500 dark:text-natural-400">
                                            <span>{t('departments.targets.baseline')}: {target.baseline}</span>
                                            <span className="font-bold">{progress}%</span>
                                            <span>{t('departments.targets.target')}: {target.target}</span>
                                        </div>
                                         <div className="flex items-center gap-1 mt-2">
                                            <button onClick={() => handleEditClick(target)} className="p-1 text-natural-500 hover:text-dark-purple-600 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setTargetToDelete(target)} className="p-1 text-natural-500 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/50">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                 ) : (
                     <div className="text-center py-8">
                         <EmptyState 
                            icon={<BoltIcon className="w-12 h-12 text-natural-300 dark:text-natural-600"/>}
                            message={t('departments.targets.emptyState')}
                        />
                        <button onClick={() => setIsAddModalOpen(true)} className="mt-4 flex items-center gap-1 mx-auto px-3 py-1.5 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700">
                            <PlusIcon className="w-4 h-4" />
                            {t('departments.targets.addFirstTarget')}
                        </button>
                    </div>
                )}
            </Card>
        </>
    );
};

export default TargetsCard;