import { capitalize } from '../utils/helpers'
import { isValidSearchKeyword } from '../utils/issues'

const formatIssue = el => {
  el.name = capitalize(el.name)
  el.description = capitalize(el.description)
  el.author_name = capitalize(el.author_name)
}

const defaultState = {
  issue: {
    comment: {
      text: '',
      html: ''
    },
    priority_weight: 25,
    id_assigned_user: 0,
    is_bug: 0,
    is_starred: 0,
    name: ''
  },
  issues: [],
  tags: [],
  tagsHeaders: {},
  priorities: [],
  filters: [],
  filtersDefault: [
    {is_open: 1}
  ],
  headers: null,
  countsByPriority: [],
  countTotal: 0,
  stats: {},
  statuses: [
    {id: 'open', name: 'Open'},
    {id: 'closed', name: 'Closed'},
    {id: 'resolved', name: 'Resolved'}
  ],
  starred: [],
  unread: [],
  loadingPromise: null,
  invalidFilters: [],
  activeTag: null,
  lastEvents: [],
  filteredIssues: [],
  filteredIssuesHeaders: {}
}

const issues = {
  namespaced: true,
  state: () => Object.assign({}, JSON.parse(JSON.stringify(defaultState))),
  mutations: {
    RESET (state) {
      state = Object.assign(state, JSON.parse(JSON.stringify(defaultState)))
    },
    SET_ISSUES (state, issues) {
      issues.forEach(el => formatIssue(el))
      state.issues = issues
    },
    SET_ISSUE (state, issue) {
      formatIssue(issue)
      state.issue = issue
    },
    SET_NEW_ISSUE (state, val) {
      state.issue = val
    },
    SET_DEFAULT (state) {
      state.issue = defaultState.issue
    },
    SET_LOADING_PROMISE (state, val) {
      state.loadingPromise = val
    },
    SET_HEADERS (state, val) {
      state.headers = val
      state.countTotal = val['x-pagination-total-count'] || 0
    },
    SET_STATS (state, val) {
      state.stats = val
    },
    SET_COUNTS (state, val) {
      state.countsByPriority = val
    },
    SET_FILTERS (state, val) {
      if (!Array.isArray(val) || !val.length) {
        val = JSON.parse(JSON.stringify(state.filtersDefault))
      }
      state.filters = val
    },
    SET_STARRED (state, val) {
      val.forEach(el => formatIssue(el))
      state.starred = val
    },
    SET_UNREAD (state, val) {
      val.forEach(el => formatIssue(el))
      state.unread = val
    },
    SET_SEARCH_KEYWORD (state, val) {
      state.searchKeyword = val
    },
    SET_TAGS (state, val) {
      state.tags = val
    },
    SET_TAGS_HEADERS (state, val) {
      state.tagsHeaders = val
    },
    ADD_TAG (state, tag) {
      state.tags.push(tag)
      state.tags.sort((a, b) => +a.weight - +b.weight)
    },
    MOVE_TAG (state, {id, parent}) {
      const tag = state.tags.find(el => +el.id === +id)
      if (tag) {
        tag.id_parent = parent || 0
        state.tags[state.tags.indexOf(tag)] = tag
      }
    },
    REMOVE_TAG (state, tagId) {
      const tag = state.tags.find(el => el.id.toString() === tagId.toString())
      if (tag) {
        state.tags.splice(state.tags.indexOf(tag), 1)
      }
    },
    SET_PRIORITIES (state, val) {
      state.priorities = val
    },
    ADD_FILTER (state, val) {
      const key = Object.keys(val)[0]
      const item = state.filters.find(el => Object.keys(el)[0] === key)
      if (item) {
        state.filters.splice(state.filters.indexOf(item), 1, val)
      } else {
        state.filters.push(val)
      }
    },
    REMOVE_FILTER (state, key) {
      const item = state.filters.find(
        el => String(Object.keys(el)[0]) === String(key))
      if (item) {
        state.filters.splice(state.filters.indexOf(item), 1)
      }
    },
    ADD_INVALID_FILTER (state, val) {
      if (!state.invalidFilters.includes(val)) {
        state.invalidFilters.push(val)
      }
    },
    REMOVE_INVALID_FILTER (state, val) {
      const ind = state.invalidFilters.indexOf(val)
      if (ind !== -1) {
        state.invalidFilters.splice(ind, 1)
      }
    },
    SET_ACTIVE_TAG (state, val) {
      state.activeTag = val
    },
    SET_LAST_EVENTS (state, val) {
      state.lastEvents = val
    },
    SET_FILTERED (state, val) {
      state.filteredIssues = val.issues
      state.filteredIssuesHeaders = val.headers
    }
  },
  getters: {
    isFilterDefault (state, getters) {
      const defaultFilter = state.filtersDefault.reduce(
        (a, el) => ({...a, ...el}), {})
      const defaultKeys = Object.keys(defaultFilter)
      const filter = getters.getFiltersObject
      const keys = Object.keys(filter)
      return defaultKeys.length === keys.length &&
        keys.reduce(
          (a, key) => a && defaultKeys.includes(key) && defaultFilter[key] ===
            filter[key], true)
    },
    getFilter (state, getters) {
      return function (key) {
        let item = state.filters.find(el => Object.keys(el)[0] === key)
        if (!item) {
          // define computed values here
          switch (key) {
            case 'is_closed':
              item = {[key]: getters.getFilter('is_open') === 0}
              break
          }
        }
        return item ? item[key] : null
      }
    },
    isSearch (state, getters) {
      return isValidSearchKeyword(getters.getFilter('keyword'))
    },
    getFiltersObject (state) {
      let filters = state.filters.reduce((a, el) => ({...a, ...el}), {})
      state.invalidFilters.forEach(key => {
        if (typeof filters[key] !== 'undefined') {
          delete filters[key]
        }
      })
      if (filters.keyword) {
        if (isValidSearchKeyword(filters.keyword)) {
          filters.keyword = encodeURIComponent(filters.keyword.trim())
        } else {
          // do not send keyword if it's not valid
          delete filters.keyword
        }
      }
      return filters
    },
    getSelectedTag (state, getters) {
      const idTag = getters.getFilter('id_category')
      return idTag ? state.tags.find(el => +el.id === +idTag) : null
    },
    getActiveTag (state) {
      const idTag = state.activeTag
      return idTag ? state.tags.find(el => +el.id === +idTag) : null
    },
    getDefault () {
      return key => defaultState[key] || null
    },
    getPriority (state, onlyName) {
      return function (id) {
        let priority = state.priorities.find(el => el.id === +id) || null
        if (priority) {
          return onlyName ? priority.name : priority
        }
      }
    },
    getStatus (state) {
      return function (id) {
        let status = state.statuses.find(el => el.id === id) || null
        return status ? status.name : null
      }
    },
    hasUnreadSection (state, _, rootState) {
      return (project) => {
        if (!+rootState.userSettings.tasks_with_event_on_top) {
          return false
        }
        if (!project) {
          return !!state.unread.length
        }
        return !!state.unread.find(el => +el.id_project === (project && project.id))
      }
    },
    getUpdateQuery: (state, getters, rootState, rootGetters) => () => {
      // build filter and sort data
      let data = {}
      data.filters = {...getters.getFiltersObject}
      data.filters.is_starred = 0
      if (rootGetters.activeProject) {
        data.filters.id_project = rootGetters.activeProject.id
      }
      if (+rootState.userSettings.tasks_with_event_on_top) {
        data.filters.is_read = 1
      }
      data.sort = getters.getFilter('is_closed') || +rootState.userSettings.grouping_disabled
        ? '-dta_last_event'
        : '-priority_weight,-dta_last_event'
      return data
    },
    getUpdateStarredQuery (state, getters, rootState, rootGetters) {
      return function () {
        let data = {}
        data.filters = {}
        if (rootGetters.activeProject) {
          data.filters.id_project = rootGetters.activeProject.id
        }
        data.filters.is_open = 1
        data.filters.is_starred = 1
        if (rootState.userSettings.tasks_with_event_on_top) {
          data.filters.is_read = 1
        }
        return data
      }
    },
    getUpdateUnreadQuery (state, getters, rootState, rootGetters) {
      return function () {
        // let data = {...getters.getUpdateIssuesQuery()}
        let data = {}
        data.filters = {}
        if (rootGetters.activeProject) {
          data.filters.id_project = rootGetters.activeProject.id
        }
        data.filters.is_read = 0
        data.filters.is_open = 1
        data.filters.is_starred = null
        data.sort = '-dta_last_event'
        return data
      }
    }
  },
  actions: {
    async fetch ({commit, state, dispatch, getters, rootGetters}, {newIssue} = {}) {
      // validate filters before send request (removed tags or projects)
      commit('SET_LOADING', true, { root: true })
      this.$issuesFilters().forEach(f => f.applyValidation())
      let promises = []
      if (!state.priorities.length || process.server) {
        promises.push(dispatch('updatePriorities'))
      }
      let project = rootGetters.activeProject
      if (project) {
        promises.push(dispatch('updateTags', {idProject: project.id}))
      }
      promises.length && await Promise.all(promises)
      // request issues
      promises = []
      promises.push(dispatch('getAll'))
      promises.push(dispatch('getStarred'))
      promises.push(dispatch('getUnread'))
      promises.push(dispatch('getStats'))
      let p = Promise.all(promises)
      commit('SET_LOADING_PROMISE', p)
      return p.then((res) => {
        if (state.loadingPromise && p !== state.loadingPromise) {
          return
        }
        if (newIssue) {
          let issuesList = newIssue.is_starred ? res[1] : res[0].issues
          let returnedIssue = issuesList.find(el => +el.id === +newIssue.id)
          if (returnedIssue) {
            returnedIssue.is_new = 1
          }
        }
        // important to commit all data altogether
        commit('SET_ISSUES', res[0].issues)
        commit('SET_HEADERS', res[0].headers)
        commit('SET_COUNTS', res[0].counts_by_priority)
        commit('SET_STARRED', res[1])
        commit('SET_UNREAD', res[2])
        commit('SET_STATS', res[3])
        commit('SET_SEARCH_KEYWORD', getters.getFilter('keyword') || '')

        commit('SET_LOADING', false, { root: true })
      })
    },
    getAll ({state, getters, rootState}) {
      let data = getters.getUpdateQuery()
      data['per-page'] = 20
      if (this.app.context.query.page) {
        data.page = this.app.context.query.page
      }
      // query
      let promises = [
        this.$api.get('issues/index', data)
      ]
      if (getters.getFilter('is_open') &&
        !getters.isSearch &&
        !+rootState.userSettings.grouping_disabled) {
        promises.push(this.$api.get('issues/counts-by-priority', data))
      }
      return Promise.all(promises).then(res => ({
        issues: res[0].data.issues || [],
        headers: res[0].headers,
        counts_by_priority: res[1] ? (res[1].data.counts_by_priority || []) : []
      }))
    },
    getStarred ({getters, commit}) {
      const page = this.app.context.query.page || 1
      let filtersObj = getters.getFiltersObject
      if (filtersObj.is_open === 0 || page > 1 || getters.isSearch) {
        return []
      }
      let data = getters.getUpdateStarredQuery()
      data['per-page'] = 500
      return this.$api.get('issues/index', data).then(res => res.data.issues)
    },
    getUnread ({getters, commit, state, rootState}) {
      const page = this.app.context.query.page || 1
      let filtersObj = getters.getFiltersObject
      if (filtersObj.is_open === 0 || page > 1 || !+rootState.userSettings.tasks_with_event_on_top || getters.isSearch) {
        return []
      }
      let data = getters.getUpdateUnreadQuery()
      data['per-page'] = 500
      return this.$api.get('issues/index', data).then(res => res.data.issues)
    },
    getStats ({getters, commit, rootGetters}) {
      let statsFilters = {}
      if (rootGetters.activeProject) {
        statsFilters.id_project = rootGetters.activeProject.id
      }
      return this.$api.get('stats-bugtracker/issues-bugs-times', statsFilters).then(res => res.data)
    },
    loadIssue ({ commit, dispatch }, num) {
      return this.$api.get('issues/view', { number: num }).then(res => {
        commit('SET_ISSUE', res.data.issue)
      })
    },
    updateIssue ({ commit }, issue) {
      return this.$api.put('issues/' + issue.id, issue).then(res => {
        commit('SET_ISSUE', res.data.issue)
      })
    },
    resetFilter ({commit, dispatch}) {
      dispatch('updateUserSettings', {issues_filters: []}, {root: true}).then(() => {
        commit('SET_FILTERS', [])
        dispatch('fetch')
      })
    },
    activateTag (store, tagId) {
      if (tagId) {
        store.commit('ADD_FILTER', {id_category: tagId})
      } else {
        store.commit('REMOVE_FILTER', 'id_category')
      }
      store.dispatch('updateUserSettings',
        {issues_filters: store.state.filters}, {root: true})
      return store.dispatch('fetch')
    },
    addTag (store, {name, idProject, cntUse = 0, noMutation = false}) {
      return this.$api.post('categories', {
        name,
        id_project: idProject,
        cnt_use: cntUse
      })
        .then((res) => {
          let el = res.data.category
          el.name = capitalize(el.name)
          !noMutation && store.commit('ADD_TAG', el)
          return el
        })
    },
    updateTags (store, {idProject, isAuto = false, page = 1}) {
      return this.$api.get('categories', {
        filters: {
          id_project: idProject,
          is_auto: +isAuto
        },
        'per-page': 100,
        page
      })
        .then((res) => {
          let tags = res.data.categories
          tags.forEach(el => {
            el.name = capitalize(el.name)
          })
          store.commit('SET_TAGS', tags)
          store.commit('SET_TAGS_HEADERS', res.headers)
          return tags
        })
    },
    updatePriorities (store) {
      return this.$api.get('priorities', {sort: '-weight'})
        .then((res) => {
          if (res.data.priorities) {
            for (let i = 0; i < res.data.priorities.length; i++) {
              res.data.priorities[i].id = res.data.priorities[i].weight
            }
          }
          store.commit('SET_PRIORITIES', res.data.priorities)
        })
    },
    updateLastEvents (store, idProject) {
      return this.$api.get('events/list', {
        filters: {id_project: idProject, is_read: 0},
        sort: '-dta',
        'per-page': 3
      }).then(res => {
        store.commit('SET_LAST_EVENTS', res.data.events)
      })
    },
    setStarred (store, params) {
      if (params.id) {
        return this.$api.put('issues/starred?id=' + params.id, {'is_starred': params.is_starred}).then(() => store.dispatch('getProjects', {}, {root: true}))
      }
    },
    getFiltered ({state, commit}) {
      if (!state.activeTag) {
        return
      }
      let data = {
        'per-page': 20,
        filters: {
          is_open: 1,
          id_category: state.activeTag
        }
      }
      if (this.app.context.query.filtered_page) {
        data.page = this.app.context.query.filtered_page
      }
      return this.$api.get('issues/index', data).then(res => {
        commit('SET_FILTERED', {issues: res.data.issues, headers: res.headers})
      })
    }
  }
}

export default issues
