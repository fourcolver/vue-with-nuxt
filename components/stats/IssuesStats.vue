<template>
  <div class="c-issues-stats" :class="{'m-hidden': updating, 'm-grouped': grouped}">
    <div class="b-row m-header">
      <div class="b-task">
        <dropdown :options="onlyBugsOptions"
                  :selected="onlyBugs"
                  :onChange="val => onlyBugs = val"></dropdown>
        <dropdown v-if="period == 'day'" :options="weekDayOptions"
                  :selected="weekDay"
                  :label="$t('issues_stats.all_days')"
                  :empty="$t('issues_stats.all_days')"
                  class="b-day-selector"
                  :onChange="val => weekDay = val"></dropdown>
      </div>
      <checkbox :model="!grouped" @change="val => grouped = !val" :value="true"
                :label="$t('issue_stats.grouping_disabled')"></checkbox>
      <div class="b-time" :class="{'m-bug': onlyBugs === 1}">{{ secondsToHIS(totalTime, 'h:i')}}</div>
    </div>
    <div class="b-box">
      <template v-for="timer, i in timers">
        <div class="b-row m-row m-project-header"
             v-if="grouped && (i === 0 || timers[i - 1].id_project != timer.id_project)"
             :class="{'has-hover': getProject(timer.id_project)}"
             @click="$router.push(createProjectUrl(getProject(timer.id_project).uid))">
          <div class="b-project" v-if="getProject(timer.id_project)">
            <avatar :name="getProject(timer.id_project).name" :src="getProject(timer.id_project).logo_url"
                    size="20"></avatar>
            <span class="e-project-name">{{ getProject(timer.id_project).name }}</span>
          </div>
          <div class="b-project" v-else>
            <div class="e-project">{{ $t('issue_stats.no_project') }}</div>
          </div>
          <div class="b-time">{{ secondsToHIS(getProjectTime(timer.id_project), 'h:i')}}</div>
        </div>
        <div class="b-row m-row" :class="{'has-hover': timer.issue}" @click="goToIssue(timer)">
          <div class="b-task">
            <avatar v-if="!grouped && getProject(timer.id_project)" :name="getProject(timer.id_project).name"
                    :src="getProject(timer.id_project).logo_url" size="20"></avatar>
            <template>
              <div class="e-number" v-if="timer.issue">{{ timer.issue.number }}.</div>
            </template>
            <template>
              <div class="b-name">
                <div class="e-name" v-if="timer.id_issue" v-for="item in timer.notes"
                     :class="{'m-task': timer.id_issue}">
                   {{ item.note !== $t('No description') ? item.note : (timer.issue.tag1 ? timer.issue.tag1 + '. ': '') + (item.issue.subject || item.issue.snippet) }}
                </div>
                <div class="e-name" v-if="!timer.id_issue">
                   {{ timer.note }}
                </div>
              </div>
            </template>
          </div>
          <div v-if="timer.notes.length > 1">
            <div class="b-time" v-for="item in timer.notes">{{ secondsToHIS(item.spent_sec, 'h:i') }}</div>
          </div>
          <div class="b-total-time">{{ secondsToHIS(timer.spent_sec, 'h:i') }}</div>
        </div>
      </template>
      <div class="b-row m-row" v-if="!timers.length">
        <div class="b-empty">{{ $t('issue_stats.no_tasks') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import Dropdown from '../Dropdown.vue'
  import ContextMenu from '../ContextMenu.vue'
  import { mapGetters } from 'vuex'
  import { secondsToHIS } from '~/utils/time'
  import Avatar from '../Avatar.vue'
  import TagLabel from '../TagLabel.vue'
  import Checkbox from '../Checkbox.vue'
  import RadioBtn from '../RadioBtn.vue'
  import { groupBy } from 'lodash'
  import moment from 'moment'

  export default {
    components: {
      Checkbox,
      TagLabel,
      Avatar,
      ContextMenu,
      Dropdown,
      RadioBtn
    },
    name: 'issues-stats',
    data () {
      return {
        updating: false,
        weekDay: null
      }
    },
    props: ['period', 'user', 'selectedDate', 'year'],
    methods: {
      update () {
        return this.$store.dispatch('stats/getIssuesTimers', {
          idUser: this.user.id,
          period: this.period,
          baseDate: this.selectedDate,
          year: this.year
        }).finally(() => {
          this.updating = false
        })
      },
      goToIssue (timer) {
        if (!timer.issue) {
          return
        }
        const route = this.createIssueUrl({
          uid: this.getProject(timer.id_project).uid,
          number: timer.issue.number
        })
        this.$router.push(route)
      },
      getProjectTime (idProject) {
        return this.timers.reduce((sum, el) => sum + (+el.id_project === +idProject ? el.spent_sec : 0), 0)
      },
      secondsToHIS
    },
    computed: {
      ...mapGetters({
        getProject: 'company/getProject',
        createProjectUrl: 'company/createProjectUrl',
        createIssueUrl: 'company/createIssueUrl'
      }),
      timers () {
        let sortedByIssue = [...this.$store.state.stats.issuesTimers]

        let grouped = groupBy(sortedByIssue, 'id_issue')
        let groupedByIssue = []

        for (let issueId in grouped) {
          const items = grouped[issueId]

          items.sort((a, b) => {
            if (a.spent_sec !== b.spent_sec) {
              return b.spent_sec > a.spent_sec ? 1 : -1
            }
            return 0
          })

          if (items[0].id_issue) {
            groupedByIssue.push(
              {
                id_issue: items[0].id_issue,
                id_project: items[0].id_project,
                id_user: items[0].id_user,
                issue: items[0].issue,
                spent_sec: items.reduce((sum, el) => sum + el.spent_sec, 0),
                notes: items,
                note: !items[0].id_issue ? items[0].note : null
              }
            )
          } else {
            items.forEach(item => {
              groupedByIssue.push(
                {
                  ...item,
                  notes: []
                }
              )
            })
          }
        }
        if (!this.grouped) {
          groupedByIssue.sort((a, b) => {
            if (a.spent_sec !== b.spent_sec) {
              return b.spent_sec > a.spent_sec ? 1 : -1
            }
            return 0
          })
          return groupedByIssue
        } else {
          let sorted = [...groupedByIssue]
          sorted.sort((a, b) => {
            if (a.id_project !== b.id_project) {
              const aOrd = this.getProject(a.id_project) ? this.getProject(a.id_project).position : Infinity
              const bOrd = this.getProject(b.id_project) ? this.getProject(b.id_project).position : Infinity
              return bOrd > aOrd ? -1 : 1
            } else if (a.spent_sec !== b.spent_sec) {
              return b.spent_sec > a.spent_sec ? 1 : -1
            }
            return 0
          })
          return sorted
        }
      },
      totalTime () {
        return this.timers.reduce((sum, el) => sum + el.spent_sec, 0)
      },
      dateOptions () {
        let ret = []
        let start = this.$date()
        switch (this.period) {
          case 'day':
            for (let i = 0; i < 7; i++) {
              ret.push(start.clone().subtract(i, 'day'))
            }
            return ret
          case 'week':
            for (let i = 0; i < 3; i++) {
              ret.push(start.clone().subtract(i * 7, 'day'))
            }
            return ret
          case 'month':
            for (let i = 0; i < 3; i++) {
              ret.push(start.clone().subtract(i, 'month'))
            }
            return ret
        }
      },
      grouped: {
        get () {
          return !this.$store.state.userSettings.grouping_disabled_stats_tasks
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsSync', {grouping_disabled_stats_tasks: !val})
        }
      },
      onlyBugs: {
        get () {
          return this.$store.state.userSettings.bugs_only_stats_tasks
        },
        set (val) {
          this.updating = true
          this.$store.dispatch('updateUserSettingsSync', {bugs_only_stats_tasks: val})
          this.update()
        }
      },
      onlyBugsOptions () {
        return [
          {
            id: 2,
            name: this.$t('issue_stats.tasks_and_bugs')
          },
          {
            id: 1,
            name: this.$t('issue_stats.only_bugs')
          },
          {
            id: 0,
            name: this.$t('issue_stats.only_tasks')
          }
        ]
      },
      weekDayOptions () {
        let ret = []
        moment.locale(this.$i18n.locale)
        let days = moment.weekdays()
        days.push(days.shift())
        days.forEach((d, i) => {
          ret.push({
            id: i + 1,
            name: d
          })
        })
        return ret
      }
    },
    mounted () {
      window.issuesStats = this
    },
    watch: {
      selectedDate () {
        this.update()
      },
      user () {
        this.update()
      },
      weekDay (val) {
        if (val === null) {
          this.update()
          return
        }
        return this.$store.dispatch('stats/getIssuesTimers', {
          idUser: this.user.id,
          dtaFrom: this.selectedDate.clone().isoWeekday(val).startOf('day'),
          dtaTo: this.selectedDate.clone().isoWeekday(val).endOf('day')
        }).finally(() => {
          this.updating = false
        })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-issues-stats {
    @import '~assets/css/mixins.less';
    @import '~assets/css/variables.less';
    width: @issues-width;
    @row-height: 35px;
    margin: 10px auto;
    &.m-hidden {
      visibility: hidden;
    }
    .b-box {
      font-size: .9em;
      position: relative;
      .white-box();
    }
    .b-row {
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      &:nth-child(odd) {
        background: #fafafa;
      }
      &.has-hover {
        .hover-mixin();
      }
      .b-task, .b-project, .b-empty, .b-time, .b-total-time {
        padding: 0 10px;
        display: flex;
        height: 100%;
        align-items: center;
      }
      .b-total-time {
        font-weight: bold;
      }
      .b-avatar, .e-number, .b-time, .b-total-time {
        display: flex;
        align-self: flex-start;
        align-items: center;
        height: @row-height;
      }
      &.m-header {
        background: transparent !important;
        .b-checkbox {
          margin-right: 15px;
          .b-icon {
            margin-right: 5px;
          }
        }
        .b-time {
          font-weight: bold;
          &.m-bug {
            color: @red-color;
          }
        }
      }
      .b-day-selector {
        margin-left: 20px;
        .dropdown-menu {
          li {
            text-transform: capitalize;
          }
        }
      }
      &:not(.m-header) .b-task {
        overflow-x: hidden;
      }
      .b-task {
        flex: 1;
        display: flex;
        .e-for {
          color: @basic-blue;

          &.bug {
            color: @red-color;
          }
        }
        .b-date-selector {
          margin-left: 8px;
          padding: 3px;
          .hover-mixin();
          .e-toggle {
            font-weight: bold;
            font-size: .85em;
            text-transform: uppercase;
          }
          .b-menu-items {
            width: 160px;
            padding: 5px 0;
            .b-date {
              font-size: 1rem;
              text-transform: capitalize;
              .hover-mixin();
              padding: 10px 15px;
              &.m-selected {
                color: @red-color;
              }
            }
          }
        }
        .e-number {
          margin-right: 5px;
          color: @basic-blue;
        }
        .b-avatar {
          margin-right: 8px;
          img {
            display: block;
          }
        }
        .b-tag-label {
          margin-right: 0;
          font-weight: normal;
        }

        .b-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .e-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-basis: 85%;
          flex-grow: 1;
          height: @row-height;
          display: flex;
          align-items: center;
          &.m-task {
            color: @basic-blue;
          }
        }
      }
      .b-time {
        text-align: right;
        justify-content: flex-end;
        height: @row-height;
        &:last-child {
          padding-bottom: 0;
        }
      }
      .b-project {
        flex: 1;
        overflow-x: hidden;
        .b-avatar {
          margin-right: 8px;
        }
        .e-project {
          margin-right: 5px;
        }
        .e-project-name {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow-x: hidden;
        }
      }
      .b-empty {
        flex: 1;
        justify-content: center;
      }
      &.m-project-header {
        font-weight: bold;
      }
    }
    .b-settings {
      width: 36px;
      height: 36px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: -1px;
      right: -40px;

      .e-toggle {
        padding-top: 1px;
        padding-left: 5px;
        font-size: 18px;
        width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        text-align: center;
        .hover-mixin();
      }
      .b-menu-items {
        .b-checkbox {
          display: block;
          label {
            display: block;
            .hover-mixin();
            padding: 10px;
          }
        }

        .c-radio-btn {
            padding: 10px;
            .hover-mixin();

            .b-icon {
                margin-right: 10px;
            }
        }
      }
    }
    &.m-grouped .b-row:not(.m-header) .b-task {
      padding-left: 37px;
    }
  }
</style>
