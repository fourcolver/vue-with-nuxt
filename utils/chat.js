import moment from 'moment'

export const formatDuration = (ctx, minutes) => {
  const localeLang = ctx.$i18n.locale.split('-')[0]
  if (['en', 'ru'].includes(localeLang)) {
    moment.locale(localeLang + '-long')
  }
  const str = moment.duration({minutes}).humanize()
  moment.locale(ctx.$i18n.locale)
  return str
}
