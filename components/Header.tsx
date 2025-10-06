
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import { SunIcon, MoonIcon, LanguageIcon, MenuIcon, CloseIcon } from './icons/IconComponents';

const Header: React.FC = () => {
    const { theme, setTheme, language, setLanguage, isSidebarOpen, setIsSidebarOpen } = useAppContext();
    const { t } = useLocalization();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    const logoSources = {
        ar: {
            light: 'https://www.mim.gov.sa/_next/image?url=https%3A%2F%2Fmim-cms-directus.mim.gov.sa%2Fassets%2F%2F2f536dde-4d35-455a-8544-b6391ce1e6ce.avif&w=1080&q=90',
            dark: 'https://www.mim.gov.sa/_next/image?url=https%3A%2F%2Fmim-cms-directus.mim.gov.sa%2Fassets%2F%2F747ac770-34f5-4acb-9041-2b6333276a70.avif&w=1080&q=90',
        },
        en: {
            light: 'https://www.mim.gov.sa/_next/image?url=https%3A%2F%2Fmim-cms-directus.mim.gov.sa%2Fassets%2F%2F51850a2b-a6b6-4d37-8f5b-24c7b11589d8.avif&w=1080&q=90',
            dark: 'https://www.mim.gov.sa/_next/image?url=https%3A%2F%2Fmim-cms-directus.mim.gov.sa%2Fassets%2F%2F2833f165-b07a-4401-99f5-de8b6b16bdc0.avif&w=1080&q=90',
        },
    };

    const logoSrc = logoSources[language][theme];
    const logoAlt = language === 'ar' ? 'شعار وزارة الصناعة والثروة المعدنية' : 'Ministry of Industry and Mineral Resources logo';


    return (
        <header className="sticky top-0 z-30 w-full bg-white dark:bg-natural-800 border-b border-natural-200 dark:border-natural-700 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                 <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-md text-natural-500 hover:bg-natural-100 dark:hover:bg-natural-700"
                        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {isSidebarOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                    <img src={logoSrc} alt={logoAlt} className="h-8 md:h-10 lg:h-12 w-auto" />
                 </div>

                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <button
                        onClick={toggleLanguage}
                        className="p-2 rounded-full text-natural-500 hover:bg-natural-100 dark:hover:bg-natural-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple-500"
                        aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                    >
                        <LanguageIcon className="h-6 w-6" />
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-natural-500 hover:bg-natural-100 dark:hover:bg-natural-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple-500"
                        aria-label={theme === 'light' ? t('darkMode') : t('lightMode')}
                    >
                        {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
