export const calculateThumb = (t, options) => {
  if (!t || !t.url || !options) {
    return false
  }
  let {maxWidth, maxHeight} = options
  let thumb = {
    w: +(t.sizes ? t.sizes.w : t.w),
    h: +(t.sizes ? t.sizes.h : t.h),
    url: t.url
  }
  if (thumb.w > maxWidth) {
    thumb.h = thumb.h * maxWidth / thumb.w
    thumb.w = maxWidth
  }
  if (thumb.h > maxHeight) {
    thumb.w = thumb.w * maxHeight / thumb.h
    thumb.h = maxHeight
  }
  return thumb
}

export const calculatePercentDone = issue => {
  if (!issue.estimated_time && !issue.percent_done) {
    return 0
  }
  if (issue.percent_done) {
    return issue.percent_done > 100 ? 100 : issue.percent_done
  }
  if (issue.estimated_time && issue.spent_time) {
    const percent = Math.ceil(issue.spent_time / issue.estimated_time * 100)
    return percent > 100 ? 100 : percent
  }
}
export const getNoDiscHint = (ctx, onlyContent = false) => {
  const isOwner = ctx.$store.state.webuser.user.role === 'owner'
  let ret = ctx.$t('plan_no_disc_space_' + (isOwner ? 'owner' : 'coder'))
  if (isOwner) {
    ret += `<br><a href="#" data-nuxt-link="/upgrade">${ctx.$t('plan_upgrade_link')}</a>`
  }
  return onlyContent ? ret : {content: ret, html: true}
}

export const SEARCH_MIN_LENGTH = 3

export const isValidSearchKeyword = keyword => {
  const key = keyword && keyword.trim()
  return key && (key.length >= SEARCH_MIN_LENGTH || key.match(/^\d+$/))
}

export const getStatusOptions = ctx => {
  return [
    {
      id: 'open',
      name: ctx.$t('issue.status.open')
    },
    {
      id: 'resolved',
      name: ctx.$t('issue.status.resolved')
    },
    {
      id: 'closed',
      name: ctx.$t('issue.status.closed')
    }
  ]
}
