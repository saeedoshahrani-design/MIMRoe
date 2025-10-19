import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useLocalization } from '../hooks/useLocalization';

const PageTitle: React.FC = () => {
    const { activePage } = useAppContext();
    const { t } = useLocalization();

    const pageTitle = t(`nav.${activePage}`);

    return (
        <div className="text-left rtl:text-right">
            <h1 className="text-2xl font-bold text-white bg-dark-purple-700 px-5 py-2 rounded-md inline-block shadow-md">
                {pageTitle}
            </h1>
        </div>
    );
};

export default PageTitle;