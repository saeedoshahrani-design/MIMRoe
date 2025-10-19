import React, { useState } from 'react';
import { StrategicInitiative, InitiativeMember, LocalizedString } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useInitiatives } from '../../context/InitiativesContext';
import { PlusIcon, TeamIcon } from '../icons/IconComponents';
import EmptyState from '../EmptyState';
import InitiativeMemberCard from './InitiativeMemberCard';
import AddMemberModal from './AddMemberModal';
import ConfirmationModal from '../ConfirmationModal';
import { autoTranslate } from '../../utils/localizationUtils';

interface InitiativeMembersTabProps {
    initiative: StrategicInitiative;
    setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
}

const InitiativeMembersTab: React.FC<InitiativeMembersTabProps> = ({ initiative, setToast }) => {
    const { t, language } = useLocalization();
    const { updateInitiative } = useInitiatives();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<InitiativeMember | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<InitiativeMember | null>(null);

    const handleSave = (data: { name: string; role: string; tasks: string; }) => {
        const members = initiative.members || [];
        const otherLang = language === 'ar' ? 'en' : 'ar';

        if (memberToEdit) {
            // Update
            const updatedMembers = members.map(m => {
                if (m.id === memberToEdit.id) {
                    const newName: LocalizedString = { ...(m.name || { ar: '', en: '' }) };
                    newName[language] = data.name;
                    newName[otherLang] = m.name?.[otherLang] || autoTranslate(data.name, otherLang);
                    
                    const newRole: LocalizedString = { ...(m.role || { ar: '', en: '' }) };
                    newRole[language] = data.role;
                    newRole[otherLang] = m.role?.[otherLang] || autoTranslate(data.role, otherLang);

                    const newTasks: LocalizedString = { ...(m.tasks || { ar: '', en: '' }) };
                    newTasks[language] = data.tasks;
                    newTasks[otherLang] = m.tasks?.[otherLang] || autoTranslate(data.tasks, otherLang);

                    return { ...m, name: newName, role: newRole, tasks: newTasks };
                }
                return m;
            });
            updateInitiative(initiative.id, { members: updatedMembers });
        } else {
            // Add new
            const newMember: InitiativeMember = {
                id: `member-${Date.now()}`,
                name: {
                    [language]: data.name,
                    [otherLang]: autoTranslate(data.name, otherLang)
                } as LocalizedString,
                role: {
                    [language]: data.role,
                    [otherLang]: autoTranslate(data.role, otherLang)
                } as LocalizedString,
                tasks: {
                    [language]: data.tasks,
                    [otherLang]: autoTranslate(data.tasks, otherLang)
                } as LocalizedString,
            };
            updateInitiative(initiative.id, { members: [...members, newMember] });
        }
        setIsModalOpen(false);
        setMemberToEdit(null);
    };

    const handleDelete = () => {
        if (!memberToDelete) return;
        const updatedMembers = (initiative.members || []).filter(m => m.id !== memberToDelete.id);
        updateInitiative(initiative.id, { members: updatedMembers });
        setMemberToDelete(null);
    };

    return (
        <div className="space-y-6">
            <AddMemberModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setMemberToEdit(null); }}
                onSave={handleSave}
                memberToEdit={memberToEdit}
            />
            <ConfirmationModal
                isOpen={!!memberToDelete}
                onClose={() => setMemberToDelete(null)}
                onConfirm={handleDelete}
                title={t('delete')}
                message={t('deleteConfirmation')}
            />

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('initiatives.details.members.title')}</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700"
                >
                    <PlusIcon className="w-4 h-4" />
                    {t('initiatives.details.members.add')}
                </button>
            </div>
            
            {(initiative.members || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(initiative.members || []).map(member => (
                        <InitiativeMemberCard
                            key={member.id}
                            member={member}
                            onEdit={() => { setMemberToEdit(member); setIsModalOpen(true); }}
                            onDelete={() => setMemberToDelete(member)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<TeamIcon className="w-12 h-12" />}
                    message={t('initiatives.details.members.empty')}
                />
            )}
        </div>
    );
};

export default InitiativeMembersTab;