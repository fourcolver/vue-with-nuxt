<template>
  <div class="b-menu">
    <chat-link type="icon" :toggle="false" v-if="$store.state.cntUnreadChatMessages"></chat-link>

    <a @click="mobileRedirect" v-if="mobileUrl">Mobile Version</a>

    <quwi-link :to="ticketsUrl" :class="{'m-current': ['issues.all', 'issues.project', 'comments.project'].includes(routeMask)}">{{ $t('Tickets') }}</quwi-link>

    <quwi-link :to="this.checkAccess('owner') ? '/stats' : '/my-stats'" :class="{'m-current': ['stats.user', 'stats'].includes(routeMask)}">{{ $t('menu.stats') }}</quwi-link>

    <quwi-link to="/calendar" :class="{'m-current': ['calendar'].includes(routeMask)}">{{ $t('menu.calendar') }}</quwi-link>

    <chat-link type="text"></chat-link>
    <avatar-menu :user="user"></avatar-menu>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import Avatar from '~/components/Avatar'
  import ChatLink from './chat/ChatLink.vue'
  import ContextMenu from './ContextMenu.vue'
  import AvatarMenu from './AvatarMenu.vue'

  export default {
    name: 'top-menu',
    components: {
      AvatarMenu,
      ContextMenu,
      ChatLink,
      Avatar
    },
    computed: {
      ...mapGetters({
        isGuest: 'webuser/isGuest',
        checkAccess: 'webuser/checkAccess',
        createProjectUrl: 'company/createProjectUrl',
        getProject: 'company/getProject'
      }),
      ...mapState('webuser', ['user']),
      routeMask () {
        return this.$route.name.replace(/^company\./, '')
      },
      ticketsUrl () {
        const project = this.getProject()
        return this.createProjectUrl(project ? project.uid : null)
      },
      mobileUrl () {
        if (process.env.MOBILE_URL && this.$store.state.isMobileVisit) {
          return process.env.MOBILE_URL
        }
        return false
      }
    },
    methods: {
      mobileRedirect () {
        if (this.mobileUrl) {
          this.$cookies.set('mDenyRedirect', 0, { domain: '.' + process.env.SITE_HOST, path: '/' })
          window.location.href = this.mobileUrl
        }
      }
    }
  }
</script>


<style lang="less" type="text/less">
  @import '~assets/css/menu.less';

  .c-chat-link.m-icon {
    margin-right: auto;
  }
</style>


