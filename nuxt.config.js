const path = require('path')
const nodeExternals = require('webpack-node-externals')
const { existsSync } = require('fs')

require('dotenv').config()

module.exports = {
  debug: true,
  /*
  ** Headers of the page
  */
  head: {
    title: 'Quwi',
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {
        hid: 'description',
        name: 'description',
        content: 'Quwi - project management and time tracking. \n' +
        'Best and easy to use project management platform with time tracking, realtime chat and filesharing features you will love.'
      }
    ],
    link: [
      {hid: 'favicon', rel: 'icon', type: 'image/x-icon', href: '/favicon.png'}
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: {color: '#bb381d'},
  plugins: [
    {src: '~/plugins/i18n.js'},
    {src: '~/plugins/confirm.js', ssr: false},
    {src: '~/plugins/axios_api.js'},
    // {src: '~/plugins/sync_store.js'},
    {src: '~/plugins/custom_directives.js'},
    {src: '~/plugins/issues_filters.js'},
    {src: '~/plugins/vue-notification.js'},
    {src: '~/plugins/quwi_link.js'},
    {src: '~/plugins/vue-infinite-scroll.js', ssr: false},
    {src: '~/plugins/title_notifications.js', ssr: false},
    {src: '~/plugins/autofocus.js', ssr: false},
    {src: '~/plugins/context_menu.js', ssr: false},
    {src: '~/plugins/log_activity.js', ssr: false},
    {src: '~/plugins/log_errors.js', ssr: false},
    {src: '~/plugins/socket_client.js', ssr: false},
    {src: '~/plugins/company_date.js'},
    {src: '~/plugins/directives/autocomplete.js', ssr: false},
    {src: '~/plugins/directives/tooltip.js', ssr: false},
    {src: '~/plugins/nuxt_link.js', ssr: false},
    {src: '~/plugins/vue-clipboard.js', ssr: false},
    {src: '~/plugins/directives/allowed_symbols.js', ssr: false},
    {src: '~/plugins/quwi_editor.js'},
    {src: '~/plugins/prevent_ctrlA.js', ssr: false}
  ],
  router: {
    middleware: [
      'mobile_redirect',
      'check_auth', // auth from cookie on server side
      'check_browser', // auth from cookie on server side
      'company_redirect', // check url and add company uid to it
      'validate_project' // add current project to store
    ],
    extendRoutes (routes, resolve) {
      routes.push({
        name: 'stats.user',
        path: '/my-stats',
        component: resolve(__dirname, 'pages/stats/user.vue')
      })
      routes.push({
        path: '/d',
        name: 'download.short',
        component: resolve(__dirname, 'pages/download.vue')
      })
      routes.push({
        name: 'unsubscribe-user',
        path: '/unsubscribe/:slug/:action/:id',
        component: resolve(__dirname, 'pages/unsubscribe.vue')
      })
      routes.push({
        name: 'restore-password',
        path: '/restore/:token',
        component: resolve(__dirname, 'pages/restore.vue')
      })
      routes.push({
        name: 'users.create',
        path: '/users/create',
        component: resolve(__dirname, 'pages/users/edit.vue')
      })
      routes.forEach(route => {
        let newRoute = { ...route, path: '/:company' + route.path, name: 'company.' + route.name }
        routes.push(newRoute)
      })
      // these routes should not exists without company
      routes.push({
        name: 'company.issues.all',
        path: '/:company/p/all',
        component: resolve(__dirname, 'pages/issues/index.vue')
      })
      routes.push({
        name: 'company.issues.project',
        path: '/:company/p/:project',
        component: resolve(__dirname, 'pages/issues/index.vue')
      })
      routes.push({
        name: 'company.comments.project',
        path: '/:company/p/:project/comments',
        component: resolve(__dirname, 'pages/comments/index.vue')
      })
      routes.push({
        name: 'company.draw-screen-hash',
        path: '/:company/draw-screen/:hash',
        component: resolve(__dirname, 'pages/draw-screen.vue')
      })
    }
  },
  css: [
    {src: '~assets/css/common.less', lang: 'less'},
    {src: '~assets/css/libs/tooltip.less', lang: 'less'},
    {src: '~assets/css/libs/vuebar.less', lang: 'less'},
    {src: '~assets/css/quwi-font.css'}
  ],
  modules: [
    'nuxtjs-dotenv-module',
    'cookie-universal-nuxt',
    '@nuxtjs/onesignal',
    ['@nuxtjs/pwa', { icon: false }],
    ['@nuxtjs/google-analytics', {
      id: 'UA-737594-21',
      debug: {
        // enabled: true,
        sendHitTask: process.env.NODE_ENV ? process.env.NODE_ENV === 'production' : false
      }
    }]
  ],
  oneSignal: {
    init: {
      appId: process.env.ONESIGNAL_APP_ID || 'b64e6414-71ff-443e-a7e4-08b20a5dcd53',
      allowLocalhostAsSecureOrigin: true,
      autoRegister: false,
      welcomeNotification: {
        disable: true
      },
      cdn: process.env.NODE_ENV === 'production',
      OneSignalSDK: process.env.NODE_ENV === 'production' ? 'https://cdn.onesignal.com/sdks/OneSignalSDK.js' : null
    }
  },
  /*
  ** Build configuration
  */
  build: {
    devtool: 'eval',
    vendor: ['vue-notification', 'vue-infinite-scroll'],
    /*
    ** Run ESLint on save
    */
    styleResources: {
      less: './assets/css/variables.less'
    },

    extend (config, ctx) {
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }

      if (ctx.isServer) {
        // Rewrite externals for use quwi-editor from source
        config.externals = []
        this.options.modulesDir.forEach(dir => {
          if (existsSync(dir)) {
            config.externals.push(
              nodeExternals({
                whitelist: [/es6-promise|quwi-editor|\.(?!(?:js|json)$).{1,5}$/i],
                modulesDir: dir
              })
            )
          }
        })
      }

      const babelLoader = config.module.rules.find((rule) => rule.loader === 'babel-loader')
      babelLoader.exclude = /node_modules(?!(\/|\\)quwi-editor)/

      config.resolve.alias['utils'] = path.resolve(__dirname, 'utils')
      config.resolve.alias['components'] = path.resolve(__dirname, 'components')
      config.resolve.alias['store'] = path.resolve(__dirname, 'store')
      if (process.env.EDITOR_PATH) {
        config.resolve.alias['quwi-editor'] = process.env.EDITOR_PATH + '/src/wrapper'
      }
    }
  }
}
