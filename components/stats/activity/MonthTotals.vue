<template>
  <div class="c-month-totals">
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
            name="quarter"
            :selected="currentQuarter"
            :onChange="changeQuarter"
            :options="quarters">
          </dropdown>
        </div>
        <slot name="yearSelector"></slot>
      </div>
    </div>
    <div class="b-box m-month">
      <div class="b-row" @click="$emit('openMonth', item.weeks[0])" v-for="item, index in months"
           :class="{'m-current' : $date().isSame(item.weeks[0], 'month')}">
        <div class="b-left">
          <div class="e-month">{{ item.weeks[0].format('MMM') }}</div>
        </div>
        <div class="b-center">
          <div class="b-graph-container">
            <div class="b-graph">
              <div class="e-bar" v-for="input in item.inputs" :style="{height: getAvgActivity(input) + '%'}"></div>
            </div>
          </div>
          <div class="b-time">
            <div class="e-total-time">{{ loading ? '' : secondsToHIS(getTotalSpent(item), 'h:i')}}</div>
          </div>
          <div class="b-main">
            <div class="b-cell" :class="{active: w.isSame($date(), 'isoWeek')}" v-for="w in item.weeks">
              <div class="e-date">{{ formatWeek(w) }}</div>
              <progress-bar :percent="getPercentForWeek(w)"></progress-bar>
              <div class="e-time">{{ loading ? '' : secondsToHIS(getSpentForWeek(w), 'h:i') }}</div>
            </div>
          </div>
          <div class="b-avg" :class="{'m-high': item.avg > 66.66, 'm-low': item.avg && item.avg < 33.33}">
            <div class="e-avg">{{ loading ? '' : (countAvgActivity(item.inputs) || 0) + '%' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { getAvgActivity, countAvgActivity } from '~/utils/stats'
  import { mapState } from 'vuex'
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
    name: 'month-totals',
    data () {
      return {
        startDay: null,
        loading: false
      }
    },
    mixins: [activity],
    props: {
      user: null,
      year: null
    },
    methods: {
      getTotalSpent (item) {
        return item.weeks.reduce((a, w) => a + (this.spentByWeek[w.format('YYYY-MM-DD')] || 0), 0)
      },
      getSpentForWeek (w) {
        return this.spentByWeek[w.format('YYYY-MM-DD')] || 0
      },
      getPercentForWeek (w) {
        let maxSeconds = 12 * 3600 * 7
        let spent = this.getSpentForWeek(w)
        return spent > maxSeconds ? maxSeconds : Math.floor(spent / maxSeconds * 100)
      },
      formatWeek (w) {
        let end = w.clone().endOf('isoWeek')
        if (!end.isSame(w, 'month')) {
          end = w.clone().endOf('month')
        }
        if (w.isSame(end, 'date')) {
          return w.format('DD')
        }
        return w.format('DD') + '-' + end.format('DD')
      },
      changeQuarter (val) {
        this.startDay = (this.startDay || this.$date()).clone().year(this.year).month(val * 3)
      },
      getAvgActivity,
      countAvgActivity,
      secondsToHIS
    },
    computed: {
      ...mapState({
        activity: state => state.stats.aggregatedActivity,
        spentByWeek: state => state.stats.spentByWeek
      }),
      months () {
        let ret = []
        let date = this.startDay || this.$date()
        let quarter = Math.floor(date.month() / 3)
        for (let m = quarter * 3; m < (quarter + 1) * 3; m++) {
          let monthStart = date.clone().startOf('year').add(m, 'months').startOf('month')
          if (monthStart.isAfter(this.$date().startOf('day'))) {
            break
          }
          let weeks = []
          let current = monthStart.clone()
          while (current.clone().startOf('isoWeek').isSame(monthStart, 'month') || current.clone().endOf('isoWeek').isSame(monthStart, 'month')) {
            let start = current.clone().startOf('isoWeek')
            if (!start.isSame(monthStart, 'month')) {
              start = current.clone()
            }
            let end = current.clone().endOf('isoWeek')
            if (!end.isSame(monthStart, 'month')) {
              end = current.clone().endOf('month')
            }
            weeks.push(start)
            current.add(7, 'd')
          }
          let inputs = this.activity.filter(el => monthStart.isSame(el.dta_interval_start, 'month'))
          let avg = countAvgActivity(inputs) || 0
          ret.push({weeks, inputs, avg})
        }
        return ret.reverse()
      },
      quarters () {
        moment.locale(this.$i18n.locale)
        const months = moment.months()
        const isCurrentYear = this.year === this.$date().year()
        const regDate = this.$date(this.user.dta_create)
        const isRegYear = this.year === regDate.year()
        let ret = []
        for (let i = 0; i < 12; i += 3) {
          let end = i + 2
          let isInFuture = isCurrentYear && i > this.$date().month()
          let isBeforeReg = isRegYear && end < regDate.month()
          if (!isInFuture && !isBeforeReg) {
            ret.push({id: Math.floor(i / 3), name: months[i] + ' - ' + months[end]})
          }
        }
        return ret.reverse()
      },
      currentQuarter () {
        return Math.floor((this.startDay || this.$date()).month() / 3)
      }
    },
    mounted () {
      window.monthTotals = this
    },
    watch: {
      startDay (val) {
        this.loading = true
        const opts = {
          idUser: this.user.id,
          baseDate: val,
          period: 'month',
          year: this.year
        }
        let promises = [
          this.$store.dispatch('stats/loadLastTimers', opts),
          this.$store.dispatch('stats/getSpentByWeek', opts),
          this.$store.dispatch('stats/loadAggregatedActivity', opts)
        ]
        Promise.all(promises).then(() => {
          this.loading = false
        })
        this.$emit('changeDate', val)
      },
      year (val) {
        this.setYear(val, 'quarter', this.$date(this.user.dta_create))
      }
    },
    created () {
      if (this.year !== this.$date().year()) {
        this.setYear(this.year, 'quarter', this.$date(this.user.dta_create))
      } else {
        this.startDay = this.$date()
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-month-totals {
    position: relative;
    .b-row {
      .hover-mixin();
    }
  }
</style>