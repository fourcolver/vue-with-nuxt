<template>
  <div class="c-work-period b-timer js-timer"
       v-tooltip.top="tooltipOptions" :data-id="timer.id"
       @mousemove="timerHover(timer, $event)"
       @mouseleave="timerLeave(timer, $event)" @mouseenter="timerEnter(timer, $event)"
       @click="timerClick" :class="{'m-manual': timer.is_manual}"
       :style="{left: getTimerShift(timer) + '%', width: (timer.spent_sec / (24 * 36)) + '%'}">
    <span class="e-time js-time" v-if="timer.spent_sec > 3000">{{ secondsToHIS(timer.spent_sec, 'h:i') }}</span>
    <div class="e-line js-line"></div>
    <div v-show="activeThumb.url && activeThumb.id_timer && activeThumb.id_timer === timer.id"
         :style="getThumbPosition(activeThumb)"
         @click="openGallery(timer, activeThumb)"
         class="b-thumb-window js-thumb-window">
      <img v-if="activeThumb.id_timer && activeThumb.id_timer === timer.id"
           :width="activeThumb.width + 'px'"
           :height="activeThumb.height + 'px'"
           :src="getThumbUrl(activeThumb)"/>
    </div>
    <screenshots-viewer @prev="loadScreensForTimer(null, null, false)"
                        @next="loadScreensForTimer(null, null, true)"
                        :screens="screens"
                        :headers="headers"
                        ref="viewer"
                        :prefetch="true"
                        :currentUser="user"></screenshots-viewer>
  </div>
</template>

