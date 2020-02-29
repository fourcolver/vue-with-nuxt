<template>
  <div class="c-manual-timer" v-if="visible" @click.self="close" v-key-escape="() => close()">
    <form class="b-box" @submit.prevent="submit">
      <div class="b-title">
        <div class="e-title">{{ $t('manual_timer.title_' + (timer.id ? 'edit' : 'add')) }}</div>
        <div class="b-close" @click="close"><i class="bu-cross"></i></div>
      </div>
      <div class="b-body">
        <div class="b-row">
          <div class="b-label">{{ $t('manual_timer.end') }}</div>
          <div class="b-input">
            <time-input ref="maxDateInput" v-model="timer.dta_end" :min="$date(timer.dta_start).add(1, 's')"
                        :max="maxTime"></time-input>
            <div class="e-date" v-if="timer.id">{{ $date(timer.dta_end).format('D MMM')}}</div>
          </div>
        </div>
        <div class="b-row">
          <div class="b-label">{{ $t('manual_timer.start') }}</div>
          <div class="b-input">
            <time-input ref="minDateInput" v-model="timer.dta_start" :min="minTime"
                        :max="$date(timer.dta_end).subtract(1, 's')"></time-input>
            <div class="e-date" v-if="timer.id">{{ $date(timer.dta_start).format('D MMM')}}</div>
          </div>
        </div>
        <div class="b-row">
          <div class="b-label">{{ $t('manual_timer.result_interval') }}</div>
          <div class="b-input">
            <div class="e-time">{{ secondsToHIS($date(timer.dta_end).diff($date(timer.dta_start), 's'))}}</div>
          </div>
        </div>
        <div class="b-row">
          <div class="b-label">{{ $t('manual_timer.bug') }}</div>
          <div class="b-input">
            <radio-btn :label="$t('Yes')" :value="true" v-model="timer.is_bug"></radio-btn>
            <radio-btn :label="$t('No')" :value="false" v-model="timer.is_bug"></radio-btn>
          </div>
        </div>
        <div class="b-row">
          <div class="b-label">{{ $t('manual_timer.working_on_ticket') }}</div>
          <div class="b-input">
            <radio-btn :label="$t('Yes')" :value="true" v-model="isWorkOnIssue"></radio-btn>
            <radio-btn :label="$t('No')" :value="false" v-model="isWorkOnIssue"></radio-btn>
          </div>
        </div>
        <div class="b-row">
          <div class="b-label">{{ $t('manual_timer.project') }}</div>
          <div class="b-input">
            <dropdown direction="auto" :scrollable="true" :options="$store.state.projects"
                      :selected="timer.id_project"
                      :label="$t('manual_timer.select_project')"
                      :onChange="val => {timer.id_project = val; getIssues()}"></dropdown>
          </div>
        </div>
        <div class="b-row m-note">
            <div class="b-label"></div>
            <div class="b-input">
              <template v-if="!isWorkOnIssue">
                <input class="e-note" v-model="timer.note" type="text" :placeholder="$t('manual_timer.note')"/>
              </template>
              <template v-else-if="timer.id_project && !(issuesLoading && !issuesLoadMore)">
                <context-menu class="b-select-issue" trigger="click" v-if="issues.length" :direction="['right', 'top']"
                              :autoClose="true">
                  <div slot="content">
                    <a v-if="selectedIssue">{{selectedIssue.number}}. {{ getIssueTitle(selectedIssue) }}</a>
                    <a v-else>{{ $t('manual_timer.select_issue')}}</a>
                  </div>
                  <div class="b-items" slot="items">
                    <div class="b-issues">
                      <div class="b-issue" v-for="issue in issues" @click="timer.id_issue = issue.id"
                           :class="{'m-closed': issue.status == 'closed', 'm-resolved': issue.status == 'resolved'}">
                        <div class="e-number">{{ issue.number }}.</div>
                        <div class="e-name">{{ getIssueTitle(issue) }}</div>
                      </div>
                    </div>
                    <div class="b-load-more" :class="{'m-inactive': issuesLoadMore}" @click.stop=""
                         v-if="issuesHeaders['x-pagination-total-count'] > issues.length">
                      <a class="e-load-more" href="#" @click.prevent="loadMore">{{ $t('manual_timer.load_more') }}</a>
                    </div>
                  </div>
                </context-menu>
                <div class="e-empty" v-else>{{ $t('manual_timer.no_issues')}}</div>
              </template>
            </div>
        </div>
        <div class="b-buttons">
          <div class="b-left">
            <div class="e-delete" v-if="timer.id" @click.stop="deleteTimer(timer)">
              {{ $t('edit_time.delete_timer')}}
            </div>
          </div>
          <div class="b-right">
            <btn :loading="sending" @click="submit" :text="$t('manual_timer.btn_' + (timer.id ? 'edit' : 'add'))"></btn>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
  import TimeInput from '../TimeInput.vue'
  import RadioBtn from '../RadioBtn.vue'
  import Dropdown from '../Dropdown.vue'
  import Btn from '../Btn.vue'
  import { secondsToHIS } from '~/utils/time'
  import ContextMenu from '../ContextMenu.vue'
  import Avatar from '../Avatar.vue'
  import { mapGetters } from 'vuex'

  const getDefaultTimer = () => {
    return {
      id: null,
      dta_start: null,
      dta_end: null,
      id_issue: null,
      id_project: null,
      is_bug: false,
      note: ''
    }
  }

  export default {
    components: {
      Avatar,
      ContextMenu,
      Btn,
      Dropdown,
      RadioBtn,
      TimeInput
    },
    name: 'manual-timer',
    computed: {
      ...mapGetters({
        'getProject': 'company/getProject'
      }),
      selectedIssue () {
        if (this.timer.id_issue) {
          return this.issues.find(el => +el.id === +this.timer.id_issue)
        }
      },
      issuesPage () {
        return +this.issuesHeaders['x-pagination-current-page'] || 1
      }
    },
    data () {
      return {
        visible: false,
        timer: getDefaultTimer(),
        isWorkOnIssue: true,
        minTime: null,
        maxTime: null,
        issues: [],
        sending: false,
        issuesLoading: false,
        issuesLoadMore: false,
        issuesHeaders: {}
      }
    },
    methods: {
      close () {
        this.visible = false
      },
      async add (min, max) {
        this.timer = getDefaultTimer()
        this.minTime = min
        this.maxTime = max
        this.timer.dta_start = min.format('YYYY-MM-DD HH:mm:ss')
        this.timer.dta_end = max.format('YYYY-MM-DD HH:mm:ss')
        this.visible = true
      },
      async edit (timer, before, after) {
        this.timer = getDefaultTimer()
        await Promise.all([
          this.getIssues(),
          this.getTimer(timer.id)
        ])
        if (!this.timer.is_manual) {
          this.minTime = this.$date(this.timer.dta_start).add(1, 's')
          this.maxTime = this.$date(this.timer.dta_end).subtract(1, 's')
        } else {
          this.minTime = before ? this.$date(before.dta_end).add(1, 's') : this.$date(timer.dta_start).startOf('day')
          this.maxTime = after ? this.$date(after.dta_start).subtract(1, 's') : this.$date(timer.dta_start).endOf('day')
        }
        this.visible = true
      },
      getTimer (id) {
        return this.$api.get('timers/' + id).then(res => {
          this.isWorkOnIssue = !!res.data.timers.id_issue
          this.timer = res.data.timers
        })
      },
      getIssues (page = null) {
        this.issuesLoading = true
        if (page) {
          this.issuesLoadMore = true
        }
        return this.$api.get('issues', {
          filters: {id_project: this.timer.id_project},
          sort: '-dta_last_event',
          'per-page': 25,
          page: page || 1
        }).then(res => {
          this.issuesHeaders = {...res.headers}
          this.issues = !page ? res.data.issues : [...this.issues, ...res.data.issues]
          this.issuesLoading = false
          this.issuesLoadMore = false
        })
      },
      getIssueTitle (i) {
        return `${i.tag1 ? i.tag1 + (i.name ? '.' : '') : ''} ${i.name || ''} ${!i.tag1 && !i.name ? i.description : ''}`
      },
      validate () {
        if (this.isWorkOnIssue && !this.timer.id_issue) {
          alert(this.$t('manual_timer.no_issue'))
          return false
        } else if (!this.isWorkOnIssue) {
          if (!this.timer.id_project) {
            alert(this.$t('manual_timer.no_project'))
            return false
          } else if (!this.timer.note.trim()) {
            alert(this.$t('manual_timer.no_note'))
            return false
          }
        }
        return true
      },
      submit () {
        let fields = ['dta_start', 'dta_end', 'is_bug']
        if (this.isWorkOnIssue) {
          fields.push('id_issue')
        } else {
          fields = [...fields, 'id_project', 'note']
        }
        if (!this.validate()) {
          return
        }
        let data = {}
        fields.forEach(f => {
          data[f] = this.timer[f]
        })
        data.dta_start = this.$date(data.dta_start).utcOffset(0).format('YYYY-MM-DD HH:mm:ss')
        data.dta_end = this.$date(data.dta_end).utcOffset(0).format('YYYY-MM-DD HH:mm:ss')
        this.sending = true
        let apiCall
        if (!this.timer.id) {
          apiCall = this.$api.post('timers', data)
        } else {
          apiCall = this.$api.put('timers/' + this.timer.id, data)
        }
        apiCall.then(() => {
          this.$emit('submit')
        })
      },
      async deleteTimer (timer) {
        await this.$confirm(this.$t('edit_time.delete_confirm'))
        await this.$api.delete('timers/' + timer.id)
        this.$emit('submit')
      },
      loadMore () {
        if (this.issuesLoadMore) {
          return
        }
        this.getIssues(this.issuesPage + 1)
      },
      secondsToHIS
    },
    mounted () {
      window.manualTimer = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-manual-timer {
    .fullscreen-modal();
    display: flex;
    align-items: center;
    .b-box {
      .white-box();
      width: 520px;
      padding: 0;
      .b-title {
        @title-height: 38px;
        background: #f4f4f4;
        font-weight: bold;
        display: flex;
        height: @title-height;
        align-items: center;
        .e-title {
          flex: 1;
          padding-left: 30px;
        }
        .b-close {
          width: @title-height;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          .hover-mixin();
        }
      }
      .b-body {
        padding: 15px 30px;
        .b-row {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          min-height: 16px;
          > .b-label {
            font-weight: bold;
            width: 180px;
            min-width: 180px;
          }
          > .b-input {
            display: flex;
            flex: 1;
            .c-radio-btn:first-child {
              margin-right: 10px;
            }
            .b-dropdown {
              padding-left: 3px;
              a.dropdown-toggle {
                text-transform: none;
                text-overflow: ellipsis;
                display: block;
                max-width: 275px;
              }
              .dropdown-menu {
                overflow-y: auto;
                max-height: 310px;
              }
            }
            input.e-note {
              .text-input();
            }
            .e-date {
              display: flex;
              align-items: center;
              margin-left: 10px;
              height: 64px;
            }
            .e-time {
              padding-left: 3px;
              font-size: 1.2em;
              font-weight: bold;
            }
            .b-select-issue {
              .b-menu-content {
                font-size: 0.9em;
                font-weight: bold;
                margin-left: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 275px;
                a {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  display: inline-block;
                  max-width: 100%;
                }
              }
              .b-menu-items {
                max-height: 300px;
                overflow-y: auto;
                padding: 5px 0;
                .b-issues {
                  width: 450px;
                  .b-issue {
                    display: flex;
                    align-items: center;
                    .hover-mixin();
                    overflow: hidden;
                    padding: 0 10px;
                    height: 32px;
                    &.m-closed {
                      color: #777;
                    }
                    &.m-resolved {
                      color: @green-color;
                    }
                    .b-avatar img {
                      display: block;
                    }
                    > div:not(:last-child) {
                      margin-right: 5px;
                    }
                    > div:last-child {
                      overflow: hidden;
                      text-overflow: ellipsis
                    }
                  }
                }
                .b-load-more {
                  height: 32px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  &.m-inactive {
                    opacity: .5;
                    a {
                      cursor: default;
                    }
                  }
                }
              }
            }
            .e-empty {
              margin-left: 3px;
            }
          }
          &.m-note {
            height: 36px;
          }
        }
        .b-buttons {
          display: flex;
          > .b-left {
            flex: 1;
            .e-delete {
              text-decoration: none;
              color: @red-color;
              height: @btn-height;
              display: flex;
              align-items: center;
              &:hover {
                cursor: pointer;
                text-decoration: underline;
              }
            }
          }
          > .b-right {
          }
        }
      }
    }
  }
</style>
