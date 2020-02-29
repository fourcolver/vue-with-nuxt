<template>
  <div class="c-unread-events" v-if="events.length">
    <div class="b-read-all" v-if="showRead" @click="readAll">{{ $t('unread_events.read_all') }}</div>
    <div class="b-events"
         v-infinite-scroll="loadMore"
         infinite-scroll-disabled="loadDisabled"
         infinite-scroll-distance="10">
      <template v-for="event, i in events">
        <div class="b-issue" v-if="i === 0 || events[i - 1].id_issue != event.id_issue"
             :class="{'m-single-event': eventsCounts[+event.id_issue] === 1, inactive: !event.issue.is_active}">
          <div class="b-main" @click="event.issue.is_active ? eventClick(event, $event) : null">
            <div class="b-top">
              <avatar size="20" v-if="event.issue.project" :src="event.issue.project.logo_url"
                      :name="event.issue.project.name"></avatar>
              <span class="e-number">{{ event.issue.number }}. </span>
              <tag-label v-if="event.issue.tag1" :tag1="event.issue.tag1"
                         :class="{'no-subject': !event.issue.subject && !event.issue.description}"
                         :end-arrow="event.issue.subject"></tag-label>
              <span class="e-name" v-if="event.issue.subject">{{ event.issue.subject }}</span>
              <span class="e-name" v-if="!event.issue.id_category && !event.issue.subject">{{ event.issue.description
                }}</span>
              <i class="bu-bug" v-if="+event.issue.is_bug"></i>
              <priority-label :weight="event.issue.priority_weight"></priority-label>
            </div>
            <unread-event v-if="eventsCounts[+event.id_issue] === 1" :event="event" :showRead="false"
                          :active="!!event.issue.is_active"></unread-event>
          </div>
          <div v-if="showRead" class="b-read" @click="readIssue(event.id_issue)">
            <i class="bu-ok-circle"></i>
          </div>
        </div>
        <unread-event v-if="eventsCounts[+event.id_issue] > 1" :event="event"
                      @click="e => eventClick(event, e)" :showRead="showRead"
                      :active="!!event.issue.is_active"></unread-event>
      </template>
    </div>
  </div>
</template>

<script>
  import Avatar from '~/components/Avatar.vue'
  import { mapGetters } from 'vuex'
  import TagLabel from '~/components/TagLabel.vue'
  import SmallEvent from './SmallEvent.vue'
  import UnreadEvent from './UnreadEvent.vue'
  import PriorityLabel from '../PriorityLabel.vue'
  import { goToIssue } from '~/utils/events'

  export default {
    components: {
      PriorityLabel,
      UnreadEvent,
      SmallEvent,
      TagLabel,
      Avatar
    },
    name: 'unread-events',
    data () {
      return {
        reloadPromise: null,
        page: 1
      }
    },
    props: {
      eventsProp: null,
      showRead: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      readAll () {
        this.$api.put('events/read-all').then(() => {
          this.$store.dispatch('updateUnreadEvents')
        })
      },
      loadMore () {
        this.$store.dispatch('updateUnreadEvents', {page: ++this.page})
      },
      readIssue (id) {
        this.$api.put('events/read', {id_issue: id}).then(() => {
          this.$store.dispatch('updateUnreadEvents')
        })
      },
      eventClick (evt, e) {
        const r = this.$route
        if (r.name === 'company.comments.project' && +r.query.issue === +evt.issue.number) {
          const pageComponent = window.layout.$refs.baseComponent.$children[0]
          if (pageComponent && typeof pageComponent.scrollToComment === 'function') {
            pageComponent.scrollToComment(evt.id_comment)
          }
        } else {
          goToIssue(this, evt, e)
        }
      }
    },
    mounted () {
      window.unreadEvents = this
    },
    computed: {
      ...mapGetters({
        'getProject': 'company/getProject'
      }),
      events () {
        return this.eventsProp || this.$store.state.unreadEvents
      },
      headers () {
        return this.eventsProp ? {} : this.$store.state.unreadEventsHeaders
      },
      loadDisabled () {
        return +this.headers['x-pagination-current-page'] >= +this.headers['x-pagination-page-count']
      },
      eventsCounts () {
        let ret = {}
        this.events.forEach(el => {
          if (!ret[+el.id_issue]) {
            ret[+el.id_issue] = 0
          }
          ret[+el.id_issue]++
        })
        return ret
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-unread-events {
    text-align: left;
    @read-all-height: 38px;
    @priority-width: @navbar-height;
    .b-read-all {
      height: @read-all-height;
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      background-color: #fff;
      color: #2975dc;
      font-weight: bold;
      font-size: 0.9em;
      .hover-mixin();
    }
    .b-events {
      margin-top: @read-all-height;
      max-height: calc(100vh ~'-' @navbar-height ~'-' @read-all-height);
      overflow-y: auto;
      padding-bottom: 10px;
      .b-issue, .c-unread-event {
        display: flex;
        align-items: center;
        .b-read {
          width: @navbar-height;
          min-width: @navbar-height;
          .hover-mixin();
          display: flex;
          justify-content: center;
          height: 100%;
          align-items: center;
          i {
            color: #999;
            font-size: 1.3em;
          }
        }

        .b-tag-label.no-subject {
          max-width: 100%;
          flex: 1;
        }
      }
      .b-issue {
        &:not(.m-single-event) {
          height: 30px;
          > .b-main {
            display: flex;
          }
        }
        > .b-main {
          flex: 1;
          padding: 0 10px;
          height: 100%;
          overflow: hidden;
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
          }
          .c-unread-event {
            .b-main {
              padding: 0 0 0 15px;
            }
          }
        }
        &:not(.inactive) {
          > .b-main {
            .hover-mixin();
          }
        }
        &.inactive {
          opacity: .5;
        }
        &.m-single-event {
          height: auto;
          > .b-read {
            height: @navbar-height;
          }
          > .b-main {
            padding-top: 5px;
            padding-bottom: 5px;
          }
        }
      }
      .c-unread-event {
        .b-main {
          padding-left: 25px;
        }
      }
    }
  }
</style>
