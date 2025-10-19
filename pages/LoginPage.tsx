import React, { useState } from 'react';
import { 
    auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from '../firebase.ts';
import { getAdditionalUserInfo } from "firebase/auth";
import { useLocalization } from '../hooks/useLocalization.ts';
import { seedUserData } from '../utils/seedUserData.ts';
import { db } from '../firebase.ts';
import { doc, getDoc } from 'firebase/firestore';
import { EyeIcon, EyeSlashIcon } from '../components/icons/IconComponents.tsx';


const LoginPage: React.FC = () => {
    const { t } = useLocalization();
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLoginView) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Whitelist check
                const whitelistRef = doc(db, 'whitelist', email.toLowerCase());
                const whitelistSnap = await getDoc(whitelistRef);

                if (!whitelistSnap.exists()) {
                    setError(t('login.errors.unauthorized'));
                    setLoading(false);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                if (userCredential) {
                    const { isNewUser } = getAdditionalUserInfo(userCredential);
                    if (isNewUser) {
                       await seedUserData();
                    }
                }
            }
        } catch (err: any) {
            const errorCode = err.code || 'default';
            const translationKey = `login.errors.${errorCode}`;
            let errorMessage = t(translationKey);

            // Fallback to default message if a specific translation doesn't exist
            if (errorMessage === translationKey) {
                errorMessage = t('login.errors.default');
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="min-h-screen bg-natural-50 dark:bg-natural-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-dark-purple-800 dark:text-dark-purple-200">
                        {t('login.title')}
                    </h1>
                    <p className="mt-2 text-natural-500 dark:text-natural-400">
                        {isLoginView ? t('login.subtitleLogin') : t('login.subtitleSignup')}
                    </p>
                </div>

                <div className="bg-white dark:bg-natural-800 p-8 rounded-lg shadow-md border dark:border-natural-700">
                    <form onSubmit={handleAuthAction} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-natural-700 dark:text-natural-300">
                                {t('login.emailLabel')}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md shadow-sm placeholder-natural-400 focus:outline-none focus:ring-dark-purple-500 focus:border-dark-purple-500 text-natural-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-natural-700 dark:text-natural-300">
                                {t('login.passwordLabel')}
                            </label>
                             <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-3 py-2 bg-white dark:bg-natural-700 border border-natural-300 dark:border-natural-600 rounded-md shadow-sm placeholder-natural-400 focus:outline-none focus:ring-dark-purple-500 focus:border-dark-purple-500 text-natural-900 dark:text-white"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setIsPasswordVisible(prev => !prev)}
                                    className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-3 rtl:pl-3 rtl:pr-0 flex items-center text-natural-500"
                                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {isPasswordVisible ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dark-purple-600 hover:bg-dark-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple-500 disabled:bg-natural-400"
                            >
                                {loading ? '...' : (isLoginView ? t('login.signInButton') : t('login.signUpButton'))}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-natural-500 dark:text-natural-400">
                    {isLoginView ? t('login.switchPromptLogin') : t('login.switchPromptSignup')}
                    <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-medium text-dark-purple-600 hover:text-dark-purple-500 dark:text-dark-purple-400 dark:hover:text-dark-purple-300 ml-1 rtl:ml-0 rtl:mr-1">
                        {isLoginView ? t('login.switchActionLogin') : t('login.switchActionSignup')}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;