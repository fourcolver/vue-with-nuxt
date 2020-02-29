import MobileDetect from 'mobile-detect'
import { getCompanyUidFromDomain } from '~/utils/helpers'

function getMobileUrl (route, host) {
  let redirect = null
  switch (route.name) {
    case 'index':
    case 'company.index':
    case 'company.login':
    case 'company.forgot':
    case 'company.tos':
    case 'company.privacy':
    case 'company.restore-password':
    case 'company.issues.all':
    case 'company.issues.project':
    case 'company.issues.comments':
      redirect = route.fullPath
      break
    case 'company.dashboard':
      redirect = '/events'
      break
  }
  if (redirect && host) {
    redirect = `/${host}${redirect}`
  }
  return redirect && `${process.env.MOBILE_URL}${redirect}`
}

export default function ({store, req, redirect, route, app}) {
  //  redirect to mobile version
  if (!process.env.MOBILE_URL) {
    return
  }
  const md = new MobileDetect(process.server ? req.headers['user-agent'] : navigator.userAgent)
  store.commit('SET_IS_MOBILE_VISIT', md.mobile())
  const cookieName = 'mDenyRedirect'
  if (process.server && route.query.switch && route.query.switch === 'desktop') {
    app.$cookies.set(cookieName, 1, {
      domain: '.' + process.env.SITE_HOST,
      path: '/'
    })
    delete route.query.switch
    redirect(302, route)
  } else {
    const redirectUrl = getMobileUrl(route, getCompanyUidFromDomain(req))
    if (store.state.isMobileVisit && !app.$cookies.get(cookieName) && redirectUrl) {
      if (process.server) {
        redirect(302, redirectUrl)
      } else {
        window.location.href = redirectUrl
      }
    }
  }
}