<script>
  import { secondsToHIS } from '~/utils/time'
  import ScreenshotsViewer from './ScreenshotsViewer.vue'

  export default {
    components: {ScreenshotsViewer},
    name: 'work-period',
    data () {
      return {
        activeThumb: {},
        thumbs: [],
        thumbsLoading: false,
        screens: [],
        headers: {},
        isWithoutThumbs: false,
        isHover: false
      }
    },
    props: {
      timer: Object,
      user: Object
    },
    methods: {
      timerHover (timer, e) {
        if (!e.target.classList || !e.target.classList.contains('js-timer')) {
          return
        }
        const r = e.target.getBoundingClientRect()
        let percent = (e.clientX - r.left) / r.width * 100
        if (percent < 0) {
          percent = 0
        }
        e.target.querySelector('.js-line').style.left = percent + '%'
        if (this.thumbs.length) {
          this.setActiveThumb(this.thumbs[Math.floor(this.thumbs.length * percent * 0.01)])
        }
        this.$emit('hover', e)
      },
      timerClick (e) {
        const allowedClasses = ['js-timer', 'js-line', 'js-time']
        if (e.target.classList && allowedClasses.some(cls => e.target.classList.contains(cls))) {
          if (this.activeThumb.id) {
            this.openGallery(this.timer, this.activeThumb)
          }
        }
      },
      timerLeave () {
        this.$emit('leave')
        this.isHover = false
        this.activeThumb = {}
      },
      timerEnter (timer, e) {
        this.$emit('enter')
        this.isHover = true
        let load = this.loadThumbs(timer)
        if (load) {
          load.then(() => {
            this.timerHover(timer, e)
          })
        }
      },
      getTimerShift (timer) {
        let dayTimeStart = this.$date(timer.dta_start).startOf('day').unix()
        let timerTime = this.$date(timer.dta_start).unix()
        // сколько минут прошло с начала выбранных суток
        let diff = Math.round((timerTime - dayTimeStart) / 60)
        // сколько прошло с начала суток в процентах
        return (diff / (24 * 60)) * 100
      },
      loadThumbs (timer) {
        if (this.thumbsLoading || this.thumbs.length) {
          return
        }
        this.thumbsLoading = true
        const filters = {
          dta_from: this.$date(timer.dta_start).iso(),
          dta_to: this.$date(timer.dta_end).iso(),
          id_user: this.userId
        }
        return this.$api.get('timers-screens/aggregate-thumbs', {
          filters,
          interval: 180
        }).then(res => {
          let screens = res.data.screens
          screens.map(el => {
            el.id_timer = timer.id
          })
          this.thumbs = screens
          if (!this.thumbs.length) {
            this.isWithoutThumbs = true
          }
        }).finally(() => {
          this.thumbsLoading = false
        })
      },
      setActiveThumb (thumb) {
        let activeThumb = {...thumb}
        if (!activeThumb.id_timer) {
          return
        }
        const rect = this.$el.getBoundingClientRect()
        const thumbWindow = this.$el.querySelector('.js-thumb-window')
        let border = 2
        if (thumbWindow) {
          const computedBorder = parseFloat(window.getComputedStyle(thumbWindow).borderTopWidth)
          if (computedBorder > 0) {
            border = computedBorder
          }
        }
        if (rect.top - (activeThumb.height + border) > 0) {
          activeThumb.top = -1 * (activeThumb.height + border)
        } else {
          activeThumb.top = parseFloat(window.getComputedStyle(this.$el).height)
        }
        if (rect.right + ((activeThumb.width + border * 2) / 2) > window.innerWidth) {
          activeThumb.right = 0
        }
        this.activeThumb = activeThumb
      },
      getThumbPosition (thumb) {
        let ret = {}
        if (thumb.top) {
          ret.top = thumb.top + 'px'
        }
        if (typeof thumb.right !== 'undefined') {
          ret.right = thumb.right !== 0 ? thumb.right + 'px' : thumb.right
        }
        return ret
      },
      getThumbUrl (thumb) {
        return thumb.url + (thumb.url.indexOf('?') === -1 ? '?' : '&') + 'access_token=' + this.$store.state.webuser.tokens.access_token
      },
      openGallery (timer, screen) {
        let load = this.loadScreensForTimer(timer, screen)
        if (load) {
          load.then(res => this.$refs.viewer.show(screen))
        }
      },
      loadScreensForTimer (timer = null, screen = null, isNextPage = null) {
        if (!timer) {
          timer = this.screensTimer
        }
        if (!timer) {
          return
        }
        let params = {
          filters: {
            dta_from: this.$date(timer.dta_start).iso(),
            dta_to: this.$date(timer.dta_end).iso(),
            id_user: this.userId
          },
          sort: 'dta'
        }
        if (screen) {
          params.id_screen = screen.id
        }
        if (isNextPage !== null) {
          const currentPage = this.headers['x-pagination-current-page'] || 1
          params.page = isNextPage ? currentPage + 1 : currentPage - 1
        }
        this.screensTimer = timer
        return this.$api.get('timers-screens', params).then(res => {
          if (isNextPage === null) {
            this.screens = res.data.screens
          } else {
            if (isNextPage) {
              this.screens = [...this.screens, ...res.data.screens]
            } else {
              this.screens = [...res.data.screens, ...this.screens]
            }
          }
          this.headers = res.headers
        })
      },
      secondsToHIS
    },
    computed: {
      userId () {
        return this.user.id
      },
      tooltipOptions () {
        return {
          content: this.$t('work_period.no_screens'),
          autoHide: true,
          delay: {show: 300, hide: 0},
          boundariesElement: 'body',
          trigger: 'manual',
          show: this.isWithoutThumbs && this.isHover
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-work-period {
    position: absolute;
    top: 5px;
    background: #589ae8;
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &.m-manual {
      background: rgb(238, 160, 34);
    }
    > .e-time {
      color: #fff;
      font-weight: bold;
      font-size: .7em;
      pointer-events: none;
    }
    .e-line {
      position: absolute;
      width: 2px;
      background: #000;
      height: 100%;
      display: none;
      max-width: 100%;
    }
    &:hover .e-line {
      display: block;
    }
    .b-thumb-window {
      display: none;
      position: absolute;
      z-index: 104;
      border: 2px solid #000;
      cursor: pointer;
    }
    &:hover {
      .b-thumb-window {
        display: block;
        img {
          display: block;
        }
      }
    }
  }
</style>
