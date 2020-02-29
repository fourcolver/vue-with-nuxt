import { raiseError } from '~/utils/helpers'

export default async function ({store, req, redirect, route, app, error}) {
  // find out current uid
  let uid = route.params.company || null
  if (uid) {
    if (store.getters['webuser/isGuest'] || !store.getters['webuser/getCompanyByUid'](uid)) {
      // if company does not exist at all, we've got 404 here
      await store.dispatch('company/fetchInfo', uid).catch((e) => raiseError(error, e))
    }
  }
  store.commit('company/SET_UID', uid)

  // redirect for members only. ignore anonymous routes
  if (!store.getters['webuser/isGuest'] && route.name) {
    if (!uid) {
      // if current uid is undefined, redirect to member's current company
      const url = store.getters['company/createCompanyUrl']({
        route: { ...route },
        uid: store.getters['webuser/company'].uid
      })
      return redirect(url)
    } else if (!store.getters['webuser/getCompanyByUid'](uid)) {
      // if it's not member's company, redirect to index
      if (!['company.index', 'company.invite'].includes(route.name)) {
        return redirect(`/${uid}`)
      }
    }
  }
}
