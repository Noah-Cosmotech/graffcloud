'use client'

import { useI18n } from './I18nProvider'

export function LangToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        data-lang="en"
        onClick={() => setLang('en')}
        className={lang === 'en' ? 'active' : ''}
      >
        EN
      </button>
      <button
        data-lang="no"
        onClick={() => setLang('no')}
        className={lang === 'no' ? 'active' : ''}
      >
        NO
      </button>
    </div>
  )
}
