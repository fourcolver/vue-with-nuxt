<template>

  <div class="app-stats-index">
    <div class="b-center">
      <div class="b-top-menu">
        <div class="b-left">
          <date-filter :date="date" @change="date => changeDate(date)"></date-filter>
        </div>
        <div class="b-right">
          <div class="b-hours">
            <div class="e-hour" v-for="hour in hours">
              <span class="e-digit"
                    :class="{current: isToday && +hour === +getCurrentHour()}">{{ hour < 10 ? '0' + hour : hour
                }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="b-users" :class="{loading: timersLoading}">
        <div class="b-user-wrap" v-for="(user, index) in users">
          <div class="e-play" @click="playTimelapseVideo(user)"
               :class="{inactive: isPlayBtnInactive(user)}"
               v-tooltip="playBtnTooltip(user)">
            <i class="bu-play-circle" v-if="user.id !== loadingVideoUser"></i>
            <quwi-spinner v-else></quwi-spinner>
          </div>
          <div class="b-item"
               v-if="checkAccess('owner') || +loggedUser.id === +user.id"
               @click="$router.push(getUserScreensRoute(user))">
            <div class="b-user">
              <div class="b-left">
                <avatar :userId="user.id" size="35"></avatar>
              </div>
              <div class="b-middle str-truncate">
                <div class="e-name">{{ user.name }}</div>
                <div class="e-task" v-if="+user.is_timer_online">
                  <span v-if="user.timer_last"><span v-if="user.timer_last.issue_number">{{user.timer_last.issue_number + '. '}}</span>{{ user.timer_last.working_on }}</span>
                </div>
                <div class="e-worked" v-else>
                <span v-if="user.dta_timer_activity">
                  {{ $tc('user.worked.ago', true, {date: $dateAgo(user.dta_timer_activity)}) }}
                </span>
                  <span v-else>
                  {{ $t('never worked') }}
                </span>
                </div>
              </div>
              <div class="b-right">
                <i class="bu-clock" :class="{working: user.is_timer_online}"></i>
                <span class="e-worked-time">
                {{ timers[+user.id] ? secondsToHIS(timers[+user.id].time, 'h:i', false) : '0:00' }}
              </span>
              </div>
            </div>
            <div class="b-timeline">
              <div class="b-grid">
                <div class="e-hour" v-for="hour in hours"></div>
              </div>
              <div class="b-timers" v-show="!timersLoading"
                   v-if="timers[+user.id] && timers[+user.id].timers.length">
                <work-period @click.stop.native="" v-for="timer in timers[+user.id].timers" :timer="timer"
                             :user="user"
                             :key="timer.id"></work-period>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="b-screenshots-wrapper">
        <screenshots-list v-if="preparedScreenshots.length"
                          @screenClick="item => $refs.viewer.show(item)"
                          :showUser="true" :showDate="true" :showCheckbox="false"
                          :showTool="false"
                          :modeViewScreens="0"
                          class="b-screenshots" :class="{loading: screensLoading}"
                          :screens="preparedScreenshots" :headers="headers"
                          @delete="s => deleteScreens(s)"
        ></screenshots-list>
        <div class="b-empty" v-else>{{ $t('No screenshots found') }}</div>
      </div>
    </div>
    <screenshots-viewer :selectable="true" ref="viewer" :screens="screens" :singlePage="true"
                        :headers="headers"></screenshots-viewer>
  </div>
</template>

<script>
  import Pagination from 'components/Pagination'
  import Dropdown from 'components/Dropdown.vue'
  import { secondsToHIS } from 'utils/time'
  import ScreenshotsList from 'components/stats/ScreenshotsList.vue'
  import DateFilter from 'components/stats/DateFilter.vue'
  import Avatar from 'components/Avatar.vue'
  import moment from 'moment'
  import { mapState, mapActions, mapGetters } from 'vuex'
  import { raiseError, getErrorFromResponse } from '~/utils/helpers'
  import { getNoDiscHint } from '~/utils/issues'
  import WorkPeriod from '../../components/stats/WorkPeriod.vue'
  import { mergeNearTimers } from '~/utils/stats'
  import QuwiSpinner from '../../components/Spinner.vue'
  import ScreenshotsViewer from '../../components/stats/ScreenshotsViewer.vue'

  const getDateFilter = (app, date) => {
    let d = app.$date(date).startOf('day')
    return {
      dta_from: d.iso(),
      dta_to: d.endOf('day').iso()
    }
  }
  const getTimers = (app, date) => {
    return app.$api.get('timers', {filters: getDateFilter(app, date)}).then(res => {
      let ret = {}
      for (let k = 0; k < res.data.timers.length; k++) {
        let timer = res.data.timers[k]
        if (!ret[timer.id_user]) {
          ret[timer.id_user] = {
            timers: [],
            time: 0
          }
        }
        ret[timer.id_user].timers.push(timer)
        ret[timer.id_user].time += +timer.spent_sec
      }
      Object.keys(ret).forEach(id => {
        ret[id].timers = mergeNearTimers(app, ret[id].timers)
      })
      return ret
    })
  }

  const getScreensCounts = (app, date) => {
    return app.$api.get('timers-screens/counts-by-users', {filters: getDateFilter(app, date)}).then(res => {
      return res.data.counts_by_users
    })
  }

  export default {
    components: {
      QuwiSpinner,
      WorkPeriod,
      Avatar,
      DateFilter,
      ScreenshotsList,
      Pagination,
      Dropdown,
      ScreenshotsViewer
    },
    middleware: 'member',
    head: {
      title: 'Stats'
    },
    data: () => ({
      users: [],
      screens: [],
      timers: {},
      headers: {},
      screensLoading: false,
      timersLoading: false,
      page: 1,
      screensCounts: [],
      loadingVideoUser: null
    }),
    async asyncData ({app, query, store, redirect, error}) {
      if (query.date) {
        if (!app.$date(query.date, 'YYYY-MM-DD').isValid()) {
          return redirect('/stats')
        }
      }
      if (store.state.webuser.user.role !== 'owner') {
        return redirect('/my-stats')
      }
      let promises = [
        app.$api.get('timers-screens/company-latest').then(res => ({
          screens: res.data.screens || [],
          headers: res.headers || {}
        })),
        store.dispatch('getUsersByProjectId', null),
        getTimers(app, query.date)
      ]
      if (store.getters['webuser/checkAccess']('timelapse_video')) {
        promises.push(getScreensCounts(app, query.date))
      } else {
        promises.push([])
      }
      try {
        let [screensShots, users, timers, screensCounts] = await Promise.all(promises)
        let {screens, headers} = screensShots
        users = users.filter(u => u.is_active)
        return {
          id_user: 0,
          screens,
          headers,
          users,
          timers,
          screensCounts
        }
      } catch (e) {
        raiseError(error, e)
      }
    },
    computed: {
      ...mapState(['notifications']),
      ...mapState('webuser', {loggedUser: 'user'}),
      ...mapGetters({
        checkAccess: 'webuser/checkAccess'
      }),
      indexedUsers () {
        let ret = {}
        for (let k = 0; k < this.users.length; k++) {
          ret[this.users[k].id] = this.users[k]
        }
        return ret
      },
      hours () {
        let ret = []
        for (let k = 0; k < 24; k++) {
          ret.push(k)
        }
        return ret
      },
      preparedScreenshots () {
        let ret = []
        for (let k = 0; k < this.screens.length; k++) {
          let screen = this.screens[k]
          if (screen.id_user && this.indexedUsers[screen.id_user]) {
            screen.user = this.indexedUsers[screen.id_user]
          }
          ret.push(screen)
        }
        return ret
      },
      isToday () {
        let m = moment(this.date)
        if (m) {
          return m.isSame(this.$date(), 'day')
        }
      },
      date () {
        return this.$route.query.date ? this.$date(this.$route.query.date) : this.$date()
      },
      loadDisabled () {
        return this.screensLoading || +this.headers['x-pagination-page-count'] <= this.page
      }
    },
    methods: {
      ...mapActions(['getScreens']),
      selectUser (val, name) {
        let query = val ? {id_user: val} : null
        this.$router.push({path: '/stats', query: query})
      },
      changeDate (date) {
        this.$router.push({path: '/stats', query: {date: date.format('YYYY-MM-DD')}})
      },
      getUserScreensRoute (user) {
        let route = {
          path: '/stats/user',
          query: {id: user.id}
        }
        if (this.$route.query.date) {
          route.query.date = this.$route.query.date
        }
        return route
      },
      getCurrentHour () {
        return this.$date().hour()
      },
      getTimerShift (timer) {
        let dayTimeStart = this.date.startOf('day').unix()
        let timerTime = this.$date(timer.dta_start).unix()
        // сколько минут прошло с начала выбранных суток
        let diff = Math.round((timerTime - dayTimeStart) / 60)
        // сколько прошло с начала суток в процентах
        return (diff / (24 * 60)) * 100
      },
      async updateTimers () {
        this.timersLoading = true
        let [timers, counts] = await Promise.all([
          getTimers(this, this.$route.query.date),
          getScreensCounts(this, this.$route.query.date)
        ])
        this.timersLoading = false
        this.timers = {...timers}
        this.screensCounts = counts
      },
      playBtnTooltip (user) {
        let opts = {
          delay: {
            show: 300,
            hide: 0
          },
          placement: 'right'
        }
        if (!this.checkAccess('disc_space')) {
          opts.content = getNoDiscHint(this, true)
        } else if (!this.checkAccess('timelapse_video')) {
          opts.content = this.$t('subscription.not_included_feature') + `<br><a href="#" data-nuxt-link="/upgrade">${this.$t('plan_upgrade_link')}</a>`
        } else if (!this.getScreensCount(user)) {
          opts.content = this.$t('stats_index.no_screens_video')
        }
        if (opts.content) {
          return opts
        }
      },
      getScreensCount (user) {
        const el = this.screensCounts.find(el => +el.id_user === +user.id)
        return el ? +el.count : 0
      },
      isPlayBtnInactive (user) {
        return !this.checkAccess('timelapse_video') || !this.checkAccess('disc_space') || !this.getScreensCount(user) || this.timersLoading || this.loadingVideoUser
      },
      playTimelapseVideo (user) {
        if (this.isPlayBtnInactive(user)) {
          return
        }
        this.loadingVideoUser = user.id
        this.$api.get('timers-screens/timelapse-video', {
          filters: {
            ...getDateFilter(this, this.$route.query.date),
            id_user: user.id
          }
        }).then(res => {
          if (res.data && res.data.timelapse_video && res.data.timelapse_video.file) {
            window.layout.$refs.dialog.activate('video-modal', {
              url: res.data.timelapse_video.file,
              mime: res.data.timelapse_video.mime_type,
              waitLoad: true,
              onOpen: () => {
                this.loadingVideoUser = null
              }
            })
          }
        }).catch(err => alert(getErrorFromResponse(err)))
      },
      secondsToHIS
    },
    mounted () {
      window.statsIndex = this
    },
    watch: {
      '$route.query.date': function () {
        this.updateTimers()
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';
  @import '~assets/css/animation.less';
  @import '~assets/css/menu.less';
  @import '~assets/css/libs/load_awesome/load_awesome.less';

  .app-stats-index {
    @width: 1128px;
    .loading {
      opacity: .5;
      pointer-events: none;
    }
    .b-top-menu {
      height: @navbar-height;
      display: flex;
      align-items: center;
      .b-left {
        width: calc(30% ~'+' 32px);
        .c-date-filter {
          margin-right: 15px;
          .e-date {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: @red-color;
          }
          > .e-left, .e-right {
            font-size: 1.4em !important;
            width: @navbar-height;
            height: @navbar-height;
            justify-content: center;
            align-items: center;
            display: flex;
          }
        }
      }
      .b-right {
        flex: 1;
        .b-hours {
          display: flex;
          position: relative;
          left: -(100% / 48 );
          .e-hour {
            width: 100% / 24;
            text-align: center;
            font-size: .8em;
            font-weight: bold;
            .e-digit {
              width: 14px;
              height: 19px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              &.current {
                color: #fff;
                background: #000;
                width: 19px;
                border-radius: 50%;
              }
            }
          }
        }
      }

    }
    .b-users {
      background: #fff;
      border-top: 1px solid #dedede;
      border-bottom: 1px solid #dedede;
    }
    .b-users {
      margin-bottom: 25px;
      .b-user-wrap {
        display: flex;
        padding-top: 5px;

        > .e-play {
          width: @navbar-height;
          height: @navbar-height;
          display: flex;
          justify-content: center;
          align-items: center;
          i {
            font-size: 1.8em;
          }
          &:not(.inactive) {
            .hover-mixin();
          }
          &.inactive {
            opacity: .5;
          }
          .c-spinner {
            color: #000;
          }
        }
        > .b-item {
          display: flex;
          height: @navbar-height;
          .hover-mixin();
          flex: 1;
          > .b-user {
            width: 30%;
            display: flex;
            align-items: center;
            padding: 0 20px 0 10px;
            overflow-x: hidden;
            .b-left {
              margin-right: 10px;
            }
            .b-middle {
              flex: 1;
              .e-name {
                font-weight: bold;
                margin-bottom: 3px;
              }
              .e-task {
                color: @green-color;
              }
              .e-task, .e-worked {
                font-size: .9em;
                overflow-x: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .e-worked {
                font-style: italic;
                color: #bbb;
              }
            }
            .b-right {
              font-size: .9em;
              .bu-clock {
                width: 22px;
                color: @red-color;
                &.working {
                  color: @green-color;
                }
              }
              .e-worked-time {
                font-weight: bold;
              }
            }
          }
        .b-timeline {
          flex: 1;
          position: relative;
          .b-grid {
            width: 100%;
            height: @navbar-height;
            display: flex;
            position: absolute;
            .e-hour {
              width: 100% / 24;
              height: 100%;
              @hour-border: 1px dashed #d5dbe0;
              &:not(:last-child) {
                border-right: @hour-border;
              }
              &:first-child {
                border-left: @hour-border;
              }
            }
          }
          .b-timers {
            position: relative;
            .b-timer {
              position: absolute;
              background: #589ae8;
              height: 38px;
              top: 4px;
            }
          }
        }
      }

        &:last-child {
          padding-bottom: 5px;
        }
      }
    }

    .b-screenshots-wrapper {
      .b-header {
        margin-bottom: 15px;
        .e-name {
          color: @red-color;
          font-size: 1em;
          padding: 0 20px;
        }
      }
      .b-pagination {
        padding: 15px;
      }
      .b-empty {
        text-align: center;
      }
    }

  }
</style>
