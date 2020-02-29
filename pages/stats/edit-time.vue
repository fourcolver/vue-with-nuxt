<template>

  <div class="stats-edit-time">
    <div class="b-top">
      <div class="b-date">
        <div class="e-left"
             @click="$router.push({query: {date: currentDate.clone().subtract(1, 'd').format('YYYY-MM-DD')}})">&lt;
        </div>
        <div class="e-date">{{ currentDate.format('DD MMM YYYY') }}</div>
        <div class="e-right" :class="{hidden: $date().isSame(currentDate, 'day')}"
             @click="$router.push({query: {date: currentDate.clone().add(1, 'd').format('YYYY-MM-DD')}})">
          &gt;
        </div>
      </div>
      <div class="e-total-time" v-if="totalTime">
        {{ $t('edit_time.day_total') + ': ' + secondsToHIS(totalTime)}}
      </div>
    </div>
    <div class="b-box">
      <!--  -->
      <div class="b-custom-link">
        <a class="e-link"
           v-show="!loading"
           v-if="canAddLastTimer()"
           href="#"
           @click.prevent="addTime(timers.length ? timers[0] : null, null)">{{ $t('edit_time.add_custom')}}</a>
        <a href="#" class="e-link m-inactive" @click.prevent=""
           v-tooltip="{content: $t('edit_time.cant_add_last'), delay: {show: 300, hide: 0}}"
           v-if="currentDate.isSame($date(), 'date')">{{ $t('edit_time.add_custom')}}</a>
      </div>
      <div class="b-timers" v-if="timers.length">
        <div class="b-timer" v-for="timer, i in timers" :class="{'m-manual': timer.is_manual, 'm-bug': timer.is_bug}">
          <div class="b-middle">
            <div class="b-project">
              <avatar v-if="getProject(timer.id_project)" :src="getProject(timer.id_project).logo_url"
                      :name="getProject(timer.id_project).name" size="40"></avatar>
            </div>
            <div class="b-main" @click="timerClick(timer)" :class="{'m-editable' : canEdit(timer)}"
                 v-tooltip="canEdit(timer) ? null : {content: $t('edit_time.cant_edit_last'), delay: {show: 300, hide: 0}}">
              <div class="b-top">
                <div class="e-time">
                  {{ $date(timer.dta_start).format('HH:mm:ss') + ' - ' + $date(timer.dta_end).format('HH:mm:ss')}}
                </div>
              </div>
              <div class="b-bottom">
                <div class="b-desc">
                  <span class="e-number" v-if="timer.issue_number">{{ timer.issue_number }}. </span>
                  <span class="e-desc">{{ timer.working_on }}</span>
                </div>
              </div>
            </div>
            <div class="b-spent">
              <div class="e-spent">{{ secondsToHIS(timer.spent_sec)}}</div>
            </div>
          </div>
          <div class="b-custom-link" v-if="canAddTimerBefore(timer)">
            <a class="e-link" href="#"
               @click.prevent="addTime(i === timers.length - 1 ? null : timers[i + 1], timer)">{{ $t('edit_time.add_custom')}}</a>
          </div>
        </div>
      </div>
      <div class="b-empty" v-else>
        <div class="e-no-time">{{ $t('edit_time.no_timers')}}</div>
      </div>
      <manual-timer ref="manualTimer" @submit="submitManual"></manual-timer>
    </div>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import moment from 'moment'
  import { secondsToHIS } from '~/utils/time'
  import Avatar from '../../components/Avatar.vue'
  import ManualTimer from '../../components/stats/ManualTimer.vue'

  export default {
    components: {
      ManualTimer,
      Avatar
    },
    computed: {
      ...mapState({
        timers: state => state.stats.editTimers
      }),
      ...mapGetters({
        'getProject': 'company/getProject'
      }),
      currentDate () {
        return this.$date(this.$route.query.date || null).startOf('day')
      },
      totalTime () {
        return this.timers.reduce((a, el) => a + +el.spent_sec, 0)
      }
    },
    fetch ({store, app, query}) {
      let date = app.$date(query.date || null, 'YYYY-MM-DD').startOf('day')
      return store.dispatch('stats/getEditTimers', {
        idUser: store.state.webuser.user.id,
        dtaFrom: date.unix(),
        dtaTo: date.endOf('day').unix()
      })
    },
    watch: {
      '$route.query.date': function () {
        this.loading = true
        this.loadTimers()
      }
    },
    mounted () {
      window.editTime = this
    },
    data () {
      return {
        loading: false
      }
    },
    methods: {
      addTime (before = null, after = null) {
        let start = before ? this.$date(before.dta_end).add(1, 's') : this.currentDate
        let end
        if (after) {
          end = this.$date(after.dta_start).subtract(1, 's')
        } else {
          if (this.currentDate.isSame(this.$date(), 'date')) {
            end = this.$store.state.serverDate ? moment(this.$store.state.serverDate) : moment()
          } else {
            end = this.currentDate.clone().endOf('day')
          }
        }
        this.$refs.manualTimer.add(start, end)
      },
      submitManual () {
        this.loadTimers().then(() => {
          this.$refs.manualTimer.sending = false
          this.$refs.manualTimer.close()
        })
      },
      loadTimers () {
        this.loading = true
        let date = this.$date(this.$route.query.date, 'YYYY-MM-DD').startOf('day')
        return this.$store.dispatch('stats/getEditTimers', {
          idUser: this.$store.state.webuser.user.id,
          dtaFrom: date.unix(),
          dtaTo: date.endOf('day').unix()
        }).then(() => {
          this.loading = false
        })
      },
      canAddTimerBefore (timer) {
        const ind = this.timers.indexOf(timer)
        if (ind === this.timers.length - 1) {
          return this.$date(timer.dta_start).format('HH:mm:ss') !== '00:00:00'
        } else {
          return this.$date(timer.dta_start).diff(this.$date(this.timers[ind + 1].dta_end), 's') > 2
        }
      },
      canEdit (timer) {
        if (this.currentDate.isSame(this.$date(), 'date')) {
          return this.timers.indexOf(timer) !== 0
        }
        return true
      },
      timerClick (timer) {
        if (!this.canEdit(timer)) {
          return
        }
        const i = this.timers.indexOf(timer)
        const before = i === this.timers.length - 1 ? null : this.timers[i + 1]
        const after = i === 0 ? null : this.timers[i - 1]
        this.$refs.manualTimer.edit(timer, before, after)
      },
      canAddLastTimer () {
        if (this.currentDate.isSame(this.$date(), 'date')) {
          return false
        }
        return !this.timers.length || this.$date(this.timers[0].dta_end).format('HH:mm:ss') !== '23:59:59'
      },
      secondsToHIS
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .stats-edit-time {
    > .b-top {
      width: @issues-width;
      margin: auto;
      position: relative;
      .b-date {
        width: 200px;
        margin: 10px auto;
        display: flex;
        align-items: center;
        height: @navbar-height;
        color: @red-color;
        .e-left, .e-right {
          font-size: 1.4em;
          .hover-mixin();
          height: 100%;
          width: @navbar-height;
          display: flex;
          justify-content: center;
          align-items: center;
          &.hidden {
            visibility: hidden;
          }
        }
        .e-date {
          flex: 1;
          margin: 0 5px;
          text-align: center;
        }
      }
      .e-total-time {
        position: absolute;
        top: 0;
        right: 2px;
        color: rgb(47, 117, 181);
        display: flex;
        height: @navbar-height;
        align-items: center;
        font-weight: normal;
      }
    }
    .b-box {
      .white-box();
      a {
        text-decoration: underline;
        color: rgb(60, 119, 190);
        &:hover {
          text-decoration: none;
        }
      }
      margin: 0 auto 30px auto;
      width: @issues-width;
      padding: 15px;
      .b-timers {
        .b-timer {
          margin-bottom: 10px;
          @project-width: 65px;
          .b-project {
            width: @project-width;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .b-middle {
            display: flex;
            height: @project-width;
            > .b-main {
              font-size: .9em;
              flex: 1;
              height: 100%;
              background: rgb(88, 154, 232);
              color: #fff;
              padding: 10px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
              border-radius: 3px;
              &.m-editable:hover {
                background: rgba(88, 154, 232, .7);
                cursor: pointer;
              }
              > .b-top, .b-bottom {
                display: flex;
              }
              > .b-top {
                .e-spent {
                  flex: 1;
                  text-align: right;
                }
              }
              > .b-bottom {
                .b-desc {
                  white-space: nowrap;
                  overflow: hidden;
                  display: flex;
                  flex: 1;
                  .e-number {
                    margin-right: 5px;
                  }
                  .e-desc {
                    text-overflow: ellipsis;
                    overflow: hidden;
                  }
                }
              }
            }
            > .b-project, .b-spent {
              width: 75px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            > .b-spent {
              color: rgb(47, 117, 181);
              font-weight: bold;
              font-size: 0.9em;
            }
            &:hover {
              .e-delete {
                visibility: visible !important;
              }
            }
          }
          &.m-manual .b-middle .b-main {
            background: rgb(238, 160, 34);
            &.m-editable:hover {
              background: rgba(238, 160, 34, .7);
            }
          }
          &.m-bug > .b-middle .b-main {
            background: rgb(192, 0, 0) !important;
            &.m-editable:hover {
              background: rgba(192, 0, 0, .7) !important;
            }
          }
          .b-custom-link {
            margin-top: 10px;
          }
        }
      }
      .b-empty {
        text-align: center;
      }
      .b-custom-link {
        text-align: center;
        height: 16px;
        position: relative;
        .e-total-time {
          position: absolute;
          right: 10px;
          top: 2px;
          color: rgb(47, 117, 181);
          font-weight: bold;
          font-size: 0.9em;
        }
        .e-link {
          &.m-inactive {
            cursor: default !important;
            text-decoration: underline !important;
            opacity: .5;
          }
        }
      }
      > .b-custom-link {
        margin-bottom: 10px;
      }
    }
  }
</style>
