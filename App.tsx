import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Challenges from './pages/Challenges';
import Departments from './pages/Departments';
import LeadTasks from './pages/LeadTasks';
import BusinessTimeline from './pages/BusinessTimeline';
import ActivationTeam from './pages/ActivationTeam';
import Procedures from './pages/Procedures';
import { locales } from './i18n/locales';
import { ChallengesProvider } from './context/ChallengesContext';
import { DepartmentsDataProvider } from './context/DepartmentsDataContext';
import { OpportunitiesProvider } from './context/OpportunitiesContext';
import { TimelineTasksProvider } from './context/TimelineTasksContext';
import { LeadTasksProvider } from './context/LeadTasksContext';
import { EmployeeProvider } from './context/EmployeeContext';
import { ProceduresProvider } from './context/ProceduresContext';

export type Page = 'dashboard' | 'challenges' | 'departments' | 'leadTasks' | 'businessTimeline' | 'activationTeam' | 'procedures';

const LANGUAGE_STORAGE_KEY = 'mim_op_excellence_language';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [language, setLanguageState] = useState<'en' | 'ar'>(() => {
        try {
            const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
            return (savedLanguage === 'en' || savedLanguage === 'ar') ? savedLanguage : 'ar';
        } catch (error) {
            console.error("Could not read language from local storage", error);
            return 'ar';
        }
    });
    const [activePage, setActivePage] = useState<Page>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const setLanguage = (lang: 'en' | 'ar') => {
        try {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch (error) {
            console.error("Could not save language to local storage", error);
        }
        setLanguageState(lang);
    };

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        root.lang = language;
        root.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.body.style.fontFamily = language === 'ar' ? '"Almarai", sans-serif' : '"Inter", sans-serif';
    }, [theme, language]);

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isSidebarOpen]);

    const t = useMemo(() => {
        return (key: string, replacements?: Record<string, string | number>) => {
            const keys = key.split('.');
            let result: any = locales[language];
            for (const k of keys) {
                result = result?.[k];
                if (result === undefined) {
                    return key;
                }
            }

            if (typeof result === 'string' && replacements) {
                let replacedResult = result;
                for (const placeholder in replacements) {
                    replacedResult = replacedResult.replace(`{${placeholder}}`, String(replacements[placeholder]));
                }
                return replacedResult;
            }
            
            return result;
        };
    }, [language]);

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard />;
            case 'challenges': return <Challenges />;
            case 'departments': return <Departments />;
            case 'leadTasks': return <LeadTasks />;
            case 'businessTimeline': return <BusinessTimeline />;
            case 'activationTeam': return <ActivationTeam />;
            case 'procedures': return <Procedures />;
            default: return <Dashboard />;
        }
    };
    
    return (
        <AppProvider value={{ theme, setTheme, language, setLanguage, t, activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }}>
            <ProceduresProvider>
                <EmployeeProvider>
                    <LeadTasksProvider>
                        <ChallengesProvider>
                            <OpportunitiesProvider>
                                <DepartmentsDataProvider>
                                    <TimelineTasksProvider>
                                        <div className="bg-natural-100 dark:bg-natural-900 text-natural-800 dark:text-natural-200 min-h-screen">
                                            <Header />
                                            <Sidebar />
                                            <main className="p-6 lg:p-8">
                                                {renderPage()}
                                            </main>
                                        </div>
                                    </TimelineTasksProvider>
                                </DepartmentsDataProvider>
                            </OpportunitiesProvider>
                        </ChallengesProvider>
                    </LeadTasksProvider>
                </EmployeeProvider>
            </ProceduresProvider>
        </AppProvider>
    );
};

export default App;