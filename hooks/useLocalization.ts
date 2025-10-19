import { useAppContext } from '../context/AppContext.tsx';
import { locales } from '../i18n/locales.ts';

export const useLocalization = () => {
    const { t, language } = useAppContext();
    const formatDate = locales[language].formatDate;
    return { t, language, formatDate };
};