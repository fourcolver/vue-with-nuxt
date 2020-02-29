<template>
  <no-ssr>
    <div class="c-push-warning m-warning-bar">
      <transition name="slide">
        <template v-if="!closed && isUserQualify && isRouteQualify && status == 'default'">
          <div class="b-row m-blue" v-if="!showGreen">
            Quwi {{ $t('pushwarning.need_perm') }} <a
            @click="enable">{{ $t('pushwarning.enable_link') }}</a>
            <div class="e-close" @click="showGreen = true">
              &times;
            </div>
          </div>
          <div class="b-row m-green visible" v-if="showGreen">
            {{ $t('pushwarning.recommend') }}
          <a @click="enable">{{ $t('pushwarning.enable_link_short') }}</a>
          <span>&bull;</span>
            <a @click="closed = true">{{ $t('pushwarning.ask')}}</a>
            <span>&bull;</span>
            <a @click="deny">{{ $t('pushwarning.never_ask')}}</a>
          </div>
        </template>
      </transition>
    </div>
  </no-ssr>
</template>

<script>
  export default {
    name: 'push-warning',
    data () {
      return {
        status: null,
        showGreen: false,
        isTemporaryDisabled: false,
        closed: false,
        initialStatus: null
      }
    },
    methods: {
      enable () {
        if (this.isTemporaryDisabled) {
          alert(this.$t('pushwarning.temp_denied_alert'))
        }
        if (typeof window.OneSignal.registerForPushNotifications === 'function') {
          try {
            window.OneSignal.registerForPushNotifications()
          } catch (e) {
            console.error(e)
          }
        }
      },
      deny () {
        window.localStorage && window.localStorage.setItem('pushWarningHidden', 1)
        this.closed = true
      },
      updateStatus () {
        const isHidden = window.localStorage && window.localStorage.getItem('pushWarningHidden')
        if (isHidden) {
          return
        }
        window.OneSignal && window.OneSignal.push(['getNotificationPermission', perm => {
          this.status = perm
          if (this.status !== 'granted') {
            this.$store.commit('SET_PUSH_ENABLED', false)
          }
        }])
      }
    },
    computed: {
      isUserQualify () {
        return !this.$store.getters['webuser/isGuest'] && !this.$store.state.webuser.isFromControl
      },
      isRouteQualify () {
        return this.$route.path.indexOf('login') === -1 && this.$route.path.indexOf('upgrade') === -1
      }
    },
    mounted () {
      window.pushWarning = this
      let isDebug = false
      window.OneSignal.push(() => {
        window.OneSignal.on && window.OneSignal.on('subscriptionChange', isSubscribed => {
          if (isSubscribed) {
            if (isDebug) {
              console.log('subscriptionChange event. new user allow. created profile')
            }
            window.OneSignal.getUserId(userId => {
              if (isDebug) {
                console.log('getUserId event. OneSignal User ID:', userId)
              }
            })
          } else {
            window.OneSignal.getUserId(userId => {
              if (isDebug) {
                console.log('Unsubscribe event. OneSignal User ID:', userId)
              }
            })
          }
          this.updateStatus()
        })
      })
      window.OneSignal.push(() => {
        window.OneSignal.on('notificationPermissionChange', e => {
          if (isDebug) {
            console.log('notificationPermissionChange')
            console.log(e)
          }
          if (e && e.to) {
            this.status = e.to
            if (this.status === 'default' && this.initialStatus === 'default') {
              this.isTemporaryDisabled = true
            } else if (this.status === 'granted') {
              window.localStorage && window.localStorage.removeItem('pushWarningHidden')
            }
          }
        })
      })
      this.updateStatus()
      this.initialStatus = this.status
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/warning_bar.less';
  .c-push-warning {
    .m-blue {
      background: #2c9edf;
    }
    .m-green {
      background: #008851;
    }
  }
</style>
