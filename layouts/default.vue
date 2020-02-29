<template>
  <div class="app-layout"
       :class="{[
         'lang-' + $i18n.locale]: true,
         padded: isProjectBar,
         'm-chat-pinned' : isChatAllowed}">
    <projects-bar v-if="isProjectBar"></projects-bar>
    <sidebar :hidden="isSidebarHidden" v-if="!isGuest && hasSidebar"></sidebar>
    <nav class="app-navbar">
      <nuxt-link :to="logoUrl" class="app-quwi" v-event-class="'click'">
        <img src="/img/quwi-logo.png" width="24" height="24">
      </nuxt-link>
      <template v-if="!isGuest && !isUpgrade">
        <context-menu v-if="cntEvents" class="b-events-menu" trigger="hover" closeDelay="300" :preload="true"
                      :anchor=" 'bellMenu' ">
          <div slot="content">
            <nuxt-link to="/" v-if="!isGuest && cntEvents"
                       class="b-events-cnt">
              <div class="b-box">
                <i class="bu-bell"></i>
                <span class="e-number">{{ cntEvents }}</span>
              </div>
            </nuxt-link>
          </div>
          <div slot="items">
            <unread-events></unread-events>
          </div>
        </context-menu>
        <read-events v-else></read-events>
      </template>

      <top-menu v-if="!isGuest && !isUpgrade && !isUnsupportedBrowser"></top-menu>
      <div class="b-menu" v-if="isGuest">
        <language-selector :lang="$i18n.locale" @change="l => setLocale(l)" :showTitle="true"></language-selector>
        <nuxt-link v-if="!['login'].includes($route.name)" to="/login">{{ $t('Login') }}</nuxt-link>
        <nuxt-link v-if="!['signup', 'invite'].includes($route.name)" to="/signup">{{ $t('Signup') }}
        </nuxt-link>
      </div>
    </nav>
    <chat-small ref="quwiChat" v-if="!isGuest && !isUpgrade && isChatAllowed"></chat-small>
    <section :style="computedStyle" id="content" ref="content">
      <notifications :reverse="true"/>
      <plan-warning v-if="!isGuest && $store.getters['webuser/checkAccess']('owner')"></plan-warning>
      <push-warning></push-warning>
      <nuxt ref="baseComponent"></nuxt>
    </section>
    <site-footer v-if="isGuest"></site-footer>
    <quwi-dialog ref="dialog"></quwi-dialog>
  </div>
</template>

