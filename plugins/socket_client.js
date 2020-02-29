import Vue from 'vue'
import socketio from 'socket.io-client'
import VueSocketio from 'vue-socket.io'

let socket = null
let attempts = 0
const maxRetries = 10

const connectSocket = async (app, store) => {
  const query = {
    token: store.state.webuser.tokens.access_token,
    tab_focused: (document.hasFocus() ? 1 : 0),
    uid: store.getters['webuser/company'] && store.getters['webuser/company'].uid
  }
  socket = socketio(process.env.WS_URL, {query: query})
  socket.on('disconnect', reason => {
    if (reason === 'io server disconnect') {
      socket.destroy()
      socket = null
      window.$socket = null
      if (attempts < maxRetries && store.getters['webuser/isGuest']) {
        setTimeout(() => connectSocket(store), 1000)
        attempts++
      }
    }
  })
  const checkAppVersion = () => {
    app.$api.get('misc/versions').then(res => {
      const currentVersion = +res.data.web
      const oldVersion = socket.appVersion
      socket.appVersion = currentVersion
      if (oldVersion && oldVersion !== currentVersion) {
        window.location.reload()
      }
    })
  }
  socket.on('connect', () => {
    checkAppVersion()
  })
  socket.on('reconnect', () => {
    checkAppVersion()
    store.dispatch('socketReconnect')
  })
  window.$socket = socket
  Vue.use(VueSocketio, socket, store)
}

export default ({app, store}) => {
  if (!store.getters['webuser/isGuest'] && process.env.WS_URL) {
    connectSocket(app, store)
  }
}
