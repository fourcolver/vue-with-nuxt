import Cookie from 'cookie'
import storeDefaults from '~/store/default'

export default (context) => {
  let {req, store} = context
  if (process.server && req.headers.cookie) {
    const storeCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith('vuex='))
    if (storeCookie) {
      let parsed = Cookie.parse(storeCookie)
      if (parsed && parsed.vuex) {
        let savedValues = JSON.parse(parsed.vuex)
        if (savedValues) {
          for (let k in savedValues) {
            if (storeDefaults[k] && typeof (storeDefaults[k]) === 'object') {
              store.state[k] = {...storeDefaults[k], ...savedValues[k]}
            } else {
              store.state[k] = savedValues[k]
            }
          }
        }
      }
    }
  } else if (!process.server) {
    const storage = window.localStorage.vuex
    if (storage) {
      const savedValues = JSON.parse(storage)
      for (let k in savedValues) {
        store.state[k] = savedValues[k]
      }
    }
  }
  // process is global for all requests since application start
  // this way context (and store) is being mixed between different requests {users)
  // process.ctx = context
  // if (!process.server) {
  //   window.ctx = context
  // }
}
