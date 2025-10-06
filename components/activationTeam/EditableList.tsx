import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { PlusIcon, TrashIcon } from '../icons/IconComponents';

interface EditableListProps {
    label: string;
    items: string[];
    onItemsChange: (newItems: string[]) => void;
}

const EditableList: React.FC<EditableListProps> = ({ label, items, onItemsChange }) => {
    const { t } = useLocalization();
    const [newItem, setNewItem] = useState('');

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        onItemsChange(newItems);
    };

    const handleAddItem = () => {
        if (newItem.trim()) {
            onItemsChange([...items, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onItemsChange(newItems);
    };

    return (
        <div>
            <label className="text-sm font-semibold text-natural-600 dark:text-natural-300">{label}</label>
            <div className="space-y-2 mt-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => handleItemChange(index, e.target.value)}
                            className="flex-grow w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                            aria-label={`${t('delete')} ${item}`}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                        placeholder={`${t('addItem')}...`}
                        className="flex-grow w-full bg-natural-100 dark:bg-natural-700 rounded-md p-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="p-2 bg-dark-purple-100 text-dark-purple-700 dark:bg-dark-purple-800 dark:text-dark-purple-200 hover:bg-dark-purple-200 rounded-full"
                        aria-label={t('addItem')}
                        disabled={!newItem.trim()}
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditableList;