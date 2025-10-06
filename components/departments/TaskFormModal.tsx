import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { DepartmentTask } from '../../types';
import { CloseIcon } from '../icons/IconComponents';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: Pick<DepartmentTask, 'description'>) => void;
    taskToEdit: DepartmentTask | null;
}

const MIN_LENGTH = 5;
const MAX_LENGTH = 300;

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, taskToEdit }) => {
    const { t } = useLocalization();
    const isEditMode = !!taskToEdit;
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
        }
    };

    useEffect(() => {
        if (isOpen) {
            const initialDescription = isEditMode ? taskToEdit.description : '';
            setDescription(initialDescription);
            setError(null);
            setIsLoading(false);
            
            // Autofocus and adjust height
            setTimeout(() => {
                textareaRef.current?.focus();
                adjustTextareaHeight();
            }, 100);
        }
    }, [isOpen, taskToEdit, isEditMode]);

    const validate = (): boolean => {
        const trimmedDescription = description.trim();
        if (trimmedDescription.length < MIN_LENGTH || trimmedDescription.length > MAX_LENGTH) {
            setError(t('departments.tasks.validation.descriptionLength'));
            return false;
        }
        setError(null);
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setIsLoading(true);
            // Simulate async save
            setTimeout(() => {
                onSave({ description: description.trim() });
            }, 500);
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
        if (error) {
           validate(); // Re-validate on change to clear error message
        }
        adjustTextareaHeight();
    };

    if (!isOpen) return null;
    
    const modalTitle = isEditMode ? t('departments.tasks.editModalTitle') : t('departments.tasks.addModalTitle');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-natural-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-natural-200 dark:border-natural-700">
                    <h2 className="text-lg font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-2">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium sr-only">{t('departments.tasks.taskDescription')}</label>
                        <textarea
                            ref={textareaRef}
                            name="description"
                            id="description"
                            value={description}
                            onChange={handleDescriptionChange}
                            placeholder={t('departments.tasks.descriptionPlaceholder')}
                            rows={3}
                            className="mt-1 w-full bg-natural-50 dark:bg-natural-700 border-natural-300 dark:border-natural-600 rounded-md shadow-sm focus:ring-dark-purple-500 focus:border-dark-purple-500 resize-none overflow-hidden break-words"
                            aria-required="true"
                            aria-invalid={!!error}
                            aria-describedby="description-error description-counter"
                        />
                        <div className="flex justify-between items-center mt-1">
                            {error && <p id="description-error" className="text-red-500 text-xs">{error}</p>}
                            <p id="description-counter" className={`text-xs ml-auto ${description.length > MAX_LENGTH ? 'text-red-500' : 'text-natural-500'}`}>
                                {description.length}/{MAX_LENGTH}
                            </p>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end items-center p-4 border-t border-natural-200 dark:border-natural-700 bg-natural-50 dark:bg-natural-800/50 rounded-b-lg mt-auto">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 text-natural-700 dark:text-natural-200 hover:bg-natural-50 dark:hover:bg-natural-600">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSubmit} type="submit" disabled={isLoading} className="ms-3 px-4 py-2 text-sm font-medium text-white bg-dark-purple-600 rounded-md hover:bg-dark-purple-700 disabled:bg-natural-400 disabled:cursor-not-allowed flex items-center justify-center w-[70px]">
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            t('save')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskFormModal;