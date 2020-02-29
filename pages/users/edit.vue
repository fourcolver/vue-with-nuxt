<template>

  <div class="app-users-edit" v-cloak>
    <div class="b-page-content">
      <div class="b-back" @click="goBack">
        <span class="e-arrow">&lt;</span>
        <span class="e-name">{{ $t('Back') }}</span>
      </div>
      <div class="b-user-info" v-if="user.id">
        <avatar :userId="user.id" size="120"></avatar>
        <div class="e-name">{{ capitalize(user.name) }}</div>
        <working-info v-if="user.id" :user="user"></working-info>
      </div>

      <edit-user class="b-edit-user" :user="user" :projects="projects" @update="update"></edit-user>

      <div class="b-last-events" v-if="events.length">
        <div class="e-header">{{ $t('users_edit.latest_events')}}</div>
        <div class="b-box">
          <unread-events v-if="events.length" :eventsProp="events" :showRead="false"></unread-events>
          <div class="b-empty" v-else>
            {{ $t('users_edit.no_events')}}
          </div>
        </div>
      </div>

      <div class="b-last-screens" v-if="screens.length">
        <div class="e-header">{{ $t('users_edit.latest_screens') }}</div>
        <div class="b-box">
          <div class="b-screens">
            <protected-image @click.native="$refs.viewer.show(screen)" :src="screen.sizes.thumb.url"
                             :prefetchSrc="screen.sizes.file.url" :key="screen.id"
                             v-for="screen in screens"></protected-image>
          </div>
          <screenshots-viewer :selectable="false" ref="viewer" :screens="screens" :singlePage="true"
                              :headers="screensHeaders"></screenshots-viewer>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import EditUser from '~/components/users/EditUser'
  import { capitalize, raiseError } from '~/utils/helpers'
  import Avatar from '../../components/Avatar.vue'
  import WorkingInfo from '../../components/WorkingInfo.vue'
  import UnreadEvent from '../../components/events/UnreadEvent.vue'
  import { goToIssue } from '~/utils/events'
  import ProtectedImage from '../../components/ProtectedImage.vue'
  import ScreenshotsViewer from '../../components/stats/ScreenshotsViewer.vue'
  import UnreadEvents from '../../components/events/UnreadEvents.vue'

  export default {
    components: {
      UnreadEvents,
      ScreenshotsViewer,
      ProtectedImage,
      UnreadEvent,
      WorkingInfo,
      Avatar,
      EditUser
    },
    middleware: ['member', 'owner'],
    head: {
      title: 'Users'
    },
    data () {
      return {
        user: {},
        projects: [],
        events: [],
        screens: [],
        screensHeaders: {}
      }
    },
    methods: {
      update (user) {
        this.user = user
        if (!this.$route.query.id) {
          this.$router.replace('/users/edit?id=' + user.id)
        }
      },
      goBack () {
        let route = {path: '/users'}
        if (this.$route.query.keyword) {
          route.query = {keyword: this.$route.query.keyword}
          if (this.$route.query.page) {
            route.query.page = this.$route.query.page
          }
        }
        this.$router.push(route)
      },
      goToIssue (evt, e) {
        return goToIssue(this, evt, e)
      },
      capitalize
    },
    asyncData ({route, error, app, query}) {
      let promises = [
        app.$api.get('projects-manage', {sort: 'is_active-,dta_create'})
      ]
      if (query.id) {
        promises.push(app.$api.get('users-manage/' + query.id))
        promises.push(app.$api.get('events/by-author', {id_user: query.id, 'per-page': 5}))
        promises.push(app.$api.get('timers-screens', {filters: {'id_user': query.id}, 'per-page': 5}))
      }
      return Promise.all(promises).then(res => {
        let user = res[1] ? res[1].data.user : {}
        let events = res[2] ? res[2].data.events : []
        let screens = res[3] ? res[3].data.screens : []
        let screensHeaders = res[3] ? res[3].headers : {}
        return {
          projects: res[0].data.projects,
          user,
          events,
          screens,
          screensHeaders
        }
      }).catch((e) => {
        raiseError(error, e)
      })
    },
    mounted () {
      window.editUser = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .app-users-edit {
    .app-top-container {
      .top-row;
      height: @app-top-container-height;
      .b-center {
        width: @center-width;
        display: flex;
        align-items: center;
        height: 100%;
        margin: auto;
        font-size: 18px;
        font-weight: bold;
      }
    }
    .b-page-content {
      padding: 20px 0;
      width: @center-width;
      margin: auto;
      .b-user-info {
        display: flex;
        align-items: center;
        flex-direction: column;
        margin-bottom: 20px;
        .b-avatar {
          margin-bottom: 10px;
        }
        .e-name {
          margin-bottom: 5px;
          font-weight: bold;
          font-size: 1.2em;
        }
      }
      .e-header {
        color: @red-color;
        display: flex;
        align-items: center;
        height: @navbar-height;
        padding-left: 1px;
      }
      .b-box {
        .white-box();
      }
      .b-last-events {
        margin-top: 20px;
        .b-box {
          padding: 15px 0;
          .c-unread-events {
            .b-events {
              margin-top: 0;
              margin-bottom: 0;
              padding-bottom: 0;
              .b-issue {
                > .b-main {
                  padding: 0 20px;
                }
                &.m-single-event > .b-main {
                  padding-top: 5px;
                  padding-bottom: 5px;
                }
              }
              > .c-unread-event {
                .b-main {
                  padding: 0 20px 0 35px;
                }
              }
            }
          }
        }
      }
      .b-last-screens {
        margin-top: 20px;
        .b-screens {
          padding: 20px;
          img {
            width: calc(20% ~'-' 2px);
            margin-right: 2px;
            cursor: pointer;
          }
        }
      }
      .b-back {
        position: absolute;
        padding: 10px 5px;
        color: #2975dc;
        font-weight: bold;
        user-select: none;
        .hover-mixin();
        .e-arrow {
          margin-right: 5px;
        }
      }
    }
  }
</style>

