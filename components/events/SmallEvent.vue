<template>

  <div class="c-small-event">
    <div class="b-check" v-if="showRead" @click="read(event)">
      <i class="bu-ok-circle"></i>
    </div>
    <div class="b-issue-click" @click="goToIssue(event, $event)"
         :class="{inactive: event.issue && !event.issue.is_active}">
      <div class="b-left">
        <avatar size="30" :userId="event.id_user"></avatar>
      </div>
      <div class="b-center">
        <div class="b-top">
          <avatar v-if="showProject && getProject(event.id_project)" :size="16" :name="getProject(event.id_project).name"
                  :src="getProject(event.id_project).logo_url"></avatar>
          <div class="b-title">
            <span class="e-number">{{ event.issue.number }}.</span>
            <tag-label v-if="event.issue.tag1" :tag1="event.issue.tag1"
                       :end-arrow="event.issue.subject"></tag-label>
            <span class="e-name" v-if="event.issue.subject">{{ event.issue.subject }}</span>
            <span class="e-name" v-if="!event.issue.id_category && !event.issue.subject">{{ event.description }}</span>
          </div>
          <span class="e-time">{{ $dateAgo(event.dta_create) }}</span>
        </div>
        <div class="b-bottom">
          <div class="e-name">{{ getCompanyUser(event.id_user).name }}</div>
          <div class="e-title">{{ event.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Avatar from '~/components/Avatar.vue'
  import { mapGetters } from 'vuex'
  import TagLabel from '~/components/TagLabel.vue'
  import { goToIssue } from '~/utils/events'

  export default {
    components: {
      TagLabel,
      Avatar
    },
    name: 'small-event',
    data () {
      return {}
    },
    props: {
      event: null,
      showRead: {
        default: true,
        type: Boolean
      },
      showProject: {
        default: true,
        type: Boolean
      }
    },
    methods: {
      read (evt) {
        this.$store.commit('REMOVE_UNREAD_EVENT', evt.id)
        this.$api.put('events/read-by-id', {id: evt.id}).then(() => {
          this.$store.dispatch('updateUnreadEvents')
        })
      },
      goToIssue (evt, e) {
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
    computed: {
      ...mapGetters({
        'getCompanyUser': 'getCompanyUser',
        'getProject': 'company/getProject',
        'createIssueUrl': 'company/createIssueUrl'
      })
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  @row-height: 47px;
  .c-small-event {
    display: flex;
    height: @row-height;
    &:not(:last-child) {
      margin-bottom: 5px;
    }
    .b-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: @row-height;
      .hover-mixin();
      i {
        font-size: 1.3em;
        color: #767676;
        padding: 2px 0;
      }
    }
    .b-issue-click {
      display: flex;
      flex: 1;
      padding: 5px;
      padding-right: 18px;
      overflow-x: hidden;
      &:not(.inactive) {
        .hover-mixin();
      }
      &.inactive {
        opacity: .7;
      }
      .b-left {
        display: flex;
        align-items: center;
        .b-avatar {
          margin-right: 10px;
        }
      }
      .b-center {
        overflow: hidden;
        white-space: nowrap;
        flex: 1;
        .b-top {
          display: flex;
          margin-bottom: 6px;
          align-items: center;
          .b-avatar {
            margin-right: 5px;
            .e-empty-avatar {
              letter-spacing: 1px;
            }
            img {
              display: block;
            }
          }
          .b-title {
            flex: 1;
            display: flex;
            .e-number {
              font-weight: bold;
              margin-right: 5px;
            }
            &, .b-tag-label, .e-name {
              overflow-x: hidden;
              text-overflow: ellipsis;
            }
            .b-tag-label {
              min-width: 45px;
            }
          }
          .e-time {
            margin-left: 5px;
            font-size: .8em;
            white-space: nowrap;
            color: #6f6f6f;
          }
        }
        .b-bottom {
          .e-name, .e-title {
            display: inline;
          }
          .e-name {
            color: #2975dc;
            margin-right: 8px;
          }
          .e-title {
            overflow-x: hidden;
            text-overflow: ellipsis;
            flex: 1;
            color: @green-color;
            font-style: italic;
            font-size: 0.9em;
          }
        }
      }
    }
  }
</style>
