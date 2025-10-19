import React from 'react';
import { InitiativeMember } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import Card from '../Card';
import { UserCircleIcon, PencilIcon, TrashIcon } from '../icons/IconComponents';

interface InitiativeMemberCardProps {
    member: InitiativeMember;
    onEdit: () => void;
    onDelete: () => void;
}

const InitiativeMemberCard: React.FC<InitiativeMemberCardProps> = ({ member, onEdit, onDelete }) => {
    const { t, language } = useLocalization();

    return (
        <Card className="flex flex-col group relative">
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-1.5 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700" title={t('edit')}><PencilIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title={t('delete')}><TrashIcon className="w-4 h-4 text-red-500" /></button>
            </div>
            <div className="flex items-center gap-4">
                <UserCircleIcon className="w-12 h-12 text-natural-300 dark:text-natural-600 flex-shrink-0" />
                <div className="min-w-0">
                    <h4 className="font-bold text-natural-800 dark:text-natural-100 break-words">{member.name?.[language] || ''}</h4>
                    <p className="text-sm text-natural-500 dark:text-natural-400 break-words">{member.role?.[language] || ''}</p>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t dark:border-natural-700">
                <p className="text-xs font-semibold text-natural-500 dark:text-natural-400 mb-1">{t('initiatives.details.members.tasks')}</p>
                <p className="text-sm whitespace-pre-wrap break-words">{member.tasks?.[language] || ''}</p>
            </div>
        </Card>
    );
};

export default InitiativeMemberCard;