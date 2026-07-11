import en from './en.json'
import es from './es.json'
import fr from './fr.json'

export type Locale = 'en' | 'es' | 'fr'

const messages: Record<Locale, Record<string, string>> = { en, es, fr }

let currentLocale: Locale = (localStorage.getItem('novaflix-locale') as Locale) || 'en'

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale) {
  currentLocale = locale
  localStorage.setItem('novaflix-locale', locale)
  document.documentElement.lang = locale
}

export function t(key: string, fallback?: string): string {
  return messages[currentLocale]?.[key] || messages.en?.[key] || fallback || key
}
