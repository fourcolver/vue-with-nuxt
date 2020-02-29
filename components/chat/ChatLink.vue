<template>
  <a class="c-chat-link" v-if="canSee" @click="click"
     :class="{inactive: !checkAccess('chat'), 'm-current': $store.state.isChatActive, 'm-text': type == 'text', 'm-icon': type == 'icon'}"
     v-tooltip="inactiveTooltip">
    <i class="bu-speech-bubble" v-if="type === 'icon'"></i>
    <span class="e-chat-link" v-else-if="type === 'text'">{{ $t('chat_link.link_name')}}</span>
    <span v-if="$store.state.cntUnreadChatMessages" class="e-cnt-new">{{ $store.state.cntUnreadChatMessages }}</span>
  </a>
</template>

<script>
  import { mapGetters, mapState } from 'vuex'
  export default {
    name: 'chat-link',
    props: {
      type: {
        default: 'icon'
      },
      toggle: {
        default: true
      }
    },
    data () {
      return {}
    },
    methods: {
      click () {
        if (!this.checkAccess('chat')) {
          return
        }
        if (this.$store.state.isChatActive && (window && window.chatComponent)) {
          window.chatComponent.clearMessagesScrollStyles()
          window.chatComponent.clearChannelsScrollStyles()
        }
        if (this.toggle) {
          this.$store.commit('SET_CHAT_ACTIVE', !this.isChatActive)
        } else {
          if (!this.isChatActive) {
            this.$store.commit('SET_CHAT_ACTIVE', true)
          } else {
            window.chatComponent.activate()
          }
        }
      }
    },
    computed: {
      ...mapGetters({
        checkAccess: 'webuser/checkAccess'
      }),
      ...mapState(['isChatActive']),
      inactiveTooltip () {
        if (this.checkAccess('chat')) {
          return null
        }
        return {
          content: this.$t('plan_no_access') +
          `<br><a href="#" data-nuxt-link="/upgrade">${this.$t('plan_upgrade_link')}</a>`,
          html: true
        }
      },
      canSee () {
        return this.checkAccess('chat') || this.checkAccess('owner')
      }
    },
    mounted () {
      window.chatLink = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-chat-link {
    position: relative;
    min-width: 55px;
    padding: 0;
    text-align: center;
    justify-content: center;
    &.inactive {
      opacity: .5;
      cursor: default;
      &:hover {
        background: transparent;
      }
    }
    .e-cnt-new {
      position: absolute;
      top: 6px;
      right: 9px;
    }
    i.bu-speech-bubble {
      font-size: 1.7em;
    }
    &.m-text {
      padding: 0 25px;
      .e-cnt-new {
        top: 15px;
        right: 8px;
        display: none;
      }
    }
  }
</style>



