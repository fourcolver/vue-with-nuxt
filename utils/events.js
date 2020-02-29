export const goToIssue = (ctx, evt, e) => {
  if (!evt.issue.is_active) {
    return
  }
  let project = ctx.$store.getters['company/getProject'](evt.id_project)
  if (!project) {
    return
  }
  const route = ctx.$store.getters['company/createIssueUrl']({
    uid: project.uid,
    number: evt.issue.number
  })
  if (evt.id_comment) {
    route.hash = '#comment_' + evt.id_comment
  }
  if (e.ctrlKey) {
    window.open(ctx.$router.resolve(route).href).focus()
  } else {
    ctx.$router.push(route)
  }
}
