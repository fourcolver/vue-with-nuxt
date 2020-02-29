<template>
  <div class="c-events-list">
    <div class="b-header">
      <div class="b-left">
        <context-menu ref="projectFilter" trigger="click" class="b-project-menu" direction="right" :autoClose="true">
          <div slot="content" v-if="selectedProject">
            <avatar size="20" :src="selectedProject.logo_url" class="project-logo"
                    :name="selectedProject.name"></avatar>
            <div class="e-name">{{ selectedProject.name }}</div>
          </div>
          <div slot="content" class="e-all" v-else>{{ $t('events_list.all_projects') }}</div>
          <div slot="items">
            <div class="b-item" @click="setProject(0)">
              <div class="e-name">{{ $t('events_list.all_projects') }}</div>
            </div>
            <div class="b-item" v-for="project in $store.state.projects" @click="setProject(project.id)">
              <avatar size="20" :src="project.logo_url" class="project-logo"
                      :name="project.name"></avatar>
              <div class="e-name">{{ project.name }}</div>
            </div>
          </div>
        </context-menu>
      </div>
      <div class="b-right">
        <context-menu :autoClose="true" class="b-gear-menu" ref="gearMenu" v-if="issues.length" trigger="click"
                      direction="left">
          <div class="e-content" slot="content">
            <i class="bu-gear"></i>
          </div>
          <div slot="items">
            <div class="b-options">
              <div class="e-option" :class="{active: thumbOption === 'big'}" @click="setThumbs('big')">
                {{ $t('Big thumbnails')}}
              </div>
              <div class="e-option" :class="{active: thumbOption === 'small'}" @click="setThumbs('')">
                {{ $t('Small thumbnails')}}
              </div>
              <div class="e-option" :class="{active: thumbOption === 'hide'}" @click="setThumbs('hide')">
                {{ $t('Hide thumbnails') }}
              </div>
              <div class="e-option" :class="{active: thumbOption === 'subject'}" @click="setThumbs('subject')">
                {{ $t('Only subject') }}
              </div>
            </div>
          </div>
        </context-menu>
      </div>
      <div class="b-read">
        <i class="bu-ok-circle e-read" @click="readAll" v-if="hasUnread"></i>
      </div>
    </div>
    <div class="b-wrap" v-if="issues.length" v-for="issue in issues">
      <div class="b-box" :class="{'m-unread': !+issue.is_read, 'm-clickable': issue.is_active}" @click="goToIssue(issue, $event)">
        <div class="b-issue">
          <div class="b-top">
            <avatar size="20" :src="issue.project.logo_url" class="project-logo"
                    :name="issue.project.name"></avatar>
            <div class="b-title">
              <span class="e-id">{{ issue.number + (issue.id_category || issue.name ? '. ' : '') }}</span>
              <tag-label v-if="issue.tag1" :tag1="issue.tag1" :endArrow="issue.name"></tag-label>
              <span v-if="issue.name" class="e-title">{{issue.name}}</span>
              <span v-if="issue.id_user && getCompanyUser(issue.id_user).name"
                    class="e-author">{{ $t('by.someone') + ' ' + getCompanyUser(issue.id_user).name }}</span>
            </div>
            <i class="bu-bug" v-if="+issue.is_bug"></i>
            <priority-label :weight="issue.priority_weight"></priority-label>
          </div>
          <div class="b-middle" v-if="thumbOption !== 'subject' " :class="{'m-big-thumb': thumbOption == 'big' }">
            <template v-if="issue.thumb && thumbOption == 'small'">
              <div class="b-image">
                <protected-image v-if="thumbOption == 'small'" @click.stop="" :src="issue.thumb.url"
                                 :width="issue.thumb.w" :height="issue.thumb.h" :preview="false"></protected-image>
              </div>
            </template>
            <template v-else-if="issue.thumb && thumbOption == 'big'">
              <div class="b-image-wrap">
                <div class="b-image">
                  <protected-image :class="{'has-overflow': issue.thumb_medium.w < 170 || issue.thumb.h < 78}"
                                   @click.stop="" :width="issue.thumb_medium.w" :height="issue.thumb_medium.h"
                                   :src="issue.thumb.url" :preview="false"></protected-image>
                </div>
              </div>
            </template>
            <div class="b-text">
              <div class="e-desc"
                   v-html="issue.description ? processDesc(issue.description) : ''"></div>
            </div>
          </div>
        </div>
        <div class="b-events" v-if="issue.event_last">
          <div class="b-event" :class="{'m-system': isSystemType(issue.event_last.type)}">
            <div class="b-left">
              <avatar size="40" :userId="issue.event_last.id_user"></avatar>
            </div>
            <div class="b-text">
              <div class="b-name">
                <span class="e-name">{{ getCompanyUser(issue.event_last.id_user).name }}</span>
              </div>
              <div class="e-desc" v-if="isSystemType(issue.event_last.type)">{{ issue.event_last.title }}</div>
              <div class="e-desc" v-else v-html="processDesc(issue.event_last.description)"></div>
            </div>
            <div class="b-right">
              <div class="e-date">{{ $dateAgo(issue.event_last.dta) }} </div>
              <div class="e-cnt-new" v-if="issue.unread_events > 1">
                +{{ +issue.unread_events - 1}}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="b-read">
        <i v-if="!issue.is_read" @click="readIssue(issue.id)" class="bu-ok-circle"></i>
      </div>
    </div>
    <div class="b-no-events" v-if="!issues.length">{{ $t('events_list.no_events') }}</div>
    <pagination :headers="headers" template="2_buttons"></pagination>
  </div>
