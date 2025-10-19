import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext.tsx';
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Challenges from './pages/Challenges.tsx';
import Departments from './pages/Departments.tsx';
import LeadTasks from './pages/LeadTasks.tsx';
import BusinessTimeline from './pages/BusinessTimeline.tsx';
import ActivationTeam from './pages/ActivationTeam.tsx';
import Procedures from './pages/Procedures.tsx';
import InitiativesPage from './pages/InitiativesPage.tsx';
import Reports from './pages/Reports.tsx';
import { locales } from './i18n/locales.ts';
import { ChallengesProvider } from './context/ChallengesContext.tsx';
import { DepartmentsDataProvider } from './context/DepartmentsDataContext.tsx';
import { OpportunitiesProvider } from './context/OpportunitiesContext.tsx';
import { TimelineTasksProvider } from './context/TimelineTasksContext.tsx';
import { LeadTasksProvider } from './context/LeadTasksContext.tsx';
import { EmployeeProvider } from './context/EmployeeContext.tsx';
import { ProceduresProvider, useProcedures } from './context/ProceduresContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import { InitiativesProvider } from './context/InitiativesContext.tsx';

export type Page = 'dashboard' | 'challenges' | 'departments' | 'leadTasks' | 'businessTimeline' | 'activationTeam' | 'procedures' | 'initiatives' | 'reports';

const LANGUAGE_STORAGE_KEY = 'mim_op_excellence_language';

const PageLayout: React.FC = () => {
    const { activePage, isSidebarOpen, t } = useAppContext();
    const { isUpdating } = useProcedures();

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard />;
            case 'challenges': return <Challenges />;
            case 'departments': return <Departments />;
            case 'leadTasks': return <LeadTasks />;
            case 'businessTimeline': return <BusinessTimeline />;
            case 'activationTeam': return <ActivationTeam />;
            case 'procedures': return <Procedures />;
            case 'initiatives': return <InitiativesPage />;
            case 'reports': return <Reports />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="bg-natural-100 dark:bg-natural-900 text-natural-800 dark:text-natural-200 min-h-screen">
            <Header />
            <Sidebar />
            <main className={`${isSidebarOpen ? 'lg:ms-[256px]' : ''} p-6 lg:p-8 transition-all duration-300`}>
                {renderPage()}
            </main>
            {isUpdating && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex flex-col items-center justify-center animate-fade-in" aria-live="assertive" role="alert">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-white"></div>
                    <p className="mt-4 text-white font-semibold text-lg">{t('procedures.documentingChange')}</p>
                </div>
            )}
        </div>
    );
}

const AppContent: React.FC = () => {
    return (
        <InitiativesProvider>
            <ProceduresProvider>
                <EmployeeProvider>
                    <LeadTasksProvider>
                        <ChallengesProvider>
                            <OpportunitiesProvider>
                                <DepartmentsDataProvider>
                                    <TimelineTasksProvider>
                                        <PageLayout />
                                    </TimelineTasksProvider>
                                </DepartmentsDataProvider>
                            </OpportunitiesProvider>
                        </ChallengesProvider>
                    </LeadTasksProvider>
                </EmployeeProvider>
            </ProceduresProvider>
        </InitiativesProvider>
    );
};

const AppWithProviders: React.FC = () => {
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    
    const { user, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(false);
    const [isInitialAuthChecked, setIsInitialAuthChecked] = useState(false);

    useEffect(() => {
        // This effect manages the splash screen visibility.
        if (!loading) {
            // Mark that the initial authentication check is complete.
            setIsInitialAuthChecked(true);
            
            // If a user is logged in (either on initial load or after a new login),
            // trigger the splash screen.
            if (user) {
                setShowSplash(true);
                const timer = setTimeout(() => {
                    setShowSplash(false);
                }, 2000); // Show splash for 2 seconds
                
                // Cleanup the timer if the component unmounts or dependencies change.
                return () => clearTimeout(timer);
            }
        }
    }, [loading, user]); // Re-run whenever auth state changes.


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
        if (isSidebarOpen && window.innerWidth < 1024) {
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
    
    const appContextValue = { theme, setTheme, language, setLanguage, t, activePage, setActivePage, isSidebarOpen, setIsSidebarOpen };
    
    // While the initial authentication check is running, show a loader.
    if (!isInitialAuthChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-dark-purple-500"></div>
            </div>
        );
    }
    
    // After auth check, if we need to show the splash screen (because a user is present).
    if (user && showSplash) {
        return <SplashScreen />;
    }
    
    return (
        <AppProvider value={appContextValue}>
            {user ? <AppContent /> : <LoginPage />}
        </AppProvider>
    );
};


const App: React.FC = () => (
    <AuthProvider>
        <AppWithProviders />
    </AuthProvider>
);

export default App;