<template>
  <div class="c-site-footer b-site-footer" :style="computedStyle">
    <div class="b-inner">
      <p class="b-links">
        <nuxt-link to="/tos">{{$t('footer.tos')}}</nuxt-link>
        <nuxt-link to="/privacy">{{$t('footer.privacy')}}</nuxt-link>
        <a v-for="href, app in links" :href="href" target="_blank">Quwi {{ $t('footer.for') + ' ' + capitalize(app)
          }} </a>
      </p>
      <p>{{$t('footer.uses_cookies')}}</p>
      <p>{{$t('footer.info_of_website')}}</p>
      <p>61 Spyrou Kyprianou, SK House, 4003 Limassol, Cyprus,
        con<span class="e-loath"> and </span>tact<span class="e-loath"> that. </span>@quwi.<span class="e-loath"> super </span>com
      </p>
      <p><a href="https://www.commercegate.com" target="_blank">CommerceGate</a> {{$t('footer.authorized')}}</p>
      <p v-if="!isGuest">
        <logout-link :allDevices="true">{{ $t('footer.logout_all') }}</logout-link>
      </p>
      <p>© 2008 - {{currentYear}} Quwi.com</p>
    </div>
  </div>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import LogoutLink from './LogoutLink.vue'
  import { APP_DOWNLOAD_LINKS } from '~/utils/dict'
  import { capitalize } from '~/utils/helpers'

  export default {
    components: {LogoutLink},
    name: 'site-footer',
    computed: {
      currentYear () {
        return (new Date()).getFullYear()
      },
      routeMask () {
        let mask = this.$route.name && this.$route.name.replace(/^company\./, '')
        return mask && mask.split('.')[0]
      },
      hasSidebar () {
        return this.routeMask === 'issues' || this.routeMask === 'comments'
      },
      isStats () {
        return this.routeMask === 'stats'
      },
      isSidebarHidden () {
        return this.routeMask === 'comments'
      },
      isProfile () {
        return this.routeMask === 'profile'
      },
      computedStyle () {
        const ret = {}
        if (!['index', 'login', 'signup', 'forgot', 'draw-screen'].includes(this.routeMask)) {
          const chatWidth = this.$store.state.chatZoomWidth ? this.$store.state.chatZoomWidth : this.$store.state.chatWidth
          if (this.settings.chat_win_position === 'left') {
            ret.paddingLeft = `${chatWidth + this.$store.state.projectsBarWidth}px`
          } else {
            ret.paddingRight = `${chatWidth}px`
          }

          if (this.hasSidebar || this.isStats || this.isProfile) {
            const issueListWidth = 745
            const starOffset = 32
            ret.minWidth = `${issueListWidth + this.$store.state.projectsBarWidth + chatWidth + starOffset * 2}px`
          } else {
            ret.minWidth = `${this.$store.state.contentMinWidth}px`
          }
        }
        return ret
      },
      links () {
        return APP_DOWNLOAD_LINKS
      },
      ...mapState({
        settings: state => state.userSettings
      }),
      ...mapGetters({
        isGuest: 'webuser/isGuest'
      })
    },
    methods: {
      capitalize
    }
  }
</script>
<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  .b-site-footer {
    // min-width: @issues-width;

    background: #d8d8d8;
    .b-inner {
      padding: 18px 0;
      height: 100%;
      margin: auto;
      text-align: center;
      color: #8d8d8d;
      font-size: 12px;
      .e-loath {
        display: none;
      }
      p {
        text-align: center;
        line-height: 20px;
      }
      .b-links {
        a {
          margin: 0 5px;
        }
      }
      a, .e-link {
        cursor: pointer;
        text-decoration: underline;
        color: #8d8d8d;
        &:active, &:visited, &:hover {
          color: #8d8d8d;
        }
        &:hover {
          text-decoration: none;
        }
      }
    }
  }
</style>
