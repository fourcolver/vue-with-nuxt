export default function ({ store, req, redirect, route }) {
  // redirect for members from outer pages
  // company must exist in member's area
  if (!store.getters['webuser/isGuest'] &&
    !store.getters['webuser/isLogoutProcess'] &&
    store.state.company.uid &&
    store.getters['webuser/getCompanyByUid'](store.state.company.uid)) {
    // redirect inside member area
    // const project = store.getters['company/getProject']()
    // return redirect(store.getters['company/createProjectUrl'](project ? project.uid : null))
    return redirect(store.getters['company/createUrl']('/p/all'))
  }
}
