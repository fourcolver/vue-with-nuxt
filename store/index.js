import Vuex from 'vuex'
import defaultState from './default'
import { md5 } from '~/utils/crypto'
import Issues from '~/store/issues'
import webuser from '~/store/webuser'
import stats from '~/store/stats'
import company from '~/store/company'
import { capitalize } from '~/utils/helpers'

const createStore = () => {
  // let freshState = Object.assign({}, JSON.parse(JSON.stringify(defaultState)))
  return new Vuex.Store({
    state: () => Object.assign({}, JSON.parse(JSON.stringify(defaultState))),
    mutations: {
      SET_LOADING (state, val) {
        state.loading = val
      },
      SET_SIDEBAR_LOCKED (state, val) {
        state.isSidebarLocked = val
      },
      SET_DEFAULT (state, item) {
        let newVal
        if (defaultState[item]) {
          if (typeof defaultState[item] === 'object' &&
            !Array.isArray(defaultState[item])) {
            newVal = JSON.parse(JSON.stringify(defaultState[item]))
          } else {
            newVal = defaultState[item]
          }
          state[item] = newVal
        }
      },
      SET_USER_SETTINGS (state, data) {
        state.userSettings = {...state.userSettings, ...data}
        delete state.userSettings.hash
        let s = Object.keys(state.userSettings)
          .sort()
          .reduce((a, el, index) => a + (index === 0 ? '' : '|') +
            state.userSettings[el], '')
        state.userSettings.hash = md5(s)
      },
      ADD_ASSIGN_USERS (state, users) {
        for (let k in users) {
          const existentUser = state.assignUsers.find(
            el => +el.id === +users[k].id)
          if (!existentUser) {
            users[k].id_projects = [users[k].id_project]
            state.assignUsers.push(users[k])
          } else {
            if (existentUser.id_projects.indexOf(users[k].id_project) === -1) {
              state.assignUsers.splice(state.assignUsers.indexOf(existentUser),
                1)
              existentUser.id_projects.push(users[k].id_project)
              state.assignUsers.push(existentUser)
            }
          }
        }
      },
      DEL_ASSIGN_USERS (state, idProject) {
        for (let k in state.assignUsers) {
          const index = state.assignUsers[k].id_projects.indexOf(idProject)
          if (index !== -1) {
            state.assignUsers[k].id_projects.splice(index, 1)
          }
        }
      },
      SET_ACTIVE_PROJECT (state, uid) {
        state.activeProjectUid = uid
      },
      SET_PROJECTS (state, projects) {
        projects.forEach(el => {
          el.name = capitalize(el.name)
        })
        state.projects = projects
      },
      UPDATE_PROJECT (state, project) {
        let oldProject = state.projects.find(el => +el.id === +project.id)
        if (oldProject) {
          state.projects.splice(state.projects.indexOf(oldProject), 1, project)
          if (!project.is_active && state.activeProjectUid === project.uid) {
            state.activeProjectUid = null
          }
        } else {
          state.projects.push(project)
        }
      },
      SET_COMMENTS (state, comments) {
        state.comments = comments
      },
      ADD_COMMENT (state, comment) {
        if (state.comments.some(el => +el.id === +comment.id)) {
          return
        }
        state.comments.push(comment)
      },
      REMOVE_COMMENT (state, id) {
        const comment = state.comments.find(el => +el.id === +id)
        if (comment) {
          state.comments.splice(state.comments.indexOf(comment), 1)
        }
      },
      SET_SIDEBAR_FORCE_SHOW (state, val) {
        state.sidebarForceShow = val
      },
      RESET (state) {
        // this.replaceState(Object.assign({}, defaultState))
        state = Object.assign(state, defaultState)
      },
      SET_LOCALE (state, val) {
        state.locale = val
      },
      SET_SHOW_EVENTS (state, val) {
        state.showEvents = val
      },
      SET_DRAFTS (state, val) {
        state.drafts = val
      },
      SET_EVENTS_COUNTS (state, val) {
        state.eventsCounts = val
      },
      SOCKET_RELOAD () {
        window && window.location.reload()
      },
      SET_CHAT_ACTIVE (state, val) {
        this.$cookies.set('CHAT_ACTIVE', +val)
        state.isChatActive = +val
      },
      SET_CNT_UNREAD_CHAT_MESSAGES (state, val) {
        state.cntUnreadChatMessages = +val
      },
      SET_CNT_UNREAD_CHAT_CHANNELS (state, val) {
        state.cntUnreadChatChannels = val
      },
      SET_MAIN_CHAT_ID (state, val) {
        state.idMainChat = +val
      },
      SET_CHAT_BIG (state, val) {
        state.isChatBig = +val
      },
      SET_CHAT_SIDEBAR (state, val) {
        state.isChatSidebar = +val
      },
      SET_UNREAD_EVENTS (state, val) {
        state.unreadEvents = val
      },
      REMOVE_UNREAD_EVENT (state, id) {
        let evt = state.unreadEvents.find(el => +el.id === +id)
        if (evt) {
          state.unreadEvents.splice(state.unreadEvents.indexOf(evt), 1)
        }
      },
      ADD_UNREAD_EVENTS (state, val) {
        state.unreadEvents = state.unreadEvents.concat(val).sort((a, b) => +b.id - +a.id)
      },
      SET_UNREAD_EVENTS_PROMISE (state, val) {
        state.unreadEventsPromise = val
      },
      SET_UNREAD_EVENTS_HEADERS (state, val) {
        state.unreadEventsHeaders = val
      },
      SET_COMPANY_USERS (state, val) {
        val.forEach(el => {
          el.name = capitalize(el.name)
        })
        state.companyUsers = val
      },
      ADD_COMPANY_USER (state, val) {
        if (!state.companyUsers.some(el => +el.id === +val.id)) {
          state.companyUsers.push(val)
        }
      },
      SET_COMPANY_PROFILE_OPTIONS (state, val) {
        state.companyProfileOptions = val
      },
      SET_SIDEBAR_WIDTH (state, val) {
        if (val > state.sidebarMinWidth) {
          state.sidebarWidth = val
        } else {
          state.sidebarWidth = state.sidebarMinWidth
        }
      },
      SET_SIDEBAR_ZOOM_WIDTH (state, val) {
        if (val > state.sidebarMinWidth || val === 0) {
          state.sidebarZoomWidth = val
        } else {
          state.sidebarZoomWidth = state.sidebarMinWidth
        }
      },
      SET_EDITOR_CUSTOM_COLORS (state, val) {
        state.editorCustomColors = val
      },
      SET_CHAT_WIDTH (state, val) {
        if (val > state.chatMinWidth) {
          state.chatWidth = val
        } else {
          state.chatWidth = state.chatMinWidth
        }
      },
      SET_CHAT_ZOOM_WIDTH (state, val) {
        if (val > state.chatMinWidth || val === 0) {
          state.chatZoomWidth = val
        } else {
          state.chatZoomWidth = state.chatMinWidth
        }
      },
      SET_CHAT_PINNED (state, val) {
        state.isChatPinned = val
      },
      SET_SIDEBAR_COMPONENT (state, val) {
        state.sidebarComponent = val
      },
      TOGGLE_CHAT_PINNED (state) {
        state.isChatPinned = !state.isChatPinned
      },
      SET_PUSH_ENABLED (state, val) {
        state.pushEnabed = val
      },
      SET_SERVER_DATE (state, val) {
        state.serverDate = val
      },
      SET_EXPIRED_WARNING (state, val) {
        state.expiredWarning = val
      },
      SET_CHAT_MESSAGE (state, val) {
        state.chatMessage = val
      },
      SET_IS_MOBILE_VISIT (state, val) {
        state.isMobileVisit = val
      },
      SET_FILES (state, val) {
        state.files = val
      },
      SET_FILES_HEADERS (state, val) {
        state.filesHeaders = val
      }
    },
    getters: {
      getDefault () {
        return key => defaultState[key] || null
      },
      getUser: state => id => state.assignUsers.find(el => +el.id === +id),
      getCompanyUser: state => id => state.companyUsers.find(el => +el.id === +id),
      activeProject (state) {
        return state.projects.find(el => el.uid === state.activeProjectUid)
      },
      getDateTimeFormatFor: (state) => (name) => {
        return state.dateTimeFormats[name] || state.dateTimeFormats['default']
      },
      cntDashboardEvents (state) {
        let cnt = 0
        for (let k = 0; k < state.eventsCounts.length; k++) {
          let obj = state.eventsCounts[k]
          if (obj) {
            cnt += +obj.count
          }
        }
        return cnt
      },
      cntTitleNotifications (state, getters) {
        return state.cntUnreadChatMessages + getters.cntDashboardEvents
      }
    },
    actions: {
      reset ({commit}) {
        commit('RESET')
        commit('webuser/RESET')
        commit('Issues/RESET')
        commit('stats/RESET')
      },
      getIssues ({state, getters}) {
        let data = getters.getUpdateQuery()
        data['per-page'] = 20
        if (this.app.context.query.page) {
          data.page = this.app.context.query.page
        }
        // query
        let promises = [
          this.$api.get('issues/index', data)
        ]
        if (!getters.getIssuesFilter('is_closed') &&
          !getters.isSearch &&
          !+state.userSettings.grouping_disabled) {
          promises.push(this.$api.get('issues/counts-by-priority', data))
        }
        return Promise.all(promises).then(res => ({
          issues: res[0].data.issues || [],
          headers: res[0].headers,
          counts_by_priority: res[1] ? (res[1].data.counts_by_priority || []) : []
        }))
      },
      updateUserSettings (store, data) {
        return this.$api.put('settings/update', data).then(res => {
          store.commit('SET_USER_SETTINGS', res.data.settings)
        })
      },
      updateUserSettingsSync (store, data) {
        store.commit('SET_USER_SETTINGS', data)
        return this.$api.put('settings/update', data)
      },
      updateUserSettingsCookie (store, data) {
        store.commit('SET_USER_SETTINGS', data)
        for (let k in data) {
          return this.$cookies.set(k, data[k])
        }
        return true
      },
      // Users
      getAssignUsers (store, opt) {
        let projectId, isActive
        if (typeof opt === 'object') {
          ({projectId, isActive} = opt)
        } else {
          projectId = opt
        }
        let params = {id: projectId}
        if (isActive) {
          params['is_active'] = +isActive
        }
        return this.$api.get('users/by-project', params)
          .then((res) => {
            const users = res.data.users
            for (let k in users) {
              users[k].id_project = +projectId
            }
            store.commit('DEL_ASSIGN_USERS', projectId)
            store.commit('ADD_ASSIGN_USERS', users)
          })
      },
      getProjects (store) {
        return this.$api.get('projects')
          .then(response => {
            store.commit('SET_PROJECTS', response.data.projects)
            return response.data.projects
          })
      },
      updateComments (store, {issue}) {
        return this.$api.get('comments', {number: issue}).then((res) => {
          store.commit('SET_COMMENTS', res.data.comments)
        })
      },
      updateUnreadEvents ({state, commit}, {events = true, counts = true, page = 1} = {}) {
        let promises = [null, null]
        if (counts && page === 1) {
          promises[0] = this.$api.get('events/counts-by-project-unread')
        }
        if (events) {
          promises[1] = this.$api.get('events/list', {
            filters: {is_read: 0},
            sort: '-id_issue,-dta',
            'per-page': 50,
            page
          })
        }
        let p = Promise.all(promises).then(res => {
          if (state.unreadEventsPromise && p !== state.unreadEventsPromise) {
            return
          }
          res[0] && commit('SET_EVENTS_COUNTS', res[0].data.counts_by_project)
          res[1] && commit(page === 1 ? 'SET_UNREAD_EVENTS' : 'ADD_UNREAD_EVENTS', res[1].data.events)
          res[1] && commit('SET_UNREAD_EVENTS_HEADERS', res[1].headers)
        })
        commit('SET_UNREAD_EVENTS_PROMISE', p)
        return p
      },
      updateDrafts (store) {
        return this.$api.get('issues-draft').then(res => {
          res && res.data && store.commit('SET_DRAFTS', res.data.drafts)
        })
      },
      removeDraft (store, id) {
        let drafts = Object.assign([], store.state.drafts)
        let removingDraft = drafts.find(el => +el.id === +id)
        if (removingDraft) {
          drafts.splice(drafts.indexOf(removingDraft), 1)
          store.commit('SET_DRAFTS', drafts)
        }
        return this.$api.delete('issues-draft/' + id)
      },
      socket_dashboardEventRead (store) {
        store.dispatch('updateUnreadEvents')
      },
      socket_dashboardEvent (store) {
        store.dispatch('updateUnreadEvents')
      },
      socket_chatOwnChannelRead (store, payload) {
        store.dispatch('updateUnreadChatMessagesCount')
      },
      async socket_changeOnline ({dispatch}, data) {
        dispatch('getCompanyUsers')
      },
      socket_userActivated (store) {
        store.dispatch('getCompanyUsers')
      },
      socket_projectChanged (store) {
        store.dispatch('getProjects').then(() => {
          store.dispatch('reloadChat')
        })
      },
      updateUnreadChatMessagesCount (store) {
        return this.$api.get('/chat-messages/counts-unread-by-channel').then(res => {
          let cnt = 0
          if (res.data.counts_unread_by_channel.length) {
            let items = res.data.counts_unread_by_channel
            for (let i = 0; i < items.length; i++) {
              cnt += +items[i].count
            }
          }
          store.commit('SET_CNT_UNREAD_CHAT_MESSAGES', cnt)
          store.commit('SET_CNT_UNREAD_CHAT_CHANNELS', res.data.counts_unread_by_channel)
        })
      },
      getUser (store, id) {
        return this.$api.get('users/' + id).then(res => res.data.user)
      },
      getUsersByProjectId (store, id, params = {}) {
        return this.$api.get('/users/by-project', {...params, id})
          .then(res => {
            let users = res.data.users
            users.forEach(el => {
              el.name = capitalize(el.name)
            })
            return users
          })
      },
      getCompanyUsers ({commit}) {
        return this.$api.get('/users/by-project').then(res => {
          res.data.users.forEach(user => {
            user.working_sec = null
            if (user.is_timer_online && user.timer_last && user.timer_last.dta_start) {
              user.working_sec = this.$date().diff(this.$date(user.timer_last.dta_start), 'seconds')
            }
          })
          commit('SET_COMPANY_USERS', res.data.users)
        })
      },
      getCompanyProfileOptions ({commit}) {
        return this.$api.get('/companies/profile-options').then(res => {
          commit('SET_COMPANY_PROFILE_OPTIONS', res.data)
        })
      },
      updateInitial ({dispatch}) {
        let promises = [
          dispatch('getProjects'),
          dispatch('getCompanyUsers'),
          dispatch('updateUnreadEvents')
        ]
        return Promise.all(promises)
      },
      socketReconnect ({dispatch, commit}) {
        let promises = [
          dispatch('updateInitial'),
          dispatch('updateUnreadChatMessagesCount'),
          dispatch('reloadChat')
        ]
        return Promise.all(promises)
      },
      reloadChat ({state, commit}) {
        if (!process.server && state.isChatActive && (window && window.chatComponent)) {
          window.chatComponent.clearMessagesScrollStyles()
          window.chatComponent.clearChannelsScrollStyles()
          commit('SET_CHAT_ACTIVE', false)
          window.$nuxt.$nextTick(() => commit('SET_CHAT_ACTIVE', true))
        }
      },
      updateFiles ({commit, getters, state}, {sort, page = 1} = {}) {
        let params = {
          filters: {},
          'per-page': 10,
          page
        }
        if (sort) {
          params.sort = sort
        }
        if (getters.activeProject) {
          params.filters.id_project = getters.activeProject.id
        }
        return this.$api.get('files', params).then(res => {
          const files = res.data.files
          commit('SET_FILES', page === 1 ? files : [...state.files, ...files])
          commit('SET_FILES_HEADERS', res.headers)
          return res.data.files
        })
      }
    },
    modules: {
      Issues,
      webuser,
      stats,
      company
    }
  })
}
export default createStore