</template>

<script>
  import Avatar from '~/components/Avatar.vue'
  import ProtectedImage from '~/components/ProtectedImage.vue'
  import TagLabel from '~/components/TagLabel.vue'
  import Pagination from '~/components/Pagination.vue'
  import PriorityLabel from '~/components/PriorityLabel.vue'
  import { mapGetters } from 'vuex'
  import { escape } from 'lodash'
  import ContextMenu from '../ContextMenu.vue'

  export default {
    components: {
      ContextMenu,
      Pagination,
      TagLabel,
      ProtectedImage,
      Avatar,
      PriorityLabel
    },
    name: 'events-list',
    props: ['issues', 'headers'],
    methods: {
      readAll () {
        this.$api.put('events/read-all')
        this.$store.commit('SET_EVENTS', [])
        this.$emit('read')
      },
      readIssue (id) {
        this.$api.put('events/read', {id_issue: id})
        this.$emit('read', id)
      },
      processDesc (desc) {
        if (!desc) {
          return ''
        }
        desc = escape(desc)
        desc = desc.replace(/\n/g, '<br>')
        return desc
      },
      isSystemType (type) {
        const commentTypes = [
          'create_comment_issue'
        ]
        return commentTypes.indexOf(type) === -1
      },
      goToIssue (issue, e) {
        if (!issue.is_active) {
          return
        }
        const project = this.getProject(issue.id_project)
        const route = this.createIssueUrl({
          uid: project && project.uid,
          number: issue.number
        })
        if (e.ctrlKey) {
          window.open(this.$router.resolve(route).href).focus()
        } else {
          this.$router.push(route)
        }
      },
      setProject (projectId) {
        this.$store.dispatch('updateUserSettingsSync', {dashboard_filter_project: projectId})
        this.$emit('changeProject', projectId)
      },
      setThumbs (option) {
        this.$store.dispatch('updateUserSettings', {dashboard_thumb: option})
      }
    },
    computed: {
      ...mapGetters({
        'createIssueUrl': 'company/createIssueUrl',
        'getCompanyUser': 'getCompanyUser',
        'getProject': 'company/getProject'
      }),
      hasUnread () {
        return !!this.issues.find(el => !+el.is_read) || false
      },
      selectedProject () {
        const idProject = this.$store.state.userSettings.dashboard_filter_project
        if (!idProject) {
          return null
        }
        return this.getProject(idProject)
      },
      thumbOption () {
        return this.$store.state.userSettings.dashboard_thumb || 'small'
      }
    },
    mounted () {
      window.eventsList = this
    }
  }
