<template>
  <div class="c-issue" :class="{'m-only-subject': isOnlySubject, 'm-new': issue.is_new, 'm-transition': newIssueTransition}">
    <issue-star v-if="issue.is_open && !(isOnlySubject && isRecentlyResolved)" :issue="issue"
                @change="(val) => issue.is_starred = val"></issue-star>
    <div class="b-issue"
         @click="goToIssue(issue)"
         :class="{progress: issue.assignee_name && issue.status === 'open', 'has-image': issue.image, 'has-title': hasTitle(issue), closed: !issue.is_open, resolved: isRecentlyResolved}">
      <div class="e-border-line"></div>
      <div class="e-unread" v-if="!isRecentlyResolved && countUnreadEvents">{{ countUnreadEvents }}</div>
      <div class="e-unread resolved" v-else-if="isRecentlyResolved && countUnreadEvents > 1">{{ countUnreadEvents }}</div>
      <div class="e-resolved-mark" v-else-if="isRecentlyResolved && countUnreadEvents === 1">
        <i class="bu-check-single-fat"></i>
      </div>
      <span class="e-bug" v-if="issue.is_bug">
        <i class="bu-bug"></i>
      </span>
      <div class="b-top">
        <div class="b-left">
          <span class="e-project" v-if="!$route.params.project && getProject(issue.id_project)">
                <avatar :src="getProject(issue.id_project).logo_url || ''" :size="20"
                        :name="getProject(issue.id_project).name" :title="getProject(issue.id_project).name"></avatar>
          </span>
          <span class="e-status" v-if="['closed', 'resolved'].includes(issue.status)">{{ issue.status }}</span>
          <span class="e-id"
            v-html="highlightNumber(issue.number) + ((issue.id_category || issue.name || isOnlySubject) ? '. ' : '')">
          </span>
          <tag-label v-if="issue.tag1" :tag1="issue.tag1"
                     :endArrow="issue.name || isOnlySubject"></tag-label>
          <template v-if="issue.name">
            <span v-if="!isSearch" class="e-title">{{ issue.name}}</span>
            <span v-else class="e-title" v-html="highlightSearchKeyword(issue.name)"></span>
          </template>
          <template v-else-if="isOnlySubject && !issue.name">
            <span class="e-cut-desc">{{ issue.description.substring(0, 50) }}</span>
          </template>
        </div>
        <div class="b-right">
          <div class="b-due-on" v-if="issue.status === 'open' && issue.dta_due_on">
            <span class="e-date">{{ $t('issue.due') + ': ' + $date(issue.dta_due_on).format('D MMM')}}</span>
          </div>
          <priority-label
            v-if="$store.state.userSettings.grouping_disabled || !$store.getters['Issues/getFilter']('is_open') || ['starred', 'unread'].includes(section)"
            :weight="issue.priority_weight"></priority-label>
        </div>
      </div>

      <div class="b-middle" v-if="!isOnlySubject">
        <div v-if="!$store.state.userSettings.issues_thumb && thumb" class="b-image">
          <protected-image @click.stop="" :src="thumb.url"
                           :height="thumb.h" :preview="false"></protected-image>
        </div>
        <div v-if="$store.state.userSettings.issues_thumb === 'big' && thumbMedium" class="b-big-image">
          <protected-image @click.stop="" :src="thumbMedium.url" :width="thumbMedium.w"
                           :height="thumbMedium.h" :preview="false"></protected-image>
        </div>
        <div class="b-text">
          <div class="e-desc"
               v-html="issue.description ? processDesc(issue.description) : ''"></div>
        </div>
      </div>
      <div class="b-bottom" v-if="!isOnlySubject">
        <div class="b-left">
          <span class="e-date">{{ formatDate(issue.dta_create, dateFormat) }}</span>
          <span class="e-author">{{ $t('by.someone') + ' ' + issue.author_name }}</span>
        </div>
        <div class="b-right">
          <div class="b-members" v-if="issue.participants && issue.participants.length">
            <avatar v-for="(member, i) in issue.participants" :userId="member.id"
                    :key="member.id" size="28"></avatar>
          </div>
          <div class="b-time-bar" v-if="issue.spent_time">
            <span class="e-time">{{ secondsToHIS(issue.spent_time, 'h:i:s', false)}}</span>
            <progress-bar class="b-progress" v-if="percentDone" :percent="percentDone"></progress-bar>
          </div>
        </div>
      </div>
    </div>
    <i v-if="isRecentlyResolved" @click.stop="markDone"
       class="e-mark-done bu-check-single"></i>
    <i v-else-if="!issue.is_read" @click.stop="markRead"
       class="e-mark-read bu-check-single"></i>
  </div>
</template>

