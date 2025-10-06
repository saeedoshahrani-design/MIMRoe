
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useLocalization } from '../hooks/useLocalization';
import { Page } from '../App';
import { 
    DashboardIcon, ChallengesIcon, DepartmentsIcon, 
    LeadTasksIcon, CalendarDaysIcon, TeamIcon,
    ClipboardDocumentListIcon
} from './icons/IconComponents';

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
        setIsSidebarOpen(false);
    };

    return (
        <li>
            <a
                href="#"
                onClick={handleClick}
                className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ltr:gap-3 rtl:justify-between ${
                    isActive
                        ? 'bg-dark-purple-100 dark:bg-dark-purple-800/50 text-dark-purple-800 dark:text-dark-purple-100 font-bold'
                        : 'text-natural-600 dark:text-natural-300 hover:bg-natural-100 dark:hover:bg-natural-700'
                }`}
            >
                <span className="rtl:order-2">{icon}</span>
                <span className="rtl:order-1">{label}</span>
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
        { page: 'activationTeam', icon: <TeamIcon className="h-6 w-6" />, label: t('nav.activationTeam') },
        { page: 'leadTasks', icon: <LeadTasksIcon className="h-6 w-6" />, label: t('nav.leadTasks') },
        { page: 'businessTimeline', icon: <CalendarDaysIcon className="h-6 w-6" />, label: t('nav.businessTimeline') },
    ];
    
    return (
       <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden={!isSidebarOpen}
            />

            {/* Universal Drawer */}
            <aside 
                className={`fixed top-0 bottom-0 z-40 w-64 h-full bg-white dark:bg-natural-800 flex flex-col transition-transform duration-300 ease-in-out ${
                    isSidebarOpen 
                        ? 'transform-none' 
                        : 'ltr:-translate-x-full rtl:translate-x-full'
                }`}
            >
                <div className="h-16 flex-shrink-0" /> {/* Spacer for header */}
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