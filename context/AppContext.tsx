import React, { createContext, useContext } from 'react';
import { Page } from '../App.tsx';

interface AppContextType {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    language: 'en' | 'ar';
    setLanguage: (language: 'en' | 'ar') => void;
    t: (key: string, replacements?: Record<string, string | number>) => any;
    activePage: Page;
    setActivePage: (page: Page) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = AppContext.Provider;

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};