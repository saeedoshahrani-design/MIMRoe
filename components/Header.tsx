

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLocalization } from '../hooks/useLocalization.ts';
import { SparklesIcon, Bars3Icon, SunIcon, MoonIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, CloseIcon } from './icons/IconComponents.tsx';

const Header: React.FC = () => {
    const { theme, setTheme, language, setLanguage, isSidebarOpen, setIsSidebarOpen } = useAppContext();
    const { user, logout } = useAuth();
    const { t } = useLocalization();

    return (
        <>
            <header className="sticky top-0 z-30 h-16 bg-white dark:bg-natural-800 border-b border-natural-200 dark:border-natural-700 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"
                        aria-label="Toggle sidebar"
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-8 w-8 text-dark-purple-500" />
                        <span className="hidden sm:block font-bold text-lg text-natural-800 dark:text-natural-100">
                            {t('login.title')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="p-2 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700"
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                    </button>

                    <button
                        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                        className="p-2 rounded-full hover:bg-natural-100 dark:hover:bg-natural-700 font-bold text-sm"
                        aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
                    >
                        {language === 'en' ? 'AR' : 'EN'}
                    </button>

                    {user && (
                        <div className="relative group">
                            <button className="flex items-center gap-2">
                            <UserCircleIcon className="h-8 w-8 text-natural-500" />
                            <span className="hidden md:block text-sm font-medium">{user.email}</span>
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-natural-700 rounded-md shadow-lg border dark:border-natural-600 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                            <button onClick={logout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-natural-100 dark:hover:bg-natural-600">
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};

export default Header;