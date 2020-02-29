<template>
  <div class="stats-user" v-if="user">
    <div class="b-top">
      <nuxt-link :to="backLink" class="e-back" v-if="$route.query.id">
        <i class="bu-left-dir"></i>
      </nuxt-link>
      <div v-if="$store.getters['webuser/checkAccess']('owner')" class="b-left b-user-link" :class="{visible: prevUser}"
           @click="prevUser ? $router.push({path: '/stats/user', query: {id: prevUser.id}}) : null">
        <template v-if="prevUser">
          <avatar :userId="prevUser.id" size="50"></avatar>
          <div class="e-name">{{ prevUser.name }}</div>
        </template>
      </div>
      <div class="b-center">
        <div class="e-name">{{ user.name }}</div>
        <avatar size="120" :userId="user.id"></avatar>
        <working-info mode="stats" :showWorkingOn="true" :user="user">
          <span slot="workingSeconds" class="e-work-time"
                v-if="(workingSeconds || user.working_sec) !== null"> ({{ secondsToHIS(workingSeconds || user.working_sec)}})</span>
        </working-info>
        <div class="e-due">{{ $tc('stats.user.due_penalties', 0, {n: user.due_penalties || 0}) }}</div>
        <div class="b-total-time" v-if="user.timer_last && user.is_timer_online">
          {{ $t('stats.user.spent_all') + ' ' + secondsToHIS(user.timer_last.spent_sec) }}
        </div>
        <div class="b-place" v-if="activityRanks[+user.id]">
          {{ $tc('stats_user.activity_rank', null, {n: activityRanks[+user.id]}) }}
        </div>
      </div>
      <div v-if="$store.getters['webuser/checkAccess']('owner')" class="b-right b-user-link"
           :class="{visible: nextUser}"
           @click="nextUser ? $router.push({path: '/stats/user', query: {id: nextUser.id}}) : null">
        <template v-if="nextUser">
          <avatar :userId="nextUser.id" size="50"></avatar>
          <div class="e-name">{{ nextUser.name }}</div>
        </template>
      </div>
    </div>

    <div class="b-middle" :class="{hidden: pageLoading}">
      <activity-report @loading="loading = true" @load="loading = false" :user="user" :period="period"
                       @changePeriod="val => period = val" @changeDate="val => currentDate = val"
                       @changeYear="y  => year = y" :year="year || $date().year()"></activity-report>
      <issues-stats :period="period" :selectedDate="currentDate || $date()" :year="year || $date().year()" :user="user"
                    :class="{hidden: loading}"></issues-stats>
      <div class="b-screenshots-wrap" :class="{hidden: loading}">
        <div class="b-screenshots">
          <screenshots-list @screenClick="item => $refs.viewer.show(item)"
                            :showUser="false" :showDate="false" :user="user"
                            @delete="getScreens({userId: user.id, filters: { dta_from: $event.dta_from, dta_to: $event.dta_to }})"
                            @changeDay="getScreens({userId: user.id, filters: { dta_from: $event.dta_from, dta_to: $event.dta_to }})"></screenshots-list>
        </div>
      </div>
    </div>
    <screenshots-viewer :selectable="true" ref="viewer" :screens="screens" :currentUser="user" :singlePage="true"
                        :headers="headers"></screenshots-viewer>
  </div>
</template>

