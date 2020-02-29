<template>
  <div class="c-read-events" v-click-outside="hide" v-key-escape="hide">
    <div class="b-icon" @click="mainClick">
      <i class="bu-bell" v-if="!loading"></i>
      <quwi-spinner v-else></quwi-spinner>
    </div>
    <div class="b-issues" v-if="issues.length" v-show="isMenuVisible">
      <div class="b-issue" v-for="issue in issues" @click="issueClick(issue, $event)"
           :class="{'m-inactive': !issue.is_active}">
        <div class="b-top">
          <avatar size="20" v-if="issue.project" :src="issue.project.logo_url"
                  :name="issue.project.name"></avatar>
          <span class="e-number">{{ issue.number }}. </span>
          <tag-label v-if="issue.tag1" :tag1="issue.tag1"
                     :class="{'no-subject': !issue.name && !issue.description}"
                     :end-arrow="issue.name || issue.description"></tag-label>
          <span class="e-name" v-if="issue.name">{{ issue.name }}</span>
          <span class="e-name" v-if="!issue.id_category && !issue.name">{{ issue.description
            }}</span>
          <i class="bu-bug" v-if="+issue.is_bug"></i>
          <priority-label :weight="issue.priority_weight"></priority-label>
        </div>
        <unread-event v-if="issue.event_last" :event="issue.event_last" :showRead="false"
                      :active="issue.is_active"></unread-event>
      </div>
    </div>
  </div>
</template>

<script>
  import QuwiSpinner from '../Spinner.vue'
  import TagLabel from '../TagLabel.vue'
  import PriorityLabel from '../PriorityLabel.vue'
  import Avatar from '../Avatar.vue'
  import UnreadEvent from './UnreadEvent.vue'
  import { goToIssue } from '~/utils/events'

  export default {
    components: {
      UnreadEvent,
      Avatar,
      PriorityLabel,
      TagLabel,
      QuwiSpinner
    },
    name: 'read-events',
    data () {
      return {
        issues: [],
        headers: {},
        loading: false,
        loaded: false,
        isMenuVisible: true
      }
    },
    methods: {
      load () {
        this.loading = true
        this.$api.get('issues/with-events', {filters: {is_read: 1}}).then(res => {
          let issues = res.data.issues
          issues.forEach(el => {
            if (el.event_last) {
              el.event_last.issue = el
            }
          })
          this.issues = issues
          this.headers = res.headers
        }).finally(() => {
          this.loading = false
          this.loaded = true
        })
      },
      mainClick () {
        if (this.loading) {
          return
        }
        if (!this.loaded) {
          this.load()
        } else {
          this.isMenuVisible = !this.isMenuVisible
        }
      },
      issueClick (issue, e) {
        if (issue.event_last) {
          goToIssue(this, issue.event_last, e)
        }
      },
      hide () {
        if (this.isMenuVisible && this.loaded) {
          this.isMenuVisible = false
        }
      }
    },
    computed: {},
    mounted () {
      window.readEvents = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-read-events {
    text-align: left;
    .b-icon {
      height: @navbar-height;
      width: @navbar-height;
      display: flex;
      justify-content: center;
      align-items: center;
      .hover-mixin();
      @icon-color: #919191;
      color: @icon-color;
      .c-spinner {
        color: @icon-color;
      }
    }
    .b-issues {
      padding: 5px 0;
      z-index: 1000;
      white-space: nowrap;
      list-style: none;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid rgba(0, 0, 0, .15);
      width: 460px;
      max-height: calc(100vh ~'-' @navbar-height);
      overflow: auto;
      position: absolute;
      .b-issue {
        padding: 5px 10px;
        &:not(.m-inactive) {
          .hover-mixin();
        }
        &.m-inactive {
          opacity: .5;
        }
        .b-top {
          font-weight: bold;
          overflow: hidden;
          display: flex;
          align-items: center;
          flex: 1;
          .c-priority-label {
            width: 30px;
          }
          .b-avatar {
            margin-right: 10px;
            img {
              display: block;
            }
          }
          .e-number {
            margin-right: 5px;;
          }
          .e-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            padding-right: 10px;
            white-space: nowrap;
          }
          .bu-bug {
            margin: 0 5px;
            color: @red-color;
          }
          .b-tag-label.no-subject {
            max-width: 100%;
            flex: 1;
          }
        }
      }
    }
  }
</style>
