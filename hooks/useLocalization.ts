import { useAppContext } from '../context/AppContext';
import { locales } from '../i18n/locales';

export const useLocalization = () => {
    const { t, language } = useAppContext();
    const formatDate = locales[language].formatDate;
    return { t, language, formatDate };
};