<script>
  import { mapGetters, mapState } from 'vuex'
  import TopMenu from '~/components/TopMenu.vue'
  import Sidebar from '~/components/Sidebar.vue'
  import ProjectsBar from '../components/ProjectsBar.vue'
  import ChatSmall from '../components/chat/ChatSmall.vue'
  import SiteFooter from '~/components/SiteFooter'
  import PushWarning from '../components/PushWarning.vue'
  import ContextMenu from '../components/ContextMenu.vue'
  import UnreadEvents from '~/components/events/UnreadEvents.vue'
  import PlanWarning from '../components/PlanWarning.vue'
  import LanguageSelector from '../components/LanguageSelector.vue'
  import QuwiDialog from '../libs/quwi-dialog/QuwiDialog.vue'
  import ReadEvents from '../components/events/ReadEvents.vue'

  export default {
    components: {
      ReadEvents,
      QuwiDialog,
      PlanWarning,
      UnreadEvents,
      ContextMenu,
      PushWarning,
      ChatSmall,
      ProjectsBar,
      TopMenu,
      Sidebar,
      SiteFooter,
      LanguageSelector
    },
    head () {
      const cnt = this.$store.state.cntUnreadChatMessages + this.$store.getters.cntDashboardEvents
      const company = this.$store.getters['webuser/company']
      let template = company ? company.name + ' - %s' : '%s'
      return {
        titleTemplate: cnt > 0 ? `(${cnt}) ${template}` : template
      }
    },
    computed: {
      routeMask () {
        let mask = this.$route.name && this.$route.name.replace(/^company\./, '')
        return mask && mask.split('.')[0]
      },
      hasSidebar () {
        return this.routeMask === 'issues' || this.routeMask === 'comments'
      },
      isSidebarHidden () {
        return this.routeMask === 'comments'
      },
      isProfile () {
        return this.routeMask === 'profile'
      },
      isUpgrade () {
        return this.routeMask.indexOf('upgrade') === 0
      },
      isUnsupportedBrowser () {
        return this.routeMask === 'unsupported_browser'
      },
      isProjectBar () {
        return !this.isGuest && this.$store.state.projects.length > 0 && !this.isUpgrade
      },
      isChatAllowed () {
        return this.$store.getters['webuser/checkAccess']('chat')
      },
      computedStyle () {
        const ret = {}
        const showChat = this.isChatAllowed && this.$store.state.isChatActive && !this.isUpgrade
        const chatWidth = this.$store.state.chatZoomWidth ? this.$store.state.chatZoomWidth : this.$store.state.chatWidth
        if (showChat) {
          if (this.settings.chat_win_position === 'left') {
            ret.paddingLeft = `${this.$store.state.projectsBarWidth + chatWidth}px`
          } else {
            ret.paddingRight = `${chatWidth}px`
          }
        }

        const issueListWidth = 745
        const starOffset = 32
        if (showChat) {
          if ((this.hasSidebar || this.isProfile) && showChat) {
            ret.minWidth = `${issueListWidth + this.$store.state.projectsBarWidth + chatWidth + starOffset * 2}px`
          } else {
            ret.minWidth = `${this.$store.state.contentMinWidth}px`
          }
        }

        return ret
      },
      ...mapGetters({
        isGuest: 'webuser/isGuest',
        checkAccess: 'webuser/checkAccess',
        cntEvents: 'cntDashboardEvents'
      }),
      ...mapState({
        settings: state => state.userSettings,
        locale: state => state.locale
      }),
      logoUrl () {
        if (this.isGuest) {
          return '/'
        } else {
          return this.isUpgrade ? '/upgrade' : '/'
        }
      }
    },
    created () {
      if (typeof window !== 'undefined') {
        window.layout = this
      }

      if (this.isGuest) {
        this.$i18n.locale = this.$cookies.get('locale') || this.locale
      }
    },
    mounted () {
      window.defaultLayout = this
    },
    methods: {
      setLocale (val) {
        this.$store.dispatch('webuser/setLocaleCookie', val)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';
  @import '~assets/css/menu.less';

  body {
    background-color: #f4f4f4;
  }

  .app-layout {
    min-width: 820px;
    .app-navbar {
      display: flex;

      .b-events-menu {
        display: block;
        .b-events-cnt {
          height: @navbar-height;
          display: flex;
          align-items: center;
          padding: 0 15px;
          &:hover {
            text-decoration: none;
            background: @hover-light;
          }
          .b-box {
            font-size: .9em;
            background: #c44512;
            color: white;
            border-radius: 4px;
            padding: 5px;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            .bu-bell {
              color: #fff;
              margin-right: 3px;
            }
          }
        }
        .b-menu-items {
          width: 460px;
          left: -2px;
          max-height: calc(100vh ~'-' @navbar-height);
          overflow-y: hidden;
      }
    }
    }
    #content {
      min-height: 100vh;
    }
    &.padded {
      #content {
        padding-left: @projects-bar-width;
      }
      &.shrink {
        #content {
          padding-left: @projects-bar-width + @sidebar-width;
        }
      }
    }

   .notifications {
    font-size: 1em;
    .notification-wrapper {
      margin-top: 5px;
      .vue-notification {

        .notification-title {
          margin-bottom: 5px;
        }

        .notification-content {
        }
      }
    }
  }
  }
</style>
