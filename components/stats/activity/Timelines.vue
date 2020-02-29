<template>
  <div class="c-timelines m-day" v-if="timersByDay">
    <div class="b-menu-row">
      <div class="b-left">
        <slot name="editLink"></slot>
      </div>
      <div class="b-center">
        <slot name="periodSelector"></slot>
      </div>
      <div class="b-right">
        <div class="e-stats-for">{{ $t('activity.stats_for') }}</div>
        <div class="b-selector">
          <dropdown
            name="week"
            class="b-week-selector"
            :selected="currentWeek"
            :onChange="changeWeek"
            :options="weeks">
          </dropdown>
        </div>
        <slot name="yearSelector"></slot>
      </div>
    </div>
    <div class="b-row m-head">
      <div class="b-center">
        <div class="b-main b-numbers">
          <div class="e-number" :class="{active: $date().hour() === n}" v-for="noop, n in 24">{{n}}</div>
        </div>
      </div>
    </div>
    <div class="b-box">
      <div class="b-row js-row" v-for="d, index in days"
           :class="{'m-current' : $date().isSame(d.date, 'day'), 'm-weekend': [0, 6].includes(d.date.day())}">
        <div class="b-center">
          <div class="b-date">{{ d.date.format('DD MMM')}}</div>
          <div class="b-week-day">{{ d.date.format('ddd')}}</div>
          <div class="b-time">
            <div class="e-total-time" v-if="!loading">{{ getTotalWorkedForDate(d.date)}}</div>
          </div>
          <div class="b-main js-main">
            <div class="b-grid">
              <div class="e-cell" :class="{active: $date().hour() === n}" v-for="noop, n in 24"></div>
            </div>
            <div class="b-timers" v-if="getTimersForDate(d.date).length">
              <work-period :timer="timer" :user="user" v-for="timer in getTimersForDate(d.date)" :key="timer.id"
                           @hover="e => drawGraphLine(e)" @enter="removeGraphLines"
                           @leave="removeGraphLines">
              </work-period>
            </div>
          </div>
          <div class="b-avg" :class="{'m-high': d.avg > 66.66, 'm-low': d.avg && d.avg < 33.33}">
            {{ loading ? '' : (d.avg || 0) + '%' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import { secondsToHIS } from '~/utils/time'
  import WorkPeriod from '../WorkPeriod.vue'
  import { getAvgActivity, countAvgActivity } from '~/utils/stats'
  import Dropdown from '../../Dropdown.vue'
  import activity from '~/utils/mixins/stats/activity'

  export default {
    components: {
      Dropdown,
      WorkPeriod
    },
    name: 'timelines',
    props: ['user', 'year', 'openDay'],
    mixins: [activity],
    data () {
      return {
        totalsByDay: {},
        startDay: null,
        loading: false
      }
    },
    methods: {
      getTimersForDate (date) {
        let obj = this.timersByDay.find(el => el.date.isSame(date, 'day'))
        return obj && obj.timers ? obj.timers : []
      },
      getTotalWorkedForDate (date, formatted = true) {
        const index = date.format('YYYY-MM-DD')
        const sec = this.totalsByDay[index] || 0
        return formatted ? secondsToHIS(sec, 'h:i') : sec
      },
      drawGraphLine (e) {
        const graphLine = this.$el.querySelector('.js-row:hover .b-graph .js-line')
        if (graphLine) {
          const grid = this.$el.querySelector('.js-main:hover')
          if (grid) {
            const gridRect = grid.getBoundingClientRect()
            const gridPercent = (e.clientX - gridRect.left) / gridRect.width * 100
            graphLine.style.left = gridPercent + '%'
            graphLine.style.display = 'block'
          }
        }
      },
      removeGraphLines () {
        this.$el.querySelectorAll('.b-graph .js-line').forEach(el => {
          el.style.display = 'none'
        })
      },
      getAvgActivityInHour (d, h) {
        let inp = d.inputs.find(el => this.$date(el.dta_interval_start).hour() === h)
        if (inp) {
          return Math.floor((inp.mouse_sum / inp.mouse_count + inp.keyboard_sum / inp.keyboard_count) / 2)
        } else {
          return 0
        }
      },
      changeWeek (num) {
        this.startDay = (this.startDay ? this.startDay.clone() : this.$date()).year(this.year).startOf('year').startOf('isoWeek').add((+num - 1) * 7, 'd')
      },
      load (day) {
        this.loading = true
        let promises = [
          this.$store.dispatch('stats/loadLastTimers', {
            idUser: this.user.id,
            baseDate: day,
            year: this.year
          }),
          this.$store.dispatch('stats/loadAggregatedActivity', {
            idUser: this.user.id,
            baseDate: day,
            year: this.year
          })
        ]
        Promise.all(promises).then(() => {
          this.loading = false
          this.$emit('load')
        })
      },
      getAvgActivity,
      countAvgActivity
    },
    computed: {
      ...mapState({
        timers: state => state.stats.timers,
        activity: state => state.stats.aggregatedActivity
      }),
      timersByDay () {
        let timers = this.timers
        let h = {}
        timers.forEach(el => {
          let date = this.$date(el.dta_start)
          let dayIndex = date.format('YYYY-MM-DD')
          if (!h[dayIndex]) {
            h[dayIndex] = {date, dayIndex, timers: []}
          }
          h[dayIndex].timers.push(el)
        })
        let ret = []
        this.totalsByDay = {}
        for (let k in h) {
          h[k].total_time = h[k].timers.reduce((a, el) => {
            return a + el.spent_sec
          }, 0)
          this.totalsByDay[k] = h[k].total_time
          ret.push(h[k])
        }
        return ret
      },
      days () {
        let hash = {}
        const fmt = 'YYYYMMDD'
        const start = (this.startDay ? this.startDay.clone() : this.$date()).startOf('isoWeek')
        for (let i = 0; i < 7; i++) {
          let d = start.clone().add(i, 'd').startOf('day')
          hash[d.format(fmt)] = {date: d, inputs: []}
        }
        this.activity.forEach(item => {
          let k = item.interval_key_mode
          if (!hash[k]) {
            return []
          }
          hash[k].inputs.push(item)
        })
        let ret = []
        for (let k in hash) {
          hash[k].avg = this.countAvgActivity(hash[k].inputs)
          ret.push(hash[k])
        }
        ret.sort((a, b) => +a.date - +b.date)
        return ret
      },
      currentWeek () {
        let d = (this.startDay || this.$date()).clone()
        let w = d.isoWeek()
        if (w === 1 && d.year() !== d.endOf('isoWeek').year()) {
          w = 53
        }
        return w
      },
      weeks () {
        let ret = []
        let lastWeek
        if (this.$date().endOf('isoWeek').year() === this.year) {
          lastWeek = this.$date().isoWeek()
        } else {
          lastWeek = this.startDay.clone().endOf('year').isoWeek() === 52 ? 52 : 53
        }
        let firstWeek = 1
        let regDate = this.$date(this.user.dta_create)
        if (this.year === regDate.year()) {
          firstWeek = regDate.isoWeek()
        }
        for (let w = lastWeek; w >= firstWeek; w--) {
          ret.push({
            id: w,
            name: this.$t('timelines.week') + ' ' + w
          })
        }
        return ret
      }
    },
    watch: {
      startDay (val) {
        this.load(val)
        this.$emit('changeDate', val)
      },
      year (val) {
        this.setYear(val, 'isoWeek', this.$date(this.user.dta_create))
      }
    },
    created () {
      if (this.openDay) {
        this.startDay = this.openDay
      } else {
        if (this.year !== this.$date().year()) {
          this.setYear(this.year, 'isoWeek', this.$date(this.user.dta_create))
        } else {
          this.startDay = this.$date()
        }
      }
    },
    mounted () {
      window.timelines = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-timelines {
    @stats-bar-color: #589ae8;
    @row-height: 30px;
    @graph-margin: 5px;
    @day-width: 65px;
    @week-day-width: 43px;
    @work-time-width: 59px;
    @percent-width: 53px;
    .b-menu-row {
      padding-left: 10px;
      .b-week-selector {
        .dropdown-menu {
          max-height: 300px;
          overflow-y: auto;
        }
      }
    }
    .b-row {
      height: 40px;
      display: flex;
      &.m-head {
        @selector-width: @day-width + @week-day-width + @work-time-width;
        height: 20px;
        .b-center {
          position: relative;
          .b-numbers {
            max-width: calc(100% ~'-' @selector-width ~'-' @percent-width);
          }
          .b-graph {
            border-bottom: none;
          }
        }
      }
      .b-center {
        flex: 1;
        display: flex;
        .b-date, .e-week, .e-month, .e-total-time {
          font-size: .8em;
          text-transform: uppercase;
          white-space: nowrap;
          font-weight: bold;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .b-date {
          width: @day-width;
        }
        .b-graph-container {
          height: 100%;
          display: flex;
          align-items: center;
        }
        .b-graph {
          display: flex;
          width: 120px;
          margin: @graph-margin;
          align-items: flex-end;
          justify-content: flex-start;
          border-bottom: .5px solid #ccc;
          position: relative;
          .e-bar {
            width: 4px;
            background: #7fa2cc;
            &:not(:last-child) {
              margin-right: 1px;
            }
          }
          .e-line {
            width: 2px;
            background: #000;
            height: @row-height;
            position: absolute;
            display: none;
            z-index: 2;
          }
        }
        .b-avg, .b-time, .b-week-day {
          display: flex;
          justify-content: center;
          padding: 0 15px;
          align-items: center;
        }
        .b-week-day {
          width: @week-day-width;
          font-size: .8em;
          text-transform: uppercase;
          color: #484848;
          justify-content: flex-start;
        }
        .b-time {
          width: @work-time-width;
          text-transform: uppercase;
          white-space: nowrap;
          font-weight: bold;
        }
        > .b-main {
          flex: 1;
          display: flex;
          position: relative;
          &.b-numbers {
            @width: 100% / 23;
            margin-top: 3px;
            position: relative;
            left: calc(-(@width / 2) ~'+' 174px);
            .e-number {
              width: @width;
              color: #667;
              font-size: .7em;
              text-align: center;
              &.active {
                color: @stats-bar-color;
                font-size: .75em;
                font-weight: bold;
                position: relative;
                top: -.05em;
              }
            }
          }
          .b-grid {
            display: flex;
            width: 100%;
            align-items: center;
            .e-cell {
              border-left: 1px solid #e7e7e7;
              width: 100% / 23;
              height: 100%;
              &.active {
                border-left: 1px solid #2975dc;
              }
            }
          }
          .b-timers {
            .c-work-period {
              height: @row-height;
            }
          }
        }
        .b-avg {
          width: @percent-width;
          font-size: .8em;
          display: flex;
          justify-content: center;
          align-items: center;
          &.m-high {
            color: @green-color;
          }
          &.m-low {
            color: @red-color;
          }
        }
      }
      &:not(:hover) .b-center .b-graph .e-line {
        display: none !important;
      }

      &.m-current {
        .e-total-time {
          color: #589ae8;
        }
      }
      &.m-weekend {
        .b-center {
          .b-date {
            color: @red-color;
          }
          .b-week-day {
            color: @red-color;
          }
        }
      }
    }
    .b-box {
      padding: 10px 0;
    }
  }
</style>