<script>
  import ProtectedImage from '../ProtectedImage.vue'
  import Avatar from '../Avatar.vue'
  import TagLabel from '../TagLabel.vue'
  import { linkify, escape, cutWordWithContext, escapeRegExp } from '~/utils/helpers'
  import { formatDate, secondsToHIS } from '~/utils/time'
  import { calculateThumb, calculatePercentDone, SEARCH_MIN_LENGTH, isValidSearchKeyword } from '~/utils/issues'
  import IssueStar from '../IssueStar.vue'
  import ProgressBar from '../ProgressBar.vue'
  import { mapGetters } from 'vuex'
  import moment from 'moment'
  import PriorityLabel from '../PriorityLabel.vue'

  export default {
    name: 'issue',
    props: ['issue', 'section'],
    components: {
      PriorityLabel,
      ProgressBar,
      IssueStar,
      ProtectedImage,
      TagLabel,
      Avatar
    },
    data () {
      return {
        thumb: {},
        thumbMedium: {},
        newIssueTransition: false,
        timers: []
      }
    },
    methods: {
      getProjectUid (id) {
        let project = this.getProject(id)
        return project ? project.uid : null
      },
      processDesc (desc) {
        if (!this.isSearch) {
          desc = escape(desc)
          desc = desc.replace(/\n/g, '<br>')
        } else {
          let keyword = this.$store.state.Issues.searchKeyword
          if (desc.toLowerCase().indexOf(keyword.toLowerCase()) === -1) {
            const words = keyword.split(' ')
            if (words.length > 1) {
              for (let k = 0; k < words.length; k++) {
                if (words[k].trim().length >= SEARCH_MIN_LENGTH) {
                  keyword = words[k]
                  break
                }
              }
            }
          }
          const cut = cutWordWithContext(desc, keyword, 100)
          if (cut) {
            desc = cut
          }
          desc = escape(desc)
          desc = this.highlightSearchKeyword(desc)
        }
        return desc
      },
      hasTitle (issue) {
        return issue.name || issue.id_category
      },
      markDone () {
        this.$emit('markDone', this.issue.id)
      },
      markRead () {
        this.$emit('markRead', this.issue.id)
      },
      goToIssue (issue) {
        const route = this.createIssueUrl({
          uid: this.getProjectUid(issue.id_project),
          number: issue.number
        })
        this.$router.push(route)
      },
      formatDate (dta, format) {
        return formatDate(dta, format, this.$i18n.locale)
      },
      highlightNumber (number) {
        return parseInt(this.$store.state.Issues.searchKeyword.trim()) === number ? `<span class="e-search-highlight">${number}</span>` : number
      },
      highlightSearchKeyword (text) {
        const keyword = this.$store.state.Issues.searchKeyword.trim()
        const replace = kw => text.replace(new RegExp(escapeRegExp(kw), 'gi'), m => `<span class="e-search-highlight">${m}</span>`)
        if (text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
          return replace(keyword)
        } else {
          const words = keyword.split(' ')
          if (words.length > 1) {
            for (let k = 0; k < words.length; k++) {
              if (words[k].trim().length >= SEARCH_MIN_LENGTH) {
                text = replace(words[k])
              }
            }
          }
          return text
        }
      },
      linkify,
      secondsToHIS
    },
    created () {
      this.thumb = calculateThumb(this.issue.thumb, {maxWidth: 170, maxHeight: 78})
      this.thumbMedium = calculateThumb(this.issue.thumb_medium, {maxWidth: 690, maxHeight: 400})
    },
    computed: {
      ...mapGetters({
        'getDateTimeFormatFor': 'getDateTimeFormatFor',
        'getProject': 'company/getProject',
        'createIssueUrl': 'company/createIssueUrl'
      }),
      dateFormat () {
        let nowYear = moment().get('year')
        let issueYear = moment(this.issue.dta_create).get('year')
        return nowYear === issueYear ? this.getDateTimeFormatFor('issuesWithoutYear') : this.getDateTimeFormatFor('issues')
      },
      percentDone () {
        return calculatePercentDone(this.issue)
      },
      isRecentlyResolved () {
        return this.issue.is_open && this.issue.is_recently_resolved
      },
      countUnreadEvents () {
        return +this.issue.unread_events
      },
      isSearch () {
        return isValidSearchKeyword(this.$store.state.Issues.searchKeyword)
      },
      isOnlySubject () {
        return this.$store.state.userSettings.issues_thumb === 'subject'
      }
    },
    mounted () {
      if (this.issue.is_new) {
        this.timers.push(window.setTimeout(() => {
          this.issue.is_new = 0
        }, 100))
        this.newIssueTransition = true
        this.timers.push(window.setTimeout(() => {
          this.newIssueTransition = 0
        }, 2000))
      }
    },
    beforeDestroy () {
      this.timers.length && this.timers.forEach((timer) => clearTimeout(timer))
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-issue {
    @blue: #2975dc;
    @green: #428e42;
    position: relative;
    .c-issue-star {
      right: -32px;
      left: auto;
      top: 20px;
    }
    .b-issue {
      .white-box();
      padding-top: 20px;
      color: black;
      margin-top: 0;
      margin-bottom: 7px;
      margin-left: auto;
      margin-right: auto;
      cursor: pointer;
      position: relative;
      &:hover {
        background-color: @hover-color !important;
      }
      .e-border-line {
        width: 3px;
        height: 95%;
        position: absolute;
        border-radius: 3px;
        top: 2.5%;
        left: 3px;
      }
      @unread-height: 18px;
      .e-unread, .e-resolved-mark {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        height: @unread-height;
        min-width: 22px;
        border-top-left-radius: 5px;
        border-bottom-right-radius: 5px;
        border-top-right-radius: 0 !important;
        border-bottom-left-radius: 0 !important;
        position: absolute;
        top: -1px;
        left: -1px;
      }
      .e-unread {
        margin-right: 5px;
        .cnt-events-mixin();

        &.resolved {
          background: @green-color;
        }
      }
      .e-resolved-mark {
        background: @green-color;
        color: #fff;
        font-size: .6em;
        i {
          position: relative;
          left: -1px;
        }
      }
      .e-bug {
        position: absolute;
        right: -1px;
        top: -1px;
        background: @red-color;
        display: flex;
        height: @unread-height;
        padding: 0 2px;
        justify-content: center;
        align-items: center;
        border-bottom-left-radius: 10px;
        .bu-bug {
          display: inline-block;
          transform: rotate(45deg);
          color: #fff;
        }
      }
      &.resolved {
        .b-bottom {
          .e-mark-done {
            margin-right: 10px;
            margin-left: 10px;
            margin-bottom: 5px;
          }
        }

      }
      &.progress {
        .e-border-line {
          background: @blue;
        }
      }
      &.closed {
        .e-border-line {
          background: #888;
        }
      }
      &.has-image {
        min-height: 165px;
        &.has-title {
          min-height: 196px;
        }
      }
      .b-top, .b-bottom, .b-middle {
        padding-left: 20px;
        padding-right: 20px;
      }
      .b-top {
        font-weight: bold;
        margin-bottom: 10px;
        display: flex;
        > .b-left {
          display: flex;
          flex: 1;
          align-items: center;
          overflow: hidden;
          .e-project {
            margin-right: 7px;
          }
          .b-avatar {
            line-height: 1px;
          }
          .e-status {
            text-transform: uppercase;
            font-weight: normal;
            margin-right: 5px;
          }
          .e-id {
            white-space: pre;
          }
          .e-title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .b-tag-label {
            overflow: visible;
            max-width: none;
          }
        }
        > .b-right {
          display: flex;
          align-items: center;
          .b-due-on {
            color: @red-color;
            font-weight: normal;
            font-size: 0.9em;
          }
          .c-priority-label {
            margin-left: 10px;
            height: 10px;
            align-items: center;
          }
        }
      }
      .b-middle {
        @max-height: @line-height * 4;
        &:after {
          .after-clearfix();
        }
        .b-image {
          float: left;
          margin-right: 20px;
          width: 132px;
          height: 78px;
          border-radius: 4px;
          box-shadow: 0 0 3px #aaa;
          background-color: #000;
          overflow: hidden;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .b-big-image {
          text-align: center;
          margin-bottom: 15px;
          margin-top: 15px;
          img {
            box-shadow: @image-shadow;
            border-radius: 4px;
          }
        }
        .b-text {
          .e-desc {
            max-height: @max-height;
            line-height: @line-height;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: justify;
          }
        }
      }
      .b-bottom {
        padding-top: 10px;
        padding-bottom: 15px;
        font-size: .9em;
        display: flex;
        align-items: center;
        &:after {
          .after-clearfix();
        }
        .b-left {
          display: flex;
          height: 14px;
          flex: 1;
          align-items: center;
          color: #999;
          font-style: italic;
          .e-author {
            margin-left: 5px;
          }
        }
        > .b-right {
          display: flex;
          .b-members {
            display: flex;
            .b-avatar {
              margin-right: 3px;
              img {
                display: block;
              }
            }
          }
          .b-time-bar {
            display: flex;
            flex: 1;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            margin-left: 15px;
            .e-time {
              font-size: .8em;
              color: @blue;
              text-transform: uppercase;
              height: 14px;
              line-height: 14px;
              margin-bottom: 2px;
            }
          }
        }
      }
      .e-title, .e-desc, .e-id {
        .e-search-highlight {
          background: #ffffaf;
        }
      }
    }
    &.m-new {
      .b-issue {
        background: rgb(57, 115, 194);
      }
    }
    &.m-transition {
      .b-issue {
        transition: background linear 2s;
      }
    }
    .e-mark-done, .e-mark-read {
      color: @green;
      .hover-mixin(true);
      padding: 2px;
      position: absolute;
      bottom: 0;
      right: -42px;
      font-size: 25px;
    }
    .e-mark-read {
      color: @hover-dark;
    }
    &.m-only-subject {
      .b-issue {
        padding-top: 12px;
        .b-top {
          align-items: center;
          padding-left: 25px;
          padding-right: 25px;
          .e-cut-desc {
            font-weight: normal;
          }
        }
      }
      .c-issue-star {
        top: 10px;
      }
      .e-mark-done {
        bottom: auto;
        top: 4px;
      }
    }
  }
</style>
