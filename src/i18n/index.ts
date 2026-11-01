import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { ptBR } from './pt-BR'

export const IDIOMAS = [
  ['pt-BR', 'Português (Brasil)'],
  ['en', 'English'],
] as const
export type Idioma = (typeof IDIOMAS)[number][0]

i18n.use(initReactI18next).init({
  resources: { 'pt-BR': { translation: ptBR }, en: { translation: en } },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false }, // o React já protege o texto
})

export function mudarIdioma(idioma: Idioma) {
  i18n.changeLanguage(idioma)
  document.documentElement.lang = idioma
}

export default i18n
