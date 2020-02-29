export default function ({ store, redirect, route, app }) {
  // redirect to login for guests only
  if (store.getters['webuser/isGuest']) {
    if (process.server && app.$cookies) {
      app.$cookies.set('afterLoginRedirect', route.fullPath, {domain: '.' + process.env.SITE_HOST, path: '/'})
    }
    return redirect('/login')
  }
}
