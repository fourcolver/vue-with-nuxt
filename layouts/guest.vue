<template>
  <div class="app-layout" :class="{['lang-' + $i18n.locale]: true}">
    <nav class="app-navbar">
      <a href="/" class="app-quwi" v-event-class="'click'">Q</a>
      <div class="b-menu" v-if="$route.path.indexOf('unsupported_browser') === -1">
        <language-selector :lang="$i18n.locale" @change="l => setLocale(l)" :showTitle="true"></language-selector>
        <nuxt-link v-if="!['login'].includes($route.name) && $store.getters['webuser/isGuest']" to="/login">{{ $t('Login') }}</nuxt-link>
        <nuxt-link v-if="!['signup', 'invite', 'index'].includes($route.name)" to="/signup">{{ $t('Signup') }}</nuxt-link>
      </div>
    </nav>
    <section id="content" ref="content">
      <nuxt/>
    </section>
    <site-footer></site-footer>
    <quwi-dialog ref="dialog"></quwi-dialog>
  </div>
</template>

<script>
  import { mapGetters, mapState } from 'vuex'
  import SiteFooter from '~/components/SiteFooter'
  import QuwiDialog from '~/libs/quwi-dialog/QuwiDialog'
  import LanguageSelector from '~/components/LanguageSelector.vue'

  export default {
    components: {
      SiteFooter,
      QuwiDialog,
      LanguageSelector
    },
    computed: {
      ...mapGetters({
        isGuest: 'webuser/isGuest'
      }),
      ...mapState({
        locale: state => state.locale
      })
    },
    created () {
      if (typeof window !== 'undefined') {
        window.layout = this
      }

      if (this.isGuest) {
        this.$i18n.locale = this.$cookies.get('locale') || this.locale
      }
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
    .app-navbar {
      display: flex;
    }
    #content {
      min-height: 100vh;
    }
  }
</style>
