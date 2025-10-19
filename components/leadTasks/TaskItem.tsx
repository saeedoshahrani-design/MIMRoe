import React, { useState, useRef, useEffect } from 'react';
import { LeadTask, LeadTaskCategory } from '../../types';
import { useLeadTasks } from '../../context/LeadTasksContext';
import { TrashIcon } from '../icons/IconComponents';
import { useAppContext } from '../../context/AppContext';

interface TaskItemProps {
    task: LeadTask;
    category: LeadTaskCategory;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, category }) => {
    const { updateTask, deleteTask } = useLeadTasks();
    const { language } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text[language]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing) {
            setEditText(task.text[language]);
        }
    }, [language, task.text, isEditing]);

    const handleSave = () => {
        if (editText.trim() && editText.trim() !== task.text[language]) {
            updateTask(category, task.id, editText.trim(), language);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditText(task.text[language]);
            setIsEditing(false);
        }
    };

    return (
        <li className="group text-sm text-natural-600 dark:text-natural-300 flex items-start justify-between gap-2">
            <div className="flex items-start flex-grow min-w-0">
                <span className="mr-2 rtl:mr-0 rtl:ml-2 mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mim-bright-blue"></span>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-natural-100 dark:bg-natural-700 rounded-md px-1 -my-0.5"
                    />
                ) : (
                    <span onClick={() => setIsEditing(true)} className="flex-grow cursor-pointer break-words">
                        {task.text[language]}
                    </span>
                )}
            </div>
            <button onClick={() => deleteTask(category, task.id)} className="p-1 text-natural-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <TrashIcon className="w-4 h-4" />
            </button>
        </li>
    );
};

export default TaskItem;