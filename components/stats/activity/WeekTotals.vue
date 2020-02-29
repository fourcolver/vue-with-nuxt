<template>
  <div class="c-week-totals">
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
            name="month"
            :selected="currentMonth"
            :onChange="changeMonth"
            :options="months">
          </dropdown>
        </div>
        <slot name="yearSelector"></slot>
      </div>
    </div>
    <div class="b-box m-week">
      <div class="b-row" @click="$emit('openWeek', item.days[0])" v-for="item, index in weeks"
           :class="{'m-current' : $date().isSame(item.days[0], 'isoWeek')}">
        <div class="b-left">
          <div class="e-week">{{ item.days[0].format('DD') }}-{{ item.days[item.days.length - 1].format('DD MMM') }}
          </div>
        </div>
        <div class="b-center">
          <div class="b-time">
            <div class="e-total-time">{{ loading ? '' : secondsToHIS(getTotalSpent(item), 'h:i')}}</div>
          </div>
          <div class="b-main">
            <div class="b-cell" :class="{active: d.isSame($date(), 'day')}"
                 v-for="d in item.days">
              <div class="e-date m-week-day">{{ d.format('ddd') }}</div>
              <div class="e-date">{{ d.format('DD MMM') }}</div>
              <progress-bar :percent="getPercentForDay(d)"></progress-bar>
              <div class="e-time">{{ secondsToHIS(getSpentForDay(d), 'h:i') }}</div>
            </div>
          </div>
          <div class="b-avg" :class="{'m-high': item.avg > 66.66, 'm-low': item.avg && item.avg < 33.33}">
            <div class="e-avg">{{ loading ? '' : item.avg + '%' }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import { getAvgActivity, countAvgActivity } from '~/utils/stats'
  import { secondsToHIS } from '~/utils/time'
  import ProgressBar from '../../ProgressBar.vue'
  import moment from 'moment'
  import Dropdown from '../../Dropdown.vue'
  import activity from '~/utils/mixins/stats/activity'

  export default {
    components: {
      Dropdown,
      ProgressBar
    },
    name: 'week-totals',
    mixins: [activity],
    data () {
      return {
        totalsByDay: null,
        startDay: null,
        loading: false
      }
    },
    props: ['user', 'year', 'openDay'],
    methods: {
      shrinkWeekActivity (items) {
        // по 3 записи на день
        if (!items.length) {
          return []
        }
        let result = []
        let days = {}
        items.forEach(el => {
          let d = this.$date(el.dta_interval_start).format('YYYYMMDD')
          if (!days[d]) {
            days[d] = []
          }
          days[d].push(el)
        })
        for (let d in days) {
          let inputs = days[d]
          if (inputs.length <= 3) {
            result = result.concat(inputs)
          } else if (inputs.length < 6) {
            result = result.concat(inputs.slice(0, 3))
          } else if (inputs.length > 6) {
            let slices = [
              inputs.slice(0, Math.floor(inputs.length / 3)),
              inputs.slice(0, Math.floor(inputs.length / 3 * 2)),
              inputs.slice(Math.floor(inputs.length / 3 * 2))
            ]
            slices.forEach(slice => {
              let aggrInput = {...slice[0]}
              slice.slice(1).reduce((a, el) => {
                a.keyboard_count = +a.keyboard_count + +el.keyboard_count
                a.keyboard_sum = +a.keyboard_sum + +el.keyboard_sum
                a.mouse_count = +a.mouse_count + +el.mouse_count
                a.mouse_sum = +a.mouse_sum + +el.mouse_sum
                return a
              }, aggrInput)
              result.push(aggrInput)
            })
          }
        }
        return result
      },
      getSpentForDay (d) {
        return this.spentByDay[d.format('YYYY-MM-DD')] || 0
      },
      getPercentForDay (d) {
        let maxSeconds = 12 * 3600
        let spent = this.getSpentForDay(d)
        return spent > maxSeconds ? 100 : Math.floor(spent / maxSeconds * 100)
      },
      getTotalSpent (item) {
        return item.days.reduce((a, d) => a + (this.spentByDay[d.format('YYYY-MM-DD')] || 0), 0)
      },
      changeMonth (val) {
        this.startDay = (this.startDay || this.$date()).clone().year(this.year).month(val)
      },
      getAvgActivity,
      countAvgActivity,
      secondsToHIS
    },
    computed: {
      ...mapState({
        activity: state => state.stats.aggregatedActivity,
        spentByDay: state => state.stats.spentByDay
      }),
      weeks () {
        let ret = []
        let monthStart = (this.startDay || this.$date()).clone().startOf('month')
        for (let w = 0; ; w++) {
          let weekStart = monthStart.clone().add(w * 7, 'd').startOf('isoWeek')
          if (w > 0 && !weekStart.isSame(monthStart, 'month')) {
            break
          }
          let days = []
          if (weekStart.isAfter(this.$date().endOf('day'))) {
            break
          }
          let weekEnd = weekStart.clone().endOf('isoWeek')
          for (let d = 0; ; d++) {
            let currentDay = weekStart.clone().add(d, 'd')
            days.push(currentDay)
            if (currentDay.isSame(weekEnd, 'd')) {
              break
            }
          }
          let weekActivity = this.activity.filter(el => weekStart.isSame(el.dta_interval_start, 'isoWeek'))
          let inputs = this.shrinkWeekActivity(weekActivity)
          let avg = countAvgActivity(inputs) || 0
          ret.push({days, inputs, avg})
        }
        return ret.reverse()
      },
      currentMonth () {
        return (this.startDay || this.$date()).month()
      },
      months () {
        moment.locale(this.$i18n.locale)
        let ret = []
        const isCurrentYear = this.year === this.$date().year()
        const regDate = this.$date(this.user.dta_create)
        const isRegYear = this.year === regDate.year()
        moment.months().forEach((m, i) => {
          let isInFuture = isCurrentYear && i > this.$date().month()
          let isBeforeReg = isRegYear && i < regDate.month()
          if (!isInFuture && !isBeforeReg) {
            ret.push({id: i, name: m})
          }
        })
        return ret.reverse()
      }
    },
    watch: {
      startDay (val) {
        this.loading = true
        const opts = {
          idUser: this.user.id,
          baseDate: val,
          period: 'week',
          year: this.year
        }
        let promises = [
          this.$store.dispatch('stats/loadLastTimers', opts),
          this.$store.dispatch('stats/getSpentByDay', opts),
          this.$store.dispatch('stats/loadAggregatedActivity', opts)
        ]
        Promise.all(promises).then(() => {
          this.loading = false
          this.$emit('load')
        })
        this.$emit('changeDate', val)
      },
      year (val) {
        this.setYear(val, 'month', this.$date(this.user.dta_create))
      }
    },
    mounted () {
      window.weekTotals = this
    },
    created () {
      if (this.openDay) {
        this.startDay = this.openDay
      } else {
        if (this.year !== this.$date().year()) {
          this.setYear(this.year, 'month', this.$date(this.user.dta_create))
        } else {
          this.startDay = this.$date()
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-week-totals {
    position: relative;
    .b-row {
      height: 115px;
      align-items: center;
      display: flex;
      .hover-mixin();
      .b-left, .b-right {
        .e-week, .e-month, .e-total-time {
          height: 25px;
          line-height: 25px;
        }
      }
      .b-center {
        height: 100%;
      }
      .b-avg {
        align-items: center;
        &.m-high {
          color: @green-color;
        }
        &.m-low {
          color: @red-color;
        }
        .e-avg {
          height: 25px;
          line-height: 25px;
        }
      }
      .b-main {
        margin-top: 15px;
        .b-day {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        .b-day, .b-cell {
          width: 100% / 7;
          text-align: center;
          color: #777;
          font-size: .8em;
          .m-week-day {
            text-transform: capitalize;
            margin-bottom: 1px;
          }
        }
        .b-cell {
          font-size: .7em;
          padding: 0 10px;
          .c-progress-bar {
            margin-top: 5px;
            .e-bar {
              width: 100%;
              height: 25px;
              background: #f7f7f7;
              border-radius: 2px;
              .e-fill {
                background: @stats-bar-color;
                border-radius: 2px;
              }
            }
          }
          .e-time {
            margin-top: 7px;
          }
        }
      }
    }
  }
</style>
