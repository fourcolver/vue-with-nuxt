const PLAYER_ID_KEY = 'push.onesignal_id'
const CACHE_TIME_KEY = 'push.onesignal_cache_time'

export const getCachedOnesignalId = () => {
  if (process.server || !window || !window.localStorage || !window.OneSignal) {
    return null
  }
  if ((window.Notification && window.Notification.permission !== 'granted') || !window.$nuxt.$store.state.pushEnabled) {
    return null
  }
  let playerId = window.localStorage.getItem(PLAYER_ID_KEY)
  let cacheTime = 0
  if (playerId) {
    cacheTime = window.localStorage.getItem(CACHE_TIME_KEY)
  }
  if (!playerId || !cacheTime || Math.floor(+(new Date()) / 1000) > cacheTime + 3600) {
    invalidateOnesignalCache(true)
  }
  return playerId || null
}

export const invalidateOnesignalCache = (getNew = false) => {
  window.localStorage.removeItem(PLAYER_ID_KEY)
  window.localStorage.removeItem(CACHE_TIME_KEY)
  if (getNew) {
    window.OneSignal.push(() => {
      window.OneSignal.getUserId(userId => {
        if (userId) {
          window.localStorage.setItem(PLAYER_ID_KEY, userId)
          window.localStorage.setItem(CACHE_TIME_KEY, Math.floor(+(new Date() / 1000)))
        }
      })
    })
  }
}
