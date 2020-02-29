export default () => {
  window.isTabActive = document.hasFocus()
  window.addEventListener('focus', function () {
    window.isTabActive = true
    sendActivity()
  })
  window.addEventListener('blur', function () {
    window.isTabActive = false
    sendActivity()
  })
  const events = ['keydown', 'mousemove', 'touchstart']
  for (let k = 0; k < events.length; k++) {
    document.addEventListener(events[k], e => {
      window.dtaLastActivity = +(new Date())
      window.isTabActive = true
    })
  }
  const sendActivity = () => {
    const getIsActive = () => {
      if (!window.isTabActive) {
        return false
      } else return !!(window.dtaLastActivity && +(new Date()) - window.dtaLastActivity < 15000)
    }
    window.$socket && window.$socket.emit('activity', {
      // id_user: store.state.webuser.user.id,
      is_active: getIsActive(),
      tab_focused: window.isTabActive
    })
  }
  window.lastSeenTimer = setInterval(sendActivity, 60000)
}
