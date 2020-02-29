export default function ({store, redirect}) {
  if (!store.getters['webuser/checkAccess']('owner')) {
    return redirect('/p/all')
  }
}
