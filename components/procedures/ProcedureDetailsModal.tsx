import React from 'react';
import { Procedure } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import {
    CloseIcon, InformationCircleIcon,
    ClockIcon, DocumentTextIcon, ComputerDesktopIcon, ArrowLeftCircleIcon, ArrowRightCircleIcon, BookOpenIcon,
    DocumentArrowDownIcon, ChartBarIcon,
} from '../icons/IconComponents';
import { departments } from '../../data/mockData';

interface ProcedureDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    procedure: Procedure | null;
    onEdit: (procedure: Procedure) => void;
    onDelete: (procedure: Procedure) => void;
}

const DetailSection: React.FC<{ icon: React.ReactNode, title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className }) => (
    <div className={`p-4 bg-natural-50 dark:bg-natural-800/50 rounded-lg ${className}`}>
        <h3 className="flex items-center gap-2 text-md font-bold text-dark-purple-700 dark:text-dark-purple-300 mb-3">
            {icon}
            {title}
        </h3>
        <div className="text-natural-700 dark:text-natural-200 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
    <div className="min-w-0">
        <p className="text-xs font-semibold text-natural-500 dark:text-natural-400">{label}</p>
        <div className="font-medium break-words">{value || '-'}</div>
    </div>
);

const ProcedureDetailsModal: React.FC<ProcedureDetailsModalProps> = ({ isOpen, onClose, procedure, onEdit, onDelete }) => {
    const { t, language } = useLocalization();

    if (!isOpen || !procedure) return null;

    const departmentName = departments.find(d => d.id === procedure.departmentId)?.name[language] || procedure.departmentId;

    const eReadinessInfo = {
        'electronic': {
            text: t('procedures.electronic'),
            icon: <ComputerDesktopIcon className="w-5 h-5" />,
            className: 'text-green-700 dark:text-green-300',
        },
        'partially-electronic': {
            text: t('procedures.partiallyElectronic'),
            icon: <ComputerDesktopIcon className="w-5 h-5" />,
            className: 'text-yellow-700 dark:text-yellow-300',
        },
        'not-electronic': {
            text: t('procedures.notElectronic'),
            icon: <DocumentTextIcon className="w-5 h-5" />,
            className: 'text-red-700 dark:text-red-400',
        }
    }[procedure.eReadiness];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{t('procedures.detailsTitle')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="pb-4 border-b border-natural-200 dark:border-natural-700">
                        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-dark-purple-100 text-dark-purple-800 dark:bg-dark-purple-800 dark:text-dark-purple-100 mb-2">
                            {procedure.code}
                        </span>
                        <h1 className="text-2xl font-bold text-natural-800 dark:text-natural-100 break-words">{procedure.title[language]}</h1>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem label={t('procedures.owningDepartment')} value={departmentName} />
                        <DetailItem label={t('procedures.relatedService')} value={procedure.linkedService?.[language]} />
                        <DetailItem label={t('procedures.duration')} value={procedure.durationDays ? `${procedure.durationDays} ${t('departments.targets.unitOptions.days')}` : '-'} />
                        <DetailItem label={t('procedures.eReadiness')} value={
                             eReadinessInfo && (
                                <div className={`flex items-center gap-1.5 ${eReadinessInfo.className}`}>
                                    {eReadinessInfo.icon}
                                    <span className="font-semibold">{eReadinessInfo.text}</span>
                                </div>
                            )
                        } />
                    </div>
                    
                    <DetailSection icon={<InformationCircleIcon className="w-6 h-6" />} title={t('procedures.description')}>
                        <p className="whitespace-pre-wrap break-words">{procedure.description[language]}</p>
                    </DetailSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailSection icon={<ArrowLeftCircleIcon className="w-6 h-6" />} title={t('procedures.inputs')}>
                            <p className="whitespace-pre-wrap break-words">{procedure.inputs?.[language] || '-'}</p>
                        </DetailSection>
                         <DetailSection icon={<ArrowRightCircleIcon className="w-6 h-6" />} title={t('procedures.outputs')}>
                            <p className="whitespace-pre-wrap break-words">{procedure.outputs?.[language] || '-'}</p>
                        </DetailSection>
                    </div>

                    {procedure.policiesAndReferences?.[language] && (
                        <DetailSection icon={<BookOpenIcon className="w-6 h-6" />} title={t('procedures.policiesAndReferences')}>
                            <p className="whitespace-pre-wrap break-words">{procedure.policiesAndReferences[language]}</p>
                        </DetailSection>
                    )}

                    {procedure.technicalSystems?.[language] && (
                        <DetailSection icon={<ComputerDesktopIcon className="w-6 h-6" />} title={t('procedures.technicalSystems')}>
                            <p className="whitespace-pre-wrap break-words">{procedure.technicalSystems[language]}</p>
                        </DetailSection>
                    )}
                    
                    {procedure.formsUsed && procedure.formsUsed.length > 0 && (
                        <DetailSection icon={<DocumentTextIcon className="w-6 h-6" />} title={t('procedures.formsUsed')}>
                           <div className="space-y-2">
                               {procedure.formsUsed.map((form, index) => (
                                   <a key={index} href={`data:${form.file.type};base64,${form.file.content}`} download={form.file.name} className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-natural-700 border dark:border-natural-600 hover:bg-natural-100 dark:hover:bg-natural-600 transition-colors">
                                       <span>{form.name[language]}</span>
                                       <DocumentArrowDownIcon className="w-5 h-5 text-dark-purple-500" />
                                   </a>
                               ))}
                           </div>
                        </DetailSection>
                    )}
                    
                    {procedure.definitions && procedure.definitions.length > 0 && (
                        <DetailSection icon={<InformationCircleIcon className="w-6 h-6" />} title={t('procedures.definitions')}>
                           <dl className="space-y-3">
                               {procedure.definitions.map((def, index) => (
                                   <div key={index}>
                                       <dt className="font-bold whitespace-pre-wrap break-words">{def.term[language]}</dt>
                                       <dd className="ps-4 text-natural-600 dark:text-natural-300 whitespace-pre-wrap break-words">{def.definition[language]}</dd>
                                   </div>
                               ))}
                           </dl>
                        </DetailSection>
                    )}
                    
                    {procedure.kpi && (procedure.kpi.name[language] || procedure.kpi.target[language] || procedure.kpi.description[language]) && (
                         <DetailSection icon={<ChartBarIcon className="w-6 h-6" />} title={t('procedures.kpi')}>
                            <div className="space-y-3">
                               <DetailItem label={t('procedures.kpiName')} value={procedure.kpi.name[language]} />
                               <DetailItem label={t('procedures.kpiTarget')} value={procedure.kpi.target[language]} />
                               <DetailItem label={t('procedures.kpiDescription')} value={<p className="whitespace-pre-wrap">{procedure.kpi.description[language]}</p>} />
                            </div>
                         </DetailSection>
                    )}

                </div>
                <div className="flex justify-between items-center p-4 mt-auto border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg">
                    <button onClick={() => onDelete(procedure)} type="button" className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:text-red-300 dark:bg-red-900/50 dark:hover:bg-red-900">
                        {t('delete')}
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-natural-700 dark:text-natural-200 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md hover:bg-natural-50 dark:hover:bg-natural-600">
                            {t('close')}
                        </button>
                        <button onClick={() => onEdit(procedure)} type="button" className="px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700">
                            {t('edit')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcedureDetailsModal;