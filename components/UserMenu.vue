<template>
  <context-menu class="c-user-menu" trigger="click" :autoClose="true" :direction="direction">
    <avatar v-if="type == 'avatar'" :size="size" :userId="userId" slot="content" v-tooltip="tooltipOptions"></avatar>
    <div class="e-name" v-if="type == 'name'" slot="content" v-tooltip="tooltipOptions">{{ capitalize(user.name) }}
    </div>
    <div slot="items">
      <nuxt-link v-if="canSeeScreenshots" class="e-link" :to="'/stats/screenshots?id=' + userId">
        {{ $t('View screenshots') }}
      </nuxt-link>
      <a class="e-link" @click="showAssignedTasks">{{ $t('View assigned tasks') }}</a>
      <a class="e-link" @click="showChat">{{ $t('Send message') }}</a>
    </div>
  </context-menu>
</template>

<script>
  import ContextMenu from '~/components/ContextMenu.vue'
  import Avatar from '~/components/Avatar.vue'
  import { capitalize } from '~/utils/helpers'

  export default {
    components: {
      Avatar,
      ContextMenu
    },
    name: 'user-menu',
    data () {
      return {}
    },
    props: {
      userId: null,
      size: null,
      direction: null,
      type: {
        default: 'avatar'
      }
    },
    methods: {
      showAssignedTasks () {
        this.$store.commit('Issues/ADD_FILTER', {id_assigned_user: this.userId})
        this.$store.commit('Issues/ADD_FILTER', {is_open: 1})
        this.$router.push({name: 'issues'})
      },
      showChat () {
        if (window.layout && window.layout.$refs && window.layout.$refs.quwiChat) {
          window.layout.$refs.quwiChat.openOnUser(this.user)
        }
      },
      capitalize
    },
    computed: {
      canSeeScreenshots () {
        return this.$store.state.webuser.user.role === 'owner' || +this.userId === +this.$store.state.webuser.user.id
      },
      tooltipOptions () {
        const user = this.user
        if (!user || !user.name || !user.is_active) {
          return ''
        }
        let tooltipText = ''
        tooltipText += `${user.name}`
        if (user.is_online) {
          tooltipText += `<br/>${this.$t('Last seen')}: ${this.$t('usermenu.online')}`
        } else if (user.dta_activity) {
          tooltipText += `<br/>${this.$t('Last seen')}: ${this.$dateAgo(user.dta_activity)} ${this.$t('ago')}`
        } else {
          tooltipText += `<br/>${this.$t('Last seen')}: ${this.$t('usermenu.never')}`
        }

        if (user.is_timer_online) {
          tooltipText += `<br/>${this.$t('Last worked')}: ${this.$t('working now')}`
        } else if (user.dta_timer_activity) {
          tooltipText += `<br/>${this.$t('Last worked')}: ${this.$dateAgo(user.dta_timer_activity)} ${this.$t('ago')}`
        } else {
          tooltipText += `<br/>${this.$t('Last worked')}: ${this.$t('usermenu.never')}`
        }
        return {content: tooltipText, autoHide: true, delay: {show: 300, hide: 0}, boundariesElement: 'body'}
      },
      user () {
        return this.$store.getters['getCompanyUser'](this.userId)
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-user-menu {
    color: #000;
    .b-trigger {
      height: auto;
      .b-avatar {
        img {
          display: block;
        }
      }
      .b-menu-items {
        padding: 5px 0;
        .e-link {
          font-size: 1rem;
          display: flex;
          height: 32px;
          padding: 0 15px;
          align-items: center;
          .hover-mixin();
          color: inherit !important;
        }
      }
    }
  }
</style>