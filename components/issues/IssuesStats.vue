<template>
  <div class="c-issue-stats" v-if="+stats.total">
    <div class="e-count">
      {{ $t('Open tasks') }}: <span class="e-number">{{ stats.cntTasks }}</span> ({{ stats.percentTasks || 0 }}%)
      {{ $t('Bugs') }}:  <span class="e-number">{{ stats.cntBugs }}</span> ({{ stats.percentBugs || 0 }}%)
    </div>
    <div class="e-time" v-if="+stats.totalTime">
      {{ $t('issues.total.spent') }}
      <a @click="setStatsPeriod" class="e-toggle-period">{{ statsPeriodName }}</a>
      {{ $t('issues.total.on_tasks') }}: {{ secondsToHIS(stats.timeTasks || 0)
      }} ({{ stats.percentTimeTasks || 0 }}%),
      {{ $t('issues.total.on_bugs') }}: {{ secondsToHIS(stats.timeBugs || 0) }} ({{ stats.percentTimeBugs || 0
      }}%)
    </div>
  </div>
</template>

<script>
import { secondsToHIS } from '~/utils/time'

export default {
  created () {
    this.statsPeriod = this.$store.state.userSettings.issues_stats_period || 'this_month'
  },
  data () {
    return {
      statsPeriodOptions: [
        {
          id: 'this_month',
          name: this.$t('issues.total.this_month'),
          field: 'this_month_spent_sec'
        },
        {
          id: 'last_30_days',
          name: this.$t('issues.total.last_30'),
          field: 'last_30_days_spent_sec'
        },
        {
          id: 'all',
          name: this.$t('issues.total.all_time'),
          field: 'all_time_spent_sec'
        }
      ],
      statsPeriod: null
    }
  },
  computed: {
    stats () {
      const storeStats = this.$store.state.Issues.stats
      if (!storeStats.task || !storeStats.bug) {
        return {}
      }
      let ret = {
        cntTasks: +storeStats.task.count,
        cntBugs: +storeStats.bug.count
      }
      const total = ret.cntTasks + ret.cntBugs
      ret.total = total
      if (total > 0) {
        ret.percentBugs = Math.round(ret.cntBugs / total * 100)
        ret.percentTasks = 100 - ret.percentBugs
        if (ret.percentTasks < 10 || ret.percentBugs < 10) {
          ret.percentBugs = Math.round(ret.cntBugs / total * 1000) / 10
          ret.percentTasks = 100 - ret.percentBugs
        }
      }
      if (this.statsPeriod) {
        const period = this.statsPeriodOptions.find(el => el.id === this.statsPeriod)
        if (period) {
          const key = period.field
          ret.timeTasks = storeStats.task[key] || 0
          ret.timeBugs = storeStats.bug[key] || 0
          ret.totalTime = ret.timeTasks + ret.timeBugs
          if (ret.totalTime > 0) {
            ret.percentTimeBugs = Math.round(ret.timeBugs / ret.totalTime * 100)
            ret.percentTimeTasks = 100 - ret.percentTimeBugs
          }
        }
      }
      return ret
    },
    statsPeriodName () {
      const period = this.statsPeriodOptions.find(el => el.id === this.statsPeriod)
      if (period) {
        return period.name
      }
    }
  },
  methods: {
    setStatsPeriod () {
      const currentPeriod = this.statsPeriodOptions.find(el => el.id === this.statsPeriod)
      const currentIndex = this.statsPeriodOptions.indexOf(currentPeriod)
      const newIndex = currentIndex === this.statsPeriodOptions.length - 1 ? 0 : currentIndex + 1
      this.statsPeriod = this.statsPeriodOptions[newIndex].id
      this.$store.dispatch('updateUserSettings', {issues_stats_period: this.statsPeriod})
    },
    secondsToHIS
  }
}
</script>


<style lang="less">
  .c-issue-stats {
  color: #555;
  font-size: .7em;
  justify-content: center;
  height: 30px;
  display: flex;
  flex-direction: column;
  .e-number {
    font-weight: bold;
  }
  > div {
    margin-bottom: 3px;
  }
  .e-time {
    display: inline-flex;
    .e-toggle-period {
      font-size: 1em;
      text-transform: none;
      color: #2975dc;
      font-weight: normal;
      margin: 0 4px;
    }
  }
  .e-count, .e-time {
    white-space: nowrap;
  }
}
</style>

