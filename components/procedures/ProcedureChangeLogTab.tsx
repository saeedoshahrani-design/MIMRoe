import React, { useState } from 'react';
import { Procedure, ChangeLogEntry } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useProcedures } from '../../context/ProceduresContext';
import Card from '../Card';
import EmptyState from '../EmptyState';
import { ListBulletIcon, PlusIcon, PencilIcon, TrashIcon } from '../icons/IconComponents';
import ManualChangeLogModal from './ManualChangeLogModal';
import ConfirmationModal from '../ConfirmationModal';

interface ProcedureChangeLogTabProps {
    procedure: Procedure;
}

const ProcedureChangeLogTab: React.FC<ProcedureChangeLogTabProps> = ({ procedure }) => {
    const { t, formatDate } = useLocalization();
    const { addManualChangeLogEntry, updateManualChangeLogEntry, deleteChangeLogEntry } = useProcedures();
    const changeLog = procedure.changeLog || [];

    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<ChangeLogEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<ChangeLogEntry | null>(null);

    const handleOpenAddModal = () => {
        setEntryToEdit(null);
        setIsManualModalOpen(true);
    };

    const handleOpenEditModal = (entry: ChangeLogEntry) => {
        setEntryToEdit(entry);
        setIsManualModalOpen(true);
    };
    
    const handleSaveEntry = (data: Omit<ChangeLogEntry, 'id' | 'isManual'>) => {
        if (entryToEdit) {
            updateManualChangeLogEntry(procedure.id, entryToEdit.id, data);
        } else {
            addManualChangeLogEntry(procedure.id, data);
        }
        setIsManualModalOpen(false);
        setEntryToEdit(null);
    };

    const handleConfirmDelete = () => {
        if (entryToDelete) {
            deleteChangeLogEntry(procedure.id, entryToDelete.id);
            setEntryToDelete(null);
        }
    };

    return (
        <>
            <ManualChangeLogModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onSave={handleSaveEntry}
                entryToEdit={entryToEdit}
            />
            <ConfirmationModal
                isOpen={!!entryToDelete}
                onClose={() => setEntryToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('procedures.changeLog.deleteEntryTitle')}
                message={t('procedures.changeLog.deleteEntryConfirm')}
            />
            <Card>
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {t('procedures.changeLog.addManualEntry')}
                    </button>
                </div>
                {changeLog.length === 0 ? (
                    <EmptyState icon={<ListBulletIcon className="w-12 h-12" />} message="No changes have been logged for this procedure yet." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left rtl:text-right text-natural-600 dark:text-natural-300">
                            <thead className="text-xs text-natural-700 dark:text-natural-200 uppercase bg-natural-100 dark:bg-natural-800">
                                <tr>
                                    <th className="p-3 w-12">{t('procedures.changeLog.headers.seq')}</th>
                                    <th className="p-3">{t('procedures.changeLog.headers.type')}</th>
                                    <th className="p-3">{t('procedures.changeLog.headers.element')}</th>
                                    <th className="p-3">{t('procedures.changeLog.headers.description')}</th>
                                    <th className="p-3">{t('procedures.changeLog.headers.date')}</th>
                                    <th className="p-3 text-center">{t('procedures.changeLog.headers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {changeLog.map((log, index) => (
                                    <tr key={log.id} className="border-b dark:border-natural-700 hover:bg-natural-50 dark:hover:bg-natural-800/50 group">
                                        <td className="p-3 text-center font-semibold">{changeLog.length - index}</td>
                                        <td className="p-3">{t(`procedures.changeLog.types.${log.type}`)}</td>
                                        <td className="p-3">{t(`procedures.changeLog.elements.${log.element}`)}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="whitespace-pre-wrap break-words">{log.description}</span>
                                                {log.isManual && (
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {t('procedures.changeLog.manualEntry')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEditModal(log)} title={t('edit')} className="p-1 rounded-full text-natural-500 hover:text-dark-purple-600 hover:bg-natural-200 dark:hover:bg-natural-700">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEntryToDelete(log)} title={t('delete')} className="p-1 rounded-full text-natural-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
};

export default ProcedureChangeLogTab;
