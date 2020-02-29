class IssueFilter {
  constructor (key, context) {
    this.store = null
    this.router = null
    this.query = null
    this.app = null
    this.key = key
    this.cancelEvent = false
    this.icon = ''
    this.title = ''
    this.showInDropdown = true
    this.component = null
    this.defaultValue = null
    this.removeInvalid = true
  }

  applyContext (context) {
    this.store = context.store
    this.router = context.app.router
    this.query = context.route.query
    this.app = context.app
  }

  get options () {
    return []
  }

  setValue (value) {
    const currentValue = this.value
    const props = {[this.key]: value}
    this.store.commit('Issues/ADD_FILTER', props)
    this.update(currentValue !== value)
  }

  get value () {
    return this.store.getters['Issues/getFilter'](this.key)
  }

  validateStateValue () {
    if (!this.key) return true
    let value = this.store.getters['Issues/getFilter'](this.key)
    if (this.options.length) {
      if (!this.options.some(el => el.key === value && !el.hidden)) {
        return false
      }
    } else if (value) {
      return false
    }
    return true
  }

  cancel () {
    const currentValue = this.value
    this.store.commit('Issues/REMOVE_FILTER', this.key)
    this.update(currentValue !== null)
  }

  update (refresh = true) {
    this.store.dispatch('updateUserSettings', { issues_filters: this.store.state.Issues.filters })
    if (!refresh) {
      return
    }
    if ((+this.query.page || 1) === 1) {
      if (!process.server) {
        window.$nuxt.$loading.start()
      }
      this.store.dispatch('Issues/fetch').then(() => {
        if (!process.server) {
          window.$nuxt.$loading.finish()
        }
      })
    } else {
      this.router.push({query: {...this.query, page: 1}})
    }
  }

  applyValidation () {
    if (!this.validateStateValue()) {
      if (this.removeInvalid) {
        this.store.commit('Issues/REMOVE_FILTER', this.key)
      } else {
        this.store.commit('Issues/ADD_INVALID_FILTER', this.key)
      }
    } else {
      !this.removeInvalid && this.store.commit('Issues/REMOVE_INVALID_FILTER', this.key)
    }
  }
}

class IssueFilterStatus extends IssueFilter {
  constructor () {
    super('is_open')
    this.icon = 'bu-status'
  }

  get options () {
    return [
      { key: null, value: this.app.i18n.t('filters.status.All') },
      { key: 1, value: this.app.i18n.t('filters.status.Open') },
      { key: 0, value: this.app.i18n.t('filters.status.Closed') }
    ]
  }

  cancel () {
    this.setValue(null)
  }
}
/* eslint-disable */
class IssueFilterTag extends IssueFilter {
  constructor () {
    super('id_category')
    this.cancelEvent = false
    this.icon = 'bu-tag'
    this.removeInvalid = true
  }

  get options () {
    const project = this.store.getters.activeProject
    if (!project) {
      return []
    }
    let items = this.store.state.Issues.tags
    if (items.length) {
      items = items.map(el => ({
        key: el.id,
        value: el.name,
        hidden: project && +project.id !== +el.id_project
      }))
    }
    if (items.some(el => !el.hidden)) {
      items.unshift({
        key: null,
        value: this.app.i18n.t('filters.tags.All'),
        cancelEvent: false
      })
    }
    return items
  }

  validateStateValue () {
    // special case, b/c state value can be equal second level tag
    let value = this.store.getters['Issues/getFilter'](this.key)
    if (!value) {
      return true
    }
    const project = this.store.getters.activeProject
    return this.store.state.Issues.tags.some(el => +el.id === +value && (!project || +el.id_project === +project.id))
  }

  get value () {
    // get current tag
    const tag = this.store.getters['Issues/getSelectedTag']
    // return selected or its parent
    let value = null
    if (tag) {
      value = tag.id_parent ? tag.id_parent : tag.id
    }
    return value
  }

  cancel () {
    this.setValue(null)
  }
}
/* eslint-enable */

class IssueFilterAssigned extends IssueFilter {
  constructor (context) {
    super('id_assigned_user', context)
    this.title = context.app.i18n.t('filters.assignees.title')
    this.cancelEvent = true
    this.icon = 'bu-user'
    this.removeInvalid = false
  }

  get options () {
    // get items
    let items = this.store.state.assignUsers
    // get project
    const project = this.store.getters.activeProject
    if (project) {
      items = items.filter(el => (el.id_projects.indexOf(+project.id) > -1 || +el.id === +this.value) && el.is_active)
    }
    // map
    if (items.length) {
      items = items.map(el => ({
        key: el.id,
        value: el.name,
        avatar: el.avatar,
        hidden: project && el.id_projects.indexOf(+project.id) === -1
      }))
    }
    // add all option
    if (items.some(el => !el.hidden)) {
      items.unshift({
        key: null,
        value: this.app.i18n.t('filters.assignees.All')
      })
    }
    return items
  }
}

