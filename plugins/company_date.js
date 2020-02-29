import moment from 'moment'
import { setPeriodFormats } from '../utils/time'

moment.fn.iso = function (withMs = false) {
  return this.format('YYYY-MM-DDTHH:mm:ss' + (withMs ? '.SSS' : ''))
}

const getDate = (app, store) => (param = null, format = null, isLocal = false) => {
  let m
  if (param && format) {
    m = moment(param, format, app.i18n.locale, true)
  } else {
    m = param ? moment(param) : moment()
  }
  if (store.getters['webuser/company']) {
    // если мы создаем дату из строки, то подразумеваем, что она уже в таймзоне компании
    // при вызове конструктора момента без аргументов, подразумевается, что мы хотим получить ломальную дату в таймзоне компании. Поэтому при конвертации таймзоны дата меняется
    const preserveDate = param !== null && typeof param !== 'number' && !isLocal
    m.utcOffset(store.getters['webuser/company'].timezone_offset, preserveDate)
  }
  m.locale(app.i18n.locale)
  return m
}

const formatDateAgo = (app, store) => date => {
  setPeriodFormats(moment)
  let m = moment.utc(date)
  m.locale(app.i18n.locale)
  if (!store.state.serverDate) {
    return m.fromNow()
  } else {
    return m.from(store.state.serverDate)
  }
}

export default ({app, store}, inject) => {
  inject('date', getDate(app, store))
  inject('dateAgo', formatDateAgo(app, store))
}