<script>
  import ScreenshotsList from 'components/stats/ScreenshotsList.vue'
  import { secondsToHIS } from 'utils/time'
  import Pagination from 'components/Pagination.vue'
  import DateFilter from 'components/stats/DateFilter.vue'
  import Avatar from 'components/Avatar.vue'
  import { mapState, mapActions } from 'vuex'
  import ScreenshotsViewer from '../../components/stats/ScreenshotsViewer.vue'
  import WorkingInfo from '../../components/WorkingInfo.vue'
  import ActivityReport from '../../components/stats/activity/ActivityReport.vue'
  import { raiseError } from '~/utils/helpers'
  import IssuesStats from '../../components/stats/IssuesStats.vue'

  export default {
    components: {
      IssuesStats,
      ActivityReport,
      WorkingInfo,
      ScreenshotsViewer,
      Avatar,
      DateFilter,
      Pagination,
      ScreenshotsList
    },
    head: {
      title: 'Stats'
    },
    data () {
      return {
        loading: false,
        pageLoading: false,
        page: 1,
        activity: [],
        timers: [],
        workingSeconds: null,
        workingSecondsCounter: null,
        backDate: null,
        monthActivity: [],
        currentDate: null,
        year: null
      }
    },
    fetch ({store, query, app, error}) {
      let userId = query.id || store.state.webuser.user.id
      let period = store.state.userSettings.timers_stats_period || 'day'
      let promises = [
        store.dispatch('stats/loadAggregatedActivity', {
          idUser: userId,
          period
        }),
        store.dispatch('stats/getScreens', {userId}),
        store.dispatch('getCompanyUsers'),
        store.dispatch('stats/getIssuesTimers', {idUser: userId, period})
      ]
      if (period === 'day') {
        promises.push(store.dispatch('stats/loadLastTimers', {
          idUser: userId,
          period
        }))
      } else if (period === 'week') {
        promises.push(store.dispatch('stats/getSpentByDay', {idUser: userId}))
      } else if (period === 'month') {
        promises.push(store.dispatch('stats/getSpentByWeek', {idUser: userId}))
      }
      return Promise.all(promises).catch((e) => raiseError(error, e))
    },
    asyncData ({app}) {
      return app.$api.get('timers-activity-input/aggregate', {
        filters: {
          dta_from: app.$date().startOf('month').iso(),
          dta_to: app.$date().iso()
        }
      }).then(res => {
        return {
          monthActivity: res.data.activity_inputs
        }
      })
    },
    methods: {
      ...mapActions({
        getScreens: 'stats/getScreens'
      }),
      goToScreens () {
        if (!this.screens.length) {
          return
        }
        let url = {path: '/stats/screenshots'}
        if (this.$route.query.id) {
          url.query = {id: this.$route.query.id}
        }
        this.$router.push(url)
      },
      startSecondsCounter () {
        if (!this.user) {
          return
        }
        this.workingSeconds = this.user.working_sec
        let startSeconds = this.workingSeconds
        this.startTime = +(new Date())
        const timer = () => {
          if (this.workingSeconds !== null) {
            this.workingSeconds = startSeconds + Math.floor((+(new Date()) - this.startTime) / 1000)
          }
          requestAnimationFrame(timer)
        }
        if (this.workingSeconds !== null) {
          timer()
        }
      },
      secondsToHIS
    },
    computed: {
      ...mapState({
        screens: state => state.stats.screens,
        headers: state => state.stats.screensHeaders,
        users: state => state.companyUsers.filter(el => el.is_active)
      }),
      prevUser () {
        const user = this.users.find(el => +el.id === +this.user.id)
        let ind = this.users.indexOf(user)
        if (ind > 0) {
          return this.users[ind - 1]
        }
      },
      nextUser () {
        const user = this.users.find(el => +el.id === +this.user.id)
        let ind = this.users.indexOf(user)
        if (ind < this.users.length - 1) {
          return this.users[ind + 1]
        }
      },
      user () {
        const role = this.$store.state.webuser.user.role
        return this.users.find(el => +el.id === (role === 'coder' ? +this.$store.state.webuser.user.id : +this.$route.query.id))
      },
      period: {
        get () {
          return this.$store.state.userSettings.timers_stats_period || 'day'
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsSync', {timers_stats_period: val})
        }
      },
      backLink () {
        let route = {path: '/stats'}
        if (this.backDate) {
          route.query = {date: this.backDate}
        }
        return route
      },
      activityRanks () {
        if (!this.monthActivity.length) {
          return {}
        }
        const getActivity = el => (el.keyboard_sum / el.keyboard_count + el.mouse_sum / el.mouse_count) / 2
        this.monthActivity.sort((a, b) => getActivity(b) > getActivity(a) ? 1 : -1)
        let ret = {}
        this.monthActivity.forEach((el, i) => {
          ret[+el.id_user] = i + 1
        })
        return ret
      }
    },
    created () {
      if (!this.user) {
        this.$router.push('/stats')
      }
    },
    mounted () {
      window.userScreens = this
      this.startSecondsCounter()
      if (this.$route.query.date) {
        this.backDate = this.$route.query.date
        let q = {...this.$route.query}
        delete q.date
        this.$router.replace({query: q})
      }
    },
    watch: {
      user: function (val, old) {
        if (val && old) {
          this.startSecondsCounter()
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .stats-user {
    margin-bottom: 50px;
    > .b-top {
      display: flex;
      position: relative;
      margin-bottom: 30px;
      .e-back {
        position: absolute;
        text-transform: uppercase;
        top: 14px;
        left: 14px;
        white-space: nowrap;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 22px;
        height: 22px;
        background: #747474;
        border-radius: 5px;
        &:hover {
          background: #555;
        }
        i {
          color: #fff;
          position: relative;
          left: -1px;
        }
      }
      .b-user-link {
        opacity: .6;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        width: 120px;
        margin-bottom: 50px;
        margin-top: 50px;
        &.visible {
          cursor: pointer;
        }
        .e-name {
          font-size: .8em;
        }
        .b-avatar {
          margin-bottom: 7px;
          img {
            display: block;
          }
        }
        .e-name {
          font-size: .8em;
        }
        &:hover {
          opacity: 1;
        }
      }
      .b-center {
        display: flex;
        justify-content: flex-start;
        flex: 1;
        flex-direction: column;
        align-items: center;
        text-align: center;
        max-width: 80%;
        margin: 10px auto 0 auto;
        height: 285px;
        .e-name {
          margin-top: 3px;
          margin-bottom: 15px;
          font-size: 1.2em;
          color: @red-color;
        }
        .b-avatar {
          margin-bottom: 20px;
        }
        .c-working-info, .b-place, .b-total-time, .e-due {
          margin-bottom: 10px;
        }
      }
    }
    .b-screenshots-wrap {
      .c-screenshots-list {
        padding: 0 15px;
      }
      .b-empty {
        text-align: center;
        margin-bottom: 30px;
      }
    }
    .b-header {
      height: 40px;
      display: flex;
      margin-top: 15px;
      .e-name {
        color: @red-color;
        font-size: 1em;
        padding: 0 10px;
        margin-left: 12px;
        height: 100%;
        align-items: center;
        display: flex;
        &:not(.m-empty) {
          .hover-mixin();
        }
      }
    }
    .hidden {
      visibility: hidden;
    }
  }
</style>
