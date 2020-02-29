import { raiseError } from '~/utils/helpers'

export default function ({store, req, redirect, route, app, error}) {
  // middleware for SSR only
  // get tokens from cookies and init the application
  if (process.server && req) {
    const tokens = app.$cookies.get('jwt')
    if (tokens) {
      const companyUid = route.fullPath.split('/')[1]
      return store.dispatch('webuser/authFromCookie', { companyUid, ...tokens }).then(() => {
        return store.dispatch('updateInitial').catch((e) => raiseError(error, e))
      }).catch((e) => raiseError(error, e))
    }
  }
}
