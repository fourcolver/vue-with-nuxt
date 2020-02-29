<template>
  <context-menu class="c-avatar-menu" trigger="hover" delay="300">
    <quwi-link to="/profile" slot="content" class="e-profile-toggle">
      <avatar :userId="user.id" :src="user.avatar_url" :name="user.name" size="25"></avatar>
    </quwi-link>
    <div slot="items">
      <div class="b-company-selector" v-if="companies.length > 1">
        <div class="b-header">{{ $t('avatar_menu.current_company')}}</div>
        <radio-btn :key="c.id" class="b-row" v-model="companyId" :value="c.id" v-for="c in companies"
                   :label="capitalize(c.name)">
        </radio-btn>
      </div>
      <template v-if="$store.getters['webuser/checkAccess']('owner')">
        <nuxt-link to="/users" class="b-row">{{ $t('avatar_menu.users')}}</nuxt-link>
        <nuxt-link to="/projects" class="b-row">{{ $t('avatar_menu.projects')}}</nuxt-link>
        <nuxt-link to="/tags" class="b-row">{{ $t('avatar_menu.tags')}}</nuxt-link>
      </template>
      <quwi-link class="b-row" to="/profile">{{ $t('avatar_menu.profile') }}</quwi-link>
      <logout-link class="b-row">{{ $t('avatar_menu.logout') }}</logout-link>
    </div>
  </context-menu>
</template>

<script>
  import ContextMenu from './ContextMenu.vue'
  import Avatar from './Avatar.vue'
  import LogoutLink from './LogoutLink.vue'
  import { mapState, mapGetters } from 'vuex'
  import { capitalize } from '~/utils/helpers'
  import RadioBtn from './RadioBtn.vue'

  export default {
    components: {
      RadioBtn,
      LogoutLink,
      Avatar,
      ContextMenu
    },
    name: 'avatar-menu',
    props: ['user'],
    data () {
      return {}
    },
    methods: {
      capitalize
    },
    computed: {
      ...mapState('webuser', ['companies']),
      ...mapGetters({
        createCompanyUrl: 'company/createCompanyUrl'
      }),
      companyId: {
        get () {
          return this.$store.state.webuser.user.id_company
        },
        set (val) {
          const company = this.companies.find(el => +el.id === +val)
          if (company) {
            const route = this.createCompanyUrl({ route: { ...this.$route }, uid: company.uid })
            window.location.href = this.$router.resolve(route).href
          }
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-avatar-menu {
    .e-profile-toggle {
      padding: 0 15px;
    }
    .b-trigger {
      height: @navbar-height;
    }
    .b-menu-items {
      padding: 5px 0;
      min-width: 120px;
      .b-header {
        padding: 0 15px;
        font-style: italic;
        color: #777;
        height: 32px;
      }
      .b-row, .b-header {
        display: flex;
        align-items: center;
        float: none;
      }
      .b-row {
        padding: 0 20px;
        text-transform: none;
        font-size: 1em;
        height: 36px;
      }
      .b-company-selector {
        .b-row {
          height: 32px;
          padding: 0 15px;
          .b-label {
            margin-top: 0;
            margin-left: 5px;
          }
          &.m-current {
            color: @menu-red;
          }
          &:hover:not(.m-current) {
            color: inherit;
          }
          .hover-mixin();
        }
      }
    }
  }
</style>
