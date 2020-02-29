<template>
  <div class="c-activity-report" :class="{loading}">
    <component :is="reportComponent" ref="report" :openDay="openDay" :year="year" :user="user" :key="user.id"
               @changeDate="d => $emit('changeDate', d)" @openWeek="d => openWeek(d)"
               @openMonth="d => openMonth(d)">
      <nuxt-link slot="editLink" class="e-edit-link" to="/stats/edit-time"
                 v-if="$store.state.webuser.user.id == user.id">
        {{ $t('activity_report.edit_time')}}
      </nuxt-link>
      <div slot="periodSelector" class="b-period-selector">
        <div class="e-item" @click="changePeriod('day')" :class="{active: period == 'day'}">{{ $t('activity.week') }}
        </div>
        <div class="e-item" @click="changePeriod('week')" :class="{active: period == 'week'}">{{ $t('activity.month') }}
        </div>
        <div class="e-item" @click="changePeriod('month')" :class="{active: period == 'month'}">{{ $t('activity.year')
          }}
        </div>
      </div>
      <div slot="yearSelector" class="b-year" v-if="years.length > 1">
        <dropdown
          name="year"
          :selected="year"
          :onChange="y => $emit('changeYear', y)"
          :options="years">
        </dropdown>
      </div>
    </component>
  </div>
</template>

<script>
  import Timelines from './Timelines.vue'
  import WeekTotals from './WeekTotals.vue'
  import MonthTotals from './MonthTotals.vue'
  import Dropdown from '../../Dropdown.vue'
  import { scrollTo } from '~/utils/dom'

  export default {
    components: {
      Dropdown,
      MonthTotals,
      WeekTotals,
      Timelines
    },
    name: 'activity-report',
    props: ['user', 'period', 'year'],
    data () {
      return {
        loading: false,
        screensPage: null,
        screensTimer: null,
        screens: [],
        headers: {},
        totalsByDay: {},
        openDay: null
      }
    },
    methods: {
      refresh () {
        this.loading = true
        this.$emit('loading')
        let promises = [
          this.$store.dispatch('stats/loadAggregatedActivity', {idUser: this.userId, period: this.period}),
          this.$store.dispatch('stats/loadLastTimers', {idUser: this.userId, period: this.period})
        ]
        if (this.period === 'week') {
          promises.push(this.$store.dispatch('stats/getSpentByDay', {idUser: this.userId}))
        } else if (this.period === 'month') {
          promises.push(this.$store.dispatch('stats/getSpentByWeek', {idUser: this.userId}))
        }
        return Promise.all(promises).finally(() => {
          this.loading = false
          this.$emit('load')
        })
      },
      changePeriod (period) {
        this.$emit('changePeriod', period)
      },
      scrollUp () {
        scrollTo(this.$el, -70)
      },
      openWeek (d) {
        this.openDay = d
        this.changePeriod('day')
      },
      openMonth (d) {
        this.openDay = d
        this.changePeriod('week')
      }
    },
    computed: {
      userId () {
        return this.$route.query.id || this.$store.state.webuser.user.id
      },
      years () {
        const startYear = this.$date(this.user.dta_create).year()
        const currentYear = this.$date().year()
        let ret = []
        for (let y = startYear; y <= currentYear; y++) {
          ret.push({id: y, name: y})
        }
        return ret.reverse()
      },
      reportComponent () {
        switch (this.period) {
          case 'day':
            return 'timelines'
          case 'week':
            return 'week-totals'
          case 'month':
            return 'month-totals'
        }
      }
    },
    mounted () {
      window.activity = this
    },
    watch: {
      period: function () {
        this.$nextTick(() => this.scrollUp())
      },
      '$route.query.id': function () {
        this.refresh().then(() => {
          this.$emit('load')
          this.scrollUp()
        })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-activity-report {
    @row-height: 30px;
    @graph-margin: 5px;
    &.loading {
      pointer-events: none;
    }
    .b-menu-row {
      display: flex;
      align-items: center;
      justify-content: center;
      height: @row-height;
      margin-bottom: 10px;
      position: relative;
      padding: 0 15px;
      > .b-left, > .b-right {
        width: 300px;
      }
      > .b-left {
        padding-left: 5px;
      }
      > .b-center {
        display: flex;
        flex: 1;
        justify-content: center;
        align-items: center;
        height: 100%;
        .b-period-selector {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          .e-item {
            text-transform: uppercase;
            font-size: 0.95em;
            color: #c6c6c6;
            font-weight: bold;
            padding: 0 10px;
            height: 100%;
            display: flex;
            align-items: center;
            &.active, &:hover {
              color: #000;
            }
            &:not(.active) {
              .hover-mixin()
            }
          }
        }
      }
      > .b-right {
        display: flex;
        justify-content: flex-end;
        .e-stats-for {
          margin-right: 10px;
        }
        .dropdown-menu {
          left: auto;
          right: 0;
        }
        .b-year {
          display: flex;
          margin-left: 10px;
          .b-dropdown {
            a.dropdown-toggle {
              font-size: 0.9em;
            }
            .dropdown-menu {
              min-width: 0;
              width: 70px;
            }
          }
        }
        .e-edit-link {
          color: @basic-blue;
        }
      }
    }
    &.loading .b-box, &.loading .c-timelines {
      visibility: hidden;
    }
    .b-box {
      .white-box;
      width: 100%;
      border-left: none;
      border-right: none;
      border-radius: 0;
    }
    .b-box.m-week, .b-box.m-month {
      .b-row {
        height: 40px;
        display: flex;
        &.m-head {
          height: 30px;
          .b-center {
            .b-graph {
              border-bottom: none;
            }
          }
        }
        .b-center {
          flex: 1;
          display: flex;
          .b-avg, .b-time {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 15px;
          }
          .b-avg {
            width: 53px;
            font-size: .8em;
            &.m-low {
              color: @red-color;
            }
            &.m-high {
              color: @green-color;
            }
          }
          .b-time {
            width: 59px;
            font-size: .8em;
            text-transform: uppercase;
            white-space: nowrap;
            font-weight: bold;
          }
          > .b-main {
            flex: 1;
            display: flex;
            position: relative;
          }
        }
        > .b-left, > .b-right {
          width: 80px;
          min-width: 80px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          .e-date, .e-week, .e-month, .e-total-time {
            font-size: .8em;
            text-transform: uppercase;
            white-space: nowrap;
            font-weight: bold;
          }
        }
        &.m-current {
          .b-left {
            .e-date, .e-week, .e-month {
              color: #589ae8;
            }
          }
          .e-total-time {
            color: #589ae8;
          }
        }
      }
      .b-center {
        padding-right: 3px;
      }
      .b-row {
        height: 115px;
        align-items: center;
        .b-left, .b-right {
          .e-week, .e-month, .e-total-time {
            height: 25px;
            line-height: 25px;
          }
        }
        .b-center {
          height: 100%;
        }
        .b-graph {
          height: 30px;
        }
        .b-avg {
          align-items: center;
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
      &.m-month {
        .b-row {
          height: 115px;
          .b-center {
            overflow-x: auto;
            .b-main {
              overflow-x: auto;
              overflow-y: hidden;
              height: 100px;
              .b-day, .b-cell {
                min-width: 100% / 6 !important;
              }
              .b-cell {
                .e-date {
                  height: 25px;
                  display: inline-flex;
                  justify-content: center;
                  align-items: flex-end;
                  padding-bottom: 2px;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