</script>
<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-events-list {
    width: @issues-width;
    margin: 20px auto;
    .b-wrap {
      position: relative;
      .b-box {
        margin-bottom: 7px;
        background: #fff;
        border: 1px solid #dedede;
        border-radius: 3px;
        &.m-clickable {
          cursor: pointer;
          &:hover {
            background: #efefef;
            .b-events {
              background: #efefef;
            }
            &.m-unread {
              .b-events, .b-issue {
                background: rgba(212, 226, 245, .3);
              }
            }
          }
        }

        &.m-unread {
          @blue-color: #bad1f1;
          border: 1px solid @blue-color;
          .b-events {
            border-top: 1px solid @blue-color;
          }
          .b-issue {
            background-color: #d4e2f5;
            .b-top {
              color: #486083;
              .b-tag-label .e-separator {
                color: #b1cbef;
              }
            }
          }
          .b-events {
            background-color: #e6ecf7;
          }
        }
        .b-issue, .b-events {
          padding: 15px 20px;
        }
        .b-issue {
          .b-top {
            font-weight: bold;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            .b-tag-label {
              margin-right: 0;
            }
            .b-title {
              flex: 1;
              min-width: 0;
              .str-truncate;
              display: flex;
              align-items: center;
              .e-id {
                margin-right: 3px;
              }
              .e-author {
                margin-left: 10px;
                color: #bebebe;
                font-style: italic;
                font-weight: normal;
              }
              .e-title {
                overflow: hidden;
                margin-right: 5px;
                text-overflow: ellipsis;
              }
            }
            .bu-bug {
              /*flex: 0 0 30px;*/
              margin: 0 5px;
              color: @red-color;
            }
            .project-logo {
              height: 20px;
              flex: 0 0 30px;
              // margin: -11px 5px 0 -15px;
            }
          }
          .b-middle {
            display: flex;
            .b-image {
              border-radius: 4px;
              box-shadow: 0 0 3px #aaa;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .b-text {
              flex: 1;
              max-width: 100%;
            }
          }
        }
        .b-middle:not(.m-big-thumb) {
          .b-image {
            width: 132px;
            height: 78px;
            background-color: #000;
            overflow: hidden;
            margin-right: 15px;
          }
        }
        .b-middle.m-big-thumb {
          display: block;
          .b-image-wrap {
            margin-bottom: 10px;
            display: flex;
            justify-content: center;
            .b-image {
              min-width: 132px;
              min-height: 78px;
              background-color: #000;
              img:not(.has-overflow) {
                border-radius: 4px;
              }
            }
          }
        }
        .b-events {
          border-top: 1px solid #ddd;
          background-color: #fafafa;
          .b-event {
            display: flex;
            .b-left {
              margin-right: 15px;
            }
            .b-text {
              flex: 1;
              .e-desc {
                display: inline;
              }
              .b-name {
                .e-name {
                  color: #2567c0;
                }
              }
            }
            > .b-right {
              display: flex;
              flex-direction: column;
              .e-date {
                font-size: .8em;
                white-space: nowrap;
                color: #999;
                font-style: italic;
                margin-left: 5px;
                margin-bottom: auto;
              }
              .e-cnt-new {
                .cnt-events-mixin();
                font-size: .9em;
                padding: 2px 5px;
                display: flex;
                align-items: center;
                align-self: flex-end;
                font-weight: normal;
              }
            }
            .b-text {
              max-width: calc(~'100% - 80px');
            }
            &.m-system {
              .b-text .e-desc {
                color: @green-color;
                font-size: .9em;
                font-style: italic;
              }
            }
          }
        }
        .b-issue, .b-events {
          .b-text {
            line-height: @line-height;
            max-height: @line-height * 4;
            overflow: hidden;
            word-wrap: break-word;
            .e-desc {
              max-width: 100%;
            }
          }
        }
      }
      .b-read {
        i {
          top: 0 !important;
        }
      }
    }
    .b-header {
      position: relative;
      height: 50px;
      padding-left: 0;
      padding-right: 0;
      display: flex;
      .b-left, .b-right {
        display: flex;
        align-items: center;
      }
      .b-left {
        flex: 1;
      }
      .b-right {
        .b-gear-menu {
          .e-content {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            .hover-mixin();
            i {
              font-size: 1.3em;
              color: #777;
            }
          }
          .b-menu-items {
            padding: 5px 0;
            .b-options {
              .e-option {
                height: 34px;
                padding: 0 20px;
                display: flex;
                align-items: center;
                .hover-mixin();
                &:hover, &.active {
                  color: @red-color;
                }
              }
            }
          }
        }
      }
      .b-project-menu {
        @menu-width: 400px;
        .b-menu-content {
          font-size: .8em;
          font-weight: bold;
          text-transform: uppercase;
          padding: 10px;
          .hover-mixin();
          max-width: @menu-width;
          > div {
            display: flex;
            align-items: center;
            .b-avatar {
              margin-right: 10px;
            }
            .e-name {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
        .b-menu-items {
          padding: 5px 0;
          max-width: @menu-width;
          .b-item {
            display: flex;
            align-items: center;
            height: 34px;
            padding: 0 20px;
            overflow: hidden;
            .hover-mixin();
            > .b-avatar {
              margin-right: 10px;
            }
            > .e-name {
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }

    }
    .b-wrap, .b-header {
      .b-read {
        i {
          position: absolute;
          right: -40px;
          top: 10px;
          font-size: 1.6em;
          color: #777;
          .hover-mixin(true);
          padding: 4px 0;
          line-height: 1em;
        }
      }
    }
  }
</style>
