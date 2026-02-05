import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export function useLanguage() {
    return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
    // Default to English, typically you'd also check localStorage here
    const [language, setLanguage] = useState(localStorage.getItem('appLanguage') || 'en');

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ta' : 'en');
    };

    // Helper function to get translation
    const t = (key) => {
        return translations[language][key] || key;
    };

    const value = {
        language,
        toggleLanguage,
        setLanguage,
        t
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
