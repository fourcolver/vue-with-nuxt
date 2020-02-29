import { raiseError } from '~/utils/helpers'

export default async function ({store, route, redirect, error}) {
  // ignore guests and alien companies
  if (store.getters['webuser/isGuest'] ||
    store.getters['webuser/isLogoutProcess'] ||
    !store.state.company.uid ||
    !store.getters['webuser/getCompanyByUid'](store.state.company.uid)) {
    return true
  }
  if (route.params.project) {
    // project are always loaded after init
    if (!store.state.projects.length) {
      return redirect(store.getters['company/createUrl']('/no_projects'))
    }
    // set active project
    const project = store.getters['company/getProject'](route.params.project)
    if (!project) {
      return redirect(store.getters['company/createProjectUrl']())
    }
    store.commit('SET_ACTIVE_PROJECT', route.params.project)
    try {
      await store.dispatch('getAssignUsers', project.id)
    } catch (e) {
      raiseError(error, e)
    }
  } else {
    // set no active project
    store.commit('SET_ACTIVE_PROJECT', null)
  }
}
