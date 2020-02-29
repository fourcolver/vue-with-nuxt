import axios from 'axios'
import { raiseError } from '~/utils/helpers'
import { getCachedOnesignalId } from '~/utils/push'

const buildQueryString = (params, namespace) => {
  let qs = namespace ? '' : '?'
  for (let k in params) {
    if (!params.hasOwnProperty(k)) {
      continue
    }
    let val = params[k]
    if (typeof val === 'object') {
      qs += buildQueryString(val, k)
    } else if (val !== null && typeof val !== 'undefined') {
      qs += (namespace ? `${namespace}[${k}]` : k) + '=' + val + '&'
    }
  }
  namespace || qs.replace(/&$/, '')
  return qs
}

export default ({app, store, redirect, error}, inject) => {
  const http = axios.create({
    baseURL: process.env.API_URL
  })
  http.interceptors.request.use(
    async config => {
      const token = store.state.webuser.tokens && store.state.webuser.tokens.access_token
      if (typeof token === 'string') {
        config.headers.Authorization = `Bearer ${token}`
      }
      const uid = store.getters['webuser/company'] && store.getters['webuser/company'].uid
      if (uid && !config.headers['Client-Company']) {
        config.headers['Client-Company'] = uid
      }
      if (store.state.userSettings.lang) {
        config.headers['Client-Language'] = store.state.userSettings.lang
      } else if (!process.server) {
        config.headers['Client-Language'] = app.$cookies.get('locale') || store.state.locale
      }
      if (!process.server) {
        config.headers['Client-Timezone-Offset'] = -1 * (new Date()).getTimezoneOffset()
        const onesignalId = getCachedOnesignalId()
        if (onesignalId) {
          config.headers['Push-Token'] = onesignalId
        }
      }
      return config
    },
    err => {
      return Promise.reject(err)
    }
  )

  http.interceptors.response.use(
    async res => {
      if (!res || !res.data) {
        return Promise.reject(new Error('empty data'))
      } else {
        if (res.config.url.indexOf('auth/init') === -1) {
          const updateTime = res.headers['company-updated']
          const company = store.getters['webuser/company']
          if (updateTime && company && company.updated) {
            if (+updateTime !== +company.updated) {
              await store.dispatch('webuser/authInit')
            }
          }
        }
        if (res.headers['company-current-date']) {
          store.commit('SET_SERVER_DATE', res.headers['date'])
        }
        return res
      }
    },
    async err => {
      const code = parseInt(err.response && err.response.status)
      if (!code) {
        return Promise.reject(err)
      }
      // define status code for errorMiddleware to except status 500
      err.statusCode = err.response.data ? err.response.data.status : err.response.status
      err.message = err.response.data ? err.response.data.message : err.response.statusText
      err.name = err.response.data ? err.response.data.name : err.response.statusText
      // we can define default behaviour for non server requests here
      // this.$api.get(url, query, { customErrorHandling: true })
      if (!err.response.config.customErrorHandling) {
        switch (code) {
          case 401:
            await store.dispatch('webuser/logout')
            if (process.server) {
              redirect('/login')
            } else {
              window.location.href = '/login'
            }
            break
          case 410:
            if (process.server) {
              raiseError(error, err)
            } else {
              app.$alert({
                text: app.i18n.t('You are trying to access expired page'),
                yesLabel: app.i18n.t('Reload')
              }).then(() => window.location.reload())
            }
            break
          case 404:
          case 500:
            raiseError(error, err)
            break
        }
      }
      // always return promise
      // and we need a catch() inside every asyncData anyway
      return Promise.reject(err)
    }
  )

  const CancelToken = axios.CancelToken
  var source
  const api = {
    get: (url, query, params) => {
      if (query) {
        url += buildQueryString(query)
      }
      return http.get(url, params)
    },
    post: async (url, data, params, cancelUploadFlag) => {
      if (cancelUploadFlag) {
        source.cancel('Operation canceled by the user.')
      } else {
        source = CancelToken.source()
        params = {...params, cancelToken: source.token}
        return http.post(url, data, params)
      }
    },
    put: (url, data, params) => {
      return http.put(url, data, params)
    },
    delete: (url, data) => {
      return http.delete(url, data)
    }
  }

  inject('api', api)
}
