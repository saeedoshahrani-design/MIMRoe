

import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { getPriorityBadgeStyle } from '../utils/priority';
import { Challenge } from '../types';
import { locales } from '../i18n/locales';

interface PriorityBadgeProps {
    priorityCategory: Challenge['priority_category'];
    className?: string;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priorityCategory, className = '' }) => {
    const { t } = useLocalization();

    return (
        <span
            className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${getPriorityBadgeStyle(priorityCategory)} ${className}`}
            title={t('challenges.priorityBadgeTooltip')}
        >
            {/* FIX: Explicitly cast to string to prevent implicit symbol conversion error. */}
            {t(`challenges.priorityCategories.${String(priorityCategory)}`)}
        </span>
    );
};

export default PriorityBadge;