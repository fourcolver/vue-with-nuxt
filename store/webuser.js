import Vue from 'vue'

const defaultState = {
  tokens: null,
  company: null,
  companies: [],
  user: {
    name: ''
  },
  authItems: {},
  isFromControl: false,
  isLogoutProcess: false
}

// state should be a function. or SSR state will always keep values from last request
const webuser = {
  namespaced: true,
  state: () => Object.assign({}, JSON.parse(JSON.stringify(defaultState))),
  mutations: {
    RESET (state) {
      state = Object.assign(state, JSON.parse(JSON.stringify(defaultState)))
    },
    SET_TOKENS (state, payload) {
      state.tokens = payload || null
    },
    SET_USER (state, payload) {
      state.user = payload || null
    },
    SET_AUTH_ITEMS (state, payload) {
      state.authItems = payload || null
    },
    SET_COMPANIES (state, payload) {
      state.companies = payload || []
    },
    SET_FROM_CONTROL (state, payload) {
      state.isFromControl = payload
    },
    SET_COMPANY (state, payload) {
      const companyIdx = state.companies.findIndex(el => +el.id === +state.user.id_company)
      if (companyIdx !== -1) {
        Vue.set(state.companies, companyIdx, payload)
      }
    },
    SET_LOGOUT_PROCESS (state, val) {
      state.isLogoutProcess = val
    }
  },
  getters: {
    getCompanyByUid: (state) => (uid) => {
      return state.companies.find(el => el.uid === uid)
    },
    company (state) {
      return state.companies.find(el => +el.id === +state.user.id_company)
    },
    checkAccess: (state) => (item) => {
      return state.authItems && state.authItems[item] ? 1 : 0
    },
    isGuest (state) {
      return !state.tokens || !state.tokens.access_token || state.isLogoutProcess
    },
    isLogoutProcess (state) {
      return state.isLogoutProcess
    }
  },
  actions: {
    authFromCookie ({state, commit, dispatch, rootState}, payload) {
      dispatch('updateTokens', {access_token: payload.access_token})
      const headers = {
        'Client-Company': payload.companyUid ? payload.companyUid : null
      }
      return this.$api.get('auth/init', null, {headers}).then(res => {
        commit('SET_FROM_CONTROL', !!+res.headers['is-ctrl'])
        return dispatch('initApp', res.data)
      })
    },
    authInit ({state, commit, dispatch, rootState}) {
      return this.$api.get('auth/init').then(res => {
        return dispatch('initApp', res.data)
      })
    },
    authFromLogin ({rootState, dispatch, commit}, {email, password}) {
      const headers = {
        'Client-Company': rootState.company.uid
      }
      return this.$api.post('auth/login', {email, password}, {headers}).then(res => {
        commit('SET_USER', res.data.app_init.user)
        commit('SET_COMPANIES', res.data.app_init.companies)
        dispatch('setLoginCookie', {access_token: res.data.token})
        return res
      })
    },
    authFromInviteLogged ({dispatch, rootState}, token) {
      const headers = {
        'Client-Company': rootState.company.uid
      }
      return this.$api.put('invite/confirm-logged?token=' + token, null, {headers}).then(res => {
        dispatch('updateTokens', {access_token: res.data.token})
        dispatch('initApp', res.data.app_init)
      })
    },
    authFromInviteNew ({dispatch, rootState}, {token, name, email, password}) {
      const headers = {
        'Client-Company': rootState.company.uid
      }
      const data = {name, email, password}
      return this.$api.put('invite/confirm-new?token=' + token, data, {headers}).then(res => {
        dispatch('updateTokens', {access_token: res.data.token})
        dispatch('initApp', res.data.app_init)
      })
    },
    authFromInviteLogin ({dispatch, rootState}, {token, email, password}) {
      const headers = {
        'Client-Company': rootState.company.uid
      }
      const data = {email, password}
      return this.$api.put('invite/confirm-login?token=' + token, data, {headers}).then(res => {
        dispatch('updateTokens', {access_token: res.data.token})
        dispatch('initApp', res.data.app_init)
      })
    },
    authFromSignup ({dispatch}, {email, password, name, domain}) {
      const data = {email, password, name, company_uid: domain}
      return this.$api.post('auth/signup', data).then(res => {
        dispatch('updateTokens', {access_token: res.data.token})
        dispatch('initApp', res.data.app_init)
      })
    },
    authCoderFromSignup ({dispatch, rootState}, {secretWord, name, email, password}) {
      const data = {secret_word: secretWord, name, email, password}
      return this.$api.post('auth/coder-signup-new?uid=' + rootState.company.uid, data).then(res => {
        dispatch('reset', null, { root: true })
        dispatch('updateTokens', {access_token: res.data.token})
        dispatch('initApp', res.data.app_init)
      })
    },
    authCoderFromLogged ({dispatch, rootState}, {secretWord}) {
      const data = {secret_word: secretWord}
      return this.$api.post('auth/coder-signup-logged?uid=' + rootState.company.uid, data).then(res => {
        dispatch('reset', null, { root: true })
        dispatch('updateTokens', {access_token: res.data.token})
        dispatch('initApp', res.data.app_init)
      })
    },
    authCoderFromLogin ({dispatch, rootState}, {secretWord, email, password}) {
      const data = {secret_word: secretWord, email, password}
      return this.$api.post('auth/coder-signup-login?uid=' + rootState.company.uid, data).then(res => {
        dispatch('reset', null, { root: true })
        dispatch('updateTokens', {access_token: res.data.token})
        dispatch('initApp', res.data.app_init)
      })
    },
    logout ({state, commit, dispatch}, params = {}) {
      return this.$api.post('auth/logout', params).then(() => {
        if (!state.isLogoutProcess) {
          dispatch('reset', null, { root: true })
        }
        this.$cookies.remove('jwt', {
          domain: '.' + process.env.SITE_HOST,
          path: '/'
        })
      })
    },
    setLoginCookie (store, tokens) {
      this.$cookies.set('jwt', tokens, {
        domain: '.' + process.env.SITE_HOST,
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })
    },
    setLocaleCookie ({store, commit}, val) {
      this.$cookies.set('locale', val)
      this.app.i18n.locale = val
      commit('SET_LOCALE', val, { root: true })
    },
    updateTokens ({commit, dispatch}, tokens) {
      commit('SET_TOKENS', tokens)
      dispatch('setLoginCookie', tokens)
    },
    initApp ({commit, rootState, dispatch}, app) {
      // local state
      commit('SET_USER', app.user)
      commit('SET_AUTH_ITEMS', app.auth_items)
      commit('SET_COMPANIES', app.companies)
      // global state
      let settings = app.user_settings || {}
      const settingsFromCookies = ['chat_win_position']
      settingsFromCookies.forEach(k => {
        if (this.$cookies.get(k)) {
          settings[k] = this.$cookies.get(k)
        }
      })
      commit('SET_USER_SETTINGS', settings, {root: true})
      commit('SET_LOCALE', app.user_settings.lang, { root: true })
      if (app.user_settings.cats_bar_width) {
        commit('SET_SIDEBAR_WIDTH', app.user_settings.cats_bar_width, { root: true })
      }
      if (app.user_settings.chat_win_width) {
        commit('SET_CHAT_WIDTH', app.user_settings.chat_win_width, { root: true })
      }
      if (app.user_settings.editor_custom_colors) {
        commit('SET_EDITOR_CUSTOM_COLORS', app.user_settings.editor_custom_colors, { root: true })
      }
      commit('SET_SIDEBAR_LOCKED', app.user_settings.cats_bar_pin, { root: true })
      commit('SET_CHAT_PINNED', app.user_settings.chat_pin, { root: true })
      commit('SET_CHAT_ACTIVE', +this.$cookies.get('CHAT_ACTIVE') || false, { root: true })
      this.app.i18n.locale = app.user_settings.lang
      commit('Issues/SET_FILTERS', app.user_settings.issues_filters, { root: true })
      commit('SET_CNT_UNREAD_CHAT_MESSAGES', +app.chats_count_unread, { root: true })
      if (+app.id_channel_main) {
        commit('SET_MAIN_CHAT_ID', +app.id_channel_main, { root: true })
      }
    }
  }
}

export default webuser
