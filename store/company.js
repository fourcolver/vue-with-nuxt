const company = {
  namespaced: true,
  state: () => ({
    info: null,
    uid: null
  }),
  mutations: {
    SET_INFO (state, payload) {
      state.info = payload || null
    },
    SET_UID (state, payload) {
      state.uid = payload || null
    }
  },
  getters: {
    createUrl: (state, getters) => (route) => {
      return getters.createCompanyUrl({ route, uid: state.uid })
    },
    createAbsoluteUrl: (state, getters) => (route) => {
      const url = getters.createUrl(route)
      return `${process.env.SITE_PROTOCOL}://${process.env.SITE_HOST}${url}`
    },
    createCompanyUrl: (state) => ({ route, uid }) => {
      // do no changes, if there is no uid or uid is already set
      if (!uid || (route && route.params && route.params.company && route.params.company === uid)) {
        return route
      }
      // if we have string path only
      if (!route || typeof route === 'string') {
        return '/' + uid + '/' + (route ? route.replace(/^\//, '') : '')
      }
      // if we have an object, we have to change: path, fullPath, name and params
      // change name
      if (route.name && !/^company\./.test(route.name)) {
        route.name = 'company.' + route.name
      }
      const regex = route.params && route.params.company
        ? new RegExp('^/?' + route.params.company + '/?')
        : new RegExp('^/')
      // change path
      if (route.path) {
        route.path = '/' + uid + '/' + route.path.replace(regex, '')
      }
      // change fullPath
      if (route.fullPath) {
        route.fullPath = '/' + uid + '/' + route.fullPath.replace(regex, '')
      }
      // change params
      route.params = route.params ? { ...route.params, company: uid } : { company: uid }
      return route
    },
    getUrl (state) {
      return state.uid ? `/${state.uid}` : '/'
    },
    getProject: (state, getters, rootState) => (payload) => {
      if (Number.isInteger(payload)) {
        return rootState.projects.find(el => +el.id === +payload && el.is_active) || null
      } else if (payload) {
        return rootState.projects.find(el => el.uid === payload && el.is_active) || null
      } else {
        return rootState.projects.find(el => el.is_active) || null
      }
    },
    createProjectUrl: (state, getters, rootState) => (uid) => {
      const project = uid
        ? rootState.projects.find(el => el.uid === uid && el.is_active)
        : null
      const route = project
        ? {name: 'company.issues.project', params: {project: project.uid}}
        : { name: 'issues.all' }
      return getters.createUrl(route)
    },
    createIssueUrl: (state, getters, rootState) => ({uid, number}) => {
      const project = uid
        ? rootState.projects.find(el => el.uid === uid && el.is_active)
        : null
      const route = {
        name: 'comments.project',
        params: { project: project.uid },
        query: { issue: number }
      }
      return getters.createUrl(route)
    }
  },
  actions: {
    fetchInfo ({ commit }, uid) {
      return this.$api.get('auth/company-info', { uid }).then(res => {
        commit('SET_INFO', res.data.company)
        commit('SET_UID', uid)
      })
    }
  }
}

export default company
