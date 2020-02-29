class TitleNotification {
  constructor (context) {
    this.currentInterval = null
    this.originalTitle = ''
    this.newTitle = ''
    this.hideOnVisible = true
  }

  update (text, period = 1000, showOnActive = false) {
    if (this.currentInterval) {
      this.show(text, period, showOnActive)
    }
  }

  show (text, period = 1000, showOnActive = false) {
    if (!text) {
      return false
    }
    this.hideOnVisible = !showOnActive
    if (!showOnActive && this.isTabActive()) {
      return false
    }
    if (this.currentInterval) {
      this.hide()
    }
    this.originalTitle = document.title.replace(/^\(\d+\) /, '')
    this.newTitle = text.replace('%title%', this.originalTitle)
    this.currentInterval = window.setInterval(() => {
      if (document.title === this.originalTitle) {
        document.title = this.newTitle
      } else {
        document.title = this.originalTitle
      }
    }, period)
  }

  hide (clear = false) {
    if (this.currentInterval) {
      window.clearInterval(this.currentInterval)
      this.currentInterval = null
      document.title = clear ? this.newTitle.replace(/^\(\d+\) /, '') : this.newTitle
    } else if (clear) {
      document.title = (this.newTitle || document.title).replace(/^\(\d+\) /, '')
    }
  }

  isTabActive () {
    if (document.visibilityState) {
      return document.visibilityState === 'visible'
    } else {
      return !!window.isTabActive
    }
  }

  onVisible () {
    if (this.hideOnVisible && this.currentInterval) {
      this.hide()
    }
  }

  trackVisibility () {
    if (typeof document.onvisibilitychange !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.onVisible()
        }
      })
    }
    window.addEventListener('focus', () => this.onVisible())
  }
}

const showTitleNotification = (cnt, prevCnt) => {
  if (!process.server && window.$nuxt && window.$nuxt.$titleNotification) {
    const not = window.$nuxt.$titleNotification
    if (!cnt) {
      not.hide(true)
    } else if (cnt < prevCnt) {
      not.update('(' + cnt + ') %title%')
    } else if (cnt > prevCnt) {
      not.show('(' + cnt + ') %title%')
    }
  }
}

export default (context, inject) => {
  let obj = new TitleNotification(context)
  obj.trackVisibility()
  inject('titleNotification', obj)
  let prevCnt = context.store.getters.cntTitleNotifications
  const mutations = ['SET_EVENTS_COUNTS', 'SET_CNT_UNREAD_CHAT_MESSAGES']
  context.store.subscribe((mutation, state) => {
    if (mutations.includes(mutation.type)) {
      let currentCnt = context.store.getters.cntTitleNotifications
      showTitleNotification(currentCnt, prevCnt)
      prevCnt = currentCnt
    }
  })
}
