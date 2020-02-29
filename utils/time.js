import moment from 'moment'

moment.defineLocale('en-long', {parentLocale: 'en'})
moment.defineLocale('ru-long', {parentLocale: 'ru'})
moment.updateLocale('en-long', {
  relativeTime: {
    ...moment().locale('en-long').localeData()._relativeTime,
    'h': '1 hour'
  }
})
moment.updateLocale('ru-long', {
  relativeTime: {
    ...moment().locale('ru-long').localeData()._relativeTime,
    'h': '1 час'
  }
})

export const setPeriodFormats = (moment) => {
  moment.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s',
      s: '1 sec',
      ss: '%d sec',
      m: '1 min',
      mm: '%d min',
      h: '1 hr',
      hh: '%d hrs',
      d: '1 day',
      dd: '%d days',
      M: '1 mnth',
      MM: '%d mnth',
      y: '1 year',
      yy: '%d years'
    }
  })
  moment.updateLocale('ru', {
    relativeTime: {
      future: 'через %s',
      past: '%s',
      s: '1 сек',
      ss: '%d сек',
      m: '1 мин',
      mm: '%d мин',
      h: '1 ч',
      hh: '%d ч',
      d: '1 д',
      dd: '%d дн',
      M: '1 мес',
      MM: '%d мес',
      y: '1 г',
      yy: '%d г'
    }
  })
  moment.relativeTimeThreshold('s', 60)
  moment.relativeTimeThreshold('ss', 1)
}

export const formatDate = (date, format = 'D MMM YY', locale) => {
  let day = moment(date)
  if (!day.isValid()) {
    day = moment(date.replace(/-/g, '/').replace(/[a-z]+/gi, ' '))
  }
  if (!day) {
    return ''
  }
  if (!locale) {
    locale = 'en-US'
  }
  day.locale(locale)
  if (format === 'D MMM YY') {
    if (locale === 'en-US') {
      return day.format(format)
    } else {
      return day.format('ll')
    }
  } else {
    return day.format(format)
  }
}
export const secondsToHIS = (time, fmt = 'h:i:s', padded = true) => {
  let pad = (val) => val < 10 ? '0' + val : val.toString()
  let h = Math.floor(time / 3600)
  h = padded ? pad(h) : h
  if (fmt !== 'i:s') {
    time -= h * 3600
  }
  let m = Math.floor(time / 60)
  m = pad(m)
  time -= m * 60
  let s = pad(time)
  return fmt.replace('h', h).replace('i', m).replace('s', s)
}
