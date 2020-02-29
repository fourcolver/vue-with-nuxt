<template>
  <div class="c-issue-work" v-if="working.length">
    <div class="b-screens" v-if="screens.length">
      <div class="e-header">{{ $t('issue_workers.latest_screens') }}</div>
      <div class="b-items">
        <div class="b-screen" v-for="screen in screens.slice(0, 6)">
          <protected-image @click.native="$refs.viewer.show(screen)" :src="screen.sizes.thumb.url"
                           width="100%"
                           :prefetchSrc="screen.sizes.file.url"></protected-image>
        </div>
      </div>
    </div>
    <screenshots-viewer @next="loadMore" :selectable="true" ref="viewer" :screens="screens"
                        :currentUser="user" :isLoadMore="true"
                        :headers="screensHeaders"></screenshots-viewer>
    <div class="b-work-info" v-if="working.length">
      <div class="b-worked" v-if="working.length">
        <div class="e-header">{{ $tc('issue_workers.worked', working.length)}}:</div>
        <div class="b-users">
          <div class="b-user" v-for="user in working">
            <span class="e-spent">{{ secondsToHIS(user.issue.spent_sec) }}</span>
            <b v-if="user.issue.spent_sec_bugs"> / </b>
            <span class="e-bug" v-if="user.issue.spent_sec_bugs">{{ secondsToHIS(user.issue.spent_sec_bugs) }}</span>
            <span class="e-dot">. </span>
            <span class="e-name">{{ user.name }}</span>
            <span class="e-dash"> - </span>
            <span
              class="e-working-now"
              v-if="+user.timer_last.id_issue === +issue.id && user.is_timer_online">{{ $t('issue_workers.working_now') }}</span>
            <span class="e-ago" v-else>{{ $dateAgo(user.issue.dta_timer_activity) + ' ' + $t('ago')}}</span>
            <span class="e-dot">. </span>
            <template v-if="typeof avgActivity[+user.id] !== 'undefined' ">
              <span class="e-activity">{{ $t('issue_workers.avg_activity') }}: </span>
              <span class="e-activity-val">{{ avgActivity[+user.id]}}%</span>
            </template>
          </div>
        </div>
      </div>
      <div class="b-total" v-if="issue.spent_time > 0 && working.length > 1">
        <div class="e-header">{{ $t('issue_workers.total') }}:</div>
        <div class="e-total">{{ secondsToHIS(issue.spent_time)}}</div>
      </div>
    </div>

  </div>
</template>

<script>
  import ProtectedImage from '../ProtectedImage.vue'
  import ScreenshotsViewer from '../stats/ScreenshotsViewer.vue'
  import { secondsToHIS } from '~/utils/time'
  import { mapActions, mapState } from 'vuex'

  export default {
    components: {
      ScreenshotsViewer,
      ProtectedImage
    },
    name: 'issue-workers',
    props: {
      issue: {
        default: () => {}
      }
    },
    data () {
      return {
        activity: [],
        loading: false,
        page: 1,
        newScreens: null,
        newScreensHeaders: null
      }
    },
    methods: {
      ...mapActions({
        getScreens: 'stats/getScreens'
      }),
      secondsToHIS,
      loadMore () {
        this.getScreens({
          page: ++this.page,
          'per-page': 6,
          filters: {
            issue_number: this.$route.query.issue,
            dta_to: this.$date(this.screens.find(el => !el.is_instant).dta).unix()
          }
        })
      }
    },
    computed: {
      ...mapState({
        screens: state => state.stats.screens,
        screensHeaders: state => state.stats.screensHeaders
      }),
      avgActivity () {
        let ret = {}
        if (!this.activity.length) {
          return ret
        }
        this.activity.forEach(el => {
          ret[+el.id_user] = Math.floor((el.mouse_sum / el.mouse_count + el.keyboard_sum / el.keyboard_count) / 2)
        })
        return ret
      },
      working () {
        return this.issue.participants.filter(el => el.issue.spent_sec > 0)
      },
      user () {
        const userId = this.$route.query.id || this.$store.state.webuser.user.id
        return this.$store.state.companyUsers.find(el => +el.id === +userId)
      }
    },
    mounted () {
      window.issueWorkers = this
      this.$api.get('timers-activity-input/aggregate', {filters: {id_issue: this.issue.id}}).then(res => {
        this.activity = res.data.activity_inputs
      })
    }
  }
</script>

<style lang="less" type="text/less">
  .c-issue-work {
    background: #fafafa;
    border-radius: 3px;
    border: 1px solid #e8e8e8;
    padding: 15px;

    .b-screens {
      padding-bottom: 15px;
      .e-header {
        margin-bottom: 15px;
      }
      .b-items {
        display: flex;
        .b-screen {
          cursor: pointer;
          flex: 0 110.5px;
          &:not(:last-child) {
            margin-right: 15px;
          }
        }
      }
    }
    .b-work-info {
      line-height: 1.5;

      .b-worked {
        .b-users {
          .b-user {
            .e-bug {
              color: @menu-red;
            }
            .e-dot {
              margin-right: 15px;
            }
            .e-ago, .e-activity-val, .e-working-now, .e-spent {
              font-weight: bold;
            }
            .e-spent,
            .e-working-now {
              color: @basic-blue;
            }
          }
        }
      }
      .b-worked, .b-total {
        display: flex;
        .e-header {
          margin-right: 10px;
        }
        .e-header {
          width: 70px;
        }
        .e-total {
          color: @basic-blue;
          font-weight: bold;
        }
      }
    }
  }
</style>
