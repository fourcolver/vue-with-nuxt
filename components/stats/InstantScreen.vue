<template>
  <div v-if="user" class="c-instant-screen" :class="{'disabled': disabled || aggregated}" @click="takeScreen"
       :style="{width: width + 'px'}" v-tooltip="tooltipOptions">
      <div class="e-label">{{$t('instant_screen.title')}}</div>
      <div class="b-img-wrap" :style="{width: (width - 22) + 'px', height: height + 'px'}">
          <div class="b-center" v-if="!takingScreen">
              <div class="bu-camera" :style="{margin: width * 0.05 + 'px 0'}"></div>
              <div v-if="disabled && !aggregated" class="disabled">{{$t('instant_screen.unavailable')}}</div>
              <div v-if="aggregated" class="disabled">{{$t('instant_screen.aggregated')}}</div>
          </div>
          <div class="b-center" v-else>
              <quwi-spinner></quwi-spinner>
          </div>
      </div>
      <div class="b-bottom">
          <div class="b-time">{{formatDate(new Date(), 'H:mm')}}</div>
      </div>
  </div>
</template>

<script>
  import QuwiSpinner from '../Spinner.vue'
  import listeners from '~/utils/mixins/listeners'
  import { mapGetters } from 'vuex'
  import { formatDate } from '~/utils/time'

  export default {
    components: {QuwiSpinner},
    name: 'instant-screen',
    props: {
      user: {
        default: () => {}
      },
      width: null,
      height: null,
      aggregated: false
    },
    sockets: {
      async instant_screen_done (data) {
        if (!this.takingScreen) {
          return
        }
        if (data && data.id_screen) {
          let screen = await this.$api.get('timers-screens', {filters: {id: data.id_screen}}).then(res => res.data.screens.length ? res.data.screens[0] : null)
          if (+screen.id_user === +this.user.id) {
            screen.is_new = 1
            screen.is_instant = 1
            this.$emit('add', screen)
            this.takingScreen = false
            if (this.timeout) {
              window.clearTimeout(this.timeout)
              this.timeout = null
            }
          }
        }
      },
      change_online (data) {
        if (this.user && +this.user.id === +data.id_user) {
          this.isTimerOnline = !!+data.is_timer_online
        }
      }
    },
    data () {
      return {
        screenFailed: false,
        takingScreen: false,
        isScreenTimeout: false,
        forcePopoverShow: false,
        timeout: null,
        isTimerOnline: false
      }
    },
    mixins: [listeners],
    methods: {
      takeScreen () {
        if (this.disabled) {
          return
        }
        this.takingScreen = true
        this.$socket.emit('instant_screen_request', {id_recipients: [this.user.id]})
        this.timeout = window.setTimeout(() => {
          this.takingScreen = false
          this.screenFailed = true
          this.forcePopoverShow = true
        }, 5000)
      },
      formatDate (dta, format) {
        return formatDate(dta, format, this.$i18n.locale)
      }
    },
    computed: {
      ...mapGetters({
        checkAccess: 'webuser/checkAccess'
      }),
      hasAccess () {
        return this.checkAccess('disc_space') && this.checkAccess('instant_screen')
      },
      disabled () {
        return !this.hasAccess || this.screenFailed || !this.user || !this.isTimerOnline
      },
      tooltipOptions () {
        if (!this.disabled) {
          return {}
        }
        let content = ''
        if (!this.hasAccess) {
          if (!this.checkAccess('disc_space')) {
            content += this.$t('plan_no_disc_space_owner')
          } else if (!this.checkAccess('instant_screen')) {
            content += this.$t('plan_no_access')
          }
          content += `<br><a href="#" data-nuxt-link="/upgrade">${this.$t('plan_upgrade_link')}</a>`
        } else {
          content = this.$t('instantscreen.' + (this.screenFailed ? 'failed' : (this.aggregated ? 'aggregated' : 'not_working')))
        }
        return {
          content,
          show: this.forcePopoverShow,
          trigger: this.forcePopoverShow ? 'manual' : 'hover',
          delay: {show: 300, hide: 50}
        }
      }
    },
    mounted () {
      window.instantScreen = this
      let listener = this.addListener(document, 'click', () => {
        if (this.forcePopoverShow) {
          this.forcePopoverShow = null
          this.removeListener(listener)
        }
      })
    },
    created () {
      if (this.user) {
        this.isTimerOnline = !!+this.user.is_timer_online
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-instant-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background: #fff;
    border-radius: 10px;
    border: 1px solid #dedede;
    flex-direction: column;
    margin: 0 5px;
    margin-bottom: 10px;
    .hover-mixin();
    &.disabled {
      cursor: default;

      &:hover {
        background: #fff;
      }
    }
    .e-label {
      font-size: 0.9em;
    }
    .b-img-wrap {
      margin-top: 10px;
      margin-bottom: 10px;
      background: #fafafa;
      border: 1px solid #dedede;
      align-items: center;
      display: flex;
      font-size: .9em;

      .b-center {
        text-align: center;
        flex: 1;

        .bu-camera {
          color: #c44512;
          font-size: 2.5em !important;
          margin: 20px 0;
        }

        .disabled {
          color: #c44512;
        }

        .c-spinner {
          color: @basic-blue;
          width: 32px !important;
          height: 32px !important;
          display: inline-flex;

          div {
            width: 32px !important;
            height: 32px !important;
          }
        }
      }
    }
    .b-bottom {
      text-align: left;
      width: 100%;

      .b-time {
        font-size: 0.9em;
      }
    }
  }
</style>
