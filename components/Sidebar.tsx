import React from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useLocalization } from '../hooks/useLocalization.ts';
import { Page } from '../App.tsx';
import { 
    DashboardIcon, ChallengesIcon, DepartmentsIcon, 
    LeadTasksIcon, CalendarDaysIcon, UserGroupIcon,
    ClipboardDocumentListIcon, SparklesIcon, ChartBarIcon
} from './icons/IconComponents.tsx';

interface NavItemProps {
    page: Page;
    icon: React.ReactNode;
    label: string;
}

const NavItem: React.FC<NavItemProps> = ({ page, icon, label }) => {
    const { activePage, setActivePage, setIsSidebarOpen } = useAppContext();
    const isActive = activePage === page;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setActivePage(page);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <li>
            <a
                href="#"
                onClick={handleClick}
                className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ltr:gap-3 rtl:gap-3 rtl:justify-start ${
                    isActive
                        ? 'bg-dark-purple-100 dark:bg-dark-purple-800/50 text-dark-purple-800 dark:text-dark-purple-100 font-bold'
                        : 'text-natural-600 dark:text-natural-300 hover:bg-natural-100 dark:hover:bg-natural-700'
                }`}
            >
                <span>{icon}</span>
                <span>{label}</span>
            </a>
        </li>
    );
};


const Sidebar: React.FC = () => {
    const { t } = useLocalization();
    const { isSidebarOpen, setIsSidebarOpen } = useAppContext();

    const navItems: NavItemProps[] = [
        { page: 'dashboard', icon: <DashboardIcon className="h-6 w-6" />, label: t('nav.dashboard') },
        { page: 'challenges', icon: <ChallengesIcon className="h-6 w-6" />, label: t('nav.challenges') },
        { page: 'departments', icon: <DepartmentsIcon className="h-6 w-6" />, label: t('nav.departments') },
        { page: 'procedures', icon: <ClipboardDocumentListIcon className="h-6 w-6" />, label: t('nav.procedures') },
        { page: 'initiatives', icon: <SparklesIcon className="h-6 w-6" />, label: t('nav.initiatives') },
        { page: 'activationTeam', icon: <UserGroupIcon className="h-6 w-6" />, label: t('nav.activationTeam') },
        { page: 'leadTasks', icon: <LeadTasksIcon className="h-6 w-6" />, label: t('nav.leadTasks') },
        { page: 'businessTimeline', icon: <CalendarDaysIcon className="h-6 w-6" />, label: t('nav.businessTimeline') },
        { page: 'reports', icon: <ChartBarIcon className="h-6 w-6" />, label: t('nav.reports') },
    ];
    
    return (
       <>
            {/* Backdrop for mobile */}
            <div 
                className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden={!isSidebarOpen}
            />

            {/* Sidebar */}
            <aside 
                className={`fixed top-16 bottom-0 z-40 w-64 bg-white dark:bg-natural-800 flex flex-col transition-transform duration-300 ease-in-out ltr:left-0 rtl:right-0 ltr:border-r rtl:border-l border-natural-200 dark:border-natural-700
                ${ isSidebarOpen ? 'transform-none' : 'ltr:-translate-x-full rtl:translate-x-full' }`}
            >
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul>
                        {navItems.map(item => <NavItem key={item.page} {...item} />)}
                    </ul>
                </nav>
            </aside>
       </>
    );
};

export default Sidebar;