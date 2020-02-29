export const mergeNearTimers = (app, timers) => {
  timers = [...timers]
  let ret = []
  let mergeElement = null
  timers.sort((a, b) => +app.$date(b.dta_start) > +app.$date(a.dta_start) ? -1 : 1)
  timers.forEach((el) => {
    if (!mergeElement) {
      mergeElement = el
      ret.push(el)
      return
    }
    const d1 = app.$date(mergeElement.dta_end)
    const d2 = app.$date(el.dta_start)
    let diff = Math.abs(d1.diff(d2, 'seconds'))
    if (d1.isSame(d2, 'day') && diff <= 300 && +el.is_manual === +mergeElement.is_manual) {
      mergeElement.spent_sec = +mergeElement.spent_sec + +el.spent_sec
      mergeElement.dta_end = el.dta_end
    } else {
      mergeElement = el
      ret.push(el)
    }
  })
  return ret
}

export const getAvgActivity = item => {
  return Math.ceil((item.keyboard_sum / item.keyboard_count + item.mouse_sum / item.mouse_count) / 2)
}

export const countAvgActivity = inputs => {
  const total = inputs.reduce((a, el) => {
    a.mouse_sum += +el.mouse_sum
    a.mouse_count += +el.mouse_count
    a.keyboard_sum += +el.keyboard_sum
    a.keyboard_count += +el.keyboard_count
    return a
  }, {mouse_sum: 0, keyboard_sum: 0, mouse_count: 0, keyboard_count: 0})
  return getAvgActivity(total)
}

export const getIssueLinkFromTimer = (ctx, timer) => {
  const project = ctx.$store.getters['company/getProject'](timer.id_project)
  let route = {name: 'company.comments.project', query: {issue: timer.issue_number}}
  if (project) {
    route.params = {project: project.uid}
  }
  return route
}
