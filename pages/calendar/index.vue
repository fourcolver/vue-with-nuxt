<template>
  <div class="calendar-index">
    <div class="b-select-month">
      <div class="b-prev" @click="currentDate = currentDate.subtract(1, 'month').clone()">
        <span class="e-arrow">&lt</span>
        <span class="e-date">{{ currentDate.clone().subtract(1, 'month').format('MMM') }}</span>
      </div>
      <div class="e-current">{{ currentDate.format('MMMM YYYY') }}</div>
      <div class="b-next" @click="currentDate = currentDate.add(1, 'month').clone()">
        <span class="e-date">{{ currentDate.clone().add(1, 'month').format('MMM') }}</span>
        <span class="e-arrow">&gt</span>
      </div>
    </div>
    <div class="b-days">
      <div class="b-day m-empty" v-for="day in currentDate.clone().startOf('month').isoWeekday() - 1">
        <div class="b-inside"></div>
      </div>
      <div class="b-day" v-for="day in days" :class="{'m-today': isToday(day), 'm-past': isPast(day)}">
        <div class="b-inside">
          <div class="e-number">{{ day.format('D') }}</div>
          <div v-if="issuesByDay[day.format('YYYY-MM-DD')]" class="b-scroll" v-bar>
            <div class="b-issues" :class="{'has-scroll': issuesByDay[day.format('YYYY-MM-DD')].length > 4}">
              <div class="b-issue" @click="goToIssue(issue)"
                   :class="{'m-overdue': isOverdue(issue), 'm-done': ['resolved', 'closed'].includes(issue.status)}"
                   v-for="issue in issuesByDay[day.format('YYYY-MM-DD')]" v-tooltip.top="getIssueTooltip(issue)">
                <avatar size="20" :src="issue.project.logo_url" :name="issue.project.name"></avatar>
                <div class="e-id">{{ issue.number }}.</div>
                <div class="e-desc">{{ capitalize(issue.name || issue.description) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import Avatar from '../../components/Avatar.vue'
  import { raiseError, capitalize, clearString } from '~/utils/helpers'
  import { mapGetters } from 'vuex'

  const getIssues = (app, date) => {
    let d = date || app.$date()
    let params = {
      filters: {
        dta_due_on_from: d.clone().startOf('month').unix(),
        dta_due_on_to: d.clone().endOf('month').unix()
      }
    }
    return app.$api.get('issues/index', params)
  }

  export default {
    components: {Avatar},
    head: {
      title: 'Calendar'
    },
    data () {
      return {
        currentDate: null,
        issues: []
      }
    },
    methods: {
      goToIssue (issue) {
        let project = this.getProject(issue.id_project)
        this.$router.push(this.createIssueUrl({ uid: project.uid, number: issue.number }))
      },
      isToday (day) {
        return day.isSame(this.$date(), 'day')
      },
      isPast (day) {
        return day.isBefore(this.$date().startOf('day'))
      },
      isOverdue (issue) {
        return this.$date(issue.dta_due_on).endOf('day').unix() < this.$date().startOf('day').unix() && issue.status === 'open'
      },
      getIssueTooltip (issue) {
        if (!process.client) {
          return null
        }
        let name = clearString(issue.number + '. ' + (issue.name || issue.description).substring(0, 200))
        return {
          delay: {
            show: 800,
            hide: 0
          },
          content: name,
          boundariesElement: document.body,
          autoHide: true
        }
      },
      capitalize
    },
    computed: {
      ...mapGetters({
        'getProject': 'company/getProject',
        'createIssueUrl': 'company/createIssueUrl'
      }),
      days () {
        let ret = []
        const start = this.currentDate.clone().startOf('month')
        for (let i = 0; i < this.currentDate.daysInMonth(); i++) {
          ret.push(start.clone().add(i, 'd'))
        }
        return ret
      },
      weekDays () {
        moment.locale(this.locale)
        let days = moment.weekdaysShort()
        days.push(days.shift())
        return days
      },
      issuesByDay () {
        let ret = {}
        this.issues.forEach(el => {
          if (!ret[el.dta_due_on]) {
            ret[el.dta_due_on] = []
          }
          el.project = this.getProject(el.id_project)
          ret[el.dta_due_on].push(el)
        })
        return ret
      }
    },
    created () {
      if (this.$route.query.date) {
        this.currentDate = this.$date(this.$route.query.date, 'YYYY-MM')
      }
      if (!this.currentDate || !this.currentDate.isValid) {
        this.currentDate = this.$date()
      }
    },
    mounted () {
      window.calendarPage = this
    },
    asyncData ({app, query, error}) {
      let d
      if (query.date) {
        d = app.$date(query.date, 'YYYY-MM')
        if (!d.isValid) {
          d = null
        }
      }
      d = d || app.$date()
      return getIssues(app, d).then(res => {
        return {issues: res.data.issues}
      }).catch((e) => raiseError(error, e))
    },
    watch: {
      currentDate: function (val, old) {
        if (old === null) {
          return
        }
        this.$router.push({query: {date: val.format('YYYY-MM')}})
        getIssues(this, val).then(res => {
          this.issues = res.data.issues
        })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .calendar-index {
    @blue: #2975dc;
    margin-bottom: 20px;
    .b-select-month {
      display: flex;
      height: 30px;
      align-items: center;
      width: 250px;
      margin-left: 14px;
      margin-top: 10px;
      margin-bottom: 10px;
      > div {
        display: flex;
        align-items: center;
        height: 100%;
        justify-content: center;
      }
      .b-prev {
        .e-arrow {
          margin-right: 5px;
        }
      }
      .b-next {
        .e-arrow {
          margin-left: 5px;
        }
      }
      .b-prev, .b-next {
        .hover-mixin();
        padding: 0 5px;
        color: @blue;
        font-weight: bold;
        user-select: none;
        .e-date {
          text-transform: uppercase;
          font-size: .7em;
        }
      }
      .e-current {
        flex: 1;
        text-transform: uppercase;
        font-weight: bold;
        font-size: .8em;
      }
    }
    .b-days {
      display: flex;
      flex-wrap: wrap;
      margin: 0 10px;
      .b-day {
        width: 100% / 7;
        height: 144px;
        &.m-empty {
          opacity: .6;
        }
        &.m-today {
          .b-inside {
            border: 3px solid @blue;
            > .e-number {
              color: @blue;
            }
          }
        }
        &.m-past{
          opacity: .5;
        }
        .b-inside {
          @margin: 2px;
          .white-box();
          margin: @margin;
          height: calc(100%~'-'@margin * 2);
          padding: 5px;
          overflow: hidden;
          .e-number {
            font-size: .8em;
            font-weight: bold;
            margin-bottom: 7px;
          }
          .b-scroll {
            max-height: calc(100% ~'-' 20px);
          }
          .b-issues {
            overflow-y: auto;
            max-height: 105px;
            &.has-scroll {
              .b-issue {
                margin-right: 7px;
              }
            }
            .b-issue {
              display: flex;
              align-items: center;
              height: 26px;
              overflow: hidden;
              font-size: .9em;
              padding-left: 3px;
              .hover-mixin();
              &.m-overdue {
                color: @red-color;
              }
              &.m-done {
                color: @green-color;
              }
              .b-avatar {
                img {
                  display: block;
                }
                letter-spacing: 1px;
              }
              .b-avatar, .e-id {
                margin-right: 5px;
              }
              .e-id {
                font-weight: bold;
              }
              .e-desc {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
      }
    }
  }
</style>