class IssueFilterCreated extends IssueFilter {
  constructor (context) {
    super('id_user', context)
    this.title = context.app.i18n.t('filters.authors.title')
    this.cancelEvent = true
    this.icon = 'bu-user'
    this.removeInvalid = false
  }

  get options () {
    // get items
    let items = this.store.state.assignUsers
    // get project
    const project = this.store.getters.activeProject
    if (project) {
      items = items.filter(el => (el.id_projects.indexOf(+project.id) > -1 || +el.id === +this.value) && el.is_active)
    }
    // map
    if (items.length) {
      items = items.map(el => ({
        key: el.id,
        value: el.name,
        avatar: el.avatar,
        hidden: project && el.id_projects.indexOf(+project.id) === -1
      }))
    }
    // add all option
    if (items.some(el => !el.hidden)) {
      items.unshift({
        key: null,
        value: this.app.i18n.t('filters.authors.All')
      })
    }
    return items
  }
}

class IssueFilterBug extends IssueFilter {
  constructor (context) {
    super('is_bug', context)
    this.title = context.app.i18n.t('filters.bugs.title')
    this.cancelEvent = false
    this.icon = 'bu-bug'
    this.defaultValue = null
  }

  get options () {
    return [
      {key: null, value: this.app.i18n.t('filters.bugs.All')},
      {key: 1, value: this.app.i18n.t('filters.bugs.Tasks')},
      {key: 2, value: this.app.i18n.t('filters.bugs.Bugs')}
    ]
  }
}

class IssueFilterPriority extends IssueFilter {
  constructor (context) {
    super('priority_weight', context)
    this.title = context.app.i18n.t('filters.priority.title')
    this.cancelEvent = false
    this.icon = 'bu-priority'
  }

  get options () {
    let items = this.store.state.Issues.priorities.map(el => ({
      key: el.weight,
      component: { name: 'priority-label', props: { weight: el.weight } }
    }))
    items.unshift({
      key: null,
      value: this.app.i18n.t('filters.priorities.All')
    })
    return items
  }
}

class IssueFilterKeyword extends IssueFilter {
  constructor (context) {
    super('keyword', context)
    this.showInDropdown = false
  }

  validateStateValue () {
    return true
  }
}

class IssueFilterDta extends IssueFilter {
  constructor (field, context) {
    super(field, context)
    this.cancelEvent = true
    this.component = () => ({
      name: 'date-picker',
      props: {
        date: context.app.$date(context.store.getters['Issues/getFilter'](field) * 1000)
      },
      events: {
        selected: (d) => {
          this.setValue(this.calculateValue(d))
          if (this.parentComponent) {
            const menu = this.parentComponent.$refs.menu
            menu && menu.toggle(false)
          }
        }
      },
      ssr: false
    })
  }
  calculateValue (d) {
    return d.clone().startOf('day').unix()
  }
  valueFormatter (val) {
    if (!val) {
      return this.title
    }
    let obj = this.app.$date(val * 1000)
    return obj ? obj.format('D MMM') : ''
  }

  validateStateValue () {
    const value = this.store.getters['Issues/getFilter'](this.key)
    if (!value) {
      return true
    }
    return +value > 0
  }
}

class IssueFilterDtaCreateFrom extends IssueFilterDta {
  constructor (context) {
    super('dta_create_from', context)
    this.title = context.app.i18n.t('filters.from.title')
    this.icon = 'bu-right-open'
  }
}

class IssueFilterDtaCreateTo extends IssueFilterDta {
  constructor (context) {
    super('dta_create_to', context)
    this.title = context.app.i18n.t('filters.to.title')
    this.icon = 'bu-left-open'
  }
  calculateValue (d) {
    return d.clone().endOf('day').iso()
  }
}

const filtersClasses = {
  IssueFilterStatus,
  IssueFilterTag,
  IssueFilterAssigned,
  IssueFilterCreated,
  IssueFilterBug,
  IssueFilterPriority,
  IssueFilterKeyword,
  IssueFilterDtaCreateFrom,
  IssueFilterDtaCreateTo
}

let filters = []

export default (context, inject) => {
  inject('issuesFilters', () => {
    if (!filters.length) {
      filters = Object.keys(filtersClasses).map(name => new filtersClasses[name](context))
    }
    filters.forEach(f => f.applyContext(context))
    return filters
  })
}
