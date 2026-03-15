import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../i18n/translations';
import './LanguageSelectorModal.css';

export default function LanguageSelectorModal() {
  const { languageNotChosen, setLanguage, t } = useLanguage();

  if (!languageNotChosen) return null;

  return (
    <div className="lang-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="lang-modal-title">
      <div className="lang-modal">
        <h2 id="lang-modal-title" className="lang-modal-title">
          {t('chooseLanguage')}
        </h2>
        <p className="lang-modal-subtitle">{t('selectLanguage')}</p>
        <div className="lang-options">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className="lang-option-btn"
              onClick={() => setLanguage(lang.code)}
              aria-label={`Select ${lang.name}`}
            >
              <span className="lang-option-native">{lang.native}</span>
              <span className="lang-option-name">{lang.name}</span>
            </button>
          ))}
        </div>
        <p className="lang-modal-note">{t('langChangeLater')}</p>
      </div>
    </div>
  );
}
