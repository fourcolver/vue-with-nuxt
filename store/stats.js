import { mergeNearTimers } from '../utils/stats'
import moment from 'moment'

const getIntervalByPeriod = (period, date, year) => {
  let dtaFrom
  let dtaTo
  if (period === 'day') {
    dtaFrom = date().startOf('isoWeek')
    dtaTo = date().endOf('isoWeek')
  } else if (period === 'week') {
    dtaFrom = date().startOf('month')
    dtaTo = date().endOf('month')
  } else if (period === 'month') {
    let quarter = Math.floor(date().month() / 3)
    dtaFrom = date().startOf('year').add(quarter * 3, 'months')
    dtaTo = dtaFrom.clone().add(3, 'months')
  }
  if (dtaFrom.year() < year) {
    dtaFrom = date().year(year).startOf('year')
  }
  if (dtaTo.year() > year) {
    dtaTo = date().year(year).endOf('year')
  }
  return {dtaFrom, dtaTo}
}

const defaultState = {
  aggregatedActivity: [],
  timers: [],
  screens: [],
  screensHeaders: {},
  issuesTimers: [],
  editTimers: [],
  spentByDay: {},
  spentByWeek: {},
  spentByHour: {},
  screensWithHours: {}
}
const stats = {
  namespaced: true,
  state: () => Object.assign({}, JSON.parse(JSON.stringify(defaultState))),
  mutations: {
    SET_AGGREGATED_ACTIVITY (state, val) {
      state.aggregatedActivity = val
    },
    SET_TIMERS (state, val) {
      state.timers = val
    },
    RESET (state) {
      state = Object.assign(state, JSON.parse(JSON.stringify(defaultState)))
    },
    SET_SCREENS (state, val) {
      state.screens = val
    },
    SET_SCREENS_HEADERS (state, val) {
      state.screensHeaders = val
    },
    ADD_SCREEN (state, val) {
      state.screens.unshift(val)
    },
    UPDATE_SCREEN (state, params) {
      let savedScreen = state.screens.find(el => +el.id === +params.id)
      if (savedScreen) {
        state.screens.splice(state.screens.indexOf(savedScreen), 1, {...savedScreen, ...params})
      }
    },
    SET_ISSUES_TIMERS (state, val) {
      val.forEach(el => {
        if (Array.isArray(el.issue)) {
          el.issue = null
        }
      })
      state.issuesTimers = val
    },
    SET_EDIT_TIMERS (state, val) {
      state.editTimers = val
    },
    SET_SPENT_BY_DAY (state, val) {
      state.spentByDay = val
    },
    SET_SPENT_BY_WEEK (state, val) {
      state.spentByWeek = val
    },
    SET_SPENT_BY_HOUR (state, val) {
      state.spentByHour = val
    },
    SET_SCREENS_WITH_HOUR (state, val) {
      state.screensWithHours = val
    }
  },
  getters: {},
  actions: {
    loadAggregatedActivity (store, {idUser, period = 'day', baseDate = null, year = null}) {
      const intervals = {
        day: 3600,
        week: 1200,
        month: 31 * 3600
      }
      let {dtaFrom, dtaTo} = getIntervalByPeriod(period, () => baseDate ? baseDate.clone() : this.$date(), year || this.$date().year())
      let params = {
        mode: period,
        interval: intervals[period],
        filters: {
          id_user: idUser,
          dta_from: dtaFrom.iso(),
          dta_to: dtaTo.iso()
        }
      }
      return this.$api.get('timers-activity-input/aggregate', params).then(res => {
        store.commit('SET_AGGREGATED_ACTIVITY', res.data.activity_inputs)
        return res.data.activity_inputs
      })
    },
    loadLastTimers (store, {idUser, period = 'day', baseDate = null, year = null}) {
      let {dtaFrom, dtaTo} = getIntervalByPeriod(period, () => baseDate ? baseDate.clone() : this.$date(), year || this.$date().year())
      return this.$api.get('timers', {
        filters: {
          dta_from: dtaFrom.format('YYYY-MM-DDTHH:mm:ss'),
          dta_to: dtaTo.format('YYYY-MM-DDTHH:mm:ss'),
          id_user: idUser
        }
      }).then(res => {
        let newElements = []
        let timers = res.data.timers
        // разрезание таймеров, находящихся на рубеже дней
        timers.forEach((el, i) => {
          if (this.$date(el.dta_start).date() !== this.$date(el.dta_end).date()) {
            let newEl = {...el}
            const fmt = 'YYYY-MM-DD HH:mm:ss'
            newEl.id = el.id + '_' + 2
            newEl.dta_start = this.$date(el.dta_end).startOf('day').format(fmt)
            newEl.spent_sec = this.$date(newEl.dta_end).unix() - this.$date(newEl.dta_start).unix()
            el.dta_end = this.$date(el.dta_start).endOf('day').format(fmt)
            el.spent_sec -= newEl.spent_sec
            newElements.push({index: i + 1, item: newEl})
          }
        })
        if (newElements.length) {
          newElements.forEach(el => {
            timers.splice(el.index, 0, el.item)
          })
        }
        // слияние таймеров, между которыми прошло менее минуты
        timers = mergeNearTimers(this.app, timers)
        store.commit('SET_TIMERS', timers)
        return res.data.timers
      })
    },
    getScreens ({state, commit}, params = {}) {
      let {userId, page = 1, 'per-page': perPage = 25, sort = '-dta', filters = {}} = params
      let options = {
        'per-page': perPage,
        page,
        sort,
        filters: {
          id_user: userId,
          ...filters
        }
      }
      return this.$api.get('timers-screens', options).then(res => {
        commit('SET_SCREENS', page === 1 ? res.data.screens : [...state.screens, ...res.data.screens])
        commit('SET_SCREENS_HEADERS', res.headers)
      })
    },
    getScreensCount ({state, commit}, params = {}) {
      let {userId, 'per-page': perPage = 25, sort = '-dta', filters = {}} = params
      let options = {
        'per-page': perPage,
        sort,
        filters: {
          id_user: userId,
          ...filters
        }
      }
      return this.$api.get('timers-screens', options)
    },
    getIssuesTimers ({commit, rootState}, {idUser, period = 'day', baseDate = null, year = null, dtaFrom = null, dtaTo = null}) {
      let params = {sort: '-spent_sec', filters: {id_user: idUser}}
      switch (rootState.userSettings.bugs_only_stats_tasks) {
        case 0: params.filters.is_bug = 0; break
        case 1: params.filters.is_bug = 1
      }
      if (!dtaFrom || !dtaTo) {
        period = getIntervalByPeriod(period, () => baseDate ? baseDate.clone() : this.$date(), year || this.$date().year())
        dtaFrom = period.dtaFrom
        dtaTo = period.dtaTo
      }
      params.filters.dta_from = dtaFrom.format('YYYY-MM-DDTHH:mm:ss')
      params.filters.dta_to = dtaTo.format('YYYY-MM-DDTHH:mm:ss')
      return this.$api.get('timers/issues-stats', params).then(res => {
        commit('SET_ISSUES_TIMERS', res.data.timers)
      })
    },
    getEditTimers ({commit}, params = {}) {
      let {idUser, dtaFrom, dtaTo} = params
      return this.$api.get('timers', {filters: {id_user: idUser, dta_from: dtaFrom, dta_to: dtaTo}, sort: '-dta'}).then(res => {
        commit('SET_EDIT_TIMERS', res.data.timers)
      })
    },
    getSpentByDay ({commit}, {idUser, baseDate, year = null}) {
      const date = () => baseDate ? baseDate.clone() : this.$date()
      let {dtaFrom, dtaTo} = getIntervalByPeriod('week', date, year || this.$date().year())
      let params = {
        mode: 'week',
        filters: {
          id_user: idUser,
          dta_from: dtaFrom.format('YYYY-MM-DDTHH:mm:ss'),
          dta_to: dtaTo.format('YYYY-MM-DDTHH:mm:ss')
        }
      }
      return this.$api.get('timers/aggregate', params).then(res => {
        let days = {}
        res.data.timers.forEach(el => {
          if (el.items && el.items.length) {
            el.items.forEach(item => {
              if (item.date && !days[item.date] && item.data && item.data[0]) {
                days[item.date] = item.data[0].spent_sec
              }
            })
          }
        })
        commit('SET_SPENT_BY_DAY', days)
      })
    },
    getSpentByWeek ({commit}, {idUser, baseDate, year}) {
      const date = () => baseDate ? baseDate.clone() : this.$date()
      let {dtaFrom, dtaTo} = getIntervalByPeriod('month', date, year || this.$date().year())
      let params = {
        mode: 'month',
        filters: {
          id_user: idUser,
          dta_from: dtaFrom.format('YYYY-MM-DDTHH:mm:ss'),
          dta_to: dtaTo.format('YYYY-MM-DDTHH:mm:ss')
        }
      }
      return this.$api.get('timers/aggregate', params).then(res => {
        let weeks = {}
        res.data.timers.forEach(el => {
          if (el.items && el.items.length) {
            el.items.forEach(item => {
              if (item.date_from && !weeks[item.date_from] && item.data && item.data[0]) {
                weeks[item.date_from] = item.data[0].spent_sec
              }
            })
          }
        })
        commit('SET_SPENT_BY_WEEK', weeks)
      })
    },
    getSpentByHour ({commit}, {userId, dtaFrom, dtaTo}) {
      let params = {
        mode: 'hour',
        filters: {
          id_user: userId,
          dta_from: dtaFrom,
          dta_to: dtaTo
        }
      }
      return this.$api.get('timers/aggregate', params).then(res => {
        let hours = {}
        res.data.timers.forEach((item) => {
          let minutes = '00:00:00'

          if (item.data.length) {
            let data = item.data.find(item => +item.id_user === +userId)

            if (data) {
              minutes = moment().startOf('day')
                .seconds(data.spent_sec)
                .format('HH:mm:ss')
            }
          }
          hours[item.date] = minutes
        })
        commit('SET_SPENT_BY_HOUR', hours)
      })
    },
    getScreensWithHours ({commit, state, dispatch}, params) {
      return dispatch('getSpentByHour', {
        userId: params.userId,
        dtaFrom: params.filters.dta_from,
        dtaTo: params.filters.dta_to
      }).then(() => {
        return dispatch('getScreens', params).then(() => {
          let hours = {}
          let lockedRemoveHour = false

          Object.keys(state.spentByHour).sort((a, b) => new Date(b) - new Date(a)).forEach((key) => {
            hours[key] = state.spentByHour[key]
          })

          for (let hour in hours) {
            hours[hour] = {
              minutes: state.spentByHour[hour],
              screens: []
            }
          }

          state.screens.forEach((item) => {
            let activitySince = item.activity_since ? new Date(item.activity_since) : null
            let dta = new Date(item.dta)

            for (let hour in hours) {
              if (activitySince && (dta.getHours() === new Date(hour).getHours()) && (dta.getMinutes() >= 0 && dta.getMinutes() <= 59)) {
                hours[hour].screens.push(item)
              }
            }
          })

          for (let hour in hours) {
            if (!lockedRemoveHour && !hours[hour].screens.length) {
              delete hours[hour]
            } else {
              lockedRemoveHour = true
            }
          }

          commit('SET_SCREENS_WITH_HOUR', hours)
        })
      })
    }
  }
}

export default stats
