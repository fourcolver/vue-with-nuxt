import VueI18n from 'vue-i18n'
import Vue from 'vue'
import enUS from '~/lang/en_us'
import ruRU from '~/lang/ru_ru'

Vue.use(VueI18n)

const normalizeLocale = (locale) => {
  if (!locale) {
    return
  }
  if (locale.toLowerCase() === 'ru') {
    locale = 'ru-RU'
  } else if (locale.toLowerCase() === 'en') {
    locale = 'en-US'
  }
  const locales = ['en-US', 'ru-RU']
  if (locales.indexOf(locale) === -1) {
    return false
  }
  return locale
}

export default ({app, store, req}) => {
  let locale = store.state.locale
  if (!locale) {
    let language
    if (process.server) {
      const langHeader = req.headers['accept-language']
      if (langHeader) {
        const languages = langHeader.split(',')
        if (languages && languages[0]) {
          language = languages[0]
        }
      } else {
        language = 'en-US'
      }
    } else {
      if (navigator.languages) {
        language = navigator.languages[0]
      } else if (navigator.language) {
        language = navigator.language
      }
    }
    if (language) {
      const normalized = normalizeLocale(language)
      if (normalized) {
        locale = normalized
      }
    }
  }
  app.i18n = new VueI18n({
    locale: locale || 'en-US',
    fallbackLocale: 'en-US',
    silentTranslationWarn: true,
    messages: {
      'en-US': enUS,
      'ru-RU': ruRU
    }
  })
}